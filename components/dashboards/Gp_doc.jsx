"use client"

import { useState } from "react"
import { mockPatients } from "@/context/mockData"

export default function DoctorDashboard({ user, onLogout, onEmergencyAccess, emergencyAccess }) {
  const [activeTab, setActiveTab] = useState("search")
  const [searchPatientId, setSearchPatientId] = useState("")
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [showEmergencyConfirm, setShowEmergencyConfirm] = useState(false)

  const handleSearch = (e) => {
    e.preventDefault()
    const patient = mockPatients.find((p) => p.id === searchPatientId)
    if (patient) {
      setSelectedPatient(patient)
    } else {
      setSelectedPatient(null)
      alert("Patient not found")
    }
  }

  const handleEmergency = () => {
    if (selectedPatient) {
      onEmergencyAccess(selectedPatient.id, user.id)
      setShowEmergencyConfirm(true)
      setTimeout(() => setShowEmergencyConfirm(false), 3000)
    }
  }

  const hasEmergencyAccess =
    selectedPatient &&
    emergencyAccess[selectedPatient.id] &&
    new Date() < emergencyAccess[selectedPatient.id].expiryTime

const doctorTitle = typeof user === "string"
  ? user.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
  : "Doctor"


  return (
    <div className="min-h-screen bg-gray-50">
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
        <div className="flex gap-4 mb-6 border-b border-gray-200">
          {[
            { id: "search", label: "🔍 Search Patient" },
            { id: "recent", label: "📋 Recent Patients" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "search" && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Search Patient Records</h2>
              <form onSubmit={handleSearch} className="flex gap-2">
                <input
                  type="text"
                  value={searchPatientId}
                  onChange={(e) => setSearchPatientId(e.target.value)}
                  placeholder="Enter Patient ID (e.g., P001)"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Search
                </button>
              </form>
            </div>

            {showEmergencyConfirm && (
              <div className="bg-green-50 border border-green-300 rounded-lg p-4">
                <p className="text-green-800 font-medium">✅ Emergency access granted for 30 minutes</p>
              </div>
            )}

            {selectedPatient && (
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-teal-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">{selectedPatient.name}</h2>
                      <p className="text-sm text-gray-600">
                        Patient ID: {selectedPatient.id} | Unit Stay ID: {selectedPatient.unitStayId}
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
                </div>

                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3">👤 Patient Details</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between pb-1 border-b border-gray-100">
                          <span className="text-gray-600">Patient ID:</span>
                          <span className="font-medium">{selectedPatient.id}</span>
                        </div>
                        <div className="flex justify-between pb-1 border-b border-gray-100">
                          <span className="text-gray-600">DOB:</span>
                          <span className="font-medium">{selectedPatient.dob}</span>
                        </div>
                        <div className="flex justify-between pb-1 border-b border-gray-100">
                          <span className="text-gray-600">Gender:</span>
                          <span className="font-medium">{selectedPatient.gender}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Contact:</span>
                          <span className="font-medium">{selectedPatient.phone}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3">⚕️ Clinical Assignment</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between pb-1 border-b border-gray-100">
                          <span className="text-gray-600">Doctor Assigned:</span>
                          <span className="font-medium">{selectedPatient.doctorAssigned}</span>
                        </div>
                        <div className="flex justify-between pb-1 border-b border-gray-100">
                          <span className="text-gray-600">Admission Date:</span>
                          <span className="font-medium">{selectedPatient.admissionDate}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Ward/Room:</span>
                          <span className="font-medium">{selectedPatient.wardRoom}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <h3 className="font-semibold text-gray-900 mb-3">🔴 Allergies (⚠️ Important)</h3>
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-red-900 font-semibold">{selectedPatient.allergies}</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">📋 Diagnosis</h3>
                    <p className="text-gray-700 bg-gray-50 p-3 rounded">{selectedPatient.diagnosis}</p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">🩺 Symptoms</h3>
                    <p className="text-gray-700 bg-gray-50 p-3 rounded">{selectedPatient.symptoms}</p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">📊 Medical History</h3>
                    <p className="text-gray-700 bg-gray-50 p-3 rounded">{selectedPatient.medicalHistory}</p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">🧪 Test Results</h3>
                    <p className="text-gray-700 bg-gray-50 p-3 rounded">{selectedPatient.testResults}</p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">💊 Prescriptions</h3>
                    <div className="space-y-2">
                      {selectedPatient.prescriptions && selectedPatient.prescriptions.length > 0 ? (
                        selectedPatient.prescriptions.map((rx) => (
                          <div key={rx.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <p className="font-medium text-gray-900">{rx.medicine}</p>
                            <p className="text-sm text-gray-600">
                              Dosage: {rx.dosage} | Duration: {rx.duration}
                            </p>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-600 text-sm">No prescriptions available</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">📝 Doctor Notes</h3>
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-gray-900">{selectedPatient.doctorNotes}</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">📄 Test Reports</h3>
                    <div className="space-y-2">
                      {selectedPatient.reports && selectedPatient.reports.length > 0 ? (
                        selectedPatient.reports.map((report) => (
                          <div key={report.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <p className="font-medium text-gray-900">{report.type}</p>
                                <p className="text-sm text-gray-600">
                                  Date: {report.date} | Doctor: {report.doctor}
                                </p>
                                <p className="text-sm text-gray-600">Details: {report.details}</p>
                                <p
                                  className={`text-sm font-medium mt-1 ${
                                    report.result === "Normal" ? "text-green-600" : "text-red-600"
                                  }`}
                                >
                                  Result: {report.result}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-600 text-sm">No reports available</p>
                      )}
                    </div>
                  </div>

                  {hasEmergencyAccess && (
                    <div className="p-4 bg-yellow-50 border border-yellow-300 rounded-lg">
                      <p className="text-yellow-900 font-bold">🔓 Full Patient History Access Enabled</p>
                      <p className="text-sm text-yellow-800 mt-1">
                        Expires at {emergencyAccess[selectedPatient.id].expiryTime.toLocaleTimeString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

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
