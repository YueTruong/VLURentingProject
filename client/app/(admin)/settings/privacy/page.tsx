import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import PrivacySettingsPage from "./PrivacySettingsPage";

export default async function SettingsPrivacyPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/homepage");

  return <PrivacySettingsPage />;
}

