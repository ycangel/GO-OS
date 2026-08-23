import { getChatGPTUser } from "./chatgpt-auth";
import RuntimeDashboard from "./runtime-dashboard";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getChatGPTUser();

  return (
    <RuntimeDashboard
      viewer={
        user
          ? {
              displayName: user.displayName,
              role: "reader",
              canWrite: false,
              canInvite: false,
            }
          : null
      }
    />
  );
}
