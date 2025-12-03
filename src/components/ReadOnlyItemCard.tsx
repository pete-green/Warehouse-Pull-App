'use client'

import { PullEntry } from '@/types'
import Image from 'next/image'

interface ReadOnlyItemCardProps {
  entry: PullEntry
  index: number
  imageUrl: string | null
}

export default function ReadOnlyItemCard({
  entry,
  index,
  imageUrl,
}: ReadOnlyItemCardProps) {
  const hasShortage = entry.qtyPulled < entry.requestedQty
  const isFull = entry.qtyPulled >= entry.requestedQty
  const isNone = entry.qtyPulled === 0

  return (
    <div
      className={`card-touch transition-all ${
        isNone
          ? 'border-2 border-red-300 bg-red-50'
          : hasShortage
            ? 'border-2 border-amber-400 bg-amber-50'
            : 'border-2 border-green-400 bg-green-50'
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
            <span
              className={`text-sm px-2 py-0.5 rounded-full ${
                isNone
                  ? 'bg-red-200 text-red-800'
                  : hasShortage
                    ? 'bg-amber-200 text-amber-800'
                    : 'bg-green-200 text-green-800'
              }`}
            >
              {isNone ? 'None Pulled' : hasShortage ? 'Shortage' : 'Full'}
            </span>
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
                  isNone
                    ? 'text-red-600'
                    : hasShortage
                      ? 'text-amber-600'
                      : 'text-green-600'
                }`}
              >
                {entry.qtyPulled}
              </div>
              <div className="text-xs text-gray-500 uppercase">Pulled</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
