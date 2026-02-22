import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import SettingsPersonalClient from "./components/SettingsPersonalClient";

const MISSING_VALUE = "Chưa được cung cấp";

export default async function SettingsInfoPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/homepage");

  const legalName = session.user?.name?.trim() || MISSING_VALUE;
  const email = session.user?.email?.trim() || MISSING_VALUE;

  return <SettingsPersonalClient legalName={legalName} email={email} />;
}
