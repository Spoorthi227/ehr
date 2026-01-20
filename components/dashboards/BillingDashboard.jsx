"use client"

import { useState, useEffect } from "react"

export default function BillingDashboard({ user, onLogout, onUpdateStatus }) {
  const [allPatients, setAllPatients] = useState([])
  const [filter, setFilter] = useState("all")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const password = "Billing$Vault2025"

  const fetchBillingData = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch("http://127.0.0.1:8000/api/fetch_billingdesk_data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password })
      })

      if (!response.ok) throw new Error("Failed to fetch billing data")

      const data = await response.json()
      if (!Array.isArray(data) || !data.length) throw new Error("No billing records found")

      // Map JSON to front-end keys
      const patients = data.map(record => ({
        id: record["Patient_id"] || "",
        admissionDate: record["Admission_date"] || "",
        dischargeDate: record["Discharge_date"] || "",
        wardRoom: record["Room_alloted"] || "",
        doctorAssigned: record["Doctor_assigned"] || "",
        treatmentCost: parseFloat(record["Treatment_cost"] || 0),
        insuranceProvider: record["Insurance_provider"] || "",
        paymentStatus: record["Payment_status"] || "pending"
      }))

      setAllPatients(patients)
    } catch (err) {
      console.error(err)
      setError(err.message || "Error fetching billing data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBillingData()
  }, [])

  const handleUpdateStatus = (patientId) => {
    setAllPatients((prev) =>
      prev.map((p) =>
        p.id === patientId
          ? {
              ...p,
              paymentStatus:
                p.paymentStatus === "pending" ? "paid" : "discharged",
              dischargeDate:
                p.paymentStatus === "paid"
                  ? new Date().toISOString().split("T")[0]
                  : p.dischargeDate,
            }
          : p
      )
    )
    if (onUpdateStatus) onUpdateStatus(patientId)
  }

  const displayPatients =
    filter === "pending"
      ? allPatients.filter((p) => p.paymentStatus === "pending")
      : filter === "paid"
      ? allPatients.filter((p) => p.paymentStatus === "paid")
      : allPatients

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-blue-600 to-teal-600 border-b border-blue-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex justify-between items-center">
          <div className="text-white">
            <h1 className="text-3xl font-bold">MediCare</h1>
            <p className="text-blue-100 text-sm">EHR Management System - Billing Desk</p>
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
        {loading && <p>Loading billing data...</p>}
        {error && <p className="text-red-600">{error}</p>}

        {!loading && !error && (
          <>
            <div className="flex gap-4 mb-6 border-b border-gray-200">
              {["all", "pending", "paid"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  className={`px-4 py-2 font-medium border-b-2 ${
                    filter === tab ? "border-blue-600 text-blue-600" : "border-transparent text-gray-600"
                  }`}
                >
                  {tab === "all" ? "📋 All Patients" : tab === "pending" ? "⏳ Pending Payment" : "✅ Payment Completed"}
                </button>
              ))}
            </div>

            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-blue-50 to-teal-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Patient ID</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Admission Date</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Discharge Date</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Ward/Room</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Doctor Assigned</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Treatment Cost (₹)</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Insurance Provider</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Payment Status</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {displayPatients.map((p) => (
                      <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{p.id}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{p.admissionDate}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{p.dischargeDate || "Active"}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{p.wardRoom}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{p.doctorAssigned}</td>
                        <td className="px-6 py-4 text-sm font-semibold text-gray-900">₹{p.treatmentCost.toLocaleString()}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{p.insuranceProvider}</td>
                        <td className="px-6 py-4 text-sm">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              p.paymentStatus === "pending"
                                ? "bg-red-100 text-red-800"
                                : p.paymentStatus === "paid"
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {p.paymentStatus === "pending"
                              ? "⏳ Pending"
                              : p.paymentStatus === "paid"
                              ? "✅ Paid"
                              : "🏥 Discharged"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <button
                            onClick={() => handleUpdateStatus(p.id)}
                            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                              p.paymentStatus === "pending"
                                ? "bg-green-600 text-white hover:bg-green-700"
                                : p.paymentStatus === "paid"
                                ? "bg-blue-600 text-white hover:bg-blue-700"
                                : "bg-gray-400 text-white cursor-not-allowed"
                            }`}
                            disabled={p.paymentStatus === "discharged"}
                          >
                            {p.paymentStatus === "pending"
                              ? "Mark Paid"
                              : p.paymentStatus === "paid"
                              ? "Discharge"
                              : "Discharged"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
