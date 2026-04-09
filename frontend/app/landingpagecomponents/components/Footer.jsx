import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Briefcase } from "lucide-react"

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-8">
          <div className="col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-r from-green-600 to-emerald-600">
                <Briefcase className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold">SabaiPainxa</span>
            </div>
            <p className="text-gray-400 mb-4 max-w-md">
              Connecting skilled workers with meaningful opportunities. Building careers, one connection at a time.
            </p>
            <div className="flex space-x-4">
              <Link href="/privacy-policy" className="text-gray-400 bg-gray-900 hover:bg-gray-900 hover:text-white">
                Privacy Policy
              </Link>
              <Link href="/terms-of-service" className="text-gray-400 bg-gray-900 hover:bg-gray-900 hover:text-white">
                Terms of Service
              </Link>
            </div>
          </div>
          <div>
            <h3 className="font-semibold mb-4">For Workers</h3>
            <ul className="space-y-2 text-gray-400">
              <li>
                <Link href="/home-services" className="hover:text-white transition-colors">
                  Find Jobs
                </Link>
              </li>
              <li>
                <Link href="/dashboard/provider-dashboard" className="hover:text-white transition-colors">
                  Create Profile
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white transition-colors">
                  Worker Resources
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white transition-colors">
                  Success Stories
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4">For Employers</h3>
            <ul className="space-y-2 text-gray-400">
              <li>
                <Link href="#" className="hover:text-white transition-colors">
                  Post Jobs
                </Link>
              </li>
              <li>
                <Link href="/home-services" className="hover:text-white transition-colors">
                  Find Workers
                </Link>
              </li>
              <li>
                <Link href="/find-a-room" className="hover:text-white transition-colors">
                Room Services
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white transition-colors">
                  Support
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>© {new Date().getFullYear()} SabaiPainxa. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
