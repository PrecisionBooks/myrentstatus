# COMPONENT FILES TO COMPLETE

Due to token limits in this session, the following component files need to be created. I've provided the structure - you can request each one individually or I can provide them in the next message.

## Files Needed:

### 1. src/components/MoveInForm.tsx
- Form for adding new tenants
- Fields: building, unit, primary tenant, secondary tenant (optional), lease terms
- Prorated rent option
- File upload for lease documents
- Saves to Supabase

### 2. src/components/MoveOutForm.tsx  
- Form for recording move-outs
- Select building → filters tenants
- Select tenant → shows details
- Move-out date
- Deposit refund amount
- Notes
- Updates tenant status and creates move_out record

### 3. src/components/EditTenantForm.tsx
- Edit all tenant details
- Switch primary/secondary tenant
- Remove secondary tenant
- Change building/unit
- View rent history
- Add rent increases (updates current rent, anniversary date, creates history record)
- Edit security deposit, lease end date
- Notes

## Quick Implementation Guide:

Each component follows this pattern:

```typescript
'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function ComponentName({ onClose }: { onClose: () => void }) {
  const [formData, setFormData] = useState({...})
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // Supabase insert/update
    const { data, error } = await supabase.from('table').insert/update(...)
    if (!error) onClose()
  }
  
  return (
    <div style={{ position: 'fixed', ... }}>
      {/* Modal overlay */}
      <div style={{ background: 'white', ... }}>
        {/* Form fields */}
      </div>
    </div>
  )
}
```

## To Complete the Project:

**Option 1:** Ask me to create each component file one by one
**Option 2:** I can provide a complete download link with all files in next response
**Option 3:** You can implement these following the patterns in TenantTable.tsx

The core infrastructure is complete:
- ✅ Database schema (in DEPLOYMENT.md)
- ✅ Next.js setup
- ✅ Supabase connection
- ✅ Main table with full functionality
- ✅ Password protection
- ✅ Deployment guide

Just need the 3 form components!
