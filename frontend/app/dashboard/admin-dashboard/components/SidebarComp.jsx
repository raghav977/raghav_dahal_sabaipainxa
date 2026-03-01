"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MdDashboardCustomize } from "react-icons/md";
import { motion, AnimatePresence } from "framer-motion";
import { AiFillBook, AiFillSetting, AiFillHome, AiFillFileText, AiFillBoxPlot, AiOutlineUser, AiOutlineDollarCircle } from "react-icons/ai";

const adminNavBar = [
  { name: "Dashboard", link: "/dashboard/admin-dashboard", icon: MdDashboardCustomize },
  { name: "Bookings", link: "/dashboard/admin-dashboard/bookings", icon: AiFillBook },
  { name: "Manage Users", link: "/dashboard/admin-dashboard/users", icon: AiOutlineUser },
  { name: "Manage KYC", link: "/dashboard/admin-dashboard/pending-kycs", icon: AiFillFileText },
  { name: "Services", link: "/dashboard/admin-dashboard/pending-services", icon: AiFillBoxPlot },
  { name: "Rooms", link: "/dashboard/admin-dashboard/pending-rooms", icon: AiFillHome },
  { name: "Manage Categories", link: "/dashboard/admin-dashboard/services", icon: AiOutlineDollarCircle },
  {
    name: "Settings",
    link: "/dashboard/admin-dashboard/settings",
    icon: AiFillSetting,
    children: [
      { name: "Payment", link: "/dashboard/admin-dashboard/settings/payments", icon: AiOutlineDollarCircle },
      { name: "Payment Release", link: "/dashboard/admin-dashboard/settings/payment-release", icon: AiOutlineDollarCircle },
      { name: "Room Payment", link: "/dashboard/admin-dashboard/settings/room-payments", icon: AiOutlineDollarCircle },
    ],
  },
];

export default function AdminSidebar({ user = {} }) {
  const pathname = usePathname();
  const [hoveredMenu, setHoveredMenu] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const sidebarRef = useRef(null);
  const [isDesktop, setIsDesktop] = useState(false);

  // prevent body scroll when sidebar open and close on ESC
  useEffect(() => {
    if (isSidebarOpen) {
      document.body.classList.add("overflow-hidden");
      const onKey = (e) => {
        if (e.key === "Escape") setIsSidebarOpen(false);
      };
      document.addEventListener("keydown", onKey);
      return () => {
        document.body.classList.remove("overflow-hidden");
        document.removeEventListener("keydown", onKey);
      };
    }
    return undefined;
  }, [isSidebarOpen]);

  // Track desktop breakpoint so we can keep the sidebar visible on larger screens
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const mq = window.matchMedia('(min-width: 768px)');
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener ? mq.addEventListener('change', update) : mq.addListener(update);
    return () => { mq.removeEventListener ? mq.removeEventListener('change', update) : mq.removeListener(update); };
  }, []);

  const renderNavItem = (nav) => {
    const isParentActive = nav.link === pathname || nav.children?.some((c) => pathname.startsWith(c.link));

    if (nav.children) {
      return (
        <div key={nav.name} className="group relative">
          <button
            onClick={() => setHoveredMenu(hoveredMenu === nav.name ? null : nav.name)}
            className={`flex items-center justify-between w-full px-4 py-2 rounded-[4px] transition-colors ${
              isParentActive ? "bg-[#039561] text-white" : "text-green-50 hover:bg-[#017a4b]"
            }`}
          >
            <div className="flex items-center gap-2">
              <nav.icon className="w-5 h-5" />
              <span>{nav.name}</span>
            </div>
            <span className={`transform transition-transform ${hoveredMenu === nav.name ? "rotate-90" : ""}`}>▶</span>
          </button>

          {hoveredMenu === nav.name && (
            <div className="ml-4 mt-1 flex flex-col gap-1">
              {nav.children.map((child) => {
                const isChildActive = pathname === child.link;
                return (
                  <Link
                    key={child.name}
                    href={child.link}
                    className={`px-4 py-1 rounded-[4px] text-sm transition-colors ${
                      isChildActive ? "bg-[#017a4b] text-white" : "text-green-50 hover:bg-[#017a4b]"
                    }`}
                  >
                    <child.icon className="w-4 h-4 inline mr-2" />
                    {child.name}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      );
    }

    return (
      <Link
        key={nav.name}
        href={nav.link}
        className={`flex items-center px-4 py-2 gap-2 rounded-[4px] transition-colors ${
          pathname === nav.link ? "bg-[#039561] text-white" : "text-green-50 hover:bg-[#017a4b]"
        }`}
      >
        <nav.icon className="w-5 h-5" />
        {nav.name}
      </Link>
    );
  };

  return (
    <>
      {/* Overlay for mobile */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-30 backdrop-blur-sm bg-white/10 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      <motion.aside
        ref={sidebarRef}
        initial={{ x: isDesktop ? 0 : -300 }}
        animate={isDesktop ? { x: 0 } : (isSidebarOpen ? { x: 0 } : { x: -300 })}
        transition={{ type: "tween", duration: 0.22 }}
        aria-hidden={isDesktop ? false : !isSidebarOpen}
        className={`bg-[#039561] text-white fixed inset-y-0 left-0 z-40 w-72 transform md:relative md:translate-x-0`}
      >
        <div className="p-6 border-b border-green-700 flex items-center justify-between">
          <div>
            <span className="text-lg font-semibold">{user.name || "Admin User"}</span>
            <p className="text-xs text-green-100">{user.email || ""}</p>
          </div>
          <button
            className="md:hidden p-2 rounded hover:bg-white/10"
            onClick={() => setIsSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            ✕
          </button>
        </div>

        <nav className="flex-1 p-6 space-y-2">{adminNavBar.map(renderNavItem)}</nav>

        <div className="p-6 border-t border-green-700 text-xs text-green-100 text-center">
          &copy; {new Date().getFullYear()} Upaayax. All rights reserved.
        </div>
      </motion.aside>

      <button
        onClick={() => setIsSidebarOpen(true)}
        className="md:hidden fixed top-4 left-0 z-0 p-2 rounded bg-gray-100"
        aria-label="Open sidebar"
        aria-expanded={isSidebarOpen}
      >
        ☰
      </button>
    </>
  );
}
