import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import SettingsPersonalClient from "./components/SettingsPersonalClient";

const MISSING_VALUE = "Chưa được cung cấp";

type SettingsInfoPageProps = {
  searchParams?: Promise<{
    tab?: string;
  }>;
};

export default async function SettingsInfoPage({ searchParams }: SettingsInfoPageProps) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/homepage");
  const params = (await searchParams) ?? {};

  const legalName = session.user?.name?.trim() || MISSING_VALUE;
  const email = session.user?.email?.trim() || MISSING_VALUE;
  const initialPanel =
    params.tab === "login-security"
      ? "login_security"
      : params.tab === "privacy"
        ? "privacy"
        : params.tab === "notifications"
          ? "notifications"
          : params.tab === "language-currency"
            ? "language_currency"
          : "personal";

  return <SettingsPersonalClient legalName={legalName} email={email} initialPanel={initialPanel} />;
}
