'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { format, addMonths, startOfMonth } from 'date-fns'

type Building = { id: number; name: string }
type Unit = { id: number; unit_number: string; building_id: number }
type RentIncrease = {
  id: number
  previous_rent: number
  new_rent: number
  effective_date: string
  new_anniversary_date: string
  created_at: string
}

type Tenant = {
  id: number
  unit_id: number
  primary_tenant_name: string
  primary_tenant_email: string | null
  primary_tenant_phone: string | null
  secondary_tenant_name: string | null
  secondary_tenant_email: string | null
  secondary_tenant_phone: string | null
  move_in_date: string
  lease_end_date: string
  current_rent: number
  original_rent: number
  security_deposit: number
  rent_anniversary_date: string
  has_pet: boolean
  has_parking: boolean
  notes: string | null
  building_id: number
  unit_number: string
}

export default function EditTenantForm({ tenantId, onClose }: { tenantId: number; onClose: () => void }) {
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [buildings, setBuildings] = useState<Building[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [availableUnits, setAvailableUnits] = useState<Unit[]>([])
  const [rentHistory, setRentHistory] = useState<RentIncrease[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showAddIncrease, setShowAddIncrease] = useState(false)
  const [hasSecondary, setHasSecondary] = useState(false)

  const [formData, setFormData] = useState({
    building_id: '',
    unit_id: '',
    primary_name: '',
    primary_email: '',
    primary_phone: '',
    secondary_name: '',
    secondary_email: '',
    secondary_phone: '',
    security_deposit: '',
    lease_end_date: '',
    has_pet: false,
    has_parking: false,
    notes: ''
  })

  const [increaseData, setIncreaseData] = useState({
    new_rent: '',
    effective_date: '',
    new_anniversary_date: ''
  })

  useEffect(() => {
    fetchTenant()
    fetchBuildings()
    fetchUnits()
    fetchRentHistory()
  }, [tenantId])

  useEffect(() => {
    if (formData.building_id) {
      const filtered = units.filter(u => u.building_id === parseInt(formData.building_id))
      setAvailableUnits(filtered)
    } else {
      setAvailableUnits([])
    }
  }, [formData.building_id, units])

  const fetchTenant = async () => {
    const { data, error } = await supabase
      .from('tenants')
      .select(`
        *,
        units!inner (
          id,
          unit_number,
          building_id,
          buildings!inner (
            id,
            name
          )
        )
      `)
      .eq('id', tenantId)
      .single()

    if (error) {
      console.error('Error fetching tenant:', error)
      return
    }

    if (data) {
      const tenantData: Tenant = {
        ...data,
        building_id: data.units.building_id,
        unit_number: data.units.unit_number
      }

      setTenant(tenantData)
      setHasSecondary(!!data.secondary_tenant_name)
      
      setFormData({
        building_id: data.units.building_id.toString(),
        unit_id: data.unit_id.toString(),
        primary_name: data.primary_tenant_name,
        primary_email: data.primary_tenant_email || '',
        primary_phone: data.primary_tenant_phone || '',
        secondary_name: data.secondary_tenant_name || '',
        secondary_email: data.secondary_tenant_email || '',
        secondary_phone: data.secondary_tenant_phone || '',
        security_deposit: data.security_deposit.toString(),
        lease_end_date: data.lease_end_date,
        has_pet: data.has_pet,
        has_parking: data.has_parking,
        notes: data.notes || ''
      })
      
      setLoading(false)
    }
  }

  const fetchBuildings = async () => {
    const { data } = await supabase.from('buildings').select('*').order('name')
    if (data) setBuildings(data)
  }

  const fetchUnits = async () => {
    const { data } = await supabase.from('units').select('*').order('unit_number')
    if (data) setUnits(data)
  }

  const fetchRentHistory = async () => {
    const { data } = await supabase
      .from('rent_increases')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('effective_date', { ascending: false })

    if (data) setRentHistory(data)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const updates = {
        unit_id: parseInt(formData.unit_id),
        primary_tenant_name: formData.primary_name,
        primary_tenant_email: formData.primary_email || null,
        primary_tenant_phone: formData.primary_phone || null,
        secondary_tenant_name: hasSecondary ? formData.secondary_name || null : null,
        secondary_tenant_email: hasSecondary ? formData.secondary_email || null : null,
        secondary_tenant_phone: hasSecondary ? formData.secondary_phone || null : null,
        security_deposit: parseFloat(formData.security_deposit),
        lease_end_date: formData.lease_end_date,
        has_pet: formData.has_pet,
        has_parking: formData.has_parking,
        notes: formData.notes || null,
        updated_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from('tenants')
        .update(updates)
        .eq('id', tenantId)

      if (error) throw error

      onClose()
    } catch (error) {
      console.error('Error updating tenant:', error)
      alert('Error updating tenant. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleAddRentIncrease = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      if (!tenant) return

      // Create rent increase record
      const { error: increaseError } = await supabase.from('rent_increases').insert([{
        tenant_id: tenantId,
        previous_rent: tenant.current_rent,
        new_rent: parseFloat(increaseData.new_rent),
        effective_date: increaseData.effective_date,
        new_anniversary_date: increaseData.new_anniversary_date
      }])

      if (increaseError) throw increaseError

      // Update tenant's current rent and anniversary date
      const { error: updateError } = await supabase
        .from('tenants')
        .update({
          current_rent: parseFloat(increaseData.new_rent),
          rent_anniversary_date: increaseData.new_anniversary_date,
          updated_at: new Date().toISOString()
        })
        .eq('id', tenantId)

      if (updateError) throw updateError

      // Refresh data
      await fetchTenant()
      await fetchRentHistory()
      
      setShowAddIncrease(false)
      setIncreaseData({ new_rent: '', effective_date: '', new_anniversary_date: '' })
    } catch (error) {
      console.error('Error adding rent increase:', error)
      alert('Error adding rent increase. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const switchTenants = () => {
    setFormData(prev => ({
      ...prev,
      primary_name: prev.secondary_name,
      primary_email: prev.secondary_email,
      primary_phone: prev.secondary_phone,
      secondary_name: prev.primary_name,
      secondary_email: prev.primary_email,
      secondary_phone: prev.primary_phone
    }))
  }

  const removeSecondary = () => {
    setHasSecondary(false)
    setFormData(prev => ({
      ...prev,
      secondary_name: '',
      secondary_email: '',
      secondary_phone: ''
    }))
  }

  const addSecondary = () => {
    setHasSecondary(true)
  }

  const autoFillAnniversary = () => {
    if (increaseData.effective_date) {
      const effectiveDate = new Date(increaseData.effective_date)
      const anniversary = startOfMonth(addMonths(effectiveDate, 12))
      setIncreaseData(prev => ({
        ...prev,
        new_anniversary_date: format(anniversary, 'yyyy-MM-dd')
      }))
    }
  }

  if (loading || !tenant) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
        <div style={{ background: 'white', padding: '2rem', borderRadius: '12px' }}>Loading...</div>
      </div>
    )
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
      <div style={{ background: 'white', borderRadius: '12px', width: '100%', maxWidth: '800px', maxHeight: '90vh', overflow: 'auto' }}>
        
        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg, #378ADD 0%, #85B7EB 100%)', padding: '2rem', color: 'white', borderRadius: '12px 12px 0 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
            <div>
              <h2 style={{ fontSize: '24px', fontWeight: '500', margin: 0, color: 'white' }}>Edit tenant</h2>
              <p style={{ fontSize: '14px', margin: '8px 0 0 0', opacity: 0.9 }}>
                {buildings.find(b => b.id === tenant.building_id)?.name}, Unit {tenant.unit_number}
              </p>
            </div>
            <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '28px', cursor: 'pointer', padding: 0, width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>
              ×
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '2rem' }}>
          
          {/* Unit Information */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '500', margin: '0 0 16px 0', paddingBottom: '8px', borderBottom: '0.5px solid #e2e8f0' }}>Unit information</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>Building</label>
                <select 
                  value={formData.building_id}
                  onChange={(e) => setFormData({...formData, building_id: e.target.value, unit_id: ''})}
                  style={{ width: '100%' }}
                >
                  {buildings.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>Unit number</label>
                <select 
                  value={formData.unit_id}
                  onChange={(e) => setFormData({...formData, unit_id: e.target.value})}
                  style={{ width: '100%' }}
                >
                  {availableUnits.map(u => <option key={u.id} value={u.id}>{u.unit_number}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Primary Tenant */}
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '8px', borderBottom: '0.5px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '500', margin: 0 }}>Primary tenant</h3>
              {hasSecondary && (
                <button 
                  type="button"
                  onClick={switchTenants}
                  style={{ padding: '6px 12px', fontSize: '12px', background: 'transparent', border: '0.5px solid #e2e8f0', borderRadius: '6px' }}
                >
                  ↑↓ Switch with secondary
                </button>
              )}
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>Full name</label>
              <input 
                type="text" 
                required
                value={formData.primary_name}
                onChange={(e) => setFormData({...formData, primary_name: e.target.value})}
                style={{ width: '100%' }}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>Email</label>
                <input 
                  type="email" 
                  value={formData.primary_email}
                  onChange={(e) => setFormData({...formData, primary_email: e.target.value})}
                  style={{ width: '100%' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>Phone</label>
                <input 
                  type="tel" 
                  value={formData.primary_phone}
                  onChange={(e) => setFormData({...formData, primary_phone: e.target.value})}
                  style={{ width: '100%' }}
                />
              </div>
            </div>
          </div>

          {/* Secondary Tenant */}
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '8px', borderBottom: '0.5px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '500', margin: 0 }}>Secondary tenant</h3>
              {hasSecondary && (
                <button 
                  type="button"
                  onClick={removeSecondary}
                  style={{ padding: '6px 12px', fontSize: '12px', background: 'transparent', border: '0.5px solid #A32D2D', borderRadius: '6px', color: '#A32D2D' }}
                >
                  − Remove
                </button>
              )}
            </div>
            
            {hasSecondary ? (
              <>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>Full name</label>
                  <input 
                    type="text" 
                    value={formData.secondary_name}
                    onChange={(e) => setFormData({...formData, secondary_name: e.target.value})}
                    style={{ width: '100%' }}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>Email</label>
                    <input 
                      type="email" 
                      value={formData.secondary_email}
                      onChange={(e) => setFormData({...formData, secondary_email: e.target.value})}
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>Phone</label>
                    <input 
                      type="tel" 
                      value={formData.secondary_phone}
                      onChange={(e) => setFormData({...formData, secondary_phone: e.target.value})}
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>
              </>
            ) : (
              <div>
                <p style={{ fontSize: '13px', color: '#718096', margin: 0 }}>No secondary tenant on this lease</p>
                <button 
                  type="button"
                  onClick={addSecondary}
                  style={{ padding: '8px 16px', fontSize: '13px', marginTop: '12px', background: 'transparent', border: '0.5px solid #e2e8f0', borderRadius: '6px' }}
                >
                  + Add secondary tenant
                </button>
              </div>
            )}
          </div>

          {/* Rent Information */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '500', margin: '0 0 16px 0', paddingBottom: '8px', borderBottom: '0.5px solid #e2e8f0' }}>Rent information</h3>
            
            {/* Current Rent Display */}
            <div style={{ background: '#f7fafc', borderRadius: '8px', padding: '1.25rem', marginBottom: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <p style={{ fontSize: '12px', color: '#718096', margin: '0 0 6px 0' }}>Current monthly rent</p>
                  <p style={{ fontSize: '24px', fontWeight: '500', margin: 0 }}>${tenant.current_rent.toLocaleString()}</p>
                </div>
                <div>
                  <p style={{ fontSize: '12px', color: '#718096', margin: '0 0 6px 0' }}>Rent anniversary date</p>
                  <p style={{ fontSize: '24px', fontWeight: '500', margin: 0 }}>{format(new Date(tenant.rent_anniversary_date), 'MMM d, yyyy')}</p>
                  <p style={{ fontSize: '11px', color: '#718096', margin: '4px 0 0 0' }}>Next date rent can be increased</p>
                </div>
              </div>
            </div>

            {/* Rent History */}
            <div style={{ background: '#f7fafc', borderRadius: '8px', padding: '1rem', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h4 style={{ fontSize: '13px', fontWeight: '500', margin: 0 }}>Rent history</h4>
                <button 
                  type="button"
                  onClick={() => setShowAddIncrease(!showAddIncrease)}
                  style={{ padding: '4px 10px', fontSize: '11px', background: 'white', border: '0.5px solid #e2e8f0', borderRadius: '6px' }}
                >
                  + Add increase
                </button>
              </div>
              
              <div style={{ display: 'grid', gap: '8px' }}>
                {/* Current rent */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px', background: 'white', borderRadius: '6px', fontSize: '13px' }}>
                  <div>
                    <span style={{ fontWeight: '500' }}>${tenant.current_rent.toLocaleString()}/mo</span>
                    <span style={{ color: '#718096', marginLeft: '12px' }}>Current</span>
                  </div>
                  <span style={{ color: '#718096' }}>
                    {rentHistory.length > 0 
                      ? format(new Date(rentHistory[0].effective_date), 'MMM d, yyyy')
                      : format(new Date(tenant.move_in_date), 'MMM d, yyyy')}
                  </span>
                </div>
                
                {/* Previous increases */}
                {rentHistory.slice(1).map((increase) => (
                  <div key={increase.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px', background: 'white', borderRadius: '6px', fontSize: '13px' }}>
                    <div>
                      <span style={{ fontWeight: '500', color: '#718096' }}>${increase.new_rent.toLocaleString()}/mo</span>
                    </div>
                    <span style={{ color: '#718096' }}>{format(new Date(increase.effective_date), 'MMM d, yyyy')}</span>
                  </div>
                ))}
                
                {/* Original rent */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px', background: 'white', borderRadius: '6px', fontSize: '13px' }}>
                  <div>
                    <span style={{ fontWeight: '500', color: '#718096' }}>${tenant.original_rent.toLocaleString()}/mo</span>
                    <span style={{ color: '#718096', marginLeft: '12px' }}>Original</span>
                  </div>
                  <span style={{ color: '#718096' }}>{format(new Date(tenant.move_in_date), 'MMM d, yyyy')}</span>
                </div>
              </div>
            </div>

            {/* Add Rent Increase Form */}
            {showAddIncrease && (
              <div style={{ background: '#E6F1FB', border: '0.5px solid #85B7EB', borderRadius: '8px', padding: '1rem', marginBottom: '16px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: '500', margin: '0 0 16px 0', color: '#185FA5' }}>Record rent increase</h4>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>
                      New rent amount <span style={{ color: '#A32D2D' }}>*</span>
                    </label>
                    <input 
                      type="number" 
                      step="0.01"
                      placeholder="0.00"
                      value={increaseData.new_rent}
                      onChange={(e) => setIncreaseData({...increaseData, new_rent: e.target.value})}
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>
                      Effective date <span style={{ color: '#A32D2D' }}>*</span>
                    </label>
                    <input 
                      type="date" 
                      value={increaseData.effective_date}
                      onChange={(e) => {
                        setIncreaseData({...increaseData, effective_date: e.target.value})
                      }}
                      onBlur={autoFillAnniversary}
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>
                
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>
                    New rent anniversary date <span style={{ color: '#A32D2D' }}>*</span>
                  </label>
                  <input 
                    type="date" 
                    value={increaseData.new_anniversary_date}
                    onChange={(e) => setIncreaseData({...increaseData, new_anniversary_date: e.target.value})}
                    style={{ width: '100%' }}
                  />
                  <p style={{ fontSize: '11px', color: '#718096', margin: '4px 0 0 0' }}>
                    Usually 12 months from effective date (first of month)
                  </p>
                </div>
                
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    type="button"
                    onClick={handleAddRentIncrease}
                    disabled={!increaseData.new_rent || !increaseData.effective_date || !increaseData.new_anniversary_date}
                    style={{ padding: '10px 18px', fontSize: '13px', background: '#378ADD', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '500', cursor: 'pointer' }}
                  >
                    Save increase
                  </button>
                  <button 
                    type="button"
                    onClick={() => {
                      setShowAddIncrease(false)
                      setIncreaseData({ new_rent: '', effective_date: '', new_anniversary_date: '' })
                    }}
                    style={{ padding: '10px 18px', fontSize: '13px', background: 'transparent', border: '0.5px solid #e2e8f0', borderRadius: '6px' }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>Security deposit</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={formData.security_deposit}
                  onChange={(e) => setFormData({...formData, security_deposit: e.target.value})}
                  style={{ width: '100%' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>Lease end date</label>
                <input 
                  type="date" 
                  value={formData.lease_end_date}
                  onChange={(e) => setFormData({...formData, lease_end_date: e.target.value})}
                  style={{ width: '100%' }}
                />
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '500', margin: '0 0 16px 0', paddingBottom: '8px', borderBottom: '0.5px solid #e2e8f0' }}>Additional information</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={formData.has_pet}
                  onChange={(e) => setFormData({...formData, has_pet: e.target.checked})}
                  style={{ width: '16px', height: '16px' }}
                />
                <span style={{ fontSize: '13px' }}>Pet on premises</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={formData.has_parking}
                  onChange={(e) => setFormData({...formData, has_parking: e.target.checked})}
                  style={{ width: '16px', height: '16px' }}
                />
                <span style={{ fontSize: '13px' }}>Parking space included</span>
              </label>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>Notes</label>
              <textarea 
                placeholder="Any special terms, arrangements, or important details..."
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                style={{ width: '100%', minHeight: '100px', resize: 'vertical' }}
              />
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '12px', paddingTop: '1.5rem', borderTop: '0.5px solid #e2e8f0' }}>
            <button 
              type="submit" 
              disabled={saving}
              style={{ flex: 1, padding: '14px', background: '#378ADD', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '500', fontSize: '14px', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1 }}
            >
              {saving ? 'Saving...' : 'Save changes'}
            </button>
            <button 
              type="button"
              onClick={onClose}
              style={{ padding: '14px 24px', background: 'transparent', border: '0.5px solid #e2e8f0', borderRadius: '8px', fontWeight: '500', fontSize: '14px' }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
