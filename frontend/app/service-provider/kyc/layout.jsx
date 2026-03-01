"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import HeaderNavbar from "@/app/landingpagecomponents/components/HeaderNavbar";
import { getTokenFromLocalStorage } from "@/helper/token";

import { getRefreshTokenFromLocalStorage } from "@/helper/token";

export default function KycVerificationLayout({ children }) {
  const router = useRouter();

  useEffect(() => {

    let mounted = true;
    const verify = async () => {
      try {
        const token = getTokenFromLocalStorage("token");
        const refreshToken = getRefreshTokenFromLocalStorage("refreshToken");
        if (!token) {
          router.push("/auth/login");
          return;
        }

        const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
        const res = await fetch(`${BASE_URL}/api/users/profile`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            "x-refresh-token": refreshToken || "",
          },
        });

        if (!mounted) return;

        if (!res.ok) {

          router.push("/auth/login");
          return;
        }

        const body = await res.json();

        if (body?.status !== "success" || !body?.data) {
          router.push("/auth/login");
          return;
        }


      } catch (err) {
        console.error("Error verifying token in KYC layout:", err);
        router.push("/auth/login");
      }
    };

    verify();
    return () => {
      mounted = false;
    };
  }, [router]);

  return (
    <>
      <HeaderNavbar />
      <div className="p-6">
        <div>{children}</div>
      </div>
    </>
  );
}
