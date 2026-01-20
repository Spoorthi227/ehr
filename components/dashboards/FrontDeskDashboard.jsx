"use client"

import { useState } from "react"

export default function DoctorDashboard({ user, onLogout }) {
  const [searchPatientId, setSearchPatientId] = useState("")
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Front desk password (Layer A)
  const password = "FrontDesk@2025!"

  const handleSearch = async (e) => {
    e.preventDefault()

    if (!searchPatientId) {
      setError("Please enter a Patient ID")
      return
    }

    setLoading(true)
    setError(null)
    setSelectedPatient(null)

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/api/fetch_frontdesk_data",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          // ✅ Send Patient ID as STRING (IMPORTANT)
          body: JSON.stringify({
            patientId: searchPatientId,
            password
          })
        }
      )

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || "Failed to fetch patient data")
      }

      const data = await response.json()
      setSelectedPatient(data)
    } catch (err) {
      setError(err.message || "Patient not found or error fetching data")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-teal-600 border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-6 flex justify-between items-center">
          <div className="text-white">
            <h1 className="text-3xl font-bold">MediCare</h1>
            <p className="text-blue-100 text-sm">Front Desk Dashboard</p>
          </div>
          <button
            onClick={onLogout}
            className="px-4 py-2 bg-red-500 text-white rounded-lg"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Search */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">🔍 Search Patient</h2>
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              value={searchPatientId}
              onChange={(e) => setSearchPatientId(e.target.value)}
              placeholder="Enter Patient ID"
              className="flex-1 px-4 py-2 border rounded-lg"
            />
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg"
            >
              {loading ? "Loading..." : "Search"}
            </button>
          </form>
        </div>

        {/* Error */}
        {error && <p className="text-red-600 mt-4">{error}</p>}

        {/* Patient Details */}
        {selectedPatient && (
          <div className="bg-white mt-6 rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 bg-blue-50 border-b">
              <h2 className="text-lg font-semibold">
                {selectedPatient.Name}
              </h2>
              <p className="text-sm text-gray-600">
                Patient ID: {selectedPatient.Patient_id}
              </p>
            </div>

            <div className="p-6 space-y-3 text-sm">
              <p><strong>Gender:</strong> {selectedPatient.Gender}</p>
              <p><strong>Age:</strong> {selectedPatient.Age}</p>
              <p><strong>Address:</strong> {selectedPatient.Address}</p>
              <p><strong>Phone:</strong> {selectedPatient.Phone_number}</p>
              <p><strong>Email:</strong> {selectedPatient.Email}</p>
              <p><strong>Aadhaar:</strong> {selectedPatient.Aadhaar}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
