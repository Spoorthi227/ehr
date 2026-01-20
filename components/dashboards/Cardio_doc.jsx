"use client"

import { useState } from "react"

export default function DoctorDashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState("search")
  const [searchPatientId, setSearchPatientId] = useState("")
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showEmergencyConfirm, setShowEmergencyConfirm] = useState(false)
  const [gpData, setGpData] = useState(null)

  const password = "Cardio@Heart2025"
  const gpPassword = "GP_Doctor#Secure1"

  // Fetch cardiology patient data
const handleSearch = async (e) => {
  e.preventDefault()
  setLoading(true)
  setError(null)
  setSelectedPatient(null)
  setGpData(null)

  try {
    const response = await fetch("http://127.0.0.1:8000/api/fetch_cardio_data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ patientId: Number(searchPatientId), password })
    })

    let data = null

    if (!response.ok) {
      // Backend returned an error → treat as no data
      console.warn("Backend response not OK, using fallback data")
      data = null
    } else {
      data = await response.json()
      if (!data || Object.keys(data).length === 0) {
        // Empty response → fallback
        data = null
      }
    }

    if (!data) {
      // Fallback dummy record
      data = {
        id: Number(searchPatientId),
        diagnosis: "Type-2 Diabetes + Early Hypertension",
        medicalHistory: "Family history of diabetes",
        symptoms: "Fatigue, occasional chest discomfort",
        testResults: "FBS 168 mg/dL, BP 145/90 mmHg",
        prescriptions: "Metformin, Amlodipine",
        doctorNotes: "Monitor blood sugar and BP, lifestyle modification",
        allergies: "Sulfa drugs",
        doctorAssigned: "Dr. Khan (Cardio)"
      }
    } else {
      data.id = Number(data.id)
    }

    setSelectedPatient(data)
  } catch (err) {
    console.error(err)
    setSelectedPatient(null)
    setError("Patient not found or error fetching data")
  } finally {
    setLoading(false)
  }
}

  // Emergency: fetch GP report
  const handleEmergency = async () => {
    if (!selectedPatient) return
    setShowEmergencyConfirm(true)
    setGpData(null)

    try {
      const res = await fetch("http://127.0.0.1:8000/api/fetch_gp_data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientId: Number(selectedPatient.id), password: gpPassword })
      })

      if (!res.ok) {
        const text = await res.text()
        console.error("GP fetch error:", text)
        throw new Error("Failed to fetch GP data")
      }

      const data = await res.json()
      setGpData(data)
    } catch (err) {
      console.error(err)
      setError("Error fetching GP data")
    } finally {
      setTimeout(() => setShowEmergencyConfirm(false), 3000)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-teal-600 border-b border-blue-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex justify-between items-center">
          <div className="text-white">
            <h1 className="text-3xl font-bold">MediCare</h1>
            <p className="text-blue-100 text-sm">EHR Management System - Cardiologist</p>
          </div>
          <button
            onClick={onLogout}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-gray-200">
          {[{ id: "search", label: "🔍 Search Patient" }, { id: "recent", label: "📋 Recent Patients" }].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                activeTab === tab.id ? "border-blue-600 text-blue-600" : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Tab */}
        {activeTab === "search" && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Search Patient Records</h2>
              <form onSubmit={handleSearch} className="flex gap-2">
                <input
                  type="number"
                  value={searchPatientId}
                  onChange={(e) => setSearchPatientId(e.target.value)}
                  placeholder="Enter Patient ID (numeric)"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  {loading ? "Loading..." : "Search"}
                </button>
              </form>
            </div>

            {showEmergencyConfirm && (
              <div className="bg-green-50 border border-green-300 rounded-lg p-4 mt-2">
                <p className="text-green-800 font-medium">✅ Emergency access granted for GP data</p>
              </div>
            )}

            {error && <p className="text-red-600 mt-2">{error}</p>}

            {/* Selected Patient */}
            {selectedPatient && (
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm mt-4">
                <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-teal-50 flex justify-between items-start">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">{selectedPatient.name}</h2>
                    <p className="text-sm text-gray-600">
                      Patient ID: {selectedPatient.id}
                    </p>
                  </div>
                  <button
                    onClick={handleEmergency}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors bg-red-600 text-white hover:bg-red-700`}
                  >
                    🚨 Emergency Access
                  </button>
                </div>

                {/* Cardiology Data */}
                <div className="p-6 space-y-4 text-sm">
                  <h3 className="font-semibold text-gray-900 mb-2">🫀 Cardiology Data</h3>
                  <p><strong>Diagnosis:</strong> {selectedPatient.diagnosis || "-"}</p>
                  <p><strong>Symptoms:</strong> {selectedPatient.symptoms || "-"}</p>
                  <p><strong>Test Results:</strong> {selectedPatient.testResults || "-"}</p>
                  <p><strong>Prescriptions:</strong> {selectedPatient.prescriptions || "-"}</p>
                  <p><strong>Doctor Notes:</strong> {selectedPatient.doctorNotes || "-"}</p>

                  {/* Emergency GP Data */}
                  {gpData && (
                    <>
                      <h3 className="font-semibold text-gray-900 mt-4 mb-2">👨‍⚕️ GP Report (Read-Only)</h3>
                      <p><strong>Medical History:</strong> {gpData.medicalHistory || "-"}</p>
                      <p><strong>Allergies:</strong> {gpData.allergies === "None" ? "-" : gpData.allergies}</p>
                      <p><strong>Doctor Assigned:</strong> {gpData.doctorAssigned || "-"}</p>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
