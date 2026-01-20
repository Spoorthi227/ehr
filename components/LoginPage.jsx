"use client"

import { useState, useEffect } from "react"

// Dashboards
import BillingDashboard from "./dashboards/BillingDashboard"
import CardioDoc from "./dashboards/Cardio_doc"
import FrontDeskDashboard from "./dashboards/FrontDeskDashboard"
import GpDoc from "./dashboards/Gp_doc"
import OrthoDoc from "./dashboards/Ortho_doc"

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [systemId, setSystemId] = useState("")
  const [error, setError] = useState("")
  const [loggedInUser, setLoggedInUser] = useState(null)
  const [showPassword, setShowPassword] = useState(false)

  // -----------------------------
  // Fetch system ID
  // -----------------------------
  useEffect(() => {
    const fetchSystemId = async () => {
      try {
        console.log("[SYS] Fetching system ID...")
        console.time("get_system_id_api")

        const res = await fetch("http://127.0.0.1:8000/api/get_system_id")
        const data = await res.json()

        console.timeEnd("get_system_id_api")
        console.log("[SYS] System ID:", data.system_id)
        console.log("[SYS] Master key fetched from Azure Vault")

        setSystemId(data.system_id)
      } catch (err) {
        console.error("[SYS] Failed:", err)
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
      // Step 1: challenge
      const challengeRes = await fetch(
        "http://127.0.0.1:8000/api/get_challenge",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username }),
        }
      )

      const challengeData = await challengeRes.json()
      if (challengeRes.status !== 200) {
        setError(challengeData.error || "Failed to get challenge")
        return
      }

      // Step 2: verify
      console.log("[AUTH] Computing PKID...")
      console.time("verify_login_api")

      const verifyRes = await fetch(
        "http://127.0.0.1:8000/api/verify_login",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username,
            password,
            system_id: systemId,
          }),
        }
      )

      const verifyData = await verifyRes.json()
      console.timeEnd("verify_login_api")

      if (verifyRes.status === 200) {
        console.log("[AUTH] Login verified successfully!")
        setLoggedInUser(username)
      } else {
        setError(verifyData.error || "Login failed")
      }
    } catch (err) {
      console.error("[AUTH] Error:", err)
      setError("Something went wrong")
    }
  }

  // -----------------------------
  // Logout
  // -----------------------------
  const handleLogout = () => {
    setLoggedInUser(null)
    setUsername("")
    setPassword("")
  }

  // -----------------------------
  // Dashboard mapping
  // -----------------------------
  const renderDashboard = () => {
    const props = { user: loggedInUser, onLogout: handleLogout }

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
        return <div>Unknown user</div>
    }
  }

  if (loggedInUser) return renderDashboard()

  // -----------------------------
  // Login UI
  // -----------------------------
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-teal-600 px-8 py-8">
            <h1 className="text-3xl font-bold text-white text-center mb-2">
              MediCare
            </h1>
            <p className="text-blue-50 text-center text-sm">
              Healthcare Management System
            </p>
          </div>

          <div className="p-8">
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Username
                </label>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg"
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
                    className="w-full px-4 py-2 pr-10 border rounded-lg"
                    required
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-3"
                  >
                    {showPassword ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-teal-600 text-white font-semibold py-2 rounded-lg"
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
