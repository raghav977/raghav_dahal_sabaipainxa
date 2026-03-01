"use client"

import { useState, useEffect } from "react"
import RoomFilter from "./roomFilter"

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL

export default function RoomListPage() {
const [filters, setFilters] = useState({})
const [rooms, setRooms] = useState([])
const [loading, setLoading] = useState(false)


useEffect(() => {
const fetchRooms = async () => {
setLoading(true)
try {
const query = new URLSearchParams(filters).toString()
const res = await fetch(`${BASE_URL}/api/rooms/all?${query}`)
const data = await res.json()
if (data.success) setRooms(data.results)
} catch (err) {
console.error("Error fetching rooms:", err)
} finally {
setLoading(false)
}
}

fetchRooms()

}, [filters])

return ( <div className="max-w-5xl mx-auto py-8"> <RoomFilter filters={filters} setFilters={setFilters} />


  {loading ? (
    <p className="text-gray-600 text-center mt-10">Loading rooms...</p>
  ) : rooms.length ? (
    <div className="grid md:grid-cols-3 gap-4 mt-6">
      {rooms.map((room) => (
        <div
          key={room.id}
          className="border rounded-lg p-3 bg-white shadow-sm hover:shadow-md transition"
        >
          <img
            src={room.RoomImages?.[0]?.image_path || "/placeholder.jpg"}
            alt={room.name}
            className="rounded-md w-full h-40 object-cover"
          />
          <h3 className="text-lg font-medium mt-2">{room.name}</h3>
          <p className="text-sm text-gray-600">Rs {room.price}</p>
        </div>
      ))}
    </div>
  ) : (
    <p className="text-gray-500 text-center mt-10">No rooms found.</p>
  )}
</div>
)

}
