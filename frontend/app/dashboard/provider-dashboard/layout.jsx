"use client";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useDispatch } from "react-redux";
import { fetchMyServices } from "@/app/redux/slices/serviceSlice";
import { io } from "socket.io-client";
import { FaExclamationTriangle, FaSignOutAlt, FaHome, FaCogs, FaUser, FaCreditCard, FaBookOpen } from 'react-icons/fa'
import NotAuthenticated from "@/app/not-authenticated";


import { getTokenFromLocalStorage,getRefreshTokenFromLocalStorage } from "@/helper/token";
const BACKEND_URL = process.env.NEXT_PUBLIC_API_BASE_URL

export default function ProviderLayout({ children }) {
  const token = getTokenFromLocalStorage("token");
  const refreshToken = getRefreshTokenFromLocalStorage("refreshToken");

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [verified, setVerified] = useState(false);
  const socketRef = useRef(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const dispatch = useDispatch();
  const pathname = usePathname();

  const providerNavbar = [
    { name: "Dashboard", link: "/dashboard/provider-dashboard", icon: FaHome },

    {
      name: "Services",
      link: "/dashboard/provider-dashboard/services",
      icon: FaCogs,
      children: [
        {
          name: "All Services",
          link: "/dashboard/provider-dashboard/services",
        },
      ],
    },
    { name: "Profile", link: "/dashboard/provider-dashboard/profile", icon: FaUser },
    {
      name: "Payment",
      link: "/dashboard/provider-dashboard/payment",
      icon: FaCreditCard,
      children: [
        {
          name: "Payment History",
          link: "/dashboard/provider-dashboard/payment/history",
        },
      ],
    },
    {
      name: "My Bookings",
      link: "/dashboard/provider-dashboard/bookings",
      icon: FaBookOpen,
    },
  ];

  useEffect(() => {
  const fetchUser = async () => {
  try {
    const res = await fetch(`${BACKEND_URL}/api/users/about/service-provider/`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "x-refresh-token": refreshToken,
      },
    });

    if (res.status === 401) {
      // Token expired -> auto logout
      handleLogout();
      return;
    }

    const data = await res.json();
    if (data.status === "success") {
      setUser(data.data);
      setVerified(data.data.serviceProvider.is_verified);
    } else {
      setUser(null);
    }
  } catch (err) {
    console.error(err);
    setUser(null);
  } finally {
    setLoading(false);
  }
};


    fetchUser();
    dispatch(fetchMyServices());
  }, [dispatch, token, refreshToken]);

  // Socket notifications
  useEffect(() => {
    if (!user) return;
    console.log("Setting up socket for user", user);
    socketRef.current = io(process.env.NEXT_PUBLIC_API_BASE_URL, { 
      auth: { token: `Bearer ${token}` }
     });
    socketRef.current.emit("register", { userId: user.id, role: "provider" });

    socketRef.current.on("offlineNotifications", (msgs) =>
      setNotifications((prev) => [...msgs, ...prev])
    );
    socketRef.current.on("privateBid", (msg) =>
      setNotifications((prev) => [{ ...msg, customResponse: "" }, ...prev])
    );
    socketRef.current.on("bidResponse", (msg) =>
      setNotifications((prev) => [
        {
          type: "bidResponse",
          from: msg.from,
          amount: msg.amount,
          service: msg.service,
          message: `Seeker responded: ${msg.response} to your bid of $${msg.amount}`,
        },
        ...prev,
      ])
    );
    socketRef.current.on("privateMessage", (msg) =>
      setNotifications((prev) => [
        {
          type: "message",
          from: msg.from,
          text: msg.text,
          message: `Message from User ${msg.from}: ${msg.text}`,
        },
        ...prev,
      ])
    );

    return () => socketRef.current.disconnect();
  }, [user, token]);

  const handleLogout = async () => {
    await fetch(`${BACKEND_URL}/api/users/logout`, {
      headers:{
        'Authorization': `Bearer ${token}`,
        'x-refresh-token': refreshToken
      },
      method: "POST",
    });

    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    window.location.href = "/";
  };

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  if (!user)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <NotAuthenticated />
      </div>
    );

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar (drawer on small screens) */}
      <aside className={`bg-[#039561] text-white shadow-lg md:relative md:flex md:flex-col md:w-72 ${isSidebarOpen ? 'fixed inset-y-0 left-0 w-72 z-40 translate-x-0' : 'fixed inset-y-0 left-0 w-72 z-40 -translate-x-full md:translate-x-0'}`}>
        <div className="p-6 border-b border-green-700 flex items-center gap-3">
          <img
            src={`${BACKEND_URL}${
              user.serviceProvider?.user?.profile_picture ||
              "/placeholder.svg?height=48&width=48&query=profile"
            }`}
            alt="Profile"
            className="w-12 h-12 rounded-full object-cover ring-0 select-none"
            draggable="false"
          />
          <div>
            <h3 className="text-white">{user.name || "Provider User"}</h3>
            <p className="text-sm text-green-100">Service Provider</p>
          </div>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="ml-auto md:hidden text-white bg-transparent p-1 rounded"
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>

        <nav className="flex-1 p-6 space-y-2">
          {providerNavbar.map((nav) => {
            const isParentActive = pathname.startsWith(nav.link);
            return nav.children ? (
              <div key={nav.name} className="group">
                <Link
                  href={nav.link}
                  className={`flex items-center px-3 py-2 text-md font-medium rounded transition-all duration-200 ${isParentActive ? 'bg-[#017a4b]' : 'text-white hover:bg-[#017a4b]'}`}>
                  <nav.icon className="h-5 w-5 mr-3 flex-shrink-0" />
                  {nav.name}
                  <svg className={`ml-auto h-4 w-4 text-white transform transition-transform duration-200 ${isParentActive ? 'rotate-90' : 'group-hover:rotate-90'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>

                <div className="ml-4 mt-1 space-y-1 max-h-0 overflow-hidden group-hover:max-h-96 transition-all duration-300">
                  {nav.children.map((child) => {
                    const isChildActive = pathname === child.link;
                    return (
                      <Link key={child.name} href={child.link} className={`block px-4 py-1 text-sm rounded transition-all duration-200 ${isChildActive ? 'bg-[#017a4b] pl-5 border-l-4 border-white shadow-inner' : 'text-white hover:bg-[#017a4b] hover:pl-5'}`}>
                        {child.name}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ) : (
              <Link key={nav.name} href={nav.link} className={`flex items-center px-3 py-2 text-md font-medium rounded-[4px] transition-all duration-200 ${pathname === nav.link ? 'bg-[#017a4b]' : 'text-white hover:bg-[#017a4b]'}`}>
                <nav.icon className="h-5 w-5 mr-3 flex-shrink-0" />
                {nav.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-6 border-t border-green-700 text-center text-xs text-green-100">
          &copy; {new Date().getFullYear()} Kaam-Chaa. All rights reserved.
        </div>
      </aside>

      {/* Overlay for mobile when sidebar is open - use frosted blur instead of black */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-30 md:hidden backdrop-blur-sm bg-white/10"
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden
        />
      )}

      <main className="flex-1 overflow-auto flex flex-col md:pl-0">
        <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-white">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 rounded bg-gray-100" aria-label="Open menu">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {!verified && (
              <div className="flex items-center gap-3 bg-[#e6f4ef] border border-[#a1e2c8] rounded-[4px] px-4 py-3 max-w-md">
                <FaExclamationTriangle className="h-5 w-5 text-[#019561] flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-[#019561] text-sm">KYC Verification Pending</h4>
                  <p className="text-xs text-[#017a4b] mt-1">Kyc is under review</p>
                </div>
              </div>
            )}
          </div>

          <button onClick={handleLogout} className="flex items-center rounded-[4px] px-3 py-1 bg-gray-200 hover:bg-gray-300 text-sm text-gray-700">
            <FaSignOutAlt className="h-4 w-4 mr-1" />
            Logout
          </button>
        </div>

        <div className="p-8 flex-1">{children}</div>
      </main>
    </div>
  );
}
