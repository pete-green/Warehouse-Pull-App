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
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 30 * 1000, // Auto-refresh every 30 seconds
    refetchOnWindowFocus: true,
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
export function useRecordPulls() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      requestId,
      entries,
      userEmail,
    }: {
      requestId: string
      entries: { itemId: string; qtyPulled: number }[]
      userEmail: string
    }) => {
      // Update each item with pull quantities
      for (const entry of entries) {
        const { error } = await supabase
          .from('material_request_items')
          .update({
            qty_pulled: entry.qtyPulled,
            item_status: entry.qtyPulled > 0 ? 'pulled' : 'pending',
            pulled_at: new Date().toISOString(),
            pulled_by: userEmail,
          })
          .eq('id', entry.itemId)

        if (error) throw error
      }

      // Check if any items have shortages (pulled < requested)
      const { data: items } = await supabase
        .from('material_request_items')
        .select('quantity, qty_pulled')
        .eq('request_id', requestId)

      const hasShortages = items?.some(
        (item) => (item.qty_pulled || 0) < item.quantity
      )

      // Update the request status
      const { error: requestError } = await supabase
        .from('material_requests')
        .update({
          pull_completed_at: new Date().toISOString(),
          pulled_by: userEmail,
          has_shortages: hasShortages || false,
          // Keep as processing - main app handles status changes
        })
        .eq('id', requestId)

      if (requestError) throw requestError

      return { hasShortages }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-requests'] })
      queryClient.invalidateQueries({ queryKey: ['request'] })
    },
  })
}

// Get part images for items
export function usePartImages(partIds: string[]) {
  return useQuery({
    queryKey: ['part-images', partIds],
    queryFn: async () => {
      if (partIds.length === 0) return {}

      const { data, error } = await supabase
        .from('parts')
        .select('part_id, image_url')
        .in('part_id', partIds)

      if (error) throw error

      const imageMap: Record<string, string | null> = {}
      data?.forEach((part) => {
        imageMap[part.part_id] = part.image_url
      })

      return imageMap
    },
    enabled: partIds.length > 0,
  })
}
