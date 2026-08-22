import { getChatGPTUser } from "./chatgpt-auth";
import RuntimeDashboard from "./runtime-dashboard";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getChatGPTUser();

  return (
    <RuntimeDashboard
      actor={
        user
          ? { displayName: user.displayName, email: user.email }
          : null
      }
    />
  );
}
