declare namespace Cloudflare {
  interface Env {
    DB: D1Database;
    GO_SOCIETY_OWNER_EMAIL?: string;
    GO_SOCIETY_THREAD_HMAC_SECRET?: string;
    GO_SOCIETY_PRINCIPAL_HMAC_SECRET?: string;
  }
}
