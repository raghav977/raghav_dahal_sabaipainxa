import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import ChatComponent from "@/app/user/bookings/[booking_id]/components/ChatComponent";
import { useDispatch, useSelector } from "react-redux";
import { aboutUser } from "@/app/redux/slices/authSlice";
import { useRef } from "react";
import { getTokenFromLocalStorage,getRefreshTokenFromLocalStorage} from "@/helper/token";

const token = getTokenFromLocalStorage("token");
const refreshToken = getRefreshTokenFromLocalStorage("refreshToken");

export default function LeftSide({ bookingId }) {
    const socketRef = useRef(null);

    const [messages, setMessages] = useState([]);

    const dispatch = useDispatch();

    const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL



    const CURRENT_USER_ID = useSelector((state) => state.auth?.user?.user?.id);
    
    console.log("Current User ID from Redux:", CURRENT_USER_ID);


    useEffect(() => {
        const fetchBids = async () => {
            try {
                const response = await fetch(`${BASE_URL}/api/bids/user/bids?bookingId=${bookingId}`, { headers: { Authorization: `Bearer ${token}` , 'x-refresh-token': refreshToken } });
                const data = await response.json();
                console.log("This is fetch bids", data?.message);

                if (Array.isArray(data.message)) {
                    setMessages(data.message);
                }
            } catch (err) {
                console.error("Error fetching bids", err);
            }
        };

        fetchBids();
        dispatch(aboutUser())
    }, [bookingId]);  

    useEffect(() => {
        
        if (!socketRef.current) {
            const socketConnection = io(`${BASE_URL}`, {
                query: { token, refreshToken },
                transports: ["websocket"],
            });
            socketRef.current = socketConnection;
            console.log("Socket connection established:", socketConnection);

            socketConnection.on("connect", () => {
                console.log("Socket connected:", socketConnection.id);
                socketConnection.emit("register", { message: "hello brother" });
            });

            

            // Cleanup socket connection on unmount
            return () => {
                console.log("Disconnecting socket...");
                socketConnection.disconnect();
            };
        }
    }, []);  

    return (
        <div className="bg-white border border-gray-200 rounded-[4px] overflow-hidden">
            <header className="p-4 border-b border-gray-200 bg-gray-50">
                <h2 className="text-lg font-semibold text-gray-900">Negotiation Room</h2>
                <p className="text-sm text-gray-600 mt-1">Chat with your service provider</p>
            </header>

            {/* Chat component */}
            <ChatComponent 
                messages={messages} 
                socketRef={socketRef}
                bookingId={bookingId}
                currentUserId={CURRENT_USER_ID}
            />
        </div>
    );
}
