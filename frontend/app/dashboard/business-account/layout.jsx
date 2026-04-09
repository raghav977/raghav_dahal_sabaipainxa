"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { AiFillHome, AiFillBank } from "react-icons/ai"
import { FaUser, FaGlobe } from "react-icons/fa"

export default function BusinessAccountLayout({ children }) {
  const pathname = usePathname()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const [profile,setProfile] = useState(null);

  const navigate = useRouter();
  


  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
        const res = await fetch(`${BASE_URL}/api/users/profile`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          console.error("Failed to fetch profile:", res.status);
          return;
        }

        const body = await res.json();
        if (body?.status === "success" && body?.data && body?.data?.business_id != null) {
          setProfile(body.data);
        } else {
          console.error("Unexpected profile response:", body);
          setProfile(null);
          navigate.push("/business-account/register");
          
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
      }
    };

    fetchProfile();
  }, []);
  const providerNavbar = [
    { name: "Dashboard", link: "/dashboard/business-account/", icon: AiFillHome },
    { name: "Manage Jobs", link: "/dashboard/business-account/manage-jobs", icon: AiFillBank },
    { name: "Websites", link: "/dashboard/business-account/websites", icon: FaGlobe },
    { name: "Profile", link: "/dashboard/business-account/profile", icon: FaUser },
  ]

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`bg-[#019561] text-white fixed inset-y-0 left-0 z-40 w-64 transform transition-transform duration-300 md:relative md:translate-x-0 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-6 border-b border-[#017a4b] flex items-center justify-between">
          <h3 className="text-lg font-semibold">Dashboard</h3>
          <button className="md:hidden" onClick={() => setIsSidebarOpen(false)}>
            ✕
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {providerNavbar.map((nav) => {
            const Icon = nav.icon
            const isActive = pathname === nav.link

            return (
              <Link
                key={nav.name}
                href={nav.link}
                className={`flex items-center gap-3 px-4 py-3 rounded transition ${
                  isActive
                    ? "bg-[#017a4b] text-white"
                    : "text-[#e6f4ef] hover:bg-[#017a4b]"
                }`}
              >
                <Icon className="h-5 w-5" />
                {nav.name}
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* Overlay (mobile) */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/20 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main */}
      <main className="flex-1 flex flex-col overflow-auto">
        {/* Header */}
        <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
          <button
            className="md:hidden p-2 bg-gray-100 rounded"
            onClick={() => setIsSidebarOpen(true)}
          >
            ☰
          </button>

          <h1 className="font-semibold">Business Dashboard</h1>
        </header>

        {/* Content */}
        <div className="flex-1 p-6">{children}</div>
      </main>
    </div>
  )
}