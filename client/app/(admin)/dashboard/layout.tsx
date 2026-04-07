import { ReactNode } from "react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="admin-dashboard-shell min-h-screen bg-gray-50 text-gray-900">
      <Topbar />
      <div className="flex">
        <Sidebar />
        <div className="min-w-0 flex-1">
          <main className="px-4 py-6 lg:px-6">
            <div className="mx-auto w-full max-w-none space-y-6">{children}</div>
          </main>
        </div>
      </div>
    
    </div>
  );
}
