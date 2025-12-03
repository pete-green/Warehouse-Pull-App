# Warehouse Pull App - Claude Code Documentation

## Project Overview

A dedicated iPad application for warehouse personnel to digitally record material pulls. Replaces paper pick sheets with a streamlined digital workflow focused on speed and reliability.

**Repository**: https://github.com/pete-green/Warehouse-Pull-App
**Deployment**: Netlify (auto-deploy from main branch)
**Related Apps**:
- Consignment Management (main admin app) - shares database
- Field Materials Request (tech app) - shares auth pattern

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Auth | Google OAuth (@gogreenplumb.com) | Same as Field Materials Request |
| Scope | Pull recording ONLY | Shortage resolution handled in Consignment Manager |
| Offline | Basic protection with Dexie.js | Save work if connection drops, sync when restored |
| Sorting | Priority (urgent/asap first) + Age (oldest first) | Urgent requests should be processed first |

---

## Tech Stack

| Component | Technology |
|-----------|------------|
| Framework | Next.js 14 (App Router) |
| Auth | NextAuth.js + Google OAuth |
| Database | Supabase (same project as Consignment Manager) |
| State | Zustand (local state) + TanStack Query (server sync) |
| Styling | Tailwind CSS (iPad-optimized) |
| Offline | IndexedDB via Dexie.js |

---

## Project Structure

```
warehouse-pull-app/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/route.ts  # NextAuth API
│   │   │   └── record-pulls/route.ts        # Record pull quantities (uses service role key)
│   │   ├── login/page.tsx                   # Login page
│   │   ├── queue/page.tsx                   # Request queue
│   │   ├── pull/[requestId]/page.tsx        # Pull entry screen
│   │   ├── layout.tsx                       # Root layout
│   │   ├── page.tsx                         # Redirect to /queue
│   │   └── globals.css                      # Tailwind styles
│   ├── components/
│   │   ├── AuthProvider.tsx                 # NextAuth session provider
│   │   ├── QueryProvider.tsx                # TanStack Query provider
│   │   ├── RequestCard.tsx                  # Queue item card
│   │   ├── PullItemCard.tsx                 # Item entry card
│   │   ├── NumberPad.tsx                    # Touch number input
│   │   ├── PullSummary.tsx                  # Summary before submit
│   │   └── OfflineIndicator.tsx             # Connection status
│   ├── hooks/
│   │   └── useRequests.ts                   # Data fetching hooks
│   ├── lib/
│   │   ├── supabase.ts                      # Supabase client
│   │   ├── auth-options.ts                  # NextAuth config
│   │   ├── auth.ts                          # Auth helpers
│   │   ├── query-client.ts                  # React Query client
│   │   ├── store.ts                         # Zustand store
│   │   └── offline-db.ts                    # Dexie IndexedDB
│   └── types/
│       └── index.ts                         # TypeScript types
├── tailwind.config.ts                       # iPad-optimized Tailwind
├── next.config.mjs                          # Next.js config
└── package.json
```

---

## User Workflow

```
1. Login (Google OAuth - @gogreenplumb.com only)
        ↓
2. Request Queue (sorted by priority + age)
        ↓
3. Select Request → View Items
        ↓
4. For each item: Record qty_pulled
   - Quick buttons: "In Stock" (full qty) / "None Available"
   - Number pad for partial quantities
        ↓
5. Review Summary → Submit to Supabase
        ↓
6. If shortages: Request flagged for main app
   Return to queue for next request
```

---

## Database Tables Used

### material_requests
- `id` (UUID) - Primary key
- `request_id` (TEXT) - Display ID like "REQ-001"
- `tech_name`, `tech_id`, `truck_number`
- `priority` - 'normal' | 'urgent' | 'asap'
- `status` - 'pending' | 'processing' | 'fulfilled' etc.
- `pull_started_at`, `pull_completed_at`, `pulled_by`
- `has_shortages` (BOOLEAN)

### material_request_items
- `id` (UUID) - Primary key
- `request_id` - Foreign key to material_requests
- `part_id`, `our_part_number`, `description`, `quantity`
- `qty_pulled` (INTEGER) - Quantity actually pulled
- `item_status` - 'pending' | 'pulled' | 'partial'
- `pulled_at`, `pulled_by`

### parts (read-only)
- `part_id`, `our_part_number`, `description`
- `image_url` - For displaying part images

---

## Key Database Operations

### Fetch Pending Requests
```typescript
supabase
  .from('material_requests')
  .select('*, items:material_request_items(*)')
  .in('status', ['pending', 'processing', 'approved'])
  .order('priority', { ascending: false })
  .order('created_at', { ascending: true })
```

### Start Processing
```typescript
supabase
  .from('material_requests')
  .update({
    status: 'processing',
    pull_started_at: new Date().toISOString()
  })
  .eq('id', requestId)
```

### Record Pulls
**IMPORTANT**: Uses API route (`/api/record-pulls`) with service role key to bypass RLS policies.

```typescript
// Client calls API route
const response = await fetch('/api/record-pulls', {
  method: 'POST',
  body: JSON.stringify({ requestId, entries }),
})

// API route (server-side with service role key) updates items
await supabase
  .from('material_request_items')
  .update({
    qty_pulled: entry.qtyPulled,
    item_status: entry.qtyPulled > 0 ? 'pulled' : 'pending',
    pulled_at: new Date().toISOString(),
    pulled_by: userEmail
  })
  .eq('id', entry.itemId)
  .select() // Verify rows were updated

// Then updates request
await supabase
  .from('material_requests')
  .update({
    pull_completed_at: new Date().toISOString(),
    pulled_by: userEmail,
    has_shortages: hasShortages
  })
  .eq('id', requestId)
```

---

## iPad UI Guidelines

- **Touch targets**: Minimum 44x44px (Apple HIG)
- **Font sizes**: 18px minimum for readability
- **Quick buttons**: Large, color-coded (green=In Stock, red=None)
- **Number pad**: Full-screen modal for quantity entry
- **No hover states**: Touch-only interactions

---

## Environment Variables

```env
# Supabase (same as Consignment Manager)
NEXT_PUBLIC_SUPABASE_URL=https://vmjngtmjdrasytgqsvxp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...  # Required for /api/record-pulls route

# NextAuth (same Google OAuth as Field Materials Request)
GOOGLE_CLIENT_ID=679419172975-fp32girht9ap1as86ejn31jj8tr1q3t3.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=...
NEXTAUTH_URL=https://your-app.netlify.app
NEXTAUTH_SECRET=...
```

---

## Implementation Status

### Completed
- [x] Next.js 14 project setup
- [x] Tailwind CSS with iPad optimizations
- [x] Supabase client configuration
- [x] NextAuth with Google OAuth
- [x] Login page
- [x] Request queue page with sorting
- [x] Pull entry screen with item cards
- [x] Quick action buttons (In Stock / None)
- [x] Number pad component
- [x] Pull summary screen
- [x] Supabase submit flow
- [x] Dexie.js offline database setup
- [x] API route for record-pulls (fixes RLS issue)

### Pending
- [ ] Test on actual iPad hardware
- [ ] Offline sync on reconnect (automatic)
- [ ] Pull-to-refresh on queue
- [ ] Part image loading (needs Supabase storage setup)
- [ ] Error boundary components

---

## Bug Fixes

### December 3, 2025 - Pull quantities not persisting

**Problem**: After completing a pull, the quantities weren't being saved to the database. The UI showed success, but returning to the queue and reopening the request showed no pulled quantities.

**Root Cause**: The original code used the Supabase anon key directly from the client to update `material_request_items`. Due to Row Level Security (RLS) policies, the UPDATE succeeded but affected 0 rows (silent failure). The code only checked for `error`, not whether rows were actually updated.

**Solution**: Created `/api/record-pulls` API route that:
1. Uses the service role key (server-side, bypasses RLS)
2. Verifies rows were updated using `.select()` after UPDATE
3. Returns proper errors if updates fail

**Files Changed**:
- Created: `src/app/api/record-pulls/route.ts`
- Modified: `src/hooks/useRequests.ts` - `useRecordPulls` now calls API route
- Modified: `.env.example` - Added `SUPABASE_SERVICE_ROLE_KEY`

---

## Out of Scope

These features are handled in the Consignment Manager app:
- Shortage resolution / vendor assignment
- Service Titan PO creation
- Transaction conversion
- Consignment PO / Transfer creation
- Admin features (parts, vendors, users management)

---

## Development Notes

### Running Locally
```bash
npm install
npm run dev
```

### Building
```bash
npm run build
```

### Deployment
Push to main branch - Netlify auto-deploys.

### Adding Authorized Redirect URI
When deploying, add the Netlify URL to Google Cloud Console:
1. Go to APIs & Services > Credentials
2. Edit the OAuth 2.0 Client
3. Add authorized redirect URI: `https://your-app.netlify.app/api/auth/callback/google`

---

*Last updated: December 3, 2025*
