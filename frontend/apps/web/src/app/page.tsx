"use client";

import { CitizenHome } from "@/components/home/CitizenHome";
import { CityHome } from "@/components/home/CityHome";
import { MerchantHome } from "@/components/home/MerchantHome";
import { PublicHome } from "@/components/home/PublicHome";
import { useHomepageState } from "@/hooks/useHomepageState";

export default function HomePage() {
  const role = useHomepageState();

  return (
    <>
      {role === "public" ? <PublicHome /> : null}
      {role === "citizen" ? <CitizenHome /> : null}
      {role === "merchant" ? <MerchantHome /> : null}
      {role === "city_dashboard" ? <CityHome /> : null}
    </>
  );
}
