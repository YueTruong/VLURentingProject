"use client";
// app/page.tsx (hoặc pages/index.tsx)
import Header from "./components/HeaderUser";
import RoomList from "@/app/homepage/components/RoomList";
import Footer from "@/app/homepage/components/footer";
import { useEffect } from "react";
import api from "@/app/services/api";
import MapSection from "../homepage/components/Mapsection";
import ReviewsSection from "../homepage/components/ReviewSection";

export default function LoggedHomePage() {
  useEffect(() => {
    async function fetchData() {
      try {
        const res = await api.get("/");
        console.log(res.data);
      } catch (err) {
        console.error(err);
      }
    }

    fetchData();
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      {/* <Header /> */}
      <Header />

      <main className="grow">
        <RoomList /> 
        <MapSection />
        <ReviewsSection />
      </main>
      
      {/* <Footer /> */}
      <Footer />
    </div>
  );
}