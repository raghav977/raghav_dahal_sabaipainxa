"use client"

import { useEffect, useState } from "react";
import HeaderNavbar from "@/app/landingpagecomponents/components/HeaderNavbar";
import { useSelector, useDispatch } from "react-redux";
import NotAuthenticated from "@/app/not-authenticated";
import Loading from "@/app/loading";
import { aboutUser } from "../redux/slices/authSlice";

import { getTokenFromLocalStorage,getRefreshTokenFromLocalStorage } from "../../helper/token";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL

export default function PaymentPage() {
  const token = getTokenFromLocalStorage("token");
  const refreshToken = getRefreshTokenFromLocalStorage("refreshToken");
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const [loadingPayment, setLoadingPayment] = useState(false);
  const [message, setMessage] = useState("");
  const amount = 500;


  useEffect(() => {
    dispatch(aboutUser());
  }, [dispatch]);

  // Handle loading / auth state
  if (user === undefined) return <Loading message="Checking authentication..." />;
  if (user === null) return <NotAuthenticated />;

  const handlePay = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoadingPayment(true);
    try {
      const res = await fetch(`${BASE_URL}/api/rooms/initiate-gharbeti-payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json", 'authorization': `Bearer ${token}`, 'x-refresh-token': refreshToken },
        body: JSON.stringify({ provider: "esewa", amount }),
      });
      const data = await res.json();
      console.log("Payment initiation response:", data);

      alert("Wait")

      if (res.ok && data?.data?.redirect_url) {
        window.location.href = data.data.redirect_url;
        return;
      }
      if (!res.ok){
        console.log("Payment initiation failed:", data.data || "Failed to initiate payment");
        setMessage(data.data || "Failed to initiate payment");
        return;
      }
      setMessage(data.message || "Payment initiated. Follow the instructions.");
    } catch (err) {
        console.log("Payment initiation error:", err);
      setMessage(err.data || "Network error");
    } finally {
      setLoadingPayment(false);
    }
  };

  return (
    <>
      <HeaderNavbar />
      <div className="h-[100vh] flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-emerald-50 py-16">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-green-100 overflow-hidden min-h-[640px] flex flex-col">
          <div className="p-6 text-center bg-gradient-to-r from-green-600 to-emerald-600 text-white">
            <h2 className="text-2xl font-semibold">Secure Checkout</h2>
            <p className="mt-1 text-sm opacity-90">Pay with eSewa to unlock premium content</p>
          </div>

          <div className="p-6 flex-1 flex flex-col overflow-hidden">
            <div className="w-full max-w-sm mx-auto h-full flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-sm text-gray-500">Payment Method</p>
                    <div className="mt-2 inline-flex items-center gap-3">
                      <div className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1 rounded-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path d="M3 12h18" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M3 6h18M3 18h18" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <span className="font-medium">eSewa</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Amount</p>
                    <p className="text-xl font-bold text-green-700">NPR {amount.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <form onSubmit={handlePay}>
                  <button
                    type="submit"
                    disabled={loadingPayment}
                    className={`w-full flex items-center justify-center gap-3 py-3 rounded-lg text-white font-semibold shadow ${
                      loadingPayment ? "bg-green-300" : "bg-green-600 hover:bg-green-700"
                    }`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M12 5v14M5 12h14" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {loadingPayment ? "Redirecting to eSewa..." : "Pay with eSewa"}
                  </button>
                </form>

                {message && <div className="mt-4 text-center text-sm text-red-600">{message}</div>}

                <div className="mt-6 text-xs text-gray-500 text-center">
                  By continuing you agree to our <a className="underline">Terms</a> and <a className="underline">Privacy Policy</a>.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
