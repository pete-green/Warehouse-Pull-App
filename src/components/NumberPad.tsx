'use client'

import { useState } from 'react'

interface NumberPadProps {
  maxValue: number
  initialValue: number
  partNumber: string
  description: string
  onConfirm: (value: number) => void
  onCancel: () => void
  quantityIncrement?: number | null
  unitLabel?: string | null
}

export default function NumberPad({
  maxValue,
  initialValue,
  partNumber,
  description,
  onConfirm,
  onCancel,
  quantityIncrement,
  unitLabel,
}: NumberPadProps) {
  const [value, setValue] = useState(initialValue.toString())
  const increment = quantityIncrement || 1

  const handleDigit = (digit: string) => {
    if (value === '0') {
      setValue(digit)
    } else {
      const newValue = value + digit
      // Don't allow values larger than max
      if (parseInt(newValue) <= maxValue) {
        setValue(newValue)
      }
    }
  }

  const handleBackspace = () => {
    if (value.length > 1) {
      setValue(value.slice(0, -1))
    } else {
      setValue('0')
    }
  }

  const handleClear = () => {
    setValue('0')
  }

  const handleMax = () => {
    setValue(maxValue.toString())
  }

  const handleConfirm = () => {
    onConfirm(parseInt(value) || 0)
  }

  const currentValue = parseInt(value) || 0
  const isOverMax = currentValue > maxValue
  const isShortage = currentValue < maxValue && currentValue > 0
  const isInvalidIncrement = increment > 1 && currentValue > 0 && currentValue % increment !== 0

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gray-100 px-6 py-4 border-b border-gray-200">
          <p className="font-mono font-semibold text-gray-900">{partNumber}</p>
          <p className="text-sm text-gray-600 line-clamp-1">{description}</p>
        </div>

        {/* Unit Label Info */}
        {(unitLabel || increment > 1) && (
          <div className="mx-6 mt-4 p-3 bg-blue-50 rounded-xl border border-blue-200 text-center">
            <p className="text-sm font-medium text-blue-800">
              {unitLabel ? (
                <>Enter quantity in <strong>{unitLabel.toUpperCase()}</strong></>
              ) : (
                <>Enter quantity</>
              )}
              {increment > 1 && (
                <span className="block text-xs text-blue-600 mt-1">
                  (must be in increments of {increment})
                </span>
              )}
            </p>
          </div>
        )}

        {/* Value Display */}
        <div className="px-6 py-6 text-center">
          <div className="flex items-center justify-center gap-2">
            <div className="text-6xl font-bold text-gray-900">{value}</div>
            {unitLabel && (
              <span className="text-2xl text-gray-400 font-medium">{unitLabel}</span>
            )}
          </div>
          <div className="flex items-center justify-center gap-2 mt-2">
            <span className="text-gray-500">of</span>
            <span className="text-2xl font-semibold text-gray-700">
              {maxValue}
            </span>
            <span className="text-gray-500">requested</span>
          </div>
          {isInvalidIncrement && (
            <p className="text-red-600 font-medium mt-2">
              Must be a multiple of {increment}
            </p>
          )}
          {isShortage && !isInvalidIncrement && (
            <p className="text-amber-600 font-medium mt-2">
              This will create a shortage of {maxValue - currentValue}
            </p>
          )}
        </div>

        {/* Number Pad */}
        <div className="px-6 pb-4">
          <div className="grid grid-cols-3 gap-3">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
              <button
                key={digit}
                onClick={() => handleDigit(digit)}
                className="h-16 text-2xl font-semibold rounded-xl bg-gray-100 hover:bg-gray-200 active:bg-gray-300 transition-colors"
              >
                {digit}
              </button>
            ))}
            <button
              onClick={handleClear}
              className="h-16 text-lg font-semibold rounded-xl bg-red-100 text-red-700 hover:bg-red-200 active:bg-red-300 transition-colors"
            >
              Clear
            </button>
            <button
              onClick={() => handleDigit('0')}
              className="h-16 text-2xl font-semibold rounded-xl bg-gray-100 hover:bg-gray-200 active:bg-gray-300 transition-colors"
            >
              0
            </button>
            <button
              onClick={handleBackspace}
              className="h-16 rounded-xl bg-gray-100 hover:bg-gray-200 active:bg-gray-300 transition-colors flex items-center justify-center"
            >
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414 6.414a2 2 0 001.414.586H19a2 2 0 002-2V7a2 2 0 00-2-2h-8.172a2 2 0 00-1.414.586L3 12z"
                />
              </svg>
            </button>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-3 mt-3">
            <button
              onClick={() => setValue('0')}
              className="h-14 text-lg font-semibold rounded-xl bg-red-500 text-white hover:bg-red-600 active:bg-red-700 transition-colors"
            >
              None Available
            </button>
            <button
              onClick={handleMax}
              className="h-14 text-lg font-semibold rounded-xl bg-green-500 text-white hover:bg-green-600 active:bg-green-700 transition-colors"
            >
              Full Qty ({maxValue})
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex border-t border-gray-200">
          <button
            onClick={onCancel}
            className="flex-1 py-5 text-xl font-semibold text-gray-600 hover:bg-gray-50 active:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <div className="w-px bg-gray-200" />
          <button
            onClick={handleConfirm}
            className="flex-1 py-5 text-xl font-semibold text-green-600 hover:bg-green-50 active:bg-green-100 transition-colors"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  )
}
