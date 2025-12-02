import type { Metadata, Viewport } from 'next'
import './globals.css'
import AuthProvider from '@/components/AuthProvider'
import { QueryProvider } from '@/components/QueryProvider'

export const metadata: Metadata = {
  title: 'Warehouse Pull App',
  description: 'iPad application for warehouse material pulls',
  icons: {
    icon: 'https://gogreenplumb.com/wp-content/uploads/2025/07/Go-Green-Logo.svg',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Warehouse Pull',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased bg-gray-50">
        <AuthProvider>
          <QueryProvider>{children}</QueryProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
