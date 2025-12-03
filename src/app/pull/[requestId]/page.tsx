'use client'

import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  useRequestDetails,
  useStartProcessing,
  useRecordPulls,
  usePartImages,
} from '@/hooks/useRequests'
import { usePullStore } from '@/lib/store'
import { saveSessionOffline, updateEntryOffline } from '@/lib/offline-db'
import PullItemCard from '@/components/PullItemCard'
import ReadOnlyItemCard from '@/components/ReadOnlyItemCard'
import NumberPad from '@/components/NumberPad'
import PullSummary from '@/components/PullSummary'
import OfflineIndicator from '@/components/OfflineIndicator'

type ViewState = 'loading' | 'pulling' | 'summary' | 'submitting' | 'complete' | 'readonly'

export default function PullPage() {
  const params = useParams()
  const requestId = params.requestId as string
  const router = useRouter()
  const { data: session } = useSession()

  const [viewState, setViewState] = useState<ViewState>('loading')
  const [activeItemId, setActiveItemId] = useState<string | null>(null)
  const [showNumberPad, setShowNumberPad] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { data: request, isLoading, error } = useRequestDetails(requestId)
  const startProcessing = useStartProcessing()
  const recordPulls = useRecordPulls()

  // Get part numbers for image lookup (parts.part_id matches our_part_number)
  const partNumbers = request?.items?.map((item) => item.our_part_number) || []
  const { data: partImages } = usePartImages(partNumbers)

  // Pull store
  const {
    currentSession,
    startSession,
    startSessionWithExistingData,
    updateEntry,
    markEntryPulled,
    completeSession,
    clearSession,
    getProgress,
    getHasShortages,
  } = usePullStore()

  // Clear session if it's for a different request
  useEffect(() => {
    if (currentSession && currentSession.requestId !== requestId) {
      clearSession()
    }
  }, [requestId, currentSession, clearSession])

  // If we already have a valid session for this request, go straight to pulling
  useEffect(() => {
    if (currentSession && currentSession.requestId === requestId && viewState === 'loading') {
      setViewState('pulling')
    }
  }, [currentSession, requestId, viewState])

  // Initialize session when request loads
  useEffect(() => {
    if (request && !currentSession && viewState === 'loading') {
      // Build items array (used for both new and existing sessions)
      const items =
        request.items?.map((item) => ({
          itemId: item.id,
          partId: item.our_part_number, // Use our_part_number as the lookup key
          ourPartNumber: item.our_part_number,
          description: item.description,
          requestedQty: item.quantity,
          imageUrl: partImages?.[item.our_part_number] || null,
        })) || []

      // Check if this request was already completed (has pull_completed_at set)
      if (request.pull_completed_at) {
        // Load existing pull data in read-only mode
        const existingPulls =
          request.items?.map((item) => ({
            itemId: item.id,
            qtyPulled: item.qty_pulled ?? 0,
          })) || []

        startSessionWithExistingData(
          request.id,
          request.request_id,
          request.tech_name,
          request.truck_number,
          request.priority,
          items,
          existingPulls
        )

        setViewState('readonly')
        return
      }

      // New pull - start fresh session
      startSession(
        request.id,
        request.request_id,
        request.tech_name,
        request.truck_number,
        request.priority,
        items
      )

      // Save to offline storage
      saveSessionOffline(
        request.id,
        request.request_id,
        request.tech_name,
        request.truck_number,
        request.priority,
        items.map((i) => ({ ...i, qtyPulled: 0, isPulled: false }))
      )

      // Mark request as processing
      if (request.status === 'pending' || request.status === 'approved') {
        startProcessing.mutate(request.id)
      }

      setViewState('pulling')
    }
  }, [request, currentSession, viewState, partImages])

  // Update images when they load
  useEffect(() => {
    if (currentSession && partImages) {
      // Images loaded - could update entries here if needed
    }
  }, [partImages, currentSession])

  const handleQuantitySelect = (itemId: string) => {
    setActiveItemId(itemId)
    setShowNumberPad(true)
  }

  const handleQuickFull = (itemId: string) => {
    const entry = currentSession?.entries.find((e) => e.itemId === itemId)
    if (entry) {
      markEntryPulled(itemId, entry.requestedQty)
      updateEntryOffline(requestId, itemId, entry.requestedQty, true)
    }
  }

  const handleQuickNone = (itemId: string) => {
    markEntryPulled(itemId, 0)
    updateEntryOffline(requestId, itemId, 0, true)
  }

  const handleNumberPadConfirm = (value: number) => {
    if (activeItemId) {
      markEntryPulled(activeItemId, value)
      updateEntryOffline(requestId, activeItemId, value, true)
    }
    setShowNumberPad(false)
    setActiveItemId(null)
  }

  const handleNumberPadCancel = () => {
    setShowNumberPad(false)
    setActiveItemId(null)
  }

  const handleReviewPull = () => {
    setViewState('summary')
  }

  const handleBackToPulling = () => {
    setViewState('pulling')
  }

  const handleSubmitPull = async () => {
    if (!currentSession || !session?.user?.email) return

    setIsSubmitting(true)

    try {
      const entries = currentSession.entries.map((e) => ({
        itemId: e.itemId,
        qtyPulled: e.qtyPulled,
      }))

      await recordPulls.mutateAsync({
        requestId: currentSession.requestId,
        entries,
        userEmail: session.user.email,
      })

      completeSession()
      setViewState('complete')
    } catch (err) {
      console.error('Failed to submit pull:', err)
      // Stay on summary for retry
      setIsSubmitting(false)
    }
  }

  const handleDone = () => {
    clearSession()
    router.push('/queue')
  }

  if (isLoading || viewState === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-green-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-xl text-gray-600">Loading request...</p>
        </div>
      </div>
    )
  }

  if (error || !request) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-8 max-w-md text-center">
          <p className="text-xl text-red-800 font-semibold mb-4">
            Error loading request
          </p>
          <p className="text-red-600 mb-6">
            {(error as Error)?.message || 'Request not found'}
          </p>
          <button
            onClick={() => router.push('/queue')}
            className="btn-touch bg-gray-500 text-white hover:bg-gray-600"
          >
            Back to Queue
          </button>
        </div>
      </div>
    )
  }

  if (viewState === 'complete') {
    const hasShortages = getHasShortages()
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow-xl p-10 max-w-md text-center">
          <div
            className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 ${
              hasShortages ? 'bg-amber-100' : 'bg-green-100'
            }`}
          >
            <svg
              className={`w-14 h-14 ${hasShortages ? 'text-amber-600' : 'text-green-600'}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Pull Complete!
          </h2>
          <p className="text-lg text-gray-600 mb-2">
            Request #{request.request_id}
          </p>
          {hasShortages && (
            <p className="text-amber-600 font-medium mb-6">
              This request has shortages and will be flagged for review.
            </p>
          )}
          <button
            onClick={handleDone}
            className="btn-action-lg bg-green-500 text-white hover:bg-green-600 w-full"
          >
            Return to Queue
          </button>
        </div>
      </div>
    )
  }

  if (viewState === 'readonly') {
    return (
      <div className="min-h-screen bg-gray-50 safe-all flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10 safe-top">
          <div className="max-w-4xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={() => router.push('/queue')}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                <span className="text-lg">Back</span>
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {request.tech_name}
                </h1>
                <p className="text-gray-500">
                  Request #{request.request_id}
                  {request.truck_number && ` - Truck ${request.truck_number}`}
                </p>
              </div>
              <div className="px-4 py-2 rounded-xl text-lg font-bold bg-blue-100 text-blue-800">
                COMPLETED
              </div>
            </div>

            {/* Completion info */}
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-xl">
              <p className="text-blue-800 text-sm">
                This pull was completed on{' '}
                {new Date(request.pull_completed_at!).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                })}
                {request.pulled_by && ` by ${request.pulled_by}`}
              </p>
              {request.has_shortages && (
                <p className="text-amber-700 text-sm mt-1 font-medium">
                  This request has shortages and is awaiting resolution.
                </p>
              )}
            </div>
          </div>
        </header>

        {/* Items List - Read Only */}
        <main className="flex-1 overflow-auto pb-32">
          <div className="max-w-4xl mx-auto px-6 py-6 space-y-4">
            {currentSession?.entries.map((entry, index) => (
              <ReadOnlyItemCard
                key={entry.itemId}
                entry={entry}
                index={index + 1}
                imageUrl={partImages?.[entry.partId] || null}
              />
            ))}
          </div>
        </main>

        {/* Bottom Action Bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-bottom">
          <div className="max-w-4xl mx-auto px-6 py-4">
            <button
              onClick={() => {
                clearSession()
                router.push('/queue')
              }}
              className="w-full btn-action-lg bg-gray-500 text-white hover:bg-gray-600"
            >
              Back to Queue
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (viewState === 'summary') {
    return (
      <PullSummary
        request={request}
        entries={currentSession?.entries || []}
        onBack={handleBackToPulling}
        onSubmit={handleSubmitPull}
        isSubmitting={isSubmitting}
      />
    )
  }

  // Main pulling view
  const progress = getProgress()
  const activeEntry = currentSession?.entries.find(
    (e) => e.itemId === activeItemId
  )

  return (
    <div className="min-h-screen bg-gray-50 safe-all flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 safe-top">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => router.push('/queue')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              <span className="text-lg">Back</span>
            </button>
            <OfflineIndicator />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {request.tech_name}
              </h1>
              <p className="text-gray-500">
                Request #{request.request_id}
                {request.truck_number && ` - Truck ${request.truck_number}`}
              </p>
            </div>
            <div
              className={`px-4 py-2 rounded-xl text-lg font-bold ${
                request.priority === 'urgent'
                  ? 'bg-red-500 text-white'
                  : request.priority === 'asap'
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-200 text-gray-700'
              }`}
            >
              {request.priority.toUpperCase()}
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
              <span>
                {progress.pulled} of {progress.total} items pulled
              </span>
              <span>{progress.percentage}%</span>
            </div>
            <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 transition-all duration-300"
                style={{ width: `${progress.percentage}%` }}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Items List */}
      <main className="flex-1 overflow-auto pb-32">
        <div className="max-w-4xl mx-auto px-6 py-6 space-y-4">
          {currentSession?.entries.map((entry, index) => (
            <PullItemCard
              key={entry.itemId}
              entry={entry}
              index={index + 1}
              imageUrl={partImages?.[entry.partId] || null}
              onQuantitySelect={() => handleQuantitySelect(entry.itemId)}
              onQuickFull={() => handleQuickFull(entry.itemId)}
              onQuickNone={() => handleQuickNone(entry.itemId)}
            />
          ))}
        </div>
      </main>

      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-bottom">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <button
            onClick={handleReviewPull}
            disabled={progress.pulled < progress.total}
            className={`w-full btn-action-lg ${
              progress.pulled >= progress.total
                ? 'bg-green-500 text-white hover:bg-green-600'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {progress.pulled >= progress.total
              ? 'Review & Complete Pull'
              : `Complete all ${progress.total - progress.pulled} remaining items`}
          </button>
        </div>
      </div>

      {/* Number Pad Modal */}
      {showNumberPad && activeEntry && (
        <NumberPad
          maxValue={activeEntry.requestedQty}
          initialValue={activeEntry.qtyPulled}
          partNumber={activeEntry.ourPartNumber}
          description={activeEntry.description}
          onConfirm={handleNumberPadConfirm}
          onCancel={handleNumberPadCancel}
        />
      )}
    </div>
  )
}
