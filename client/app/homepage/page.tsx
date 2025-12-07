// app/page.tsx (hoặc pages/index.tsx)
import Header from "./components/header";
import RoomList from "./components/RoomList"; // Import cái danh sách (Grid), không phải thẻ lẻ
import Footer from "./components/footer";

export default function HomePage() {
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