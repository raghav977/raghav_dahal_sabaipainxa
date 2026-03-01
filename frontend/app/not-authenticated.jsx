"use client"

import { useRouter } from "next/navigation"

export default function NotAuthenticated({
  message = "You need to be signed in to view this page.",
  showActions = true,
  loginPath = "/auth/login",
  signupPath = "/auth/register",
}) {
  const router = useRouter()

  return (
    <div className="min-h-[60vh] flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-emerald-50 p-6">
      <div className="max-w-xl w-full bg-white rounded-2xl shadow-lg border border-green-100 p-8 text-center">
        <div className="mx-auto w-24 h-24 rounded-full bg-green-100 flex items-center justify-center mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 11c1.657 0 3-1.343 3-3S13.657 5 12 5 9 6.343 9 8s1.343 3 3 3z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 20a8 8 0 0116 0" />
          </svg>
        </div>

        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Not signed in</h2>
        <p className="text-sm text-gray-600 mb-6">{message}</p>

        {showActions && (
          <div className="flex flex-col sm:flex-row items-center gap-3 justify-center">
            <button
              onClick={() => router.push(loginPath)}
              className="px-5 py-2 rounded-md bg-green-600 text-white font-semibold hover:bg-green-700 w-full sm:w-auto"
            >
              Sign in
            </button>
            <button
              onClick={() => router.push(signupPath)}
              className="px-5 py-2 rounded-md border border-green-600 text-green-600 font-semibold hover:bg-green-50 w-full sm:w-auto"
            >
              Create account
            </button>
          </div>
        )}

        <p className="mt-6 text-xs text-gray-400">Or return to the <button onClick={() => router.push('/')} className="text-green-600 underline">home page</button>.</p>
      </div>
    </div>
  )
}
