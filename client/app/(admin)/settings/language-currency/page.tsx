import { redirect } from "next/navigation";

export default async function SettingsLanguageCurrencyPage() {
  redirect("/settings?tab=language-currency");
}
