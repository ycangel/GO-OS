import { requireAuthority } from "./authority-guard";

export async function requireOrganizationalMutation(
  actor: string,
  action: string,
) {
  return requireAuthority({
    actor,
    action,
    requestedBy: "runtime-api",
  });
}
