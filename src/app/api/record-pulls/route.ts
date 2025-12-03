import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'

// Use service role key for server-side operations (bypasses RLS)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    // Verify user is authenticated
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized - please sign in' },
        { status: 401 }
      )
    }

    const { requestId, entries } = await req.json()

    if (!requestId || !entries || !Array.isArray(entries)) {
      return NextResponse.json(
        { error: 'Invalid request - requestId and entries required' },
        { status: 400 }
      )
    }

    console.log('📝 Recording pulls for request:', requestId)
    console.log('📦 Entries to update:', entries.length)

    // Update each item with pull quantities
    for (const entry of entries) {
      const { itemId, qtyPulled } = entry

      if (!itemId || qtyPulled === undefined) {
        console.error('Invalid entry:', entry)
        continue
      }

      // Determine item status based on quantity pulled
      // 'pulled' = quantity was pulled (full or partial)
      // 'partial' = processed but zero available (shortage)
      const itemStatus = qtyPulled > 0 ? 'pulled' : 'partial'

      console.log(`  Updating item ${itemId}: qty_pulled=${qtyPulled}, status=${itemStatus}`)

      const { data, error } = await supabase
        .from('material_request_items')
        .update({
          qty_pulled: qtyPulled,
          item_status: itemStatus,
          pulled_at: new Date().toISOString(),
          pulled_by: session.user.email,
        })
        .eq('id', itemId)
        .select()

      if (error) {
        console.error('Error updating item:', itemId, error)
        throw error
      }

      if (!data || data.length === 0) {
        console.error('No rows updated for item:', itemId)
        throw new Error(`Failed to update item ${itemId} - item not found`)
      }

      console.log(`  ✅ Updated item ${itemId}`)
    }

    // Fetch all items to check for shortages
    const { data: items, error: fetchError } = await supabase
      .from('material_request_items')
      .select('quantity, qty_pulled')
      .eq('request_id', requestId)

    if (fetchError) {
      console.error('Error fetching items for shortage check:', fetchError)
      throw fetchError
    }

    // Check if any items have shortages (pulled < requested)
    const hasShortages = items?.some(
      (item) => (item.qty_pulled || 0) < item.quantity
    ) || false

    console.log('📊 Has shortages:', hasShortages)

    // Update the request with pull completion info
    const { error: requestError } = await supabase
      .from('material_requests')
      .update({
        pull_completed_at: new Date().toISOString(),
        pulled_by: session.user.email,
        has_shortages: hasShortages,
        // Keep status as 'processing' - Consignment Manager handles status changes
      })
      .eq('id', requestId)

    if (requestError) {
      console.error('Error updating request:', requestError)
      throw requestError
    }

    console.log('✅ Pull recorded successfully')

    return NextResponse.json({
      success: true,
      hasShortages,
    })
  } catch (error: any) {
    console.error('Record pulls error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to record pulls' },
      { status: 500 }
    )
  }
}
