// Material Request Types - matching Consignment Management database schema

export interface MaterialRequest {
  id: string
  request_id: string
  tech_id: string
  tech_name: string
  job_name: string
  truck_number: string | null
  needed_date: string | null
  priority: 'normal' | 'urgent' | 'asap'
  delivery_method: 'delivery' | 'pickup'
  delivery_latitude: number | null
  delivery_longitude: number | null
  delivery_address: string | null
  status: 'pending' | 'approved' | 'processing' | 'fulfilled' | 'cancelled' | 'rejected'
  notes: string | null
  created_at: string
  updated_at: string
  completed_at: string | null
  warehouse_synced: boolean
  warehouse_sync_timestamp: string | null
  total_items: number
  total_quantity: number
  // Pull tracking fields
  pull_started_at?: string | null
  pull_completed_at?: string | null
  pulled_by?: string | null
  has_shortages?: boolean
  // Delivery tracking fields
  delivery_truck_id?: string | null
  dispatched_at?: string | null
  dispatched_by?: string | null
  delivered_at?: string | null
  delivered_by?: string | null
  // Nested items
  items?: MaterialRequestItem[]
}

export interface MaterialRequestItem {
  id: string
  request_id: string
  part_id: string
  our_part_number: string
  description: string
  quantity: number
  confirmed: boolean
  created_at: string
  original_voice_input: string | null
  ai_confidence_score: number | null
  alternatives_considered: unknown | null
  // Pull tracking fields
  qty_pulled: number | null
  qty_on_shortage_po: number
  qty_cancelled: number
  item_status: 'pending' | 'pulled' | 'partial' | 'shortage_po_created' | 'completed'
  pulled_at: string | null
  pulled_by: string | null
}

// Part info for display
export interface Part {
  id: string
  part_id: string
  our_part_number: string
  description: string | null
  image_url: string | null
  category: string | null
  location: string | null
  is_consigned: boolean
}

// Pull session state
export interface PullEntry {
  itemId: string
  partId: string
  ourPartNumber: string
  description: string
  requestedQty: number
  qtyPulled: number
  imageUrl: string | null
  isPulled: boolean
  quantityIncrement?: number | null
  unitLabel?: string | null
}

export interface PullSession {
  requestId: string
  requestNumber: string
  techName: string
  truckNumber: string | null
  priority: 'normal' | 'urgent' | 'asap'
  entries: PullEntry[]
  startedAt: string
  completedAt: string | null
}

// Offline sync types
export interface PendingSync {
  requestId: string
  entries: PullEntry[]
  completedAt: string
  syncStatus: 'pending' | 'syncing' | 'failed'
  lastAttempt: string | null
  errorMessage: string | null
}
