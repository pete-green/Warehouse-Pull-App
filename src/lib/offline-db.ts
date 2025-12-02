import Dexie, { Table } from 'dexie'
import { PullEntry } from '@/types'

// Offline database for storing pull sessions when connection is lost

interface OfflinePullEntry {
  id?: number
  requestId: string
  itemId: string
  qtyPulled: number
  isPulled: boolean
  updatedAt: string
}

interface OfflinePullSession {
  requestId: string
  requestNumber: string
  techName: string
  truckNumber: string | null
  priority: 'normal' | 'urgent' | 'asap'
  entries: string // JSON stringified entries
  startedAt: string
  syncStatus: 'pending' | 'syncing' | 'synced' | 'failed'
  completedAt: string | null
  lastSyncAttempt: string | null
  errorMessage: string | null
}

class WarehousePullDB extends Dexie {
  pullEntries!: Table<OfflinePullEntry>
  pullSessions!: Table<OfflinePullSession>

  constructor() {
    super('WarehousePullDB')
    this.version(1).stores({
      pullEntries: '++id, requestId, itemId, updatedAt',
      pullSessions: 'requestId, syncStatus, completedAt',
    })
  }
}

export const offlineDb = new WarehousePullDB()

// Helper functions for offline operations

export async function saveSessionOffline(
  requestId: string,
  requestNumber: string,
  techName: string,
  truckNumber: string | null,
  priority: 'normal' | 'urgent' | 'asap',
  entries: PullEntry[]
): Promise<void> {
  await offlineDb.pullSessions.put({
    requestId,
    requestNumber,
    techName,
    truckNumber,
    priority,
    entries: JSON.stringify(entries),
    startedAt: new Date().toISOString(),
    syncStatus: 'pending',
    completedAt: null,
    lastSyncAttempt: null,
    errorMessage: null,
  })
}

export async function updateEntryOffline(
  requestId: string,
  itemId: string,
  qtyPulled: number,
  isPulled: boolean
): Promise<void> {
  const existing = await offlineDb.pullEntries
    .where({ requestId, itemId })
    .first()

  if (existing) {
    await offlineDb.pullEntries.update(existing.id!, {
      qtyPulled,
      isPulled,
      updatedAt: new Date().toISOString(),
    })
  } else {
    await offlineDb.pullEntries.add({
      requestId,
      itemId,
      qtyPulled,
      isPulled,
      updatedAt: new Date().toISOString(),
    })
  }
}

export async function getOfflineSession(
  requestId: string
): Promise<OfflinePullSession | undefined> {
  return offlineDb.pullSessions.get(requestId)
}

export async function getOfflineEntries(
  requestId: string
): Promise<OfflinePullEntry[]> {
  return offlineDb.pullEntries.where({ requestId }).toArray()
}

export async function markSessionComplete(requestId: string): Promise<void> {
  await offlineDb.pullSessions.update(requestId, {
    completedAt: new Date().toISOString(),
    syncStatus: 'pending',
  })
}

export async function markSessionSynced(requestId: string): Promise<void> {
  // Remove session and entries after successful sync
  await offlineDb.pullSessions.delete(requestId)
  await offlineDb.pullEntries.where({ requestId }).delete()
}

export async function markSessionFailed(
  requestId: string,
  errorMessage: string
): Promise<void> {
  await offlineDb.pullSessions.update(requestId, {
    syncStatus: 'failed',
    lastSyncAttempt: new Date().toISOString(),
    errorMessage,
  })
}

export async function getPendingSyncs(): Promise<OfflinePullSession[]> {
  return offlineDb.pullSessions
    .where('syncStatus')
    .anyOf(['pending', 'failed'])
    .toArray()
}

export async function clearOfflineData(): Promise<void> {
  await offlineDb.pullSessions.clear()
  await offlineDb.pullEntries.clear()
}
