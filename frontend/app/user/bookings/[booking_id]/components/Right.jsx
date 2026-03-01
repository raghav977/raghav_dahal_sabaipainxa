"use client";

import { useState, useEffect, useCallback } from "react";
import { FaCheckCircle, FaStar, FaTimesCircle, FaCreditCard, FaUserCheck } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { connectSocketConnection } from "@/helper/socket";

import { getTokenFromLocalStorage,getRefreshTokenFromLocalStorage } from "@/helper/token";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "";

const modalVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
  exit: { opacity: 0, y: 50, transition: { duration: 0.2 } },
};

const buttonVariants = {
  hover: { scale: 1.05 },
  tap: { scale: 0.95 },
};

export default function RightSide({ bookingId }) {
  const token = getTokenFromLocalStorage("token");
  const refreshToken = getRefreshTokenFromLocalStorage("refreshToken");
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [booking, setBooking] = useState(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isCancel, setIsCancel] = useState(false);
  const [ratingData, setRatingData] = useState(null);

  const fetchBookingStatus = useCallback(async () => {
    if (!bookingId) return;
    try {
      const response = await fetch(`${BASE_URL}/api/booking/get-booking-status/${bookingId}`, {
        headers: {
          "Content-Type": "application/json",
          'Authorization': `Bearer ${token}`,
          'x-refresh-token': refreshToken,
        },
      });
      const data = await response.json();
      if (data.status === "success") {
        setBooking(data.data.booking);
        setIsCancel(data.data.booking.status === "cancelled");
      }
    } catch (err) {
      console.error("Error fetching booking status:", err);
    }
  }, [bookingId]);

  const fetchPaymentStatus = useCallback(async () => {
    if (!bookingId) return;
    try {
      const res = await fetch(`${BASE_URL}/api/payments/payment-status/${bookingId}`, {
        headers: {
          "Content-Type": "application/json",
          'Authorization': `Bearer ${token}`,
          'x-refresh-token': refreshToken,
        },
      });
      const data = await res.json();
      if (data.status === "success") {
        setPaymentInfo(data.message);
      } else {
        setPaymentInfo(null);
      }
    } catch (err) {
      console.error("Error fetching payment status:", err);
      setPaymentInfo(null);
    }
  }, [bookingId]);

  const fetchRating = useCallback(async () => {
    if (!bookingId) return;
    try {
      const res = await fetch(`${BASE_URL}/api/ratings/${bookingId}`, {
        headers: {
          "Content-Type": "application/json",
          'Authorization': `Bearer ${token}`,
          'x-refresh-token': refreshToken,
        },
      });
      const data = await res.json();
      if (res.ok && (data.success === true || data.status === "success")) {
        setRatingData(data.data || null);
      } else {
        setRatingData(null);
      }
    } catch (err) {
      console.error("Error fetching rating:", err);
      setRatingData(null);
    }
  }, [bookingId]);

//   const handlePayment = useCallback(async () => {


  
//     if (!paymentInfo?.Bid?.bidAmount || !bookingId) return;

//     try {
//       console.log("this is booking id",bookingId)
//       alert("this is ")
//       const res = await fetch(`${BASE_URL}/api/payments/initiate-payment/${bookingId}`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" ,'Authorization': `Bearer ${token}`, 'x-refresh-token': refreshToken },
//         body: JSON.stringify({
//           amount: paymentInfo.Bid.bidAmount,
//           productId: bookingId,
//           paymentGateway: "esewa",
//           bidId: paymentInfo.bidId,
//         }),
//       });

//       const data = await res.json();
//       const redirectUrl = data.data?.redirect_url || data.redirect_url; // handle both
//       console.log("this is data ", await data);
//       alert("this is data "+ JSON.stringify(data));
//       if (redirectUrl) {
//   window.location.href = redirectUrl;
//   return;
// }
//       if (res.ok) {
//         const payload = data.data || {};
//         // If backend returned an action+fields for a browser POST to eSewa, build and submit a form
//         if (payload.action && payload.method && payload.fields) {
//           const form = document.createElement("form");
//           form.method = payload.method;
//           form.action = payload.action;
//           form.style.display = "none";
//           Object.entries(payload.fields).forEach(([key, value]) => {
//             const input = document.createElement("input");
//             input.type = "hidden";
//             input.name = key;
//             input.value = value == null ? "" : String(value);
//             form.appendChild(input);
//           });
//           document.body.appendChild(form);
//           form.submit();
//           return;
//         }

//         // fallback: older behavior where backend returned a redirect_url
//         if (payload.redirect_url) {
//           window.location.href = payload.redirect_url;
//           return;
//         }

//         alert(data.message || "Payment initiation failed");
//       } else {
//         alert(data.message || "Payment initiation failed");
//       }
//     } catch (err) {
//       console.error("Error initiating payment:", err);
//       alert("Error initiating payment");
//     }
//   }, [paymentInfo, bookingId]);


// const handlePayment = useCallback(async () => {
//   if (!paymentInfo?.Bid?.bidAmount || !bookingId) return;

//   try {
//     const res = await fetch(`${BASE_URL}/api/payments/initiate-payment/${bookingId}`, {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//         Authorization: `Bearer ${token}`,
//         "x-refresh-token": refreshToken,
//       },
//       body: JSON.stringify({
//         amount: paymentInfo.Bid.bidAmount,
//         paymentGateway: "esewa",
//         bidId: paymentInfo.bidId,
//       }),
//     });

//     const responseData = await res.json();
//     console.log("Backend response:", responseData);

//     const payload = responseData.data || {};

//     // ✅ Build eSewa form dynamically
//     if (payload.action && payload.method && payload.fields) {
//       const form = document.createElement("form");
//       form.method = payload.method;
//       form.action = payload.action;
//       form.style.display = "none";

//       Object.entries(payload.fields).forEach(([key, value]) => {
//         const input = document.createElement("input");
//         input.type = "hidden";
//         input.name = key;
//         input.value = String(value);
//         form.appendChild(input);
//       });

//       document.body.appendChild(form);
//       form.submit();
//       return;
//     }

//     alert("Payment initiation failed");
//   } catch (err) {
//     console.error("Error initiating payment:", err);
//     alert("Error initiating payment");
//   }
// }, [paymentInfo, bookingId]);


/**
 * Initiates an eSewa payment for a booking.
 *
 * Steps:
 *  1. Sends booking info to backend.
 *  2. Backend responds with a payment form payload.
 *  3. Dynamically builds & submits the form to eSewa sandbox.
 */


const handlePayment = useCallback(async () => {
  if (!bookingId) {
    console.error("Booking ID is missing");
    return;
  }


  const amount = Number(
    paymentInfo?.Bid?.bidAmount || paymentInfo?.bidAmount || paymentInfo?.amount || 0
  );
  const bidId = paymentInfo?.Bid?.id || paymentInfo?.bidId || paymentInfo?.Bid?.bidId || null;

  if (!amount || isNaN(amount) || amount <= 0) {
    console.error("No valid amount available for payment initiation");
    return;
  }

  try {
    const res = await fetch(`${BASE_URL}/api/payments/initiate-payment/${bookingId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "x-refresh-token": refreshToken,
      },
      body: JSON.stringify({ amount, paymentGateway: "esewa", bidId }),
    });

    const data = await res.json();


  // console.log("Backend response for payment initiation:", data);
  // alert("this is "+ JSON.stringify(data));
    const responseJson = await res.json().catch(() => ({}));

    // backend may return redirect url at top-level or inside data

    const redirectUrl = data?.data?.redirect_url

  // console.log("this is redirect url",redirectUrl)
  // alert("this is redirect url"+redirectUrl)

    if (!res.ok || !redirectUrl) {
      console.error("Payment initiation failed or no redirect URL:", responseJson || data);
      alert((responseJson && (responseJson.message || responseJson.data?.message)) || data.message || "Payment initiation failed");
      return;
    }

  // console.log("Redirecting to eSewa:", redirectUrl);
    // Redirect user to eSewa sandbox
    window.location.href = redirectUrl;
  } catch (err) {
    console.error("Error initiating payment:", err);
    alert("Error initiating payment. Please try again.");
  }
}, [paymentInfo, bookingId, token, refreshToken]);


  const handleCancelBooking = async () => {
    alert("Are you sure you want to cancel this booking? This action cannot be undone.");
  // console.log("Attempting to cancel booking:", bookingId);
    if (!bookingId) return;
    try {
      const response = await fetch(`${BASE_URL}/api/booking/cancel/${bookingId}`, {
        headers:{
          "Content-Type": "application/json",
          'Authorization': `Bearer ${token}`,
          'x-refresh-token': refreshToken,
        },
        method: "POST",
      });
      const data = await response.json();
  // console.log("Cancel booking response:", data);
      if (response.ok) {
        setIsCancel(true);
        alert("Booking cancelled successfully");
      }
    } catch (err) {
      console.error("Error cancelling booking:", err);
      alert("Error cancelling booking");
    }
  };

  const handleMarkAsComplete = useCallback(() => {
    setShowCompleteModal((prev) => !prev);
  }, []);

  const submitCompletion = useCallback(async () => {
    if (!bookingId) return;
    if (rating < 1 || rating > 5) {
      alert("Please provide a rating between 1 and 5 stars.");
      return;
    }

    try {
      const confirmed = window.confirm("Submit rating and mark booking as complete?");
      if (!confirmed) return;

      // derive ratingType from numeric rating
      const getRatingType = (r) => {
        if (r >= 5) return "excellent";
        if (r === 4) return "good";
        if (r === 3) return "average";
        return "poor";
      };
  // console.log("Submitting completion with rating:", rating, "and comment:", comment);
      

      const payload = {
        rating: Number(rating),
        ratingType: getRatingType(rating),
        comment: comment || null,
        bookingId: Number(bookingId),
      };

      const response = await fetch(`${BASE_URL}/api/ratings/submit`, {
        method: "POST",

        headers: { "Content-Type": "application/json",
          'Authorization': `Bearer ${token}`,
          'x-refresh-token': refreshToken,
         },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to mark booking as complete.");

      alert("Booking marked as complete successfully!");
      setShowCompleteModal(false);
      fetchBookingStatus();
      // refresh rating so the UI will show the submitted rating
      try {
        await fetchRating();
      } catch (err) {
        // ignore
      }
    } catch (err) {
      console.error("Error marking booking complete:", err);
      alert(err.message || "Something went wrong.");
    }
  }, [bookingId, rating, comment, fetchBookingStatus, fetchRating]);

  useEffect(() => {
    if (!bookingId) return;
    fetchBookingStatus();
    fetchPaymentStatus();
    fetchRating();

    const socket = connectSocketConnection();
    socket.emit("join-booking-room", { bookingId });
    socket.on("bid-accepted", async () => {
      await fetchPaymentStatus();
    });

    return () => socket.off("bid-accepted");
  }, [bookingId, fetchBookingStatus, fetchPaymentStatus, fetchRating]);

  if (!bookingId) return null;
  if (isCancel) {
    return (
      <div className="bg-white border border-gray-200 rounded-[4px] p-6 text-center">
        <FaTimesCircle className="w-8 h-8 text-red-500 mx-auto mb-3" />
        <p className="text-red-600 font-medium">Booking has been cancelled. Room closed.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-[4px] overflow-hidden">
      <header className="p-4 border-b border-gray-200 bg-gray-50">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          Service Actions
        </h2>
        <p className="text-sm text-gray-600 mt-1">Manage your booking actions</p>
      </header>

      <div className="p-4">
        {ratingData ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <FaCheckCircle className="w-6 h-6 text-green-600" />
              <div>
                <div className="text-sm font-medium text-gray-800">You have rated this booking</div>
                <div className="text-xs text-gray-500">{ratingData.ratingType}</div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {[1,2,3,4,5].map((s)=> (
                <FaStar key={s} className={`w-5 h-5 ${s <= (ratingData.rating||0) ? 'text-yellow-400' : 'text-gray-200'}`} />
              ))}
            </div>

            <div className="text-sm text-gray-700">{ratingData.comment || <span className="text-gray-400">No comment provided</span>}</div>
            <div className="text-xs text-gray-400">{ratingData.createdAt ? new Date(ratingData.createdAt).toLocaleString() : ''}</div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <motion.button
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
              onClick={handlePayment}
              disabled={!paymentInfo || paymentInfo.status !== "pending"}
              className={`flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-[4px] transition-colors font-medium text-sm ${
                paymentInfo && paymentInfo.status === "pending"
                  ? "bg-green-600 text-white hover:bg-green-700"
                  : "bg-gray-200 text-gray-500 cursor-not-allowed"
              }`}
            >
              <FaCreditCard className="w-4 h-4" />
              {paymentInfo && paymentInfo.status === "pending"
                ? `Pay Rs. ${paymentInfo.Bid.bidAmount.toLocaleString()}`
                : "Payment Not Available"}
            </motion.button>
            
            <motion.button
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
              onClick={handleCancelBooking}

              disabled={booking?.status === "confirmed" || paymentInfo?.status === "completed"}
              className={`flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-[4px] transition-colors font-medium text-sm ${
                // use the same disabled visual when payment is pending or payment completed
                (paymentInfo?.status === "pending" || paymentInfo?.status === "completed")
                  ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                  : "bg-red-600 text-white hover:bg-red-700"
              }`}
            >
              <FaTimesCircle className="w-4 h-4" />
              Cancel Booking
            </motion.button>

            <motion.button
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
              onClick={handleMarkAsComplete}
              disabled={paymentInfo?.status !== "completed"}
              className={`flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-[4px] transition-colors font-medium text-sm ${
                paymentInfo?.status === "completed"
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-gray-200 text-gray-500 cursor-not-allowed"
              }`}
            >
              <FaUserCheck className="w-4 h-4" />
              {booking?.status === "completed" ? "Review Service" : "Mark As Complete"}
            </motion.button>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showCompleteModal && (
          <motion.div
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowCompleteModal(false)}
          >
            {/* Frosted glass backdrop: blur the page content instead of a dark overlay */}
            <div className="absolute inset-0 backdrop-blur-sm bg-white/30" />

            <motion.div
              className="bg-white border border-gray-200 rounded-[4px] p-6 w-full max-w-md relative z-10"
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-lg font-semibold mb-4 text-gray-900">
                {booking?.status === "completed" ? "Review Service" : "Complete Booking & Rate Service"}
              </h2>

              <label className="block mb-2 text-sm font-medium text-gray-700">Rating (1-5):</label>
              <div className="flex gap-1 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <FaStar
                    key={star}
                    className={`w-6 h-6 cursor-pointer ${star <= rating ? "text-yellow-400" : "text-gray-300"}`}
                    onClick={() => setRating(star)}
                  />
                ))}
              </div>

              <label className="block mb-2 text-sm font-medium text-gray-700">Comments:</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                placeholder="Optional feedback..."
                className="w-full border border-gray-300 rounded-[4px] px-3 py-2 mb-4 text-sm focus:ring-2 focus:ring-green-300 outline-none"
              />

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowCompleteModal(false)}
                  className="px-3 py-2 border border-gray-300 rounded-[4px] text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={submitCompletion}
                  className="px-3 py-2 bg-green-600 text-white rounded-[4px] text-sm hover:bg-green-700 transition-colors"
                >
                  Submit
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}