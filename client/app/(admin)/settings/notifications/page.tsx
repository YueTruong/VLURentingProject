import { redirect } from "next/navigation";

export default async function SettingsNotificationsPage() {
  redirect("/settings?tab=notifications");
}
