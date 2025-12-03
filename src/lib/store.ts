import { create } from 'zustand'
import { PullEntry, PullSession } from '@/types'

interface PullStore {
  // Current pull session
  currentSession: PullSession | null

  // Actions
  startSession: (
    requestId: string,
    requestNumber: string,
    techName: string,
    truckNumber: string | null,
    priority: 'normal' | 'urgent' | 'asap',
    items: Omit<PullEntry, 'qtyPulled' | 'isPulled'>[]
  ) => void

  // Start session with existing pull data (for read-only view of completed pulls)
  startSessionWithExistingData: (
    requestId: string,
    requestNumber: string,
    techName: string,
    truckNumber: string | null,
    priority: 'normal' | 'urgent' | 'asap',
    items: Omit<PullEntry, 'qtyPulled' | 'isPulled'>[],
    existingPulls: { itemId: string; qtyPulled: number }[]
  ) => void

  updateEntry: (itemId: string, qtyPulled: number) => void

  markEntryPulled: (itemId: string, qtyPulled: number) => void

  // Add a new entry to the session (for realtime item additions)
  addEntry: (entry: Omit<PullEntry, 'qtyPulled' | 'isPulled'>) => void

  // Remove an entry from the session (for realtime item removals)
  removeEntry: (itemId: string) => void

  // Update requested quantity for an entry (for realtime quantity changes)
  updateEntryRequestedQty: (itemId: string, newQty: number) => void

  completeSession: () => void

  clearSession: () => void

  // Computed values
  getProgress: () => { pulled: number; total: number; percentage: number }

  getHasShortages: () => boolean

  getTotalPulled: () => number

  getTotalRequested: () => number
}

export const usePullStore = create<PullStore>((set, get) => ({
  currentSession: null,

  startSession: (requestId, requestNumber, techName, truckNumber, priority, items) => {
    const entries: PullEntry[] = items.map(item => ({
      ...item,
      qtyPulled: 0,
      isPulled: false,
    }))

    set({
      currentSession: {
        requestId,
        requestNumber,
        techName,
        truckNumber,
        priority,
        entries,
        startedAt: new Date().toISOString(),
        completedAt: null,
      },
    })
  },

  startSessionWithExistingData: (requestId, requestNumber, techName, truckNumber, priority, items, existingPulls) => {
    // Create a map of itemId -> qtyPulled for quick lookup
    const pullMap = new Map(existingPulls.map(p => [p.itemId, p.qtyPulled]))

    const entries: PullEntry[] = items.map(item => ({
      ...item,
      qtyPulled: pullMap.get(item.itemId) ?? 0,
      isPulled: true, // All items are already pulled in read-only mode
    }))

    set({
      currentSession: {
        requestId,
        requestNumber,
        techName,
        truckNumber,
        priority,
        entries,
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(), // Already completed
      },
    })
  },

  updateEntry: (itemId, qtyPulled) => {
    const session = get().currentSession
    if (!session) return

    set({
      currentSession: {
        ...session,
        entries: session.entries.map(entry =>
          entry.itemId === itemId
            ? { ...entry, qtyPulled, isPulled: false }
            : entry
        ),
      },
    })
  },

  markEntryPulled: (itemId, qtyPulled) => {
    const session = get().currentSession
    if (!session) return

    set({
      currentSession: {
        ...session,
        entries: session.entries.map(entry =>
          entry.itemId === itemId
            ? { ...entry, qtyPulled, isPulled: true }
            : entry
        ),
      },
    })
  },

  addEntry: (entry) => {
    const session = get().currentSession
    if (!session) return

    // Don't add if entry already exists
    if (session.entries.some(e => e.itemId === entry.itemId)) return

    set({
      currentSession: {
        ...session,
        entries: [...session.entries, { ...entry, qtyPulled: 0, isPulled: false }],
      },
    })
  },

  removeEntry: (itemId) => {
    const session = get().currentSession
    if (!session) return

    set({
      currentSession: {
        ...session,
        entries: session.entries.filter(entry => entry.itemId !== itemId),
      },
    })
  },

  updateEntryRequestedQty: (itemId, newQty) => {
    const session = get().currentSession
    if (!session) return

    set({
      currentSession: {
        ...session,
        entries: session.entries.map(entry =>
          entry.itemId === itemId
            ? { ...entry, requestedQty: newQty }
            : entry
        ),
      },
    })
  },

  completeSession: () => {
    const session = get().currentSession
    if (!session) return

    set({
      currentSession: {
        ...session,
        completedAt: new Date().toISOString(),
      },
    })
  },

  clearSession: () => {
    set({ currentSession: null })
  },

  getProgress: () => {
    const session = get().currentSession
    if (!session) return { pulled: 0, total: 0, percentage: 0 }

    const pulled = session.entries.filter(e => e.isPulled).length
    const total = session.entries.length
    const percentage = total > 0 ? Math.round((pulled / total) * 100) : 0

    return { pulled, total, percentage }
  },

  getHasShortages: () => {
    const session = get().currentSession
    if (!session) return false

    return session.entries.some(e => e.isPulled && e.qtyPulled < e.requestedQty)
  },

  getTotalPulled: () => {
    const session = get().currentSession
    if (!session) return 0

    return session.entries.reduce((sum, e) => sum + e.qtyPulled, 0)
  },

  getTotalRequested: () => {
    const session = get().currentSession
    if (!session) return 0

    return session.entries.reduce((sum, e) => sum + e.requestedQty, 0)
  },
}))
