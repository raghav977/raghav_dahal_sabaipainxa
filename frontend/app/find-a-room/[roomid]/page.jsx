

"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import HeaderNavbar from "@/app/landingpagecomponents/components/HeaderNavbar"
import Head from "next/head"
import Header from "@/app/dashboard/gharbeti-dashboard/listed-room/components/Header"
import { getTokenFromLocalStorage,getRefreshTokenFromLocalStorage } from "@/helper/token"

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL 

function imgUrl(path) {
    if (!path) return "/placeholder.svg"
    if (path.startsWith("http") || path.startsWith("data:")) return path
    return `${BASE_URL}${path}`
}

export default function RoomDetail() {
    const token = getTokenFromLocalStorage("token");
    const refreshToken = getRefreshTokenFromLocalStorage("refreshToken");
    const params = useParams()
    const roomId = params?.roomid
    const router = useRouter()
    const searchParams = useSearchParams()
    const [room, setRoom] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const [imgIdx, setImgIdx] = useState(0)
    const [access, setAccess] = useState({ checked: false, granted: false, contact: null, lat: null, lng: null })
    const [payLoading, setPayLoading] = useState(false)
    const [payError, setPayError] = useState("")

    useEffect(() => {
        if (!roomId) return
        setLoading(true)
        setError("")
        fetch(`${BASE_URL}/api/rooms/${roomId}`)
            .then((r) => r.json())
            .then((data) => {
                if (!data.success) throw new Error(data.message || "Failed to load room")
                setRoom(data.data)
            })
            .catch((e) => setError(e.message || "Something went wrong"))
            .finally(() => setLoading(false))
    }, [roomId])


    useEffect(() => {
        if (!roomId) return
        const justPaid = searchParams.get("paid") === "1"
        if (justPaid) {
            handleCheckAccess()
        }

    }, [roomId, searchParams])
    useEffect(() => {
        if (!roomId) return
        handleCheckAccess()

    }, [roomId])

    const handleCheckAccess = async () => {
        setPayLoading(true)
        setPayError("")
        try {
            const res = await fetch(`${BASE_URL}/api/rooms/verify-access/${roomId}`, { 
                headers: { "Content-Type": "application/json" ,
                'Authorization': `Bearer ${token}`,
                'x-refresh-token': refreshToken,
                },
             })
            const data = await res.json()
            // console.log("this is data",data)
            if (res.status === 200 && data.status && data.data) {
                // console.log("Access verified:", data)
                setAccess({ checked: true, granted: true, ...data.data })
            } else {
                setAccess({ checked: true, granted: false, contact: null, lat: null, lng: null })
                setPayError(data.message || "Payment required to access this room")
            }
        } catch (e) {
            setPayError(e.message || "Failed to verify access")
        } finally {
            setPayLoading(false)
        }
    }

    const handleInitiatePayment = async () => {
        setPayLoading(true)
        setPayError("")
        try {
            const res = await fetch(`${BASE_URL}/api/rooms/initiate-payment/${roomId}`, { 
                headers: { "Content-Type": "application/json" ,
                    'Authorization': `Bearer ${token}`,
                    'x-refresh-token': refreshToken,
                },
            })
            const data = await res.json()
            // console.log("Initiate payment response:", data)
            if (data.status === "success" && data.data.redirect_url) {
                // console.log("Redirecting to payment gateway:", data.data.redirect_url)
                window.location.href = data.data.redirect_url
            } else {
                setPayError(data.message || "Failed to initiate payment")
            }
        } catch (e) {
            setPayError(e.message || "Failed to initiate payment")
        } finally {
            setPayLoading(false)
        }
    }

    if (loading) return <div className="p-8 text-center text-gray-500">Loading…</div>
    if (error) return <div className="p-8 text-center text-red-600">{error}</div>
    if (!room) return <div className="p-8 text-center text-gray-500">Room not found.</div>

    const images = Array.isArray(room.RoomImages) && room.RoomImages.length > 0 ? room.RoomImages : null
    const mainImg = images ? imgUrl(images[imgIdx]?.image_path) : "/placeholder.svg"

    return (
        <>
        <HeaderNavbar />
        <div className="max-w-6xl mx-auto p-6 mt-10">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                {/* Left: Gallery + Description (span 2) */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="rounded-xl overflow-hidden shadow-sm bg-white">
                        <div className="relative w-full aspect-[16/9] bg-gray-100">
                            <img src={mainImg} alt={room.name} className="object-cover w-full h-full" />
                            {images && images.length > 1 && (
                                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-white/80 px-3 py-1 rounded-full">
                                    {images.map((img, idx) => (
                                        <button
                                            key={img.id}
                                            className={`w-3 h-3 rounded-full border ${imgIdx === idx ? "bg-green-600 border-green-600" : "bg-gray-200 border-gray-400"}`}
                                            onClick={() => setImgIdx(idx)}
                                            aria-label={`Show image ${idx + 1}`}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                        {images && images.length > 1 && (
                            <div className="flex gap-3 p-4 overflow-x-auto bg-white">
                                {images.map((img, idx) => (
                                    <button key={img.id} onClick={() => setImgIdx(idx)} className={`flex-none rounded-lg overflow-hidden ${imgIdx === idx ? 'ring-2 ring-green-600' : 'opacity-90 hover:opacity-100'}`}>
                                        <img src={imgUrl(img.image_path)} alt={room.name} className="h-20 w-36 object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="bg-white rounded-lg p-6 shadow-sm">
                        <div className="flex items-start gap-6">
                            <div className="flex-1">
                                <h1 className="text-2xl font-bold text-gray-900">{room.name}</h1>
                                <p className="text-sm text-gray-500 mt-1">Listed on {new Date(room.createdAt).toLocaleDateString()}</p>
                            </div>
                            <div className="text-right">
                                <div className="text-lg font-semibold text-green-700">NPR {Number(room.price).toLocaleString()}</div>
                                {room.availability_status ? (
                                    <div className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded mt-2 inline-block">Available</div>
                                ) : (
                                    <div className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded mt-2 inline-block">Unavailable</div>
                                )}
                            </div>
                        </div>

                        <div className="mt-4 text-gray-700 leading-relaxed whitespace-pre-line">
                            {room.description}
                        </div>
                    </div>
                </div>

                {/* Right: Sticky action card */}
                <aside className="lg:col-span-1">
                    <div className="sticky top-24 bg-white rounded-lg p-5 shadow-md border">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <div className="text-sm text-gray-500">Price</div>
                                <div className="text-2xl font-bold text-green-700">NPR {Number(room.price).toLocaleString()}</div>
                            </div>
                            <div className="text-sm text-gray-400">{room.availability_status ? 'Available' : 'Unavailable'}</div>
                        </div>

                        <div className="space-y-3">
                            {access.granted ? (
                                <div>
                                    <div className="text-sm text-gray-600">Contact</div>
                                    <div className="mt-2 font-mono text-green-700 bg-green-50 px-3 py-2 rounded">{access.contact}</div>
                                        <div className="text-sm text-gray-600 mt-3">Location</div>
                                        {access.lat && access.lng ? (
                                            // Link coordinates to Google Maps when available
                                            <a
                                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${access.lat},${access.lng}`)}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="mt-2 inline-block font-mono text-green-700 bg-green-50 px-3 py-2 rounded hover:underline"
                                                aria-label={`Open location in Google Maps: ${access.lat}, ${access.lng}`}
                                            >
                                                View on Google Maps • Lat: {access.lat} • Lng: {access.lng}
                                            </a>
                                        ) : (
                                            <div className="mt-2 font-mono text-green-700 bg-green-50 px-3 py-2 rounded">Lat: {access.lat} • Lng: {access.lng}</div>
                                        )}
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <div className="text-sm text-gray-600">Contact & Location</div>
                                    <div className="p-3 rounded bg-gray-50 text-gray-400 text-center blur-sm select-none">Locked — Pay to unlock</div>
                                    <div className="flex gap-2">
                                        <button onClick={handleCheckAccess} disabled={payLoading} className="flex-1 px-4 py-2 bg-white border rounded text-gray-700">Check Access</button>
                                        <button onClick={handleInitiatePayment} disabled={payLoading} className="flex-1 px-4 py-2 bg-green-600 text-white rounded">Pay (NPR 100)</button>
                                    </div>
                                    {payError && <div className="text-xs text-red-600 mt-2">{payError}</div>}
                                </div>
                            )}
                        </div>

                        <div className="mt-4 text-xs text-gray-500">Payments are handled securely. After successful payment you will be able to view contact details.</div>
                    </div>
                </aside>
            </div>
        </div>
    </>
    )
}