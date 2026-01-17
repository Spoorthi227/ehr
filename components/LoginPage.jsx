"use client"

import { useState, useEffect } from "react"

// Import your dashboard components
import BillingDashboard from "./dashboards/BillingDashboard"
import CardioDoc from "./dashboards/Cardio_doc"
import FrontDeskDashboard from "./dashboards/FrontDeskDashboard"
import GpDoc from "./dashboards/Gp_doc"
import OrthoDoc from "./dashboards/Ortho_doc"

export default function LoginPage() {
  const [username, setUsername] = useState("") // previously email
  const [password, setPassword] = useState("")
  const [systemId, setSystemId] = useState("") 
  const [error, setError] = useState("")
  const [loggedInUser, setLoggedInUser] = useState(null)
  const [showPassword, setShowPassword] = useState(false)


  // -----------------------------
  // Fetch system ID automatically on mount
  // -----------------------------
  useEffect(() => {
    const fetchSystemId = async () => {
      try {
        const res = await fetch("http://127.0.0.1:8000/api/get_system_id")
        const data = await res.json()
        setSystemId(data.system_id)
      } catch (err) {
        console.error("Failed to fetch system ID:", err)
        setSystemId("UNKNOWN_SYS")
      }
    }
    fetchSystemId()
  }, [])

  // -----------------------------
  // Handle login
  // -----------------------------
  const handleLogin = async (e) => {
    e.preventDefault()
    setError("")

    try {
      const challengeRes = await fetch("http://127.0.0.1:8000/api/get_challenge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username })
      })
      const challengeData = await challengeRes.json()
      if (challengeRes.status !== 200) {
        setError(challengeData.error || "Failed to get challenge")
        return
      }

      const verifyRes = await fetch("http://127.0.0.1:8000/api/verify_login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, system_id: systemId })
      })
      const verifyData = await verifyRes.json()
      if (verifyRes.status === 200) {
        setLoggedInUser(username) // store logged-in user
      } else {
        setError(verifyData.error || "Login failed")
      }
    } catch (err) {
      console.error(err)
      setError("Something went wrong")
    }
  }

  // -----------------------------
  // Logout function
  // -----------------------------
  const handleLogout = () => {
    setLoggedInUser(null) // reset user to show login page
    setUsername("")
    setPassword("")
  }

  // -----------------------------
  // Map username to dashboard component
  // -----------------------------
  const renderDashboard = () => {
    const props = { user: loggedInUser, onLogout: handleLogout } // pass onLogout to dashboard

    switch (loggedInUser) {
      case "BillingDesk":
        return <BillingDashboard {...props} />
      case "CARDIO":
        return <CardioDoc {...props} />
      case "FrontDesk":
        return <FrontDeskDashboard {...props} />
      case "GP":
        return <GpDoc {...props} />
      case "ORTHO":
        return <OrthoDoc {...props} />
      default:
        return <div>Unknown user dashboard</div>
    }
  }

  // -----------------------------
  // If logged in, render dashboard
  // -----------------------------
  if (loggedInUser) return renderDashboard()

  // -----------------------------
  // Otherwise, show login form
  // -----------------------------
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-teal-600 px-8 py-8">
            <h1 className="text-3xl font-bold text-white text-center mb-2">MediCare</h1>
            <p className="text-blue-50 text-center text-sm">Healthcare Management System</p>
          </div>

          <div className="p-8">
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter username"
                  required
                />
              </div>

             <div>
  <label className="block text-sm font-semibold text-gray-700 mb-2">
    Password
  </label>

  <div className="relative">
    <input
      type={showPassword ? "text" : "password"}
      value={password}
      onChange={(e) => setPassword(e.target.value)}
      className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      placeholder="Enter your password"
      required
    />

    {/* Eye toggle */}
    <button
      type="button"
      onClick={() => setShowPassword(!showPassword)}
      className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700"
    >
   {showPassword ? (
  // Eye OFF
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10 0-1.045.158-2.05.45-3M6.223 6.223A9.956 9.956 0 0112 5c5.523 0 10 4.477 10 10a9.96 9.96 0 01-1.635 5.477M15 12a3 3 0 11-6 0 3 3 0 016 0z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3 3l18 18"
    />
  </svg>
) : (
  // Eye ON
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
    />
  </svg>
)}

    </button>
  </div>
</div>


              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
              )}

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-teal-600 text-white font-semibold py-2 rounded-lg hover:shadow-lg transition-shadow"
              >
                Login
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
