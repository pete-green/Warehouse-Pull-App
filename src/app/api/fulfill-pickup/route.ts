import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'

// Use service role key to bypass RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    // Get session
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { requestId } = await request.json()

    if (!requestId) {
      return NextResponse.json(
        { error: 'Request ID is required' },
        { status: 400 }
      )
    }

    // Fetch the request to validate conditions
    const { data: materialRequest, error: fetchError } = await supabase
      .from('material_requests')
      .select('id, request_id, delivery_method, pull_completed_at, has_shortages, status')
      .eq('id', requestId)
      .single()

    if (fetchError || !materialRequest) {
      return NextResponse.json(
        { error: 'Request not found' },
        { status: 404 }
      )
    }

    // Validate conditions (matching Consignment Manager behavior)
    if (materialRequest.delivery_method !== 'pickup') {
      return NextResponse.json(
        { error: 'Only pickup orders can be fulfilled here. Use dispatch for deliveries.' },
        { status: 400 }
      )
    }

    if (!materialRequest.pull_completed_at) {
      return NextResponse.json(
        { error: 'Pull must be complete before fulfilling' },
        { status: 400 }
      )
    }

    if (materialRequest.has_shortages) {
      return NextResponse.json(
        { error: 'Orders with shortages must be resolved in Consignment Manager first' },
        { status: 400 }
      )
    }

    if (materialRequest.status === 'fulfilled') {
      return NextResponse.json(
        { error: 'Order is already fulfilled' },
        { status: 400 }
      )
    }

    // Update the request to fulfilled
    const { data: updatedRequest, error: updateError } = await supabase
      .from('material_requests')
      .update({
        status: 'fulfilled',
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', requestId)
      .select()
      .single()

    if (updateError) {
      console.error('Error fulfilling pickup:', updateError)
      return NextResponse.json(
        { error: 'Failed to fulfill pickup order' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Pickup order ${materialRequest.request_id} marked as fulfilled`,
      data: updatedRequest,
    })
  } catch (error) {
    console.error('Fulfill pickup error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
