"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";
import {
  Briefcase,
  Menu,
  X,
  UserCircle,
  Home,
  LogOut,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { aboutUser } from "@/app/redux/slices/authSlice";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { connectSocketConnection } from "@/helper/socket";
import { MdNotificationsActive, MdNotifications } from "react-icons/md";
import { getTokenFromLocalStorage, getRefreshTokenFromLocalStorage } from "../../../helper/token";
import { current } from "@reduxjs/toolkit";

export default function HeaderNavbar() {
  const reduxUser = useSelector((state) => state.auth.user);
  const dispatch = useDispatch();
  const router = useRouter();
  const pathname = usePathname();

  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [isAtTop, setIsAtTop] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const joinRef = useRef(null);
  const notifRef = useRef(null);

  const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

  // Sync user from Redux
  useEffect(() => {
    if (reduxUser?.user) setUser(reduxUser);
    else setUser(null);
  }, [reduxUser]);

  // Lazy-load profile if Redux empty
  useEffect(() => {
    if (reduxUser?.user) return;

    (async () => {
      try {
        const token = getTokenFromLocalStorage("token");
        if(!token){
          return;
        }
        const res = await fetch(`${BASE_URL}/api/users/profile`, {
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
        });
        const data = await res.json();
        const maybeUser = data?.data?.user || data?.data || null;
        if (maybeUser) {
          setUser(maybeUser);
          dispatch(aboutUser());
        }
      } catch (err) {
        console.error("Failed to fetch profile:", err);
      }
    })();
  }, [reduxUser, dispatch]);

  // Setup notifications
  useEffect(() => {
    if (!user) return;

    const token = getTokenFromLocalStorage("token");
    const refreshToken = getRefreshTokenFromLocalStorage("refreshToken");

    const socket = connectSocketConnection();
    socket.emit("register", { userId: user.id });

    const handleNewNotification = (notif) => {
      setNotifications((prev) => [notif, ...prev].slice(0, 20));
      setUnreadCount((c) => c + 1);
    };
    const handleBookingCreated = (payload) => {
      const notif = {
        id: payload.id || `booking-${Date.now()}`,
        title: payload.title || "Booking Update",
        message: payload.message || `Booking #${payload.id || ""} created/updated`,
        createdAt: new Date().toISOString(),
      };
      setNotifications((prev) => [notif, ...prev].slice(0, 20));
      setUnreadCount((c) => c + 1);
    };
    const handleNewBid = (bid) => {
      const notif = {
        id: bid.id || `bid-${Date.now()}`,
        title: "New Bid",
        message: `New bid of Rs.${bid.bidAmount || bid.amount || ""}`,
        createdAt: new Date().toISOString(),
      };
      setNotifications((prev) => [notif, ...prev].slice(0, 20));
      setUnreadCount((c) => c + 1);
    };

    socket.on("new-notification", handleNewNotification);
    socket.on("booking-created", handleBookingCreated);
    socket.on("new-bid", handleNewBid);

    // Fetch offline notifications
    (async () => {
      try {
        const res = await fetch(`${BASE_URL}/api/notifications?limit=6`, {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
            "x-refresh-token": refreshToken,
          },
        });
        const body = await res.json();
        const list = body?.data?.data || [];
        setNotifications(list.slice(0, 6));
        setUnreadCount(list.filter((n) => !n.isRead).length);
      } catch (err) {
        console.error("Failed to fetch notifications:", err);
      }
    })();
  }, [user]);

  const toggleNotif = () => {
    const token = getTokenFromLocalStorage("token");
    const refreshToken = getRefreshTokenFromLocalStorage("refreshToken");

    setNotifOpen((v) => !v);
    if (unreadCount > 0) {
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);

      fetch(`${BASE_URL}/api/notifications/mark-read`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
          "x-refresh-token": refreshToken,
        },
      }).catch(() => {});
    }
  };

  const handleLogout = async () => {
    try {
      const token = getTokenFromLocalStorage("token");
      const refreshToken = getRefreshTokenFromLocalStorage("refreshToken");

      await fetch(`${BASE_URL}/api/users/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
          "x-refresh-token": refreshToken,
        },
      });
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      setUser(null);
      setMenuOpen(false);
      setNotifOpen(false);
      router.push("/");
    }
  };

  const handleBecomeProvider = async () => {
    const token = getTokenFromLocalStorage("token");
    if (!token) {
      router.push("/auth/login");
      return;
    }
    try {
      const res = await fetch(`${BASE_URL}/api/users/profile`, {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        // Token invalid or server error -> ask user to login
        router.push("/auth/login");
        return;
      }

      const data = await res.json();
      const currentUser = data?.data || data;

      // If backend returned a non-success response shape, treat as unauthenticated
      if (data?.status && data.status !== "success") {
        router.push("/auth/login");
        return;
      }

      router.push(
        currentUser?.service_provider_id
          ? "/dashboard/provider-dashboard"
          : "/service-provider/kyc?name=service_provider"
      );
    } catch (err) {
      console.error("Failed to fetch profile for provider flow:", err);
      router.push("/auth/login");
    }
  };

  const handleBecomeGharbeti = () =>
    router.push(
      user?.gharbeti_id
        ? "/dashboard/gharbeti-dashboard"
        : "/service-provider/kyc?name=gharbeti"
    );

  useEffect(() => {
    const onDocClick = (e) => {
      if (joinRef.current && !joinRef.current.contains(e.target)) setJoinOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  const navConfig = [
    { name: "Home", link: "/" },
    { name: "Home Services", link: "/home-services" },
    { name: "Find a Room", link: "/find-a-room" },
    {name:"Nepali Template", link:"/nepali-template"},
    { name: "My Bookings", link: "/user/bookings", show: (u) => !!u },
  ];

  useEffect(() => {
    const onScroll = () => {
      try {
        setIsAtTop(window.scrollY <= 10);
      } catch (e) {

      }
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navbarVisible = isAtTop || menuOpen;

  return (
    <header className={`w-full fixed top-0 left-0 right-0 z-[50] border-b bg-white/90 backdrop-blur-lg px-4 md:px-8 transform transition-transform duration-300 ${navbarVisible ? "translate-y-0" : "-translate-y-full"}`}>
      <div className="max-w-7xl mx-auto flex items-center h-16 justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-green-600 to-emerald-600 shadow">
            <Briefcase className="h-4 w-4 text-white" />
          </div>
          <span className="text-sm md:text-lg font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent tracking-tight">
            SabaiPainxa
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex flex-1 items-center justify-center gap-5">
          {navConfig
            .filter((item) => !item.show || item.show(user))
            .map((item) => {
              const isActive = pathname === item.link || (item.link !== "/" && pathname?.startsWith(item.link));
              return (
                <Link
                  key={item.name}
                  href={item.link}
                  className={`text-sm font-medium px-3 py-2 rounded-md transition-colors border-2 ${
                    isActive
                      ? "bg-green-600 text-white border-green-600"
                      : "text-gray-800 hover:bg-green-50 hover:border-green-200 border-transparent"
                  }`}
                  aria-current={isActive ? "page" : undefined}
                >
                  {item.name}
                </Link>
              );
            })}
        </nav>

        {/* Right Section */}
        <div className="hidden md:flex items-center gap-3">
          {!user ? (
            <>
              <Link href="/auth/login">
                <Button variant="ghost" size="sm" className="text-gray-700 hover:text-green-700">Sign In</Button>
              </Link>
              <Link href="/auth/register">
                <Button className="bg-green-500 text-white px-4 py-2 rounded-xl hover:brightness-110">Register</Button>
              </Link>
            </>
          ) : (
            <>
              {/* Notifications */}
              <div className="relative" ref={notifRef}>
                <button onClick={toggleNotif} className="relative p-2 rounded hover:bg-green-50">
                  {unreadCount > 0 ? <MdNotificationsActive className="h-5 w-5 text-green-700" /> : <MdNotifications className="h-5 w-5 text-slate-700" />}
                  {unreadCount > 0 && <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full px-1.5">{unreadCount > 9 ? "9+" : unreadCount}</span>}
                </button>
                {notifOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white border rounded shadow-lg z-50">
                    <div className="px-3 py-2 border-b flex items-center justify-between">
                      <div className="text-sm font-medium">Notifications</div>
                      <button onClick={() => { setNotifications([]); setUnreadCount(0); }} className="text-xs text-green-600 hover:underline">Mark all read</button>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {notifications.length === 0 ? <div className="p-4 text-sm text-slate-500">No notifications</div> : notifications.map(n => (
                        <div key={n.id} className={`px-3 py-3 border-b hover:bg-green-50 flex items-start gap-2 ${!n.isRead ? "bg-emerald-50" : ""}`}>
                          <div className="pt-1"><Check className="w-4 h-4 text-green-600 opacity-70" /></div>
                          <div className="flex-1">
                            <div className="text-sm font-medium text-slate-800">{n.title || n.message}</div>
                            <div className="text-xs text-slate-500 mt-1">{n.createdAt ? new Date(n.createdAt).toLocaleString() : ""}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* User Avatar */}
              <div className="relative" ref={joinRef}>
                <Button variant="ghost" className="h-8 w-8 rounded-full" onClick={() => setJoinOpen(!joinOpen)}>
                  <Avatar className="h-8 w-8">
                    {user?.avatar ? <AvatarImage src={user.avatar} alt={user.name} /> : <AvatarFallback><UserCircle className="h-6 w-6" /></AvatarFallback>}
                  </Avatar>
                </Button>

                {joinOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border rounded-md shadow-lg z-[60]">
                    <div className="py-1">
                      <button onClick={() => { setJoinOpen(false); handleBecomeProvider(); }} className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center">
                        <Briefcase className="mr-2 h-4 w-4" /> Be a Provider
                      </button>
                      <button onClick={() => { setJoinOpen(false); handleBecomeGharbeti(); }} className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center">
                        <Home className="mr-2 h-4 w-4" /> Be a Gharbeti
                      </button>
                    </div>
                    <div className="border-t py-1">
                      <button onClick={() => { setJoinOpen(false); handleLogout(); }} className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center text-red-600">
                        <LogOut className="mr-2 h-4 w-4" /> Log out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Mobile Menu */}
        <button className="md:hidden p-2 rounded" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X className="h-6 w-6 text-green-700" /> : <Menu className="h-6 w-6 text-green-700" />}
        </button>

        {menuOpen && (
          <div className="md:hidden absolute left-0 top-16 w-full bg-white/95 backdrop-blur-lg shadow-lg z-50 border-t">
            <nav className="flex flex-col gap-2 py-4 px-6">
              {navConfig
                .filter((item) => !item.show || item.show(user))
                .map((item) => {
                  const isActive = pathname === item.link || (item.link !== "/" && pathname?.startsWith(item.link));
                  return (
                    <Link
                      key={item.name}
                      href={item.link}
                      onClick={() => setMenuOpen(false)}
                      className={`text-base py-2 px-3 rounded-md transition-colors ${isActive ? "bg-green-50 border-l-4 border-green-600 text-green-700 font-semibold" : "text-gray-800 hover:bg-green-50"}`}
                    >
                      {item.name}
                    </Link>
                  );
                })}
              {user && (
                <>
                 <div className="relative" ref={notifRef}>
                <button onClick={toggleNotif} className="relative p-2 rounded hover:bg-green-50">
                  {unreadCount > 0 ? <MdNotificationsActive className="h-5 w-5 text-green-700" /> : <MdNotifications className="h-5 w-5 text-slate-700" />}
                  {unreadCount > 0 && <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full px-1.5">{unreadCount > 9 ? "9+" : unreadCount}</span>}
                </button>
                {notifOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white border rounded shadow-lg z-50">
                    <div className="px-3 py-2 border-b flex items-center justify-between">
                      <div className="text-sm font-medium">Notifications</div>
                      <button onClick={() => { setNotifications([]); setUnreadCount(0); }} className="text-xs text-green-600 hover:underline">Mark all read</button>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {notifications.length === 0 ? <div className="p-4 text-sm text-slate-500">No notifications</div> : notifications.map(n => (
                        <div key={n.id} className={`px-3 py-3 border-b hover:bg-green-50 flex items-start gap-2 ${!n.isRead ? "bg-emerald-50" : ""}`}>
                          <div className="pt-1"><Check className="w-4 h-4 text-green-600 opacity-70" /></div>
                          <div className="flex-1">
                            <div className="text-sm font-medium text-slate-800">{n.title || n.message}</div>
                            <div className="text-xs text-slate-500 mt-1">{n.createdAt ? new Date(n.createdAt).toLocaleString() : ""}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

                  <button onClick={() => { setMenuOpen(false); handleBecomeProvider(); }} className="w-full text-left px-3 py-2 hover:bg-green-50 border-b border-gray-100">Be a Provider</button>
                  <button onClick={() => { setMenuOpen(false); handleBecomeGharbeti(); }} className="w-full text-left px-3 py-2 hover:bg-green-50">Be a Gharbeti</button>
                  <button onClick={() => { setMenuOpen(false); handleLogout(); }} className="w-full text-left px-3 py-2 mt-2 text-red-600 hover:bg-red-50 font-semibold">Logout</button>
                </>
              )}
              {!user && (
                <>
                <h1>Hellowfs</h1>
                  <Link href="/auth/login" onClick={() => setMenuOpen(false)}><Button variant="ghost" className="w-full justify-start">Sign In</Button></Link>
                  <Link href="/auth/register" onClick={() => setMenuOpen(false)}><Button className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white">Register</Button></Link>
                </>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
