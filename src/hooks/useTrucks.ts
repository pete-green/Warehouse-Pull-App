import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export interface Truck {
  id: string
  truck_id: string
  truck_number: string
  description: string | null
  current_tech: string | null
  active: boolean
  verizon_vehicle_id: string | null
}

// Fetch active trucks for selection
export function useTrucks() {
  return useQuery({
    queryKey: ['trucks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trucks')
        .select('id, truck_id, truck_number, description, current_tech, active, verizon_vehicle_id')
        .eq('active', true)
        .order('truck_number', { ascending: true })

      if (error) throw error
      return data as Truck[]
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Assign delivery truck to a material request
export function useAssignDeliveryTruck() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      requestId,
      truckId,
      dispatch = false,
    }: {
      requestId: string
      truckId: string
      dispatch?: boolean
    }) => {
      const response = await fetch('/api/assign-delivery-truck', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requestId, truckId, dispatch }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to assign delivery truck')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-requests'] })
      queryClient.invalidateQueries({ queryKey: ['request'] })
    },
  })
}

// Dispatch an already-assigned delivery
export function useDispatchDelivery() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ requestId }: { requestId: string }) => {
      const response = await fetch('/api/dispatch-delivery', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requestId }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to dispatch delivery')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-requests'] })
      queryClient.invalidateQueries({ queryKey: ['request'] })
    },
  })
}
