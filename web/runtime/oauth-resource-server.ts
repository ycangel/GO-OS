import { getRuntimeVariable } from "../db";

const DEFAULT_ALLOWED_ALGORITHMS = [
  "RS256",
  "RS384",
  "RS512",
  "PS256",
  "PS384",
  "PS512",
  "ES256",
  "ES384",
  "ES512",
  "EdDSA",
] as const;
const MCP_SCOPES = ["go.context.read", "go.checkpoint.write"] as const;
const WEB_SCOPE = "go.web";
const DEFAULT_CLOCK_SKEW_SECONDS = 60;
const MAX_CLOCK_SKEW_SECONDS = 300;
const MAX_JWT_BYTES = 128_000;
const MAX_JWKS_BYTES = 256_000;
const DEFAULT_JWKS_CACHE_SECONDS = 300;
const MAX_JWKS_CACHE_SECONDS = 3_600;
const JWKS_REFRESH_COOLDOWN_MS = 30_000;

type RuntimeEnv = {
  GO_PUBLIC_ORIGIN?: string;
  GO_OAUTH_ISSUER?: string;
  GO_OAUTH_AUDIENCE?: string;
  GO_OAUTH_JWKS_URI?: string;
  GO_OAUTH_JWKS_JSON?: string;
  GO_OAUTH_REQUIRED_SCOPES?: string;
  GO_OAUTH_AUTHORIZATION_SERVERS?: string;
  GO_OAUTH_ALLOWED_ALGORITHMS?: string;
  GO_OAUTH_CLOCK_SKEW_SECONDS?: string;
  GO_WEB_IDENTITY_MODE?: string;
  GO_WEB_IDENTITY_SECRET?: string;
  GO_WEB_IDENTITY_SECRET_HEADER?: string;
  GO_WEB_IDENTITY_ID_HEADER?: string;
  GO_WEB_IDENTITY_EMAIL_HEADER?: string;
  GO_WEB_IDENTITY_NAME_HEADER?: string;
};

type JsonRecord = Record<string, unknown>;

type OAuthConfiguration = {
  issuer: string;
  audiences: string[];
  requiredScopes: string[];
  allowedAlgorithms: Set<string>;
  clockSkewSeconds: number;
  jwksUri: string | null;
  inlineJwks: string | null;
};

type CachedDocument<T> = {
  source: string;
  expiresAt: number;
  value: T;
};

type ParsedJwt = {
  encodedHeader: string;
  encodedPayload: string;
  signature: Uint8Array;
  header: JsonRecord;
  claims: JsonRecord;
};

export type OAuthPrincipal = {
  issuer: string;
  subject: string;
  /** Issuer-qualified stable key used only as input to the private HMAC link. */
  principalKey: string;
  scopes: string[];
  claims: JsonRecord;
};

export type WebIdentity = {
  id: string;
  principalKey: string;
  displayName: string;
  email: string | null;
  fullName: string | null;
  authenticationMethod: "oidc" | "trusted-proxy" | "sites";
  scopes: string[];
};

export class OAuthResourceServerError extends Error {
  public readonly code: string;
  public readonly status: number;
  public readonly wwwAuthenticate?: string;

  constructor(
    code: string,
    message: string,
    status: number,
    wwwAuthenticate?: string,
  ) {
    super(message);
    this.code = code;
    this.status = status;
    this.wwwAuthenticate = wwwAuthenticate;
  }
}

let cachedDiscovery: CachedDocument<{ issuer: string; jwksUri: string }> | null =
  null;
let cachedJwks: CachedDocument<JsonRecord[]> | null = null;
let lastForcedJwksRefresh: { source: string; at: number } | null = null;

export async function authenticateBearerRequest(
  headers: Headers,
  requestUrl: string,
  requiredScopes: readonly string[] = [],
): Promise<OAuthPrincipal> {
  const authorization = headers.get("authorization");
  if (!authorization) {
    throw oauthError(
      "BEARER_TOKEN_REQUIRED",
      "A Bearer access token is required.",
      401,
      requestUrl,
      "invalid_token",
    );
  }
  const match = /^Bearer ([A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)$/.exec(
    authorization,
  );
  if (!match) {
    throw oauthError(
      "INVALID_BEARER_TOKEN",
      "The Bearer access token is malformed.",
      401,
      requestUrl,
      "invalid_token",
    );
  }

  let config: OAuthConfiguration;
  try {
    config = oauthConfiguration();
  } catch (error) {
    throw configurationError(error);
  }

  let jwt: ParsedJwt;
  try {
    jwt = parseJwt(match[1]);
  } catch {
    throw invalidToken(requestUrl);
  }
  const algorithm = stringClaim(jwt.header.alg);
  if (!algorithm || !config.allowedAlgorithms.has(algorithm)) {
    throw invalidToken(requestUrl);
  }
  // This resource server implements no JWS critical-header extensions. RFC
  // 7515 requires an implementation to reject any critical parameter it does
  // not understand rather than silently applying ordinary JWT semantics.
  if (jwt.header.crit !== undefined) {
    throw invalidToken(requestUrl);
  }
  const typ = stringClaim(jwt.header.typ);
  if (typ && !["jwt", "at+jwt"].includes(typ.toLowerCase())) {
    throw invalidToken(requestUrl);
  }

  let verified = false;
  try {
    verified = await verifyJwtSignature(jwt, algorithm, config, false);
    if (
      !verified &&
      !config.inlineJwks &&
      reserveForcedJwksRefresh(config)
    ) {
      // A rotation may have replaced a cached key. Refresh once, then fail closed.
      verified = await verifyJwtSignature(jwt, algorithm, config, true);
    }
  } catch {
    verified = false;
  }
  if (!verified) throw invalidToken(requestUrl);

  const now = Date.now() / 1_000;
  const issuer = stringClaim(jwt.claims.iss);
  const subject = stringClaim(jwt.claims.sub);
  const expiry = numericDate(jwt.claims.exp);
  const notBefore = optionalNumericDate(jwt.claims.nbf);
  const issuedAt = optionalNumericDate(jwt.claims.iat);
  if (
    issuer !== config.issuer ||
    !subject ||
    expiry === null ||
    (jwt.claims.nbf != null && notBefore === null) ||
    (jwt.claims.iat != null && issuedAt === null) ||
    now - config.clockSkewSeconds >= expiry ||
    (notBefore !== null && now + config.clockSkewSeconds < notBefore) ||
    (issuedAt !== null && now + config.clockSkewSeconds < issuedAt) ||
    !audienceMatches(jwt.claims.aud, config.audiences)
  ) {
    throw invalidToken(requestUrl);
  }

  const scopes = tokenScopes(jwt.claims);
  const expectedScopes = uniqueStrings([
    ...config.requiredScopes,
    ...requiredScopes,
  ]);
  const missingScopes = expectedScopes.filter((scope) => !scopes.has(scope));
  if (missingScopes.length) {
    throw oauthError(
      "INSUFFICIENT_SCOPE",
      "The access token does not grant the required scope.",
      403,
      requestUrl,
      "insufficient_scope",
      expectedScopes,
    );
  }

  return {
    issuer,
    subject,
    principalKey: stableOAuthPrincipalKey(issuer, subject),
    scopes: [...scopes].sort(),
    claims: jwt.claims,
  };
}

/**
 * Maps a verified OAuth principal into the existing Web member identity shape.
 * The optional proxy mode is fail-closed: identity headers are ignored unless a
 * separate server-side secret header proves that a configured trusted proxy
 * stripped client input and injected them itself.
 */
export async function resolveWebIdentity(
  headers: Headers,
  requestUrl: string,
): Promise<WebIdentity | null> {
  const runtime = runtimeEnvironment();
  const configuredMode = runtime.GO_WEB_IDENTITY_MODE?.trim() || "sites";
  if (configuredMode === "oidc") {
    if (!headers.has("authorization")) return null;
    const principal = await authenticateBearerRequest(headers, requestUrl, [
      WEB_SCOPE,
    ]);
    const email = usableString(principal.claims.email);
    const fullName = usableString(principal.claims.name);
    const displayName =
      fullName ??
      usableString(principal.claims.preferred_username) ??
      email ??
      principal.subject;
    return {
      id: principal.subject,
      principalKey: principal.principalKey,
      displayName,
      email,
      fullName,
      authenticationMethod: "oidc",
      scopes: principal.scopes,
    };
  }

  if (configuredMode !== "sites" && configuredMode !== "trusted-proxy") {
    return null;
  }
  const mode: "sites" | "trusted-proxy" = configuredMode;
  if (mode === "trusted-proxy") {
    const secret = runtime.GO_WEB_IDENTITY_SECRET?.trim() ?? "";
    if (secret.length < 32) return null;
    const secretHeader = configuredHeaderName(
      runtime.GO_WEB_IDENTITY_SECRET_HEADER,
      "x-go-web-identity-secret",
    );
    const suppliedSecret = headers.get(secretHeader) ?? "";
    if (!(await constantTimeTextEqual(secret, suppliedSecret))) return null;
  }

  const idHeader = configuredHeaderName(
    runtime.GO_WEB_IDENTITY_ID_HEADER,
    "oai-authenticated-user-id",
  );
  const emailHeader = configuredHeaderName(
    runtime.GO_WEB_IDENTITY_EMAIL_HEADER,
    "oai-authenticated-user-email",
  );
  const nameHeader = configuredHeaderName(
    runtime.GO_WEB_IDENTITY_NAME_HEADER,
    "oai-authenticated-user-full-name",
  );
  const id = usableHeader(headers.get(idHeader), 512);
  const email = usableHeader(headers.get(emailHeader), 320);
  if (!id) return null;
  const encodedName = usableHeader(headers.get(nameHeader), 1_024);
  const fullName =
    encodedName &&
    nameHeader === "oai-authenticated-user-full-name" &&
    headers.get("oai-authenticated-user-full-name-encoding") ===
      "percent-encoded-utf-8"
      ? safeDecodeURIComponent(encodedName)
      : encodedName;
  return {
    id,
    // Native Sites preserves its established private link namespace. A
    // self-hosted trusted proxy uses the same issuer-qualified sub as MCP.
    principalKey:
      mode === "trusted-proxy"
        ? stableOAuthPrincipalKey(
            requiredSecureUrl(runtime.GO_OAUTH_ISSUER, "GO_OAUTH_ISSUER"),
            id,
          )
        : id,
    displayName: fullName ?? email ?? id,
    email,
    fullName,
    authenticationMethod: mode,
    scopes: [WEB_SCOPE],
  };
}

export function buildOAuthProtectedResourceMetadata(requestUrl: string) {
  const runtime = runtimeEnvironment();
  const issuer = requiredSecureUrl(runtime.GO_OAUTH_ISSUER, "GO_OAUTH_ISSUER");
  const origin = publicOrigin(requestUrl);
  const authorizationServers = parseList(
    runtime.GO_OAUTH_AUTHORIZATION_SERVERS,
  );
  const servers = authorizationServers.length
    ? authorizationServers.map((value) =>
        requiredSecureUrl(value, "GO_OAUTH_AUTHORIZATION_SERVERS"),
      )
    : [issuer];
  const scopes = uniqueStrings([
    ...parseList(runtime.GO_OAUTH_REQUIRED_SCOPES),
    WEB_SCOPE,
    ...MCP_SCOPES,
  ]).sort();
  return {
    resource: `${origin}/mcp`,
    authorization_servers: servers,
    scopes_supported: scopes,
    bearer_methods_supported: ["header"],
  };
}

export function publicOrigin(requestUrl: string): string {
  const configured = runtimeEnvironment().GO_PUBLIC_ORIGIN?.trim();
  if (configured) {
    const parsed = new URL(configured);
    if (!isSecureUrl(parsed) || parsed.origin !== configured.replace(/\/$/, "")) {
      throw new Error("GO_PUBLIC_ORIGIN must be an HTTPS origin without a path.");
    }
    return parsed.origin;
  }
  const request = new URL(requestUrl);
  if (!isSecureUrl(request)) {
    throw new Error("The OAuth resource origin must use HTTPS or loopback HTTP.");
  }
  return request.origin;
}

function oauthConfiguration(): OAuthConfiguration {
  const runtime = runtimeEnvironment();
  const issuer = requiredSecureUrl(runtime.GO_OAUTH_ISSUER, "GO_OAUTH_ISSUER");
  const audiences = parseList(runtime.GO_OAUTH_AUDIENCE);
  if (!audiences.length) throw new Error("GO_OAUTH_AUDIENCE is required.");
  const allowedAlgorithms = parseList(runtime.GO_OAUTH_ALLOWED_ALGORITHMS);
  const algorithms = allowedAlgorithms.length
    ? allowedAlgorithms
    : [...DEFAULT_ALLOWED_ALGORITHMS];
  if (
    !algorithms.length ||
    algorithms.some(
      (algorithm) => !DEFAULT_ALLOWED_ALGORITHMS.includes(
        algorithm as (typeof DEFAULT_ALLOWED_ALGORITHMS)[number],
      ),
    )
  ) {
    throw new Error("GO_OAUTH_ALLOWED_ALGORITHMS contains an unsupported value.");
  }
  const clockSkew = runtime.GO_OAUTH_CLOCK_SKEW_SECONDS?.trim();
  const clockSkewSeconds = clockSkew
    ? Number(clockSkew)
    : DEFAULT_CLOCK_SKEW_SECONDS;
  if (
    !Number.isInteger(clockSkewSeconds) ||
    clockSkewSeconds < 0 ||
    clockSkewSeconds > MAX_CLOCK_SKEW_SECONDS
  ) {
    throw new Error(
      `GO_OAUTH_CLOCK_SKEW_SECONDS must be between 0 and ${MAX_CLOCK_SKEW_SECONDS}.`,
    );
  }
  const inlineJwks = runtime.GO_OAUTH_JWKS_JSON?.trim() || null;
  const jwksUri = runtime.GO_OAUTH_JWKS_URI?.trim()
    ? requiredSecureUrl(
        runtime.GO_OAUTH_JWKS_URI,
        "GO_OAUTH_JWKS_URI",
        true,
      )
    : null;
  return {
    issuer,
    audiences,
    requiredScopes: parseList(runtime.GO_OAUTH_REQUIRED_SCOPES),
    allowedAlgorithms: new Set(algorithms),
    clockSkewSeconds,
    jwksUri,
    inlineJwks,
  };
}

function reserveForcedJwksRefresh(config: OAuthConfiguration) {
  const source = config.jwksUri ?? config.issuer;
  const now = Date.now();
  if (
    lastForcedJwksRefresh?.source === source &&
    now - lastForcedJwksRefresh.at < JWKS_REFRESH_COOLDOWN_MS
  ) {
    return false;
  }
  lastForcedJwksRefresh = { source, at: now };
  return true;
}

async function verifyJwtSignature(
  jwt: ParsedJwt,
  algorithm: string,
  config: OAuthConfiguration,
  forceRefresh: boolean,
): Promise<boolean> {
  const keys = await loadVerificationKeys(config, forceRefresh);
  const kid = stringClaim(jwt.header.kid);
  const compatible = keys.filter((key) => jwkMatches(key, algorithm, kid));
  if ((!kid && compatible.length !== 1) || !compatible.length) return false;
  const input = new TextEncoder().encode(
    `${jwt.encodedHeader}.${jwt.encodedPayload}`,
  );
  for (const jwk of compatible) {
    try {
      const params = algorithmParameters(algorithm, jwk);
      const key = await crypto.subtle.importKey(
        "jwk",
        jwk as JsonWebKey,
        params.importAlgorithm,
        false,
        ["verify"],
      );
      if (
        await crypto.subtle.verify(
          params.verifyAlgorithm,
          key,
          ownedArrayBuffer(jwt.signature),
          input,
        )
      ) {
        return true;
      }
    } catch {
      // Try another compatible rotating key without exposing key details.
    }
  }
  return false;
}

async function loadVerificationKeys(
  config: OAuthConfiguration,
  forceRefresh: boolean,
): Promise<JsonRecord[]> {
  if (config.inlineJwks) {
    if (
      !forceRefresh &&
      cachedJwks?.source === `inline:${config.inlineJwks}` &&
      cachedJwks.expiresAt > Date.now()
    ) {
      return cachedJwks.value;
    }
    const keys = parseJwks(config.inlineJwks);
    cachedJwks = {
      source: `inline:${config.inlineJwks}`,
      expiresAt: Number.POSITIVE_INFINITY,
      value: keys,
    };
    return keys;
  }

  const jwksUri = config.jwksUri ?? (await discoverJwksUri(config.issuer, forceRefresh));
  if (
    !forceRefresh &&
    cachedJwks?.source === jwksUri &&
    cachedJwks.expiresAt > Date.now()
  ) {
    return cachedJwks.value;
  }
  const response = await fetch(jwksUri, {
    headers: { accept: "application/json" },
    redirect: "error",
    signal: AbortSignal.timeout(5_000),
  });
  if (!response.ok) throw new Error("JWKS endpoint unavailable.");
  const text = await boundedResponseText(response, MAX_JWKS_BYTES);
  const keys = parseJwks(text);
  cachedJwks = {
    source: jwksUri,
    expiresAt: Date.now() + cacheLifetimeMs(response),
    value: keys,
  };
  return keys;
}

async function discoverJwksUri(
  issuer: string,
  forceRefresh: boolean,
): Promise<string> {
  const discoveryUri = `${issuer.replace(/\/$/, "")}/.well-known/openid-configuration`;
  if (
    !forceRefresh &&
    cachedDiscovery?.source === discoveryUri &&
    cachedDiscovery.expiresAt > Date.now()
  ) {
    return cachedDiscovery.value.jwksUri;
  }
  const response = await fetch(discoveryUri, {
    headers: { accept: "application/json" },
    redirect: "error",
    signal: AbortSignal.timeout(5_000),
  });
  if (!response.ok) throw new Error("OIDC discovery endpoint unavailable.");
  const document = asRecord(
    JSON.parse(await boundedResponseText(response, MAX_JWKS_BYTES)),
  );
  const discoveredIssuer = stringClaim(document.issuer);
  const jwksUri = stringClaim(document.jwks_uri);
  if (discoveredIssuer !== issuer || !jwksUri) {
    throw new Error("OIDC discovery metadata does not match the configured issuer.");
  }
  const secureJwksUri = requiredSecureUrl(
    jwksUri,
    "discovered jwks_uri",
    true,
  );
  cachedDiscovery = {
    source: discoveryUri,
    expiresAt: Date.now() + cacheLifetimeMs(response),
    value: { issuer: discoveredIssuer, jwksUri: secureJwksUri },
  };
  return secureJwksUri;
}

function parseJwt(token: string): ParsedJwt {
  if (new TextEncoder().encode(token).byteLength > MAX_JWT_BYTES) {
    throw new Error("JWT too large.");
  }
  const [encodedHeader, encodedPayload, encodedSignature, extra] = token.split(".");
  if (!encodedHeader || !encodedPayload || !encodedSignature || extra) {
    throw new Error("Malformed JWT.");
  }
  const header = asRecord(JSON.parse(decodeBase64UrlText(encodedHeader)));
  const claims = asRecord(JSON.parse(decodeBase64UrlText(encodedPayload)));
  return {
    encodedHeader,
    encodedPayload,
    signature: decodeBase64Url(encodedSignature),
    header,
    claims,
  };
}

function algorithmParameters(algorithm: string, jwk: JsonRecord) {
  const hashSuffix = algorithm.slice(-3);
  const hash = `SHA-${hashSuffix}`;
  if (algorithm.startsWith("RS")) {
    return {
      importAlgorithm: { name: "RSASSA-PKCS1-v1_5", hash },
      verifyAlgorithm: { name: "RSASSA-PKCS1-v1_5" },
    };
  }
  if (algorithm.startsWith("PS")) {
    return {
      importAlgorithm: { name: "RSA-PSS", hash },
      verifyAlgorithm: {
        name: "RSA-PSS",
        saltLength: Number(hashSuffix) / 8,
      },
    };
  }
  if (algorithm.startsWith("ES")) {
    const curves: Record<string, string> = {
      ES256: "P-256",
      ES384: "P-384",
      ES512: "P-521",
    };
    return {
      importAlgorithm: { name: "ECDSA", namedCurve: curves[algorithm] },
      verifyAlgorithm: { name: "ECDSA", hash },
    };
  }
  if (algorithm === "EdDSA" && jwk.crv === "Ed25519") {
    return {
      importAlgorithm: { name: "Ed25519" },
      verifyAlgorithm: { name: "Ed25519" },
    };
  }
  throw new Error("Unsupported JWT algorithm.");
}

function jwkMatches(jwk: JsonRecord, algorithm: string, kid: string | null) {
  if (kid && jwk.kid !== kid) return false;
  if (jwk.alg != null && jwk.alg !== algorithm) return false;
  if (jwk.use != null && jwk.use !== "sig") return false;
  if (
    Array.isArray(jwk.key_ops) &&
    !jwk.key_ops.some((operation) => operation === "verify")
  ) {
    return false;
  }
  if ((algorithm.startsWith("RS") || algorithm.startsWith("PS")) && jwk.kty !== "RSA") {
    return false;
  }
  if (algorithm.startsWith("ES") && jwk.kty !== "EC") return false;
  if (algorithm === "EdDSA" && (jwk.kty !== "OKP" || jwk.crv !== "Ed25519")) {
    return false;
  }
  return true;
}

function parseJwks(text: string): JsonRecord[] {
  if (new TextEncoder().encode(text).byteLength > MAX_JWKS_BYTES) {
    throw new Error("JWKS too large.");
  }
  const document = asRecord(JSON.parse(text));
  if (!Array.isArray(document.keys) || !document.keys.length) {
    throw new Error("JWKS has no verification keys.");
  }
  return document.keys.map(asRecord);
}

function audienceMatches(value: unknown, expected: string[]) {
  const actual =
    typeof value === "string"
      ? [value]
      : Array.isArray(value) &&
          value.length > 0 &&
          value.every((item): item is string => typeof item === "string")
        ? value
        : [];
  return expected.some((audience) => actual.includes(audience));
}

function tokenScopes(claims: JsonRecord): Set<string> {
  const values: string[] = [];
  if (typeof claims.scope === "string") values.push(...claims.scope.split(/\s+/));
  if (typeof claims.scp === "string") values.push(...claims.scp.split(/\s+/));
  if (Array.isArray(claims.scp)) {
    values.push(...claims.scp.filter((item): item is string => typeof item === "string"));
  }
  return new Set(values.map((value) => value.trim()).filter(Boolean));
}

function stableOAuthPrincipalKey(issuer: string, subject: string) {
  return `oidc:${issuer}\u0000${subject}`;
}

function oauthError(
  code: string,
  message: string,
  status: number,
  requestUrl: string,
  oauthCode: "invalid_token" | "insufficient_scope",
  scopes: readonly string[] = [],
) {
  return new OAuthResourceServerError(
    code,
    message,
    status,
    bearerChallenge(requestUrl, oauthCode, message, scopes),
  );
}

function invalidToken(requestUrl: string) {
  return oauthError(
    "INVALID_BEARER_TOKEN",
    "The Bearer access token is invalid or expired.",
    401,
    requestUrl,
    "invalid_token",
  );
}

function configurationError(error: unknown) {
  return new OAuthResourceServerError(
    "OAUTH_CONFIGURATION_UNAVAILABLE",
    error instanceof Error
      ? `The OAuth resource server is unavailable: ${error.message}`
      : "The OAuth resource server is unavailable.",
    503,
  );
}

function bearerChallenge(
  requestUrl: string,
  error: string,
  description: string,
  scopes: readonly string[],
) {
  let origin: string;
  try {
    origin = publicOrigin(requestUrl);
  } catch {
    origin = new URL(requestUrl).origin;
  }
  const fields = [
    `resource_metadata="${escapeChallenge(`${origin}/.well-known/oauth-protected-resource`)}"`,
    `error="${escapeChallenge(error)}"`,
    `error_description="${escapeChallenge(description)}"`,
  ];
  if (scopes.length) {
    fields.push(`scope="${escapeChallenge(uniqueStrings(scopes).join(" "))}"`);
  }
  return `Bearer ${fields.join(", ")}`;
}

function escapeChallenge(value: string) {
  return value.replace(/["\\\r\n]/g, "");
}

function requiredSecureUrl(
  value: string | undefined,
  name: string,
  allowQuery = false,
) {
  const normalized = value?.trim();
  if (!normalized) throw new Error(`${name} is required.`);
  const parsed = new URL(normalized);
  if (
    !isSecureUrl(parsed) ||
    parsed.username ||
    parsed.password ||
    parsed.hash ||
    (!allowQuery && parsed.search)
  ) {
    throw new Error(`${name} must be an HTTPS URL or a loopback HTTP URL.`);
  }
  return normalized;
}

function isSecureUrl(url: URL) {
  return (
    url.protocol === "https:" ||
    (url.protocol === "http:" &&
      ["localhost", "127.0.0.1", "::1"].includes(url.hostname))
  );
}

function configuredHeaderName(value: string | undefined, fallback: string) {
  const normalized = value?.trim().toLowerCase() || fallback;
  if (!/^[a-z0-9!#$%&'*+.^_`|~-]+$/.test(normalized)) {
    throw new Error("A configured Web identity header name is invalid.");
  }
  return normalized;
}

async function constantTimeTextEqual(expected: string, actual: string) {
  const [expectedHash, actualHash] = await Promise.all([
    crypto.subtle.digest("SHA-256", new TextEncoder().encode(expected)),
    crypto.subtle.digest("SHA-256", new TextEncoder().encode(actual)),
  ]);
  const left = new Uint8Array(expectedHash);
  const right = new Uint8Array(actualHash);
  let difference = left.length ^ right.length;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left[index] ^ (right[index] ?? 0);
  }
  return difference === 0;
}

async function boundedResponseText(response: Response, maximumBytes: number) {
  const declaredLength = Number(response.headers.get("content-length") ?? 0);
  if (Number.isFinite(declaredLength) && declaredLength > maximumBytes) {
    throw new Error("OAuth metadata response too large.");
  }
  const text = await response.text();
  if (new TextEncoder().encode(text).byteLength > maximumBytes) {
    throw new Error("OAuth metadata response too large.");
  }
  return text;
}

function cacheLifetimeMs(response: Response) {
  const cacheControl = response.headers.get("cache-control") ?? "";
  const match = /(?:^|,)\s*max-age=(\d+)/i.exec(cacheControl);
  const seconds = match ? Number(match[1]) : DEFAULT_JWKS_CACHE_SECONDS;
  return Math.min(
    Number.isFinite(seconds) ? seconds : DEFAULT_JWKS_CACHE_SECONDS,
    MAX_JWKS_CACHE_SECONDS,
  ) * 1_000;
}

function decodeBase64UrlText(value: string) {
  return new TextDecoder("utf-8", { fatal: true }).decode(decodeBase64Url(value));
}

function decodeBase64Url(value: string) {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) throw new Error("Invalid base64url.");
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = `${base64}${"=".repeat((4 - (base64.length % 4)) % 4)}`;
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function ownedArrayBuffer(value: Uint8Array): ArrayBuffer {
  return Uint8Array.from(value).buffer;
}

function numericDate(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function optionalNumericDate(value: unknown): number | null {
  return value == null ? null : numericDate(value);
}

function stringClaim(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function usableString(value: unknown): string | null {
  const result = stringClaim(value);
  return result && result.length <= 1_024 ? result : null;
}

function usableHeader(value: string | null, maximumLength: number) {
  const normalized = value?.trim() ?? "";
  return normalized && normalized.length <= maximumLength ? normalized : null;
}

function safeDecodeURIComponent(value: string): string | null {
  try {
    return decodeURIComponent(value);
  } catch {
    return null;
  }
}

function parseList(value: string | undefined): string[] {
  return uniqueStrings(
    (value ?? "")
      .split(/[\s,]+/)
      .map((item) => item.trim())
      .filter(Boolean),
  );
}

function uniqueStrings(values: readonly string[]) {
  return [...new Set(values)];
}

function runtimeEnvironment(): RuntimeEnv {
  return {
    GO_PUBLIC_ORIGIN: getRuntimeVariable("GO_PUBLIC_ORIGIN"),
    GO_OAUTH_ISSUER: getRuntimeVariable("GO_OAUTH_ISSUER"),
    GO_OAUTH_AUDIENCE: getRuntimeVariable("GO_OAUTH_AUDIENCE"),
    GO_OAUTH_JWKS_URI: getRuntimeVariable("GO_OAUTH_JWKS_URI"),
    GO_OAUTH_JWKS_JSON: getRuntimeVariable("GO_OAUTH_JWKS_JSON"),
    GO_OAUTH_REQUIRED_SCOPES: getRuntimeVariable("GO_OAUTH_REQUIRED_SCOPES"),
    GO_OAUTH_AUTHORIZATION_SERVERS: getRuntimeVariable(
      "GO_OAUTH_AUTHORIZATION_SERVERS",
    ),
    GO_OAUTH_ALLOWED_ALGORITHMS: getRuntimeVariable(
      "GO_OAUTH_ALLOWED_ALGORITHMS",
    ),
    GO_OAUTH_CLOCK_SKEW_SECONDS: getRuntimeVariable(
      "GO_OAUTH_CLOCK_SKEW_SECONDS",
    ),
    GO_WEB_IDENTITY_MODE: getRuntimeVariable("GO_WEB_IDENTITY_MODE"),
    GO_WEB_IDENTITY_SECRET: getRuntimeVariable("GO_WEB_IDENTITY_SECRET"),
    GO_WEB_IDENTITY_SECRET_HEADER: getRuntimeVariable(
      "GO_WEB_IDENTITY_SECRET_HEADER",
    ),
    GO_WEB_IDENTITY_ID_HEADER: getRuntimeVariable(
      "GO_WEB_IDENTITY_ID_HEADER",
    ),
    GO_WEB_IDENTITY_EMAIL_HEADER: getRuntimeVariable(
      "GO_WEB_IDENTITY_EMAIL_HEADER",
    ),
    GO_WEB_IDENTITY_NAME_HEADER: getRuntimeVariable(
      "GO_WEB_IDENTITY_NAME_HEADER",
    ),
  };
}

function asRecord(value: unknown): JsonRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Expected a JSON object.");
  }
  return value as JsonRecord;
}
