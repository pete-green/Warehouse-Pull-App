'use client'

import { signIn } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function LoginContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-slate-100 flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 p-12 max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <img
            src="https://gogreenplumb.com/wp-content/uploads/2025/07/Go-Green-Logo.svg"
            alt="Go Green Plumbing Logo"
            className="h-24 w-auto mx-auto mb-6"
          />
          <h1 className="text-3xl font-bold text-slate-800 mb-2">
            Warehouse Pull
          </h1>
          <p className="text-lg text-slate-600">
            iPad app for material pulls
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-5 mb-6">
            <p className="text-red-800 text-lg font-semibold">Access Denied</p>
            <p className="text-red-700 mt-1">
              {error === 'AccessDenied'
                ? 'You must use a @gogreenplumb.com email address to sign in.'
                : 'An error occurred during sign-in. Please try again.'}
            </p>
          </div>
        )}

        {/* Sign In Button */}
        <button
          onClick={() => signIn('google', { callbackUrl: '/queue' })}
          className="w-full bg-white border-2 border-slate-300 hover:border-green-500 hover:bg-green-50 text-slate-700 font-bold py-5 px-6 rounded-2xl transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-4 text-xl active:scale-95"
        >
          <svg className="w-7 h-7" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Sign in with Google
        </button>

        {/* Info Text */}
        <p className="text-center text-slate-500 mt-8 text-lg">
          Only employees with @gogreenplumb.com email addresses can access this
          application.
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-slate-100 flex items-center justify-center">
          <div className="text-slate-600 text-xl">Loading...</div>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  )
}
