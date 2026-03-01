"use client"

export const dynamic = 'force-dynamic'
export const ssr = false

import ClientOnlyWrapper from "./components/ClientOnlyWrapper"

export default function ServicesPage() {
  return <ClientOnlyWrapper />
}
