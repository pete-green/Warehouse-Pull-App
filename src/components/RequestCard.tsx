'use client'

import { MaterialRequest } from '@/types'
import { useDispatchDelivery } from '@/hooks/useTrucks'
import { useState } from 'react'

interface RequestCardProps {
  request: MaterialRequest
  onClick: () => void
}

export default function RequestCard({ request, onClick }: RequestCardProps) {
  const dispatchDelivery = useDispatchDelivery()
  const [isDispatching, setIsDispatching] = useState(false)

  // Check if this is a delivery order that needs dispatch
  const isDelivery = request.delivery_method === 'delivery'
  const isPullComplete = !!request.pull_completed_at
  const hasTruckAssigned = !!request.delivery_truck_id
  const isDispatched = !!request.dispatched_at
  const needsDispatch = isDelivery && isPullComplete && hasTruckAssigned && !isDispatched

  const handleDispatch = async (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent card click navigation
    if (isDispatching) return

    setIsDispatching(true)
    try {
      await dispatchDelivery.mutateAsync({ requestId: request.id })
    } catch (error) {
      console.error('Failed to dispatch:', error)
    } finally {
      setIsDispatching(false)
    }
  }
  const itemCount = request.items?.length || request.total_items || 0
  const totalQty = request.items?.reduce((sum, item) => sum + item.quantity, 0) || request.total_quantity || 0

  // Calculate age
  const createdAt = new Date(request.created_at)
  const now = new Date()
  const ageMs = now.getTime() - createdAt.getTime()
  const ageHours = Math.floor(ageMs / (1000 * 60 * 60))
  const ageDays = Math.floor(ageHours / 24)

  let ageText = ''
  if (ageDays > 0) {
    ageText = `${ageDays}d ${ageHours % 24}h ago`
  } else if (ageHours > 0) {
    ageText = `${ageHours}h ago`
  } else {
    const ageMinutes = Math.floor(ageMs / (1000 * 60))
    ageText = `${ageMinutes}m ago`
  }

  // Priority styling
  const priorityStyles = {
    urgent: 'bg-red-500 text-white',
    asap: 'bg-orange-500 text-white',
    normal: 'bg-gray-200 text-gray-700',
  }

  // Status styling
  const statusStyles = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    approved: 'bg-blue-100 text-blue-800 border-blue-300',
    processing: 'bg-purple-100 text-purple-800 border-purple-300',
    fulfilled: 'bg-green-100 text-green-800 border-green-300',
    cancelled: 'bg-gray-100 text-gray-600 border-gray-300',
    rejected: 'bg-red-100 text-red-800 border-red-300',
  }

  return (
    <div className="w-full card-touch text-left hover:shadow-md transition-shadow">
      <div
        onClick={onClick}
        className="flex items-start justify-between gap-4 cursor-pointer active:scale-[0.99]"
        role="button"
        tabIndex={0}
      >
        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Header with badges */}
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span
              className={`px-3 py-1 rounded-full text-sm font-semibold ${priorityStyles[request.priority]}`}
            >
              {request.priority.toUpperCase()}
            </span>
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium border ${statusStyles[request.status]}`}
            >
              {request.status}
            </span>
            {request.pull_completed_at && (
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 border border-blue-300">
                Pull Complete
              </span>
            )}
            {request.has_shortages && (
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-amber-100 text-amber-800 border border-amber-300">
                Has Shortages
              </span>
            )}
            {/* Delivery/Dispatch State Badges */}
            {isDelivery && hasTruckAssigned && !isDispatched && (
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-cyan-100 text-cyan-800 border border-cyan-300">
                🚚 Truck Assigned
              </span>
            )}
            {isDelivery && isDispatched && (
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 border border-green-300">
                📍 Dispatched
              </span>
            )}
          </div>

          {/* Tech & Job Info */}
          <h3 className="text-xl font-semibold text-gray-900 mb-1 truncate">
            {request.tech_name}
          </h3>
          <p className="text-gray-600 truncate mb-2">{request.job_name}</p>

          {/* Details Row */}
          <div className="flex items-center gap-4 text-sm text-gray-500">
            {request.truck_number && (
              <span className="flex items-center gap-1">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0"
                  />
                </svg>
                Truck {request.truck_number}
              </span>
            )}
            <span>{ageText}</span>
          </div>
        </div>

        {/* Right side - Item counts */}
        <div className="text-right shrink-0">
          <div className="text-3xl font-bold text-gray-900">{itemCount}</div>
          <div className="text-sm text-gray-500">
            item{itemCount !== 1 ? 's' : ''}
          </div>
          <div className="text-lg font-semibold text-gray-600 mt-1">
            {totalQty} qty
          </div>
        </div>

        {/* Arrow indicator */}
        <div className="shrink-0 self-center">
          <svg
            className="w-8 h-8 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </div>
      </div>

      {/* Dispatch Button - shown for delivery orders ready for dispatch */}
      {needsDispatch && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <button
            onClick={handleDispatch}
            disabled={isDispatching}
            className="w-full py-3 px-4 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 active:bg-green-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isDispatching ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                Dispatching...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Dispatch Delivery
              </>
            )}
          </button>
        </div>
      )}
    </div>
  )
}
