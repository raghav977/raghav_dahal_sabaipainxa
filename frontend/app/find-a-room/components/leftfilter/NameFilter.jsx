
"use client"

import { useEffect } from "react"

export default function NameFilter({ filters, setFilters, initialName = "" }) {
    useEffect(() => {
        if (initialName && !filters?.name) {
            setFilters((prev) => ({ ...prev, name: initialName }))
        }
        // only run on initialName change
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialName])

    const handleNameChange = (e) => {
        const value = e.target.value || ""
        setFilters((prev) => ({ ...prev, name: value }))
    }

    return (
        <div className="p-4 border rounded-[4px]">
            <h2 className="text-lg font-semibold mb-2">Room Name</h2>
            <input
                type="text"
                value={filters.name || ""}
                onChange={handleNameChange}
                placeholder="Enter room name"
                className="w-full p-2 border rounded-[4px]"
            />
        </div>
    )
}