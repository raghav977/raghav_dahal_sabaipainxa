
"use client"

import { useEffect, useState } from "react"


import { getTokenFromLocalStorage,getRefreshTokenFromLocalStorage } from "@/helper/token"

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || ""

function StatCard({ title, value, subtitle }){
    return (
        <div className="bg-white border border-green-50 rounded-lg p-4 shadow-sm">
            <div className="text-sm text-gray-500">{title}</div>
            <div className="text-2xl font-bold text-green-700 mt-2">{value}</div>
            {subtitle && <div className="text-xs text-gray-400 mt-1">{subtitle}</div>}
        </div>
    )
}

function Bars({ data }){
    const max = Math.max(...data.map(d=>d.value), 1)
    return (
        <div className="space-y-3">
            {data.map((d)=> (
                <div key={d.key} className="flex items-center gap-3">
                    <div className="w-36 text-sm text-gray-600">{d.label}</div>
                    <div className="flex-1 bg-gray-100 h-6 rounded overflow-hidden">
                        <div className="h-6 bg-green-600 text-white text-xs flex items-center justify-end pr-2"
                                 style={{ width: `${(d.value/max)*100}%` }}>
                            {d.value}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}


export default function gharBetiDashboard (){
    const token = getTokenFromLocalStorage("token")
    const refreshToken = getRefreshTokenFromLocalStorage("refreshToken")
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const [stats, setStats] = useState(null)

    useEffect(()=>{
        let mounted = true
        setLoading(true)
        fetch(`${BASE_URL}/api/gharbeti/dashboard/`, { 
            headers:{
                'authorization': `Bearer ${token}`,
                'x-refresh-token': refreshToken,
            }
         })
            .then(r=>r.json())
            .then(json=>{
                if(!mounted) return
                if(json && (json.status === 'success' || json.success===true)){
                    const d = json.data || json;
                    setStats({
                        totalRooms: d.totalRooms || 0,
                        verifiedRooms: d.verifiedRooms || 0,
                        blockedRooms: d.blockedRooms || 0,
                        unverifiedRooms: d.unverifiedRooms || 0,
                    })
                } else {
                    setError(json.message || 'Failed to load dashboard')
                }
            })
            .catch(e=>{
                if(!mounted) return
                console.error(e)
                setError('Network error')
            })
            .finally(()=> mounted && setLoading(false))

        return ()=> mounted = false
    }, [])

    if(loading) return <div className="p-8 text-center text-gray-500">Loading dashboard…</div>
    if(error) return <div className="p-8 text-center text-red-600">{error}</div>
    if(!stats) return <div className="p-8 text-center text-gray-500">No data</div>

    const barsData = [
        { key: 'verified', label: 'Verified', value: stats.verifiedRooms },
        { key: 'unverified', label: 'Unverified', value: stats.unverifiedRooms },
        { key: 'blocked', label: 'Blocked', value: stats.blockedRooms },
    ]

    return (
        <div className="mx-auto p-6">
            <header className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-semibold text-green-800">Gharbeti Dashboard</h1>
                    <p className="text-sm text-gray-600 mt-1">Overview of your listed rooms</p>
                </div>
                <div className="text-sm text-gray-500">Updated: {new Date().toLocaleDateString()}</div>
            </header>

            <section className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <StatCard title="Total Rooms" value={stats.totalRooms} subtitle="Total listings" />
                <StatCard title="Verified" value={stats.verifiedRooms} subtitle="Approved listings" />
                <StatCard title="Unverified" value={stats.unverifiedRooms} subtitle="Pending review" />
                <StatCard title="Blocked" value={stats.blockedRooms} subtitle="Blocked listings" />
            </section>

            <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white border border-green-50 rounded-lg p-6 shadow-sm">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Room status distribution</h2>
                    <Bars data={barsData} />
                </div>

                <div className="bg-white border border-green-50 rounded-lg p-6 shadow-sm">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Quick breakdown</h2>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between"><div className="text-sm text-gray-600">Total</div><div className="font-medium text-green-700">{stats.totalRooms}</div></div>
                        <div className="flex items-center justify-between"><div className="text-sm text-gray-600">Verified</div><div className="font-medium text-green-700">{stats.verifiedRooms}</div></div>
                        <div className="flex items-center justify-between"><div className="text-sm text-gray-600">Unverified</div><div className="font-medium text-green-700">{stats.unverifiedRooms}</div></div>
                        <div className="flex items-center justify-between"><div className="text-sm text-gray-600">Blocked</div><div className="font-medium text-green-700">{stats.blockedRooms}</div></div>
                    </div>
                </div>
            </section>
        </div>
    )
}