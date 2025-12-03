'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useQueryClient } from '@tanstack/react-query'
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js'

export interface ItemChange {
  id: string
  type: 'added' | 'removed' | 'quantity_reduced' | 'conflict'
  itemId: string
  partNumber: string
  description: string
  oldQuantity?: number
  newQuantity?: number
  qtyPulled?: number
  timestamp: Date
}

interface MaterialRequestItem {
  id: string
  request_id: string
  our_part_number: string
  description: string
  quantity: number
  is_cancelled?: boolean
  conflict_status?: string | null
  qty_pulled?: number | null
}

interface UseItemChangesOptions {
  requestId: string | null
  enabled?: boolean
  onItemsChanged?: () => void
}

/**
 * Hook to subscribe to real-time item changes for a material request.
 * Detects when a technician adds, removes, or modifies items during an active pull.
 */
export function useItemChanges({
  requestId,
  enabled = true,
  onItemsChanged,
}: UseItemChangesOptions) {
  const [changes, setChanges] = useState<ItemChange[]>([])
  const queryClient = useQueryClient()
  const itemsRef = useRef<Map<string, MaterialRequestItem>>(new Map())

  // Dismiss a change notification
  const dismissChange = useCallback((changeId: string) => {
    setChanges((prev) => prev.filter((c) => c.id !== changeId))
  }, [])

  // Dismiss all changes
  const dismissAllChanges = useCallback(() => {
    setChanges([])
  }, [])

  // Initialize items map from current request data
  const initializeItems = useCallback((items: MaterialRequestItem[]) => {
    itemsRef.current.clear()
    items.forEach((item) => {
      itemsRef.current.set(item.id, { ...item })
    })
  }, [])

  // Set up realtime subscription
  useEffect(() => {
    if (!enabled || !requestId) return

    // First, fetch current items to initialize our reference
    const fetchInitialItems = async () => {
      const { data } = await supabase
        .from('material_request_items')
        .select('*')
        .eq('request_id', requestId)

      if (data) {
        initializeItems(data)
      }
    }

    fetchInitialItems()

    // Subscribe to changes
    const channel = supabase
      .channel(`request-items-${requestId}`)
      .on<MaterialRequestItem>(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'material_request_items',
          filter: `request_id=eq.${requestId}`,
        },
        (payload: RealtimePostgresChangesPayload<MaterialRequestItem>) => {
          const newItem = payload.new as MaterialRequestItem
          if (newItem && !itemsRef.current.has(newItem.id)) {
            // New item added by technician
            const change: ItemChange = {
              id: `add-${newItem.id}-${Date.now()}`,
              type: 'added',
              itemId: newItem.id,
              partNumber: newItem.our_part_number,
              description: newItem.description,
              newQuantity: newItem.quantity,
              timestamp: new Date(),
            }
            setChanges((prev) => [...prev, change])
            itemsRef.current.set(newItem.id, newItem)

            // Invalidate queries to refresh the UI
            queryClient.invalidateQueries({ queryKey: ['request', requestId] })
            onItemsChanged?.()
          }
        }
      )
      .on<MaterialRequestItem>(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'material_request_items',
          filter: `request_id=eq.${requestId}`,
        },
        (payload: RealtimePostgresChangesPayload<MaterialRequestItem>) => {
          const updatedItem = payload.new as MaterialRequestItem
          const oldItem = itemsRef.current.get(updatedItem.id)

          if (updatedItem && oldItem) {
            // Check for cancellation
            if (updatedItem.is_cancelled && !oldItem.is_cancelled) {
              const change: ItemChange = {
                id: `remove-${updatedItem.id}-${Date.now()}`,
                type: 'removed',
                itemId: updatedItem.id,
                partNumber: updatedItem.our_part_number,
                description: updatedItem.description,
                oldQuantity: oldItem.quantity,
                timestamp: new Date(),
              }
              setChanges((prev) => [...prev, change])
            }
            // Check for quantity reduction
            else if (updatedItem.quantity < oldItem.quantity) {
              // Check for overpull conflict
              const qtyPulled = oldItem.qty_pulled || 0
              if (updatedItem.quantity < qtyPulled) {
                const change: ItemChange = {
                  id: `conflict-${updatedItem.id}-${Date.now()}`,
                  type: 'conflict',
                  itemId: updatedItem.id,
                  partNumber: updatedItem.our_part_number,
                  description: updatedItem.description,
                  oldQuantity: oldItem.quantity,
                  newQuantity: updatedItem.quantity,
                  qtyPulled,
                  timestamp: new Date(),
                }
                setChanges((prev) => [...prev, change])
              } else {
                const change: ItemChange = {
                  id: `reduce-${updatedItem.id}-${Date.now()}`,
                  type: 'quantity_reduced',
                  itemId: updatedItem.id,
                  partNumber: updatedItem.our_part_number,
                  description: updatedItem.description,
                  oldQuantity: oldItem.quantity,
                  newQuantity: updatedItem.quantity,
                  timestamp: new Date(),
                }
                setChanges((prev) => [...prev, change])
              }
            }

            // Update our reference
            itemsRef.current.set(updatedItem.id, updatedItem)

            // Invalidate queries to refresh the UI
            queryClient.invalidateQueries({ queryKey: ['request', requestId] })
            onItemsChanged?.()
          }
        }
      )
      .on<MaterialRequestItem>(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'material_request_items',
          filter: `request_id=eq.${requestId}`,
        },
        (payload: RealtimePostgresChangesPayload<MaterialRequestItem>) => {
          const deletedItem = payload.old as MaterialRequestItem
          const oldItem = itemsRef.current.get(deletedItem?.id)

          if (oldItem) {
            const change: ItemChange = {
              id: `delete-${oldItem.id}-${Date.now()}`,
              type: 'removed',
              itemId: oldItem.id,
              partNumber: oldItem.our_part_number,
              description: oldItem.description,
              oldQuantity: oldItem.quantity,
              timestamp: new Date(),
            }
            setChanges((prev) => [...prev, change])
            itemsRef.current.delete(oldItem.id)

            // Invalidate queries to refresh the UI
            queryClient.invalidateQueries({ queryKey: ['request', requestId] })
            onItemsChanged?.()
          }
        }
      )
      .subscribe((status) => {
        console.log('Item changes subscription status:', status)
      })

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel)
    }
  }, [enabled, requestId, queryClient, onItemsChanged, initializeItems])

  return {
    changes,
    hasChanges: changes.length > 0,
    hasConflicts: changes.some((c) => c.type === 'conflict'),
    dismissChange,
    dismissAllChanges,
    initializeItems,
  }
}
