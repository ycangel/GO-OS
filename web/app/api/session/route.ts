import { getRuntimeIdentity } from "../../member-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const identity = await getRuntimeIdentity();
  if (!identity.user) {
    return Response.json({ viewer: null }, { headers: { "cache-control": "no-store" } });
  }

  return Response.json(
    {
      viewer: {
        displayName: identity.member?.displayName ?? identity.user.displayName,
        role: identity.member?.role ?? "reader",
        canWrite: Boolean(identity.member),
        canInvite: Boolean(
          identity.member?.isOwner &&
            identity.user.authenticationMethod === "sites",
        ),
      },
    },
    { headers: { "cache-control": "no-store" } },
  );
}
