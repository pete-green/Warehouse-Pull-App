import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { MaterialRequest, MaterialRequestItem } from '@/types'

// Fetch pending and processing requests for the queue
export function usePendingRequests() {
  return useQuery({
    queryKey: ['pending-requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('material_requests')
        .select(
          `
          *,
          items:material_request_items(*)
        `
        )
        .in('status', ['pending', 'processing', 'approved'])
        .order('priority', { ascending: false }) // urgent first
        .order('created_at', { ascending: true }) // oldest first

      if (error) throw error

      // Sort by priority weight (urgent=3, asap=2, normal=1) then by created_at
      const sorted = (data as MaterialRequest[]).sort((a, b) => {
        const priorityWeight = { urgent: 3, asap: 2, normal: 1 }
        const aWeight = priorityWeight[a.priority] || 1
        const bWeight = priorityWeight[b.priority] || 1

        if (aWeight !== bWeight) {
          return bWeight - aWeight // Higher priority first
        }

        // Same priority, sort by created_at (oldest first)
        return (
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        )
      })

      return sorted
    },
    staleTime: 5 * 1000, // 5 seconds - data goes stale quickly
    refetchInterval: 10 * 1000, // Auto-refresh every 10 seconds
    refetchOnWindowFocus: true,
    refetchOnMount: 'always', // Always refetch when component mounts
  })
}

// Fetch a single request with items
export function useRequestDetails(requestId: string | null) {
  return useQuery({
    queryKey: ['request', requestId],
    queryFn: async () => {
      if (!requestId) return null

      const { data, error } = await supabase
        .from('material_requests')
        .select(
          `
          *,
          items:material_request_items(*)
        `
        )
        .eq('id', requestId)
        .single()

      if (error) throw error
      return data as MaterialRequest
    },
    enabled: !!requestId,
  })
}

// Start processing a request (when user opens it)
export function useStartProcessing() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (requestId: string) => {
      const { error } = await supabase
        .from('material_requests')
        .update({
          status: 'processing',
          pull_started_at: new Date().toISOString(),
        })
        .eq('id', requestId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-requests'] })
      queryClient.invalidateQueries({ queryKey: ['request'] })
    },
  })
}

// Record pull quantities for a request
// Uses API route with service role key to bypass RLS restrictions
export function useRecordPulls() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      requestId,
      entries,
    }: {
      requestId: string
      entries: { itemId: string; qtyPulled: number }[]
      userEmail: string // kept for backwards compatibility but not used - API gets email from session
    }) => {
      const response = await fetch('/api/record-pulls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requestId, entries }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to record pulls')
      }

      const data = await response.json()
      return { hasShortages: data.hasShortages }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-requests'] })
      queryClient.invalidateQueries({ queryKey: ['request'] })
    },
  })
}

// Get part images for items (uses our_part_number to match request item part numbers)
export function usePartImages(partNumbers: string[]) {
  return useQuery({
    queryKey: ['part-images', partNumbers],
    queryFn: async () => {
      if (partNumbers.length === 0) return {}

      const { data, error } = await supabase
        .from('parts')
        .select('part_id, our_part_number, image_url')
        .in('our_part_number', partNumbers)

      if (error) throw error

      const imageMap: Record<string, string | null> = {}
      data?.forEach((part) => {
        // Map by our_part_number (which matches our_part_number in request items)
        imageMap[part.our_part_number] = part.image_url
      })

      return imageMap
    },
    enabled: partNumbers.length > 0,
  })
}
