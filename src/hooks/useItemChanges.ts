'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useQueryClient } from '@tanstack/react-query'
import { usePullStore } from '@/lib/store'
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

  // Track notified item IDs to prevent duplicate notifications
  const notifiedIdsRef = useRef<Set<string>>(new Set())

  // Track if subscription is already active to prevent duplicates
  const subscriptionActiveRef = useRef<boolean>(false)

  // Get store methods for updating entries
  const addEntry = usePullStore((state) => state.addEntry)
  const removeEntry = usePullStore((state) => state.removeEntry)
  const updateEntryRequestedQty = usePullStore((state) => state.updateEntryRequestedQty)

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

    // Prevent duplicate subscriptions
    if (subscriptionActiveRef.current) {
      console.log('Subscription already active, skipping setup')
      return
    }
    subscriptionActiveRef.current = true

    // Clear notified IDs when setting up a new subscription
    notifiedIdsRef.current.clear()

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
          if (!newItem) return

          // Check if we've already processed this item (prevent duplicates)
          const notificationKey = `add-${newItem.id}`
          if (itemsRef.current.has(newItem.id) || notifiedIdsRef.current.has(notificationKey)) {
            console.log('Skipping duplicate INSERT notification for:', newItem.id)
            return
          }

          // Mark as notified to prevent duplicates
          notifiedIdsRef.current.add(notificationKey)

          // New item added by technician - add to store first
          addEntry({
            itemId: newItem.id,
            partId: newItem.our_part_number,
            ourPartNumber: newItem.our_part_number,
            description: newItem.description,
            requestedQty: newItem.quantity,
            imageUrl: null, // Image will be loaded separately
          })

          // Create notification
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

          // Invalidate queries to refresh any other data
          queryClient.invalidateQueries({ queryKey: ['request', requestId] })
          onItemsChanged?.()
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
          if (!updatedItem) return

          const oldItem = itemsRef.current.get(updatedItem.id)
          if (!oldItem) return

          // Check for cancellation
          if (updatedItem.is_cancelled && !oldItem.is_cancelled) {
            const notificationKey = `remove-${updatedItem.id}`
            if (!notifiedIdsRef.current.has(notificationKey)) {
              notifiedIdsRef.current.add(notificationKey)

              // Remove from store
              removeEntry(updatedItem.id)

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
          }
          // Check for quantity reduction
          else if (updatedItem.quantity < oldItem.quantity) {
            // Check for overpull conflict
            const qtyPulled = oldItem.qty_pulled || 0
            if (updatedItem.quantity < qtyPulled) {
              const notificationKey = `conflict-${updatedItem.id}-${updatedItem.quantity}`
              if (!notifiedIdsRef.current.has(notificationKey)) {
                notifiedIdsRef.current.add(notificationKey)

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
              }
            } else {
              const notificationKey = `reduce-${updatedItem.id}-${updatedItem.quantity}`
              if (!notifiedIdsRef.current.has(notificationKey)) {
                notifiedIdsRef.current.add(notificationKey)

                // Update store with new quantity
                updateEntryRequestedQty(updatedItem.id, updatedItem.quantity)

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
          }

          // Update our reference
          itemsRef.current.set(updatedItem.id, updatedItem)

          // Invalidate queries to refresh any other data
          queryClient.invalidateQueries({ queryKey: ['request', requestId] })
          onItemsChanged?.()
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
          if (!deletedItem?.id) return

          const oldItem = itemsRef.current.get(deletedItem.id)
          if (!oldItem) return

          const notificationKey = `delete-${oldItem.id}`
          if (notifiedIdsRef.current.has(notificationKey)) {
            console.log('Skipping duplicate DELETE notification for:', oldItem.id)
            return
          }
          notifiedIdsRef.current.add(notificationKey)

          // Remove from store
          removeEntry(oldItem.id)

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

          // Invalidate queries to refresh any other data
          queryClient.invalidateQueries({ queryKey: ['request', requestId] })
          onItemsChanged?.()
        }
      )
      .subscribe((status) => {
        console.log('Item changes subscription status:', status)
      })

    // Cleanup subscription on unmount
    return () => {
      console.log('Cleaning up item changes subscription')
      subscriptionActiveRef.current = false
      supabase.removeChannel(channel)
    }
  }, [enabled, requestId, queryClient, onItemsChanged, initializeItems, addEntry, removeEntry, updateEntryRequestedQty])

  return {
    changes,
    hasChanges: changes.length > 0,
    hasConflicts: changes.some((c) => c.type === 'conflict'),
    dismissChange,
    dismissAllChanges,
    initializeItems,
  }
}
