"use client";

import { useSession } from "next-auth/react";
import HeaderGuest from "./homepage/components/HeaderGuest";
import HeaderUser from "./homepage/components/HeaderUser";
import RoomList from "./homepage/components/RoomList";
import MapSection from "./homepage/components/Mapsection";
import ReviewsSection from "./homepage/components/ReviewSection";
import Footer from "./homepage/components/footer";

export default function HomePage() {
  const { data: session } = useSession();

  return (
    <div className="min-h-screen flex flex-col">
      {session ? <HeaderUser /> : <HeaderGuest />}

      <main className="grow">
        <RoomList />
        <MapSection />
        <ReviewsSection />
      </main>

      <Footer />
    </div>
  )
}
