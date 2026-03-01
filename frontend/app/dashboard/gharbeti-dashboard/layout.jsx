"use client"
import { useEffect, useState, useRef } from "react"
import Link from "next/link"
import { useDispatch } from "react-redux"
import { usePathname } from "next/navigation"
import { FaBell, FaSignOutAlt, FaCheckCircle, FaExclamationTriangle, FaUser } from 'react-icons/fa'
import { AiFillHome, AiFillBank } from 'react-icons/ai'
import NotAuthenticated from "@/app/not-authenticated"
import { getTokenFromLocalStorage,getRefreshTokenFromLocalStorage } from "@/helper/token"

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function GharbetiLayout({ children }) {
  const token = getTokenFromLocalStorage("token")
  const refreshToken = getRefreshTokenFromLocalStorage("refreshToken")
  const [isPaid, setIsPaid] = useState(false)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notifications, setNotifications] = useState([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [verified, setVerified] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const socketRef = useRef(null)
  const dispatch = useDispatch()
  const pathname = usePathname()

  const providerNavbar = [
    { name: "Dashboard", link: "/dashboard/gharbeti-dashboard", icon: AiFillHome },
    { name: "Room", link: "/dashboard/gharbeti-dashboard/listed-room", icon: AiFillBank },
    { name: "Profile", link: "/dashboard/gharbeti-dashboard/profile", icon: FaUser },
  ]

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(`${BASE_URL}/api/users/about/gharbeti`, { 
          headers: {
            'Authorization': `Bearer ${token}`,
            'x-refresh-token': refreshToken,
          },
        })
        const data = await res.json()
        setVerified(data.data.gharbeti.is_verified)
        setUser(data.data.gharbeti)
        setIsPaid(data.data.gharbeti.is_paid)
      } catch (err) {
        console.error("Failed to fetch user:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchUser()
  }, [dispatch])

  const handleLogout = async () => {
    await fetch(`${BASE_URL}/api/users/logout`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-refresh-token': refreshToken,
      },
      method:"POST"
    })
    setUser(null)
    localStorage.removeItem("token")
    localStorage.removeItem("refreshToken")
    window.location.href = "/"
  }

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-[#019561]"></div>
      </div>
    )
    // console.log("this is user",user)
    // alert("this is user "+user)
    

  if (!user){
    window.location.href="/service-provider/kyc?name='gharbeti'"
  }

  if(!isPaid) return (
    <div className="p-6 text-center">
      You must pay to access the gharbeti dashboard. Please visit the payment page.{" "}
      <Link href="/payment" className="text-blue-600 underline">Payment Page</Link>.
    </div>
  )

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className={`bg-[#019561] text-white fixed inset-y-0 left-0 z-40 w-64 transform transition-transform duration-300 md:relative md:translate-x-0 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="p-6 border-b border-[#017a4b] flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">{user.name || "Property Manager"}</h3>
            <p className="text-sm text-[#a1e2c8]">Property Manager</p>
          </div>
          <button className="md:hidden" onClick={() => setIsSidebarOpen(false)}>✕</button>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {providerNavbar.map((nav) => {
            const Icon = nav.icon
            const isActive = pathname === nav.link
            return (
              <Link
                key={nav.name}
                href={nav.link}
                className={`flex items-center gap-3 px-4 py-3 rounded-[4px] transition-all duration-200 ${
                  isActive ? "bg-[#017a4b] text-white shadow-md" : "text-[#e6f4ef] hover:bg-[#017a4b] hover:text-white"
                }`}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {nav.name}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-[#017a4b] text-center text-xs text-[#a1e2c8]">
          &copy; {new Date().getFullYear()} Upaayax
        </div>
      </aside>

      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-30 backdrop-blur-sm bg-white/10 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <main className="flex-1 flex flex-col overflow-auto">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="flex items-center justify-between px-6 py-4">
            <button className="md:hidden p-2 rounded bg-gray-100" onClick={() => setIsSidebarOpen(true)}>
              ☰
            </button>

            {!verified && (
              <div className="flex items-center gap-3 bg-[#e6f4ef] border border-[#a1e2c8] rounded-[4px] px-4 py-3 max-w-md">
                <FaExclamationTriangle className="h-5 w-5 text-[#019561] flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-[#019561] text-sm">KYC Verification on the way</h4>
                  <p className="text-xs text-[#017a4b] mt-1">KYC is pending</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-4 ml-auto relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="relative p-2 rounded-lg hover:bg-[#e6f4ef] transition-colors"
              >
                <FaBell className="h-5 w-5 text-gray-700" />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#019561] text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[1.5rem] h-5 flex items-center justify-center">
                    {notifications.length > 99 ? "99+" : notifications.length}
                  </span>
                )}
              </button>

              {showDropdown && (
                <div className="absolute right-0 mt-2 w-80 bg-white shadow-xl rounded-lg border border-gray-200 z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-200 bg-[#e6f4ef]">
                    <h3 className="font-semibold text-gray-800 text-sm">Notifications</h3>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-gray-500">No new notifications</div>
                    ) : (
                      <div className="divide-y divide-gray-200">
                        {notifications.map((n, idx) => (
                          <div key={idx} className="p-4 hover:bg-[#e6f4ef] transition-colors cursor-pointer">
                            <p className="text-sm text-gray-800">{n.message}</p>
                            <span className="text-xs text-gray-500 mt-1 block">{new Date(n.createdAt || Date.now()).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-[#019561] text-white rounded-lg hover:bg-[#017a4b] text-sm font-semibold transition-colors"
              >
                <FaSignOutAlt className="h-5 w-5" />
                Logout
              </button>
            </div>
          </div>
        </header>

        <div className="flex-1 p-6 bg-gray-50">{children}</div>
      </main>
    </div>
  )
}
