// Force dynamic rendering for the queue route
// This prevents static generation which would fail without env vars
export const dynamic = 'force-dynamic'

export default function QueueLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
