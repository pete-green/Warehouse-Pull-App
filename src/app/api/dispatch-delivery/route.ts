import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { createClient } from '@supabase/supabase-js'
import { authOptions } from '@/lib/auth-options'

// Use service role key to bypass RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    // Verify authentication
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

    // First, verify the request exists and has a truck assigned
    const { data: existingRequest, error: fetchError } = await supabase
      .from('material_requests')
      .select('id, request_id, delivery_truck_id, dispatched_at')
      .eq('id', requestId)
      .single()

    if (fetchError || !existingRequest) {
      return NextResponse.json(
        { error: 'Request not found' },
        { status: 404 }
      )
    }

    if (!existingRequest.delivery_truck_id) {
      return NextResponse.json(
        { error: 'No truck assigned to this delivery. Assign a truck first.' },
        { status: 400 }
      )
    }

    if (existingRequest.dispatched_at) {
      return NextResponse.json(
        { error: 'This delivery has already been dispatched' },
        { status: 400 }
      )
    }

    // Dispatch the delivery
    const { data, error } = await supabase
      .from('material_requests')
      .update({
        dispatched_at: new Date().toISOString(),
        dispatched_by: session.user.email,
      })
      .eq('id', requestId)
      .select('id, request_id, delivery_truck_id, dispatched_at, dispatched_by')
      .single()

    if (error) {
      console.error('Error dispatching delivery:', error)
      return NextResponse.json(
        { error: 'Failed to dispatch delivery' },
        { status: 500 }
      )
    }

    console.log(`Dispatched delivery ${requestId} by ${session.user.email}`)

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error) {
    console.error('Error in dispatch-delivery:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
