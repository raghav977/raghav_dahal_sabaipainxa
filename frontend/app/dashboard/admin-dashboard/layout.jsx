"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "./components/SidebarComp";
import jwt from "jsonwebtoken";
import { getTokenFromLocalStorage } from "@/helper/token";

export default function AdminLayout({ children }) {
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const token = getTokenFromLocalStorage("token");
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const decoded = jwt.decode(token); // ⚠️ decode only, no verify
      if (!decoded?.roles?.includes("Admin")) {
        router.push("/auth/login/admin");
      } else {
        setUser(decoded);
      }
    } catch {
      router.push("/login");
    }
  }, [router]);

  if (!user) return null; 

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar user={user} />
      <main className="flex-1 bg-gray-50 p-6 overflow-auto">{children}</main>
    </div>
  );
}
