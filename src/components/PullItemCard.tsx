'use client'

import { PullEntry } from '@/types'
import Image from 'next/image'

interface PullItemCardProps {
  entry: PullEntry
  index: number
  imageUrl: string | null
  onQuantitySelect: () => void
  onQuickFull: () => void
  onQuickNone: () => void
}

export default function PullItemCard({
  entry,
  index,
  imageUrl,
  onQuantitySelect,
  onQuickFull,
  onQuickNone,
}: PullItemCardProps) {
  const isPulled = entry.isPulled
  const hasShortage = isPulled && entry.qtyPulled < entry.requestedQty
  const isFull = isPulled && entry.qtyPulled >= entry.requestedQty
  const isNone = isPulled && entry.qtyPulled === 0

  return (
    <div
      className={`card-touch transition-all ${
        isPulled
          ? hasShortage
            ? 'border-2 border-amber-400 bg-amber-50'
            : 'border-2 border-green-400 bg-green-50'
          : 'border-2 border-gray-200'
      }`}
    >
      <div className="flex gap-4">
        {/* Part Image */}
        <div className="shrink-0">
          {imageUrl ? (
            <div className="w-24 h-24 rounded-xl overflow-hidden bg-gray-100">
              <Image
                src={imageUrl}
                alt={entry.ourPartNumber}
                width={96}
                height={96}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-24 h-24 rounded-xl bg-gray-100 flex items-center justify-center">
              <svg
                className="w-10 h-10 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
            </div>
          )}
        </div>

        {/* Item Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm text-gray-500">#{index}</span>
            <span className="font-mono font-semibold text-gray-900">
              {entry.ourPartNumber}
            </span>
            {isPulled && (
              <span
                className={`text-sm px-2 py-0.5 rounded-full ${
                  hasShortage
                    ? 'bg-amber-200 text-amber-800'
                    : 'bg-green-200 text-green-800'
                }`}
              >
                {hasShortage ? 'Shortage' : 'Done'}
              </span>
            )}
          </div>
          <p className="text-gray-600 text-sm line-clamp-2 mb-3">
            {entry.description}
          </p>

          {/* Quantity Display */}
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">
                {entry.requestedQty}
              </div>
              <div className="text-xs text-gray-500 uppercase">Requested</div>
            </div>
            {isPulled && (
              <>
                <svg
                  className="w-6 h-6 text-gray-400"
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
                    className={`text-3xl font-bold ${
                      hasShortage
                        ? 'text-amber-600'
                        : isNone
                          ? 'text-red-600'
                          : 'text-green-600'
                    }`}
                  >
                    {entry.qtyPulled}
                  </div>
                  <div className="text-xs text-gray-500 uppercase">Pulled</div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="shrink-0 flex flex-col gap-2">
          {!isPulled ? (
            <>
              {/* Full Quantity Button */}
              <button
                onClick={onQuickFull}
                className="btn-touch bg-green-500 text-white hover:bg-green-600 text-base"
              >
                In Stock
                <span className="block text-xs opacity-80">
                  ({entry.requestedQty})
                </span>
              </button>

              {/* Custom Quantity Button */}
              <button
                onClick={onQuantitySelect}
                className="btn-touch bg-gray-200 text-gray-700 hover:bg-gray-300 text-base"
              >
                Other
                <span className="block text-xs opacity-70">Qty</span>
              </button>

              {/* None Available Button */}
              <button
                onClick={onQuickNone}
                className="btn-touch bg-red-100 text-red-700 hover:bg-red-200 text-base"
              >
                None
                <span className="block text-xs opacity-70">Available</span>
              </button>
            </>
          ) : (
            /* Edit Button when already pulled */
            <button
              onClick={onQuantitySelect}
              className="btn-touch bg-gray-100 text-gray-600 hover:bg-gray-200"
            >
              <svg
                className="w-5 h-5 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              <span className="text-xs">Edit</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
