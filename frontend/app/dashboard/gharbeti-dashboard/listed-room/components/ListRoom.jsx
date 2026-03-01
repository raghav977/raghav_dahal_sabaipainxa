"use client";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchMyRooms } from "@/app/redux/slices/gharbetislice";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Eye, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Edit, 
  ChevronLeft, 
  ChevronRight, 
  Search,
  MapPin,
  DollarSign,
  Image as ImageIcon,
  Home,
  Calendar,
  XCircle
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import Reapply from "./ReApply";
import { ViewRoomModal } from "@/app/dashboard/gharbeti-dashboard/listed-room/components/ViewRoomModal";
import AddRoom from "@/app/dashboard/gharbeti-dashboard/listed-room/components/AddRoom";
import { FaHome } from "react-icons/fa";
import { FaMapMarkerAlt } from "react-icons/fa";

import { getTokenFromLocalStorage,getRefreshTokenFromLocalStorage } from "../../../../../helper/token";


const BACKEND_URL = process.env.NEXT_PUBLIC_API_BASE_URL
export default function MyRoomsList() {
  const token = getTokenFromLocalStorage("token")
  const refreshToken = getRefreshTokenFromLocalStorage("refreshToken");
  const dispatch = useDispatch();
  const { rooms, total, limit, offset, loading, error } = useSelector((state) => state.gharbeti);

  const [search, setSearch] = useState("");
  const [availability, setAvailability] = useState("all");
  const [ordering, setOrdering] = useState("-createdAt");
  const [viewRoom, setViewRoom] = useState(null);
  const [reapplyRoom, setReapplyRoom] = useState(null);
  const [roomDetail, setRoomDetail] = useState(null);
  const [roomLoading, setRoomLoading] = useState(false);
  const [roomError, setRoomError] = useState(null);
  const [availabilityState, setAvailabilityState] = useState({});
  const [updatingAvailability, setUpdatingAvailability] = useState({});


  useEffect(() => {
    dispatch(fetchMyRooms({ search, availability_status: availability, ordering, limit: 6, offset: 0 }));
  }, [dispatch, search, availability, ordering]);


  useEffect(() => {
    if (rooms && Array.isArray(rooms)) {
      const map = {};
      rooms.forEach((r) => (map[r.id] = !!r.availability_status));
      setAvailabilityState(map);
    }
  }, [rooms]);

  // Fetch full room details when a room is selected for viewing
  useEffect(() => {
    const ac = new AbortController();
    if (!viewRoom) {
      setRoomDetail(null);
      setRoomError(null);
      setRoomLoading(false);
      return () => {};
    }

    const fetchRoom = async () => {
      setRoomLoading(true);
      setRoomError(null);
      try {
        const res = await fetch(`${BACKEND_URL}/api/rooms/my-rooms/${viewRoom}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { authorization: `Bearer ${token}` } : {}),
            ...(refreshToken ? { "x-refresh-token": refreshToken } : {}),
          },
          signal: ac.signal,
        });

        const payload = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(payload?.message || `Failed to load (status ${res.status})`);
        }

        // prefer payload.data if API wraps response
        setRoomDetail(payload?.data || payload);
      } catch (err) {
        if (err.name === "AbortError") return;
        console.error("Error fetching room detail:", err);
        setRoomError(err.message || "Failed to load room details");
      } finally {
        setRoomLoading(false);
      }
    };

    fetchRoom();

    return () => ac.abort();
  }, [viewRoom, token, refreshToken]);

  const handleAvailabilityToggle = async(roomId, newValue) => {
  setAvailabilityState((prev) => ({ ...prev, [roomId]: newValue }));
  // console.log(`Room ${roomId} availability set to ${newValue}`);

    try{
      const res = await fetch(`${BACKEND_URL}/api/rooms/toggle-availability/${roomId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" ,'authorization': `Bearer ${token}`, 'x-refresh-token': refreshToken },
        body: JSON.stringify({ availability_status: newValue }),

      });
      if (!res.ok) throw new Error("Failed to update availability");


    }
    
    catch(err){
      console.error("Error updating availability:", err);
    }

  };

  const handleSearch = (e) => {
    e.preventDefault();
    dispatch(fetchMyRooms({ search, availability_status: availability, ordering }));
  };

  const handlePagination = (direction) => {
    const newOffset = direction === "next" ? offset + limit : Math.max(offset - limit, 0);
    dispatch(fetchMyRooms({ search, availability_status: availability, ordering, limit, offset: newOffset }));
  };

  const getStatusBadge = (status) => {
    const variants = {
      approved: { 
        class: "bg-green-100 text-green-700 border-green-200", 
        icon: <CheckCircle className="h-3 w-3" />, 
        label: "Approved" 
      },
      pending: { 
        class: "bg-yellow-100 text-yellow-700 border-yellow-200", 
        icon: <Clock className="h-3 w-3" />, 
        label: "Pending" 
      },
      rejected: { 
        class: "bg-red-100 text-red-700 border-red-200", 
        icon: <XCircle className="h-3 w-3" />, 
        label: "Rejected" 
      },
    };
    const v = variants[status] || { 
      class: "bg-gray-100 text-gray-700 border-gray-200", 
      icon: <AlertCircle className="h-3 w-3" />,
      label: status 
    };
    return (
      <Badge className={`inline-flex items-center gap-1 px-2 py-1 rounded-[4px] text-xs font-medium border ${v.class}`}>
        {v.icon}
        {v.label}
      </Badge>
    );
  };

  const formatDate = (isoString) => {
    if (!isoString) return "—";
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return String(isoString);
    }
  };

  const totalPages = Math.ceil(total / limit) || 1;
  const currentPage = Math.floor(offset / limit) + 1;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-2xl font-semibold text-gray-900 mb-2">Listed Rooms</h1>
              <p className="text-gray-600">Manage your room listings and availability</p>
            </div>

            <div className="flex-shrink-0">
              <AddRoom />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[4px] p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <form onSubmit={handleSearch} className="flex-1 flex items-center gap-2">
              <div className="relative flex-1">
                <Input
                  type="text"
                  placeholder="Search by name, location, or note..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-[4px] focus:ring-2 focus:ring-green-300 focus:border-transparent"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
              <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-[4px] cursor-pointer">
                <Search className="h-4 w-4 mr-2" /> Search
              </Button>
            </form>

            <div className="flex items-center gap-3">
              <select
                className="px-3 py-2 border border-gray-300 rounded-[4px] focus:ring-2 focus:ring-green-300 focus:border-transparent outline-none bg-white min-w-[160px] text-sm"
                value={availability}
                onChange={(e) => setAvailability(e.target.value)}
              >
                <option value="all">All Availability</option>
                <option value="true">Available</option>
                <option value="false">Unavailable</option>
              </select>

              <select
                className="px-3 py-2 border border-gray-300 rounded-[4px] focus:ring-2 focus:ring-green-300 focus:border-transparent outline-none bg-white min-w-[180px] text-sm"
                value={ordering}
                onChange={(e) => setOrdering(e.target.value)}
              >
                <option value="-createdAt">Newest First</option>
                <option value="createdAt">Oldest First</option>
                <option value="price">Price: Low to High</option>
                <option value="-price">Price: High to Low</option>
              </select>
            </div>
          </div>
        </div>
        {!loading && rooms && (
          <div className="bg-white border border-gray-200 rounded-[4px] p-4 mb-6">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-gray-700">
                Showing {rooms.length} of {total} room{total !== 1 ? 's' : ''}
              </span>
              <span className="text-gray-600">
                {/* Page {currentPage} of {totalPages} */}
              </span>
            </div>
          </div>
        )}
        {loading ? (
          <div className="bg-white border border-gray-200 rounded-[4px] p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-green-600 border-t-transparent mb-4" />
            <p className="text-gray-500 font-medium">Loading your rooms...</p>
          </div>
        ) : error ? (
          <div className="bg-white border border-red-200 rounded-[4px] p-12 text-center">
            <XCircle className="w-8 h-8 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 font-medium">{error}</p>
          </div>
        ) : rooms && rooms.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {rooms.map((room) => (
                <Card key={room.id} className="bg-white border border-gray-200 rounded-[4px] overflow-hidden hover:border-gray-300 transition-colors cursor-pointer flex flex-col">
                  <div className="relative h-40 bg-gray-100 flex-shrink-0">
                    {room.RoomImages?.length > 0 ? (
                      <img
                        src={`${BACKEND_URL}${room.RoomImages[0].image_path || "/placeholder.svg"}`}
                        alt={room.name || "Room"}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="w-12 h-12 text-gray-300" />
                      </div>
                    )}
                    <div className="absolute top-3 right-3">
                      {getStatusBadge(room.status)}
                    </div>
                    {room.RoomImages?.length > 1 && (
                      <div className="absolute bottom-3 right-3 bg-black/70 text-white px-2 py-1 rounded-[4px] text-xs font-medium flex items-center gap-1">
                        <ImageIcon className="w-3 h-3" />
                        {room.RoomImages.length}
                      </div>
                    )}
                  </div>

                  <CardHeader className="pb-3 flex-1">
                    <div className="space-y-2">
                      <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
                        <FaHome className="w-4 h-4 text-green-600" />
                        {room.name || "Unnamed Room"}
                      </CardTitle>
                      <div className="flex items-center gap-2 text-gray-600">
                        <FaMapMarkerAlt className="w-4 h-4 text-gray-500" />
                        <span className="text-sm truncate">{room.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-green-600" />
                        <span className="text-base font-semibold text-green-700">
                          NPR {room.price?.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="p-4 space-y-3 flex-shrink-0">
                    {/* Description */}
                    {room.description && (
                      <div className="bg-gray-50 rounded-[4px] p-2 border border-gray-200">
                        <p className="text-xs text-gray-700 line-clamp-2">
                          {room.description}
                        </p>
                      </div>
                    )}

                    {/* Note */}
                    {room.note && (
                      <div className="bg-blue-50 rounded-[4px] p-2 border border-blue-200">
                        <p className="text-xs font-medium text-blue-900 mb-1">Note:</p>
                        <p className="text-xs text-gray-700 line-clamp-1">{room.note}</p>
                      </div>
                    )}

                    {/* Rejection Reason */}
                    {room.status === "rejected" && room.rejection_reason && (
                      <div className="bg-red-50 rounded-[4px] p-2 border border-red-200">
                        <p className="text-xs font-medium text-red-900 mb-1">Rejection Reason:</p>
                        <p className="text-xs text-red-700 line-clamp-1">{room.rejection_reason}</p>
                      </div>
                    )}

                    {/* Meta Info */}
                    <div className="flex items-center gap-2 text-xs text-gray-500 pt-2 border-t border-gray-100">
                      <Calendar className="w-3 h-3" />
                      <span>Listed: {formatDate(room.createdAt)}</span>
                    </div>

                    {/* Availability Toggle */}
                    <div className="flex items-center justify-between bg-gray-50 rounded-[4px] p-2 border border-gray-200">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${availabilityState[room.id] ? 'bg-green-500' : 'bg-gray-400'}`} />
                        <span className="text-xs font-medium text-gray-700">
                          {availabilityState[room.id] ? 'Available' : 'Unavailable'}
                        </span>
                      </div>
                      <Switch
                        checked={availabilityState[room.id] || false}
                        onCheckedChange={(checked) => handleAvailabilityToggle(room.id, checked)}
                        disabled={updatingAvailability[room.id]}
                        className="data-[state=checked]:bg-green-600 cursor-pointer scale-75"
                      />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="flex-1 border border-gray-300 hover:bg-gray-50 rounded-[4px] cursor-pointer text-xs" 
                        onClick={() => setViewRoom(room?.id)}
                      >
                        <Eye className="h-3 w-3 mr-1" /> View
                      </Button>

                      {room.status === "rejected" && (
                        <Button
                          size="sm"
                          className="flex-1 bg-orange-600 hover:bg-orange-700 text-white rounded-[4px] cursor-pointer text-xs"
                          onClick={() => setReapplyRoom(room)}
                        >
                          <Edit className="h-3 w-3 mr-1" /> Reapply
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 mt-6 bg-white border border-gray-200 rounded-[4px] p-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePagination("prev")}
                  disabled={offset === 0}
                  className="border border-gray-300 hover:bg-gray-50 disabled:opacity-50 rounded-[4px] cursor-pointer"
                >
                  <ChevronLeft className="h-4 w-4 mr-2" /> Previous
                </Button>
                <div className="px-4 py-2 bg-gray-50 rounded-[4px] border border-gray-200">
                  <span className="text-sm font-medium text-gray-700">
                    Page {currentPage} of {totalPages}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePagination("next")}
                  disabled={offset + limit >= total}
                  className="border border-gray-300 hover:bg-gray-50 disabled:opacity-50 rounded-[4px] cursor-pointer"
                >
                  Next <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="bg-white border border-gray-200 rounded-[4px] p-12 text-center">
            <Home className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium text-lg mb-2">No rooms found</p>
            <p className="text-gray-400 text-sm">Try adjusting your search or filters</p>
          </div>
        )}

        {/* View Modal */}
        <ViewRoomModal
          open={!!viewRoom}
          onOpenChange={(open) => {
            if (!open) setViewRoom(null);
          }}
          service={roomDetail}
          loading={roomLoading}
          error={roomError}
        />

        {/* Reapply Modal (open AddRoom with initial data) */}
        <AddRoom
          initialData={reapplyRoom}
          open={!!reapplyRoom}
          onOpenChange={(isOpen) => {
            if (!isOpen) setReapplyRoom(null)
          }}
        />
      </div>

      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(1rem);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}
