import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import TaxpayerDetailsClient from "./TaxpayerDetailsClient";

type TaxpayerDetailsPageProps = {
  searchParams?: Promise<{
    country?: string;
    business?: string;
  }>;
};

export default async function TaxpayerDetailsPage({ searchParams }: TaxpayerDetailsPageProps) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/homepage");

  const params = (await searchParams) ?? {};
  const business = params.business === "no" ? "no" : params.business === "yes" ? "yes" : null;

  if (!business) {
    redirect("/settings/tax/taxpayers?flow=VAT&country=VN");
  }

  const country = params.country === "VN" ? "Việt Nam" : "Việt Nam";

  return <TaxpayerDetailsClient country={country} businessIdChoice={business} />;
}
