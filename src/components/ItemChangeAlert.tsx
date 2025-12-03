'use client'

import { ItemChange } from '@/hooks/useItemChanges'

interface ItemChangeAlertProps {
  changes: ItemChange[]
  onDismiss: (changeId: string) => void
  onDismissAll: () => void
  onResolveConflict?: (change: ItemChange) => void
}

export default function ItemChangeAlert({
  changes,
  onDismiss,
  onDismissAll,
  onResolveConflict,
}: ItemChangeAlertProps) {
  if (changes.length === 0) return null

  const getAlertConfig = (change: ItemChange) => {
    switch (change.type) {
      case 'added':
        return {
          bgColor: 'bg-green-50 border-green-300',
          iconBg: 'bg-green-100',
          iconColor: 'text-green-600',
          titleColor: 'text-green-800',
          textColor: 'text-green-700',
          title: 'Item Added',
          icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          ),
          message: (
            <>
              Tech added <span className="font-bold">{change.partNumber}</span> x{change.newQuantity}
            </>
          ),
        }
      case 'removed':
        return {
          bgColor: 'bg-red-50 border-red-300',
          iconBg: 'bg-red-100',
          iconColor: 'text-red-600',
          titleColor: 'text-red-800',
          textColor: 'text-red-700',
          title: 'Item Removed',
          icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          ),
          message: (
            <>
              Tech removed <span className="font-bold">{change.partNumber}</span> from this order
            </>
          ),
        }
      case 'quantity_reduced':
        return {
          bgColor: 'bg-yellow-50 border-yellow-300',
          iconBg: 'bg-yellow-100',
          iconColor: 'text-yellow-600',
          titleColor: 'text-yellow-800',
          textColor: 'text-yellow-700',
          title: 'Quantity Reduced',
          icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          message: (
            <>
              Tech reduced <span className="font-bold">{change.partNumber}</span> from {change.oldQuantity} to {change.newQuantity}
            </>
          ),
        }
      case 'conflict':
        return {
          bgColor: 'bg-amber-50 border-amber-400',
          iconBg: 'bg-amber-100',
          iconColor: 'text-amber-600',
          titleColor: 'text-amber-800',
          textColor: 'text-amber-700',
          title: 'Overpull Conflict',
          icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          ),
          message: (
            <>
              <span className="font-bold">{change.partNumber}</span>: Tech requested {change.newQuantity}, but you pulled {change.qtyPulled}.
              <span className="block mt-1 font-medium">Resolution required before completing pull.</span>
            </>
          ),
        }
    }
  }

  return (
    <div className="fixed top-20 left-0 right-0 z-50 px-4">
      <div className="max-w-4xl mx-auto space-y-3">
        {changes.length > 1 && (
          <div className="flex justify-end">
            <button
              onClick={onDismissAll}
              className="text-sm text-gray-500 hover:text-gray-700 underline"
            >
              Dismiss all ({changes.length})
            </button>
          </div>
        )}
        {changes.map((change) => {
          const config = getAlertConfig(change)
          return (
            <div
              key={change.id}
              className={`${config.bgColor} border-2 rounded-2xl p-4 shadow-lg animate-slideIn`}
            >
              <div className="flex items-start gap-4">
                <div className={`${config.iconBg} p-2 rounded-xl ${config.iconColor} shrink-0`}>
                  {config.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className={`font-bold text-lg ${config.titleColor}`}>
                    {config.title}
                  </h4>
                  <p className={`${config.textColor} text-base mt-1`}>
                    {config.message}
                  </p>
                  <p className="text-gray-500 text-sm mt-2">
                    {change.description}
                  </p>
                </div>
                {change.type === 'conflict' ? (
                  <button
                    onClick={() => onResolveConflict?.(change)}
                    className="shrink-0 px-4 py-2 bg-amber-600 text-white rounded-lg font-semibold hover:bg-amber-700"
                  >
                    Resolve
                  </button>
                ) : (
                  <button
                    onClick={() => onDismiss(change.id)}
                    className="shrink-0 p-2 text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
