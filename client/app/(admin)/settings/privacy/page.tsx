import { redirect } from "next/navigation";

export default async function SettingsPrivacyPage() {
  redirect("/settings?tab=privacy");
}

