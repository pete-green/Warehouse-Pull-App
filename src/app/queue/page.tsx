'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { usePendingRequests } from '@/hooks/useRequests'
import { MaterialRequest } from '@/types'
import { useEffect } from 'react'
import RequestCard from '@/components/RequestCard'
import OfflineIndicator from '@/components/OfflineIndicator'

export default function QueuePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { data: requests, isLoading, error, refetch } = usePendingRequests()

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-green-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-xl text-gray-600">Loading requests...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-8 max-w-md text-center">
          <p className="text-xl text-red-800 font-semibold mb-4">
            Error loading requests
          </p>
          <p className="text-red-600 mb-6">{(error as Error).message}</p>
          <button
            onClick={() => refetch()}
            className="btn-touch bg-red-500 text-white hover:bg-red-600"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  const pendingCount = requests?.length || 0

  return (
    <div className="min-h-screen bg-gray-50 safe-all">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 safe-top">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img
              src="https://gogreenplumb.com/wp-content/uploads/2025/07/Go-Green-Logo.svg"
              alt="Logo"
              className="h-10 w-auto"
            />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Pull Queue</h1>
              <p className="text-sm text-gray-500">
                {pendingCount} request{pendingCount !== 1 ? 's' : ''} waiting
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <OfflineIndicator />
            <button
              onClick={() => refetch()}
              className="p-3 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors"
              title="Refresh"
            >
              <svg
                className="w-6 h-6 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </button>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="p-3 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors"
              title="Sign out"
            >
              <svg
                className="w-6 h-6 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Request List */}
      <main className="max-w-4xl mx-auto px-6 py-6">
        {!requests || requests.length === 0 ? (
          <div className="text-center py-20">
            <div className="bg-green-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-12 h-12 text-green-600"
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
            <h2 className="text-2xl font-semibold text-gray-700 mb-2">
              All caught up!
            </h2>
            <p className="text-lg text-gray-500">
              No pending material requests right now.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((request: MaterialRequest) => (
              <RequestCard
                key={request.id}
                request={request}
                onClick={() => router.push(`/pull/${request.id}`)}
              />
            ))}
          </div>
        )}
      </main>

      {/* User Info Footer */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-bottom">
        <div className="max-w-4xl mx-auto px-6 py-3 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Signed in as {session?.user?.email}
          </p>
          <p className="text-sm text-gray-400">
            Auto-refreshes every 30 seconds
          </p>
        </div>
      </footer>
    </div>
  )
}
