import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { resolveWebIdentity } from "../runtime/oauth-resource-server";

export type ChatGPTUser = {
  /** Stable within the verified identity provider; never use email as a key. */
  id: string;
  /** Issuer-qualified key used for private MCP/Web principal linking. */
  principalKey: string;
  displayName: string;
  email: string | null;
  fullName: string | null;
  authenticationMethod: "oidc" | "trusted-proxy" | "sites";
  scopes: string[];
};

const SIGN_IN_PATH = "/signin-with-chatgpt";
const SIGN_OUT_PATH = "/signout-with-chatgpt";
const CALLBACK_PATH = "/callback";

export async function getChatGPTUser(): Promise<ChatGPTUser | null> {
  const requestHeaders = await headers();
  try {
    return await resolveWebIdentity(
      requestHeaders,
      webRequestUrl(requestHeaders),
    );
  } catch {
    // Authentication and configuration failures are deliberately indistinguishable
    // from a signed-out Web request at this compatibility boundary.
    return null;
  }
}

export async function requireChatGPTUser(
  returnTo: string,
): Promise<ChatGPTUser> {
  const user = await getChatGPTUser();
  if (user) return user;

  redirect(chatGPTSignInPath(returnTo));
}

export function chatGPTSignInPath(returnTo: string): string {
  const safeReturnTo = safeRelativeReturnPath(returnTo);
  return `${SIGN_IN_PATH}?return_to=${encodeURIComponent(safeReturnTo)}`;
}

export function chatGPTSignOutPath(returnTo = "/"): string {
  const safeReturnTo = safeRelativeReturnPath(returnTo);
  return `${SIGN_OUT_PATH}?return_to=${encodeURIComponent(safeReturnTo)}`;
}

function safeRelativeReturnPath(value: string): string {
  if (!value.startsWith("/") || value.startsWith("//")) return "/";

  let url: URL;
  try {
    url = new URL(value, "https://app.local");
  } catch {
    return "/";
  }
  if (url.origin !== "https://app.local") return "/";
  if (isReservedAuthPath(url.pathname)) return "/";

  return `${url.pathname}${url.search}${url.hash}`;
}

function isReservedAuthPath(pathname: string): boolean {
  return (
    pathname === SIGN_IN_PATH ||
    pathname === SIGN_OUT_PATH ||
    pathname === CALLBACK_PATH
  );
}

function webRequestUrl(requestHeaders: Headers): string {
  const forwardedHost = requestHeaders.get("x-forwarded-host")?.split(",")[0];
  const host = forwardedHost?.trim() || requestHeaders.get("host")?.trim();
  const forwardedProtocol = requestHeaders
    .get("x-forwarded-proto")
    ?.split(",")[0]
    ?.trim();
  const protocol = forwardedProtocol === "http" ? "http" : "https";
  if (!host || /[\s/\\]/.test(host)) return "https://go-society.invalid/";
  try {
    return new URL(`${protocol}://${host}/`).toString();
  } catch {
    return "https://go-society.invalid/";
  }
}
