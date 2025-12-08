'use client'

import { useTrucks, useAssignDeliveryTruck, Truck } from '@/hooks/useTrucks'
import { useState } from 'react'

interface TruckSelectionModalProps {
  requestId: string
  onComplete: () => void
  onSkip: () => void
}

export default function TruckSelectionModal({
  requestId,
  onComplete,
  onSkip,
}: TruckSelectionModalProps) {
  const { data: trucks = [], isLoading } = useTrucks()
  const assignTruck = useAssignDeliveryTruck()
  const [selectedTruck, setSelectedTruck] = useState<Truck | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [actionType, setActionType] = useState<'assign' | 'dispatch' | null>(null)

  // Select truck (shows action buttons)
  const handleTruckClick = (truck: Truck) => {
    if (isSubmitting) return
    setSelectedTruck(selectedTruck?.id === truck.id ? null : truck)
  }

  // Assign truck only (awaiting dispatch)
  const handleAssignOnly = async () => {
    if (!selectedTruck) return
    setActionType('assign')
    setIsSubmitting(true)

    try {
      await assignTruck.mutateAsync({
        requestId,
        truckId: selectedTruck.id,
        dispatch: false,
      })
      onComplete()
    } catch (error) {
      console.error('Failed to assign truck:', error)
      setIsSubmitting(false)
      setActionType(null)
    }
  }

  // Assign and dispatch immediately
  const handleAssignAndDispatch = async () => {
    if (!selectedTruck) return
    setActionType('dispatch')
    setIsSubmitting(true)

    try {
      await assignTruck.mutateAsync({
        requestId,
        truckId: selectedTruck.id,
        dispatch: true,
      })
      onComplete()
    } catch (error) {
      console.error('Failed to assign and dispatch:', error)
      setIsSubmitting(false)
      setActionType(null)
    }
  }

  // Sort trucks: those with GPS tracking first, then by truck number
  const sortedTrucks = [...trucks].sort((a, b) => {
    // GPS-enabled trucks first
    if (a.verizon_vehicle_id && !b.verizon_vehicle_id) return -1
    if (!a.verizon_vehicle_id && b.verizon_vehicle_id) return 1
    // Then by truck number
    return a.truck_number.localeCompare(b.truck_number)
  })

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <span className="text-2xl">🚚</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                Select Delivery Truck
              </h2>
              <p className="text-blue-100 text-sm">
                Which truck will deliver this order?
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[50vh]">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-500 border-t-transparent"></div>
            </div>
          ) : sortedTrucks.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No trucks available</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedTrucks.map((truck) => (
                <div
                  key={truck.id}
                  onClick={() => handleTruckClick(truck)}
                  className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                    selectedTruck?.id === truck.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                  } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                        <span className="text-xl">🚚</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900">
                            Truck {truck.truck_number}
                          </span>
                          {truck.verizon_vehicle_id && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                              📍 GPS
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">
                          {truck.description || 'No description'}
                          {truck.current_tech && ` • ${truck.current_tech}`}
                        </p>
                      </div>
                    </div>
                    {selectedTruck?.id === truck.id && (
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
          {selectedTruck ? (
            <div className="space-y-3">
              {/* Action buttons when truck is selected */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleAssignOnly}
                  disabled={isSubmitting}
                  className="py-3 px-4 bg-blue-100 text-blue-700 font-semibold rounded-xl hover:bg-blue-200 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting && actionType === 'assign' ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent"></div>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Assign
                    </>
                  )}
                </button>
                <button
                  onClick={handleAssignAndDispatch}
                  disabled={isSubmitting}
                  className="py-3 px-4 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting && actionType === 'dispatch' ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Dispatch Now
                    </>
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500 text-center">
                <strong>Assign</strong> = Truck assigned, awaiting dispatch later
                <br />
                <strong>Dispatch Now</strong> = Driver leaving immediately
              </p>
            </div>
          ) : (
            <div>
              <button
                onClick={onSkip}
                disabled={isSubmitting}
                className="w-full py-3 text-gray-600 font-medium hover:text-gray-800 transition-colors disabled:opacity-50"
              >
                Skip for now
              </button>
              <p className="text-xs text-gray-400 text-center mt-2">
                Select a truck above, or skip to assign later
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
