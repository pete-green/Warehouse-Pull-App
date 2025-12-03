import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * POST /api/resolve-conflict
 * Resolve an overpull conflict when tech reduces quantity below what was pulled.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized - please sign in' },
        { status: 401 }
      )
    }

    const { itemId, action, newQtyPulled } = await req.json()

    if (!itemId || !action) {
      return NextResponse.json(
        { error: 'Item ID and action are required' },
        { status: 400 }
      )
    }

    console.log('Resolving conflict:', { itemId, action, newQtyPulled })

    // Fetch the current item
    const { data: item, error: fetchError } = await supabase
      .from('material_request_items')
      .select('*, request:request_id(id, total_quantity)')
      .eq('id', itemId)
      .single()

    if (fetchError || !item) {
      console.error('Item fetch error:', fetchError)
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      )
    }

    const now = new Date().toISOString()

    switch (action) {
      case 'reduce_pulled':
        // Put items back on shelf - reduce qty_pulled to match new quantity
        await supabase
          .from('material_request_items')
          .update({
            qty_pulled: item.quantity,
            conflict_status: 'resolved',
            pulled_at: now,
            pulled_by: session.user.email,
          })
          .eq('id', itemId)
        break

      case 'adjust_pulled':
        // User entered a custom qty_pulled value
        if (newQtyPulled === undefined || newQtyPulled < 0) {
          return NextResponse.json(
            { error: 'Invalid pulled quantity' },
            { status: 400 }
          )
        }
        await supabase
          .from('material_request_items')
          .update({
            qty_pulled: newQtyPulled,
            conflict_status: 'resolved',
            pulled_at: now,
            pulled_by: session.user.email,
          })
          .eq('id', itemId)
        break

      case 'keep_extra':
        // Send all pulled items - update the request quantity to match what was pulled
        const qtyPulled = item.qty_pulled || 0
        const qtyDifference = qtyPulled - item.quantity

        // Update item quantity to match qty_pulled
        await supabase
          .from('material_request_items')
          .update({
            quantity: qtyPulled,
            conflict_status: 'resolved',
          })
          .eq('id', itemId)

        // Update request total_quantity
        if (item.request && qtyDifference !== 0) {
          await supabase
            .from('material_requests')
            .update({
              total_quantity: (item.request.total_quantity || 0) + qtyDifference,
              updated_at: now,
            })
            .eq('id', item.request_id)
        }
        break

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

    console.log('Conflict resolved successfully')

    return NextResponse.json({
      success: true,
      message: 'Conflict resolved',
    })
  } catch (error: any) {
    console.error('Resolve conflict error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to resolve conflict' },
      { status: 500 }
    )
  }
}
