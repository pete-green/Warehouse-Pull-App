'use client'

import { MaterialRequest, PullEntry } from '@/types'

interface PullSummaryProps {
  request: MaterialRequest
  entries: PullEntry[]
  onBack: () => void
  onSubmit: () => void
  isSubmitting: boolean
}

export default function PullSummary({
  request,
  entries,
  onBack,
  onSubmit,
  isSubmitting,
}: PullSummaryProps) {
  const totalRequested = entries.reduce((sum, e) => sum + e.requestedQty, 0)
  const totalPulled = entries.reduce((sum, e) => sum + e.qtyPulled, 0)
  const shortageItems = entries.filter((e) => e.qtyPulled < e.requestedQty)
  const hasShortages = shortageItems.length > 0

  return (
    <div className="min-h-screen bg-gray-50 safe-all flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 safe-top">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={onBack}
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
              <span className="text-lg">Back to Edit</span>
            </button>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mt-4">
            Pull Summary
          </h1>
          <p className="text-gray-500">
            Request #{request.request_id} - {request.tech_name}
          </p>
        </div>
      </header>

      {/* Summary Stats */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="grid grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-900">
                {entries.length}
              </div>
              <div className="text-sm text-gray-500">Items</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-green-600">
                {totalPulled}
              </div>
              <div className="text-sm text-gray-500">Pulled</div>
            </div>
            <div className="text-center">
              <div
                className={`text-4xl font-bold ${hasShortages ? 'text-amber-600' : 'text-gray-400'}`}
              >
                {totalRequested - totalPulled}
              </div>
              <div className="text-sm text-gray-500">Shortage</div>
            </div>
          </div>

          {hasShortages && (
            <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <div className="flex items-start gap-3">
                <svg
                  className="w-6 h-6 text-amber-600 shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <div>
                  <p className="font-semibold text-amber-800">
                    {shortageItems.length} item
                    {shortageItems.length !== 1 ? 's' : ''} with shortages
                  </p>
                  <p className="text-sm text-amber-700 mt-1">
                    These will be flagged for shortage resolution in the main
                    Consignment Manager.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Items List */}
      <main className="flex-1 overflow-auto pb-32">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            All Items
          </h2>

          <div className="space-y-3">
            {entries.map((entry, index) => {
              const isShortage = entry.qtyPulled < entry.requestedQty
              const isNone = entry.qtyPulled === 0

              return (
                <div
                  key={entry.itemId}
                  className={`bg-white rounded-xl border-2 p-4 ${
                    isShortage
                      ? isNone
                        ? 'border-red-300 bg-red-50'
                        : 'border-amber-300 bg-amber-50'
                      : 'border-green-300 bg-green-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">
                          #{index + 1}
                        </span>
                        <span className="font-mono font-semibold">
                          {entry.ourPartNumber}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 truncate">
                        {entry.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-center">
                        <div className="text-xl font-bold text-gray-400">
                          {entry.requestedQty}
                        </div>
                        <div className="text-xs text-gray-500">Req</div>
                      </div>
                      <svg
                        className="w-4 h-4 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 7l5 5m0 0l-5 5m5-5H6"
                        />
                      </svg>
                      <div className="text-center">
                        <div
                          className={`text-xl font-bold ${
                            isNone
                              ? 'text-red-600'
                              : isShortage
                                ? 'text-amber-600'
                                : 'text-green-600'
                          }`}
                        >
                          {entry.qtyPulled}
                        </div>
                        <div className="text-xs text-gray-500">Pulled</div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </main>

      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-bottom">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <button
            onClick={onSubmit}
            disabled={isSubmitting}
            className={`w-full btn-action-lg ${
              isSubmitting
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : hasShortages
                  ? 'bg-amber-500 text-white hover:bg-amber-600'
                  : 'bg-green-500 text-white hover:bg-green-600'
            }`}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-3">
                <svg
                  className="animate-spin h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Submitting...
              </span>
            ) : hasShortages ? (
              'Complete Pull (With Shortages)'
            ) : (
              'Complete Pull'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
