"use client"
import dynamic from 'next/dynamic'
import { useState } from "react"

const MainServiceList = dynamic(() => import('./MainServiceList'), { ssr: false })
const Header = dynamic(() => import('./Header'), { ssr: false })

export default function ClientOnlyWrapper() {
  return (
    <div className="min-h-screen max-w-7xl mx-auto bg-background">
      <Header/>
      <MainServiceList/>
    </div>
  )
}
