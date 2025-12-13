// app/page.tsx (hoặc pages/index.tsx)
import Header from "./components/header";
import RoomList from "@/app/homepage/components/RoomList";
import Footer from "@/app/homepage/components/footer";

export default function LoggedHomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header nằm trên cùng */}
      <Header />

      <main className="grow">
        <RoomList /> 
      </main>

      <Footer />
    </div>
  );
}