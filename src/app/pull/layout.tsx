// Force dynamic rendering for the pull route
// This prevents static generation which would fail without env vars
export const dynamic = 'force-dynamic'

export default function PullLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
