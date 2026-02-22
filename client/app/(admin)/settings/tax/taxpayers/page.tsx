import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import TaxpayersClient from "./TaxpayersClient";

type TaxpayerPageProps = {
  searchParams?: Promise<{
    flow?: string;
    country?: string;
  }>;
};

export default async function TaxpayerSettingsPage({ searchParams }: TaxpayerPageProps) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/homepage");

  const params = (await searchParams) ?? {};
  const country = params.country === "VN" ? "Việt Nam" : "Việt Nam";

  return <TaxpayersClient country={country} />;
}
