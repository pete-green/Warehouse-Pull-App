'use client'

import { useState } from 'react'
import { ItemChange } from '@/hooks/useItemChanges'

interface ConflictResolutionModalProps {
  conflict: ItemChange
  onResolve: (resolution: ConflictResolution) => void
  onCancel: () => void
}

export interface ConflictResolution {
  itemId: string
  action: 'reduce_pulled' | 'adjust_pulled' | 'keep_extra'
  newQtyPulled?: number
}

export default function ConflictResolutionModal({
  conflict,
  onResolve,
  onCancel,
}: ConflictResolutionModalProps) {
  const [customQty, setCustomQty] = useState(conflict.newQuantity || 0)
  const [selectedAction, setSelectedAction] = useState<ConflictResolution['action'] | null>(null)

  const handleResolve = () => {
    if (!selectedAction) return

    const resolution: ConflictResolution = {
      itemId: conflict.itemId,
      action: selectedAction,
    }

    if (selectedAction === 'reduce_pulled') {
      resolution.newQtyPulled = conflict.newQuantity || 0
    } else if (selectedAction === 'adjust_pulled') {
      resolution.newQtyPulled = customQty
    }
    // For 'keep_extra', no newQtyPulled needed - we'll update the request quantity

    onResolve(resolution)
  }

  const overpullAmount = (conflict.qtyPulled || 0) - (conflict.newQuantity || 0)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Overpull Conflict
          </h2>
          <p className="text-gray-600">
            Tech reduced the quantity for this item
          </p>
        </div>

        {/* Item Details */}
        <div className="bg-gray-50 rounded-xl p-4 mb-6">
          <p className="font-bold text-lg text-gray-900">{conflict.partNumber}</p>
          <p className="text-gray-600 text-sm mb-3">{conflict.description}</p>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-white rounded-lg p-2">
              <p className="text-xs text-gray-500">Original</p>
              <p className="font-bold text-lg">{conflict.oldQuantity}</p>
            </div>
            <div className="bg-white rounded-lg p-2">
              <p className="text-xs text-gray-500">You Pulled</p>
              <p className="font-bold text-lg text-blue-600">{conflict.qtyPulled}</p>
            </div>
            <div className="bg-white rounded-lg p-2">
              <p className="text-xs text-gray-500">New Request</p>
              <p className="font-bold text-lg text-amber-600">{conflict.newQuantity}</p>
            </div>
          </div>
          <div className="mt-3 p-2 bg-amber-50 rounded-lg border border-amber-200">
            <p className="text-amber-800 text-sm text-center font-medium">
              You pulled {overpullAmount} more than the tech now needs
            </p>
          </div>
        </div>

        {/* Resolution Options */}
        <div className="space-y-3 mb-6">
          <p className="font-semibold text-gray-700 text-sm">Choose a resolution:</p>

          {/* Option 1: Put back on shelf */}
          <button
            onClick={() => setSelectedAction('reduce_pulled')}
            className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
              selectedAction === 'reduce_pulled'
                ? 'border-green-500 bg-green-50'
                : 'border-gray-200 hover:border-green-300'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                selectedAction === 'reduce_pulled' ? 'border-green-500 bg-green-500' : 'border-gray-300'
              }`}>
                {selectedAction === 'reduce_pulled' && (
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <div>
                <p className="font-semibold text-gray-900">Put {overpullAmount} back on shelf</p>
                <p className="text-sm text-gray-600">
                  Return the extra items to inventory. Your pulled count will be updated to {conflict.newQuantity}.
                </p>
              </div>
            </div>
          </button>

          {/* Option 2: Adjust pulled count */}
          <button
            onClick={() => setSelectedAction('adjust_pulled')}
            className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
              selectedAction === 'adjust_pulled'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-blue-300'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                selectedAction === 'adjust_pulled' ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
              }`}>
                {selectedAction === 'adjust_pulled' && (
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">Adjust my pulled count</p>
                <p className="text-sm text-gray-600 mb-2">
                  Enter the actual quantity you pulled (some may have already been set aside).
                </p>
                {selectedAction === 'adjust_pulled' && (
                  <div className="flex items-center gap-2 mt-2">
                    <label className="text-sm text-gray-600">Actual qty pulled:</label>
                    <input
                      type="number"
                      min={0}
                      max={conflict.qtyPulled || 0}
                      value={customQty}
                      onChange={(e) => setCustomQty(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-center font-bold text-lg"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                )}
              </div>
            </div>
          </button>

          {/* Option 3: Keep extra */}
          <button
            onClick={() => setSelectedAction('keep_extra')}
            className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
              selectedAction === 'keep_extra'
                ? 'border-purple-500 bg-purple-50'
                : 'border-gray-200 hover:border-purple-300'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                selectedAction === 'keep_extra' ? 'border-purple-500 bg-purple-500' : 'border-gray-300'
              }`}>
                {selectedAction === 'keep_extra' && (
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <div>
                <p className="font-semibold text-gray-900">Keep extra (tech will need it)</p>
                <p className="text-sm text-gray-600">
                  Send all {conflict.qtyPulled} items. The tech's request will be updated to match.
                </p>
              </div>
            </div>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onCancel}
            className="btn-touch bg-gray-200 text-gray-700 hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={handleResolve}
            disabled={!selectedAction}
            className={`btn-touch ${
              selectedAction
                ? 'bg-green-500 text-white hover:bg-green-600'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            Resolve Conflict
          </button>
        </div>
      </div>
    </div>
  )
}
