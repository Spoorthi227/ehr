"use client"

import { useState } from "react"

export default function DoctorDashboard({ user, onLogout, onEmergencyAccess, emergencyAccess }) {
  const [activeTab, setActiveTab] = useState("search")
  const [searchPatientId, setSearchPatientId] = useState("")
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showEmergencyConfirm, setShowEmergencyConfirm] = useState(false)

  const password = "GP_Doctor#Secure1"

  const handleSearch = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSelectedPatient(null)

    try {
      const response = await fetch("http://127.0.0.1:8000/api/fetch_gp_data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientId: Number(searchPatientId), password })
      })

      if (!response.ok) throw new Error("Failed to fetch patient data")

      const data = await response.json()
      data.id = Number(data.id)
      setSelectedPatient(data)
    } catch (err) {
      console.error(err)
      setSelectedPatient(null)
      setError("Patient not found or error fetching data")
    } finally {
      setLoading(false)
    }
  }

  const handleEmergency = () => {
    if (!selectedPatient) return
    onEmergencyAccess(selectedPatient.id, user.id)
    setShowEmergencyConfirm(true)
    setTimeout(() => setShowEmergencyConfirm(false), 3000)
  }

  const patientIdKey = selectedPatient ? String(selectedPatient.id) : null
  const hasEmergencyAccess =
    patientIdKey &&
    emergencyAccess &&
    emergencyAccess[patientIdKey] !== undefined &&
    new Date() < new Date(emergencyAccess[patientIdKey].expiryTime)

  // Mock recent patients
  const mockPatients = [
    { id: 210014, name: "John Doe", diagnosis: "Viral fever" },
    { id: 149756, name: "Jane Smith", diagnosis: "Diabetes" },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-teal-600 border-b border-blue-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex justify-between items-center">
          <div className="text-white">
            <h1 className="text-3xl font-bold">MediCare</h1>
            <p className="text-blue-100 text-sm">EHR Management System - General Physician</p>
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
                <p className="text-green-800 font-medium">✅ Emergency access granted for 30 minutes</p>
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
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      hasEmergencyAccess
                        ? "bg-yellow-500 text-white hover:bg-yellow-600"
                        : "bg-red-600 text-white hover:bg-red-700"
                    }`}
                  >
                    {hasEmergencyAccess ? "🔓 Emergency Access Active" : "🚨 Emergency Access"}
                  </button>
                </div>

                {/* Patient Details */}
                <div className="p-6 space-y-4 text-sm">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">📝 Records</h3>
                    <div className="space-y-1">
                      <p><strong>Diagnosis:</strong> {selectedPatient.diagnosis || "-"}</p>
                      <p><strong>Medical History:</strong> {selectedPatient.medicalHistory || "-"}</p>
                      <p><strong>Symptoms:</strong> {selectedPatient.symptoms || "-"}</p>
                      <p><strong>Test Results:</strong> {selectedPatient.testResults || "-"}</p>
                      <p><strong>Prescriptions:</strong> {selectedPatient.prescriptions || "-"}</p>
                      <p><strong>Doctor Notes:</strong> {selectedPatient.doctorNotes || "-"}</p>
                      <p><strong>Allergies:</strong> {selectedPatient.allergies === "nan" ? "No Allergies" : selectedPatient.allergies}</p>

                      <p><strong>Referred To:</strong> {selectedPatient.referredTo === "nan" ? "No Referral needed" : selectedPatient.referredTo}</p>

                      <p><strong>Doctor Assigned:</strong> {selectedPatient.doctorAssigned || "-"}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Recent Tab */}
        {activeTab === "recent" && (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-teal-50">
              <h2 className="text-lg font-semibold text-gray-900">Recent Patients</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {mockPatients.map((patient) => (
                <div
                  key={patient.id}
                  className="px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => {
                    setSearchPatientId(patient.id)
                    setSelectedPatient(patient)
                    setActiveTab("search")
                  }}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-gray-900">{patient.name}</h3>
                      <p className="text-sm text-gray-600">
                        ID: {patient.id} | Diagnosis: {patient.diagnosis}
                      </p>
                    </div>
                    <span className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded font-medium">
                      View Records
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
