"use client"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getTokenFromLocalStorage } from "@/helper/token"

export default function CallToAction() {
  const router = useRouter();
  const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = getTokenFromLocalStorage("token");
        if (!token) return;
        const res = await fetch(`${BASE_URL}/api/users/profile`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();
        const currentUser = data?.data || data;
        setUser(currentUser || null);
      } catch (err) {
        console.error("Failed to fetch profile:", err);
      }
    };
    fetchProfile();
  }, [BASE_URL]);

  const handleBecomeProvider = async () => {
    // route the user depending on whether they already have a provider profile
    if (user?.service_provider_id) return router.push("/dashboard/provider-dashboard");
    return router.push("/service-provider/kyc?name=service_provider");
  };

  const handleBecomeGharbeti = async () => {
    if (user?.gharbeti_id) return router.push("/dashboard/gharbeti-dashboard");
    return router.push("/service-provider/kyc?name=gharbeti");
  };
  return (
    <section className="py-20 bg-gradient-to-r from-green-600 to-emerald-600">
        
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
          Ready to Get Started?
        </h2>
        <p className="text-xl text-green-100 mb-10 max-w-2xl mx-auto">
          Join thousands of workers and employers who trust Kaam Chaa for their work needs
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            size="lg"
            className="bg-white text-black-700 hover:bg-gray-100  hover:text-green-700 px-8 py-3 rounded-md text-lg font-semibold shadow-md transition"
            onClick={handleBecomeProvider}
          >
            <span className="inline-flex items-center gap-2 cursor-pointer">
              <span>Register as Worker</span>
              <ArrowRight className="h-5 w-5" />
            </span>
          </Button>

          <Button
            size="lg"
            variant="outline"
            className="border-white text-green hover:bg-white hover:text-green-700 px-8 py-3 rounded-md text-lg font-semibold transition"
            onClick={handleBecomeGharbeti}
          >
            <span className="inline-flex items-center gap-2 cursor-pointer">
              <span>Register as a Gharbeti</span>
              <ArrowRight className="h-5 w-5" />
            </span>
          </Button>
        </div>
      </div>
    </section>
  )
}
