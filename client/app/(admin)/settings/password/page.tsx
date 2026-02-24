import { redirect } from "next/navigation";

export default function SettingsPasswordRedirectPage() {
  redirect("/settings?tab=login-security");
}
