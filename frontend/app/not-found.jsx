"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FaHome, FaSearch, FaExclamationTriangle } from "react-icons/fa";
import HeaderNavbar from "./landingpagecomponents/components/HeaderNavbar";
import Footer from "./landingpagecomponents/components/Footer";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
      <HeaderNavbar />
      <div className="flex items-center justify-center px-4 py-16">
        <Card className="w-full max-w-md mx-auto rounded-[4px]">
          <CardContent className="p-8 text-center">
            <div className="mb-6">
              <div className="w-24 h-24 mx-auto bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg">
                <FaExclamationTriangle className="w-12 h-12 text-white" />
              </div>
            </div>
            <div className="mb-8">
              <h1 className="text-6xl font-bold text-gray-900 mb-2">404</h1>
              <h2 className="text-2xl font-semibold text-gray-700 mb-3">Page Not Found</h2>
              <p className="text-gray-500 leading-relaxed">
                Oops! The page you're looking for seems to have wandered off. 
                Don't worry, even the best services sometimes take a wrong turn.
              </p>
            </div>
            <div className="space-y-3">
              <Link href="/" className="block">
                <Button className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 transition-all duration-200 rounded-[4px] py-3">
                  <FaHome className="w-4 h-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
              <Link href="/home-services" className="block">
                <Button 
                  variant="outline" 
                  className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 transition-all duration-200 rounded-[4px] py-3"
                >
                  <FaSearch className="w-4 h-4 mr-2" />
                  Browse Services
                </Button>
              </Link>
            </div>
            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-400">
                Need help? Contact our{" "}
                <Link href="/contact" className="text-green-600 hover:text-green-700 font-medium">
                  support team
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
}
