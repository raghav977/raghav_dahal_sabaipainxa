"use client"
import { useParams } from "next/navigation";


import { getTokenFromLocalStorage,getRefreshTokenFromLocalStorage } from "../../../../../helper/token";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL

function formatDate(dateStr){
    try{
        return new Date(dateStr).toLocaleString();
    }catch(e){
        return dateStr;
    }
}

function StatusBadge({status}){
    const map = {
        pending: 'bg-yellow-100 text-yellow-800',
        approved: 'bg-green-100 text-green-800',
        rejected: 'bg-red-100 text-red-800'
    };
    const cls = map[status] || 'bg-gray-100 text-gray-800';
    return (
        <span className={`px-2 py-1 rounded-md text-sm font-medium ${cls}`}>{status}</span>
    );
}

export default async function RoomDetailPage(){
    const { id } = useParams();

    let room = null;
    try{
        const res = await fetch(`${BASE_URL}/api/admin/room-verification/room-detail/${id}`, { cache: 'no-store', 
        headers:{
            'authorization': `Bearer ${getTokenFromLocalStorage("token")}`,
            'x-refresh-token': getRefreshTokenFromLocalStorage("refreshToken"),
          }
        });
        if(res.ok){
            const json = await res.json();
            room = json?.data ?? null;
        } else {
            console.error('Failed to fetch room detail', res.status);
        }
    }catch(err){
        console.error('Error fetching room detail', err);
    }

    if(!room){
        return (
            <div className="p-8">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-2xl font-semibold">Room not found</h2>
                    <p className="mt-2 text-sm text-gray-500">Unable to load room details. Try refreshing or check the room id.</p>
                </div>
            </div>
        )
    }

    const imageBase = BASE_URL.replace(/\/$/, '');

    return (
        <div className="p-6">
            <div className="max-w-6xl mx-auto bg-white shadow rounded-lg overflow-hidden">
                <div className="md:flex">
                    <div className="md:w-1/2 bg-gray-50 p-4">
                        {/* Images grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {room.RoomImages && room.RoomImages.length > 0 ? (
                                room.RoomImages.map(img => (
                                    <div key={img.id} className="h-48 w-full overflow-hidden rounded-md border">
                                        <img
                                            src={`${imageBase}${img.image_path}`}
                                            alt={room.name}
                                            className="h-full w-full object-cover"
                                        />
                                    </div>
                                ))
                            ) : (
                                <div className="col-span-2 h-48 flex items-center justify-center text-gray-400">No images</div>
                            )}
                        </div>

                        {/* Map link */}
                        <div className="mt-4 p-3 border rounded-md bg-white">
                            <h3 className="text-sm font-medium text-gray-700">Location</h3>
                            <p className="text-xs text-gray-500">Lat: {room.lat ?? 'N/A'}, Lng: {room.lng ?? 'N/A'}</p>
                            {room.lat && room.lng && (
                                <a
                                    className="inline-block mt-2 text-sm text-green-600 hover:underline"
                                    href={`https://www.google.com/maps?q=${room.lat},${room.lng}`}
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    Open in Google Maps →
                                </a>
                            )}
                        </div>
                    </div>

                    <div className="md:w-1/2 p-6 space-y-4">
                        <div className="flex items-start justify-between">
                            <div>
                                <h1 className="text-2xl font-semibold">{room.name}</h1>
                                <p className="text-sm text-gray-500 mt-1">{room.description}</p>
                            </div>
                            <div className="text-right">
                                <StatusBadge status={room.status} />
                                <div className="mt-3 text-right">
                                    <div className="text-lg font-semibold">Rs {room.price}</div>
                                    <div className="text-xs text-gray-500">{room.availability_status ? 'Available' : 'Not available'}</div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="p-3 border rounded-md">
                                <div className="text-xs text-gray-500">Contact</div>
                                <div className="mt-1 font-medium">{room.contact || 'N/A'}</div>
                            </div>
                            <div className="p-3 border rounded-md">
                                <div className="text-xs text-gray-500">Note</div>
                                <div className="mt-1 font-medium">{room.note || '—'}</div>
                            </div>
                        </div>

                        <div className="p-3 border rounded-md">
                            <div className="text-xs text-gray-500">Owner</div>
                            <div className="mt-1">
                                <div className="font-medium">{room.Gharbeti?.user?.name ?? '—'}</div>
                                <div className="text-xs text-gray-500">{room.Gharbeti?.user?.email ?? ''}</div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between text-sm text-gray-500">
                            <div>Created: {formatDate(room.createdAt)}</div>
                            <div>Updated: {formatDate(room.updatedAt)}</div>
                        </div>

                        {room.rejection_reason && (
                            <div className="p-3 bg-red-50 border border-red-100 rounded-md">
                                <div className="text-xs text-red-700 font-medium">Rejection reason</div>
                                <div className="text-sm text-red-800 mt-1">{room.rejection_reason}</div>
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </div>
    )
}