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

    const { requestId, truckId, dispatch = false } = await request.json()

    if (!requestId || !truckId) {
      return NextResponse.json(
        { error: 'Request ID and Truck ID are required' },
        { status: 400 }
      )
    }

    // Build update object
    const updateData: Record<string, any> = {
      delivery_truck_id: truckId,
    }

    // If dispatch flag is true, also set dispatched_at and dispatched_by
    if (dispatch) {
      updateData.dispatched_at = new Date().toISOString()
      updateData.dispatched_by = session.user.email
    }

    // Update the material request with the delivery truck
    const { data, error } = await supabase
      .from('material_requests')
      .update(updateData)
      .eq('id', requestId)
      .select('id, request_id, delivery_truck_id, dispatched_at, dispatched_by')
      .single()

    if (error) {
      console.error('Error assigning delivery truck:', error)
      return NextResponse.json(
        { error: 'Failed to assign delivery truck' },
        { status: 500 }
      )
    }

    const action = dispatch ? 'Assigned and dispatched' : 'Assigned'
    console.log(`${action} truck ${truckId} to request ${requestId} by ${session.user.email}`)

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error) {
    console.error('Error in assign-delivery-truck:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
