'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { format, addMonths, startOfMonth } from 'date-fns'

type Building = { id: number; name: string }
type Unit = { id: number; unit_number: string; building_id: number }

export default function MoveInForm({ onClose }: { onClose: () => void }) {
  const [buildings, setBuildings] = useState<Building[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [availableUnits, setAvailableUnits] = useState<Unit[]>([])
  const [loading, setLoading] = useState(false)
  const [showSecondary, setShowSecondary] = useState(false)
  const [showProrate, setShowProrate] = useState(false)

  const [formData, setFormData] = useState({
    building_id: '',
    unit_id: '',
    primary_name: '',
    primary_email: '',
    primary_phone: '',
    secondary_name: '',
    secondary_email: '',
    secondary_phone: '',
    move_in_date: '',
    lease_duration: '12',
    monthly_rent: '',
    security_deposit: '',
    prorated_days: '',
    prorated_amount: '',
    has_pet: false,
    has_parking: false,
    notes: ''
  })

  useEffect(() => {
    fetchBuildings()
    fetchUnits()
  }, [])

  useEffect(() => {
    if (formData.building_id) {
      const filtered = units.filter(u => u.building_id === parseInt(formData.building_id))
      setAvailableUnits(filtered)
    } else {
      setAvailableUnits([])
    }
  }, [formData.building_id, units])

  const fetchBuildings = async () => {
    const { data } = await supabase.from('buildings').select('*').order('name')
    if (data) setBuildings(data)
  }

  const fetchUnits = async () => {
    const { data } = await supabase.from('units').select('*').order('unit_number')
    if (data) setUnits(data)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Calculate lease end date
      const moveInDate = new Date(formData.move_in_date)
      const leaseEndDate = addMonths(moveInDate, parseInt(formData.lease_duration))
      
      // Calculate rent anniversary (first of next month after lease end)
      const rentAnniversary = startOfMonth(addMonths(leaseEndDate, 1))

      const tenantData = {
        unit_id: parseInt(formData.unit_id),
        primary_tenant_name: formData.primary_name,
        primary_tenant_email: formData.primary_email || null,
        primary_tenant_phone: formData.primary_phone || null,
        secondary_tenant_name: showSecondary ? formData.secondary_name || null : null,
        secondary_tenant_email: showSecondary ? formData.secondary_email || null : null,
        secondary_tenant_phone: showSecondary ? formData.secondary_phone || null : null,
        move_in_date: formData.move_in_date,
        lease_end_date: format(leaseEndDate, 'yyyy-MM-dd'),
        current_rent: parseFloat(formData.monthly_rent),
        original_rent: parseFloat(formData.monthly_rent),
        security_deposit: parseFloat(formData.security_deposit),
        rent_anniversary_date: format(rentAnniversary, 'yyyy-MM-dd'),
        has_pet: formData.has_pet,
        has_parking: formData.has_parking,
        notes: formData.notes || null,
        prorated_first_month: showProrate && formData.prorated_amount ? parseFloat(formData.prorated_amount) : null,
        status: 'active'
      }

      const { error } = await supabase.from('tenants').insert([tenantData])

      if (error) throw error

      onClose()
    } catch (error) {
      console.error('Error adding tenant:', error)
      alert('Error adding tenant. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const calculateLeaseEnd = () => {
    if (formData.move_in_date && formData.lease_duration) {
      const moveIn = new Date(formData.move_in_date)
      const leaseEnd = addMonths(moveIn, parseInt(formData.lease_duration))
      return format(leaseEnd, 'MMM d, yyyy')
    }
    return ''
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
      <div style={{ background: 'white', borderRadius: '12px', width: '100%', maxWidth: '800px', maxHeight: '90vh', overflow: 'auto' }}>
        
        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg, #534AB7 0%, #7F77DD 100%)', padding: '2rem', color: 'white', borderRadius: '12px 12px 0 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
            <div>
              <h2 style={{ fontSize: '24px', fontWeight: '500', margin: 0, color: 'white' }}>New move-in</h2>
              <p style={{ fontSize: '14px', margin: '8px 0 0 0', opacity: 0.9 }}>Complete all fields to record a new tenant lease</p>
            </div>
            <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '28px', cursor: 'pointer', padding: 0, width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>
              ×
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '2rem' }}>
          
          {/* Unit Details */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '500', margin: '0 0 16px 0', paddingBottom: '8px', borderBottom: '0.5px solid #e2e8f0' }}>Unit details</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>
                  Building <span style={{ color: '#A32D2D' }}>*</span>
                </label>
                <select 
                  required
                  value={formData.building_id}
                  onChange={(e) => setFormData({...formData, building_id: e.target.value, unit_id: ''})}
                  style={{ width: '100%' }}
                >
                  <option value="">Select building</option>
                  {buildings.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>
                  Unit number <span style={{ color: '#A32D2D' }}>*</span>
                </label>
                <select 
                  required
                  value={formData.unit_id}
                  onChange={(e) => setFormData({...formData, unit_id: e.target.value})}
                  style={{ width: '100%' }}
                  disabled={!formData.building_id}
                >
                  <option value="">Select unit</option>
                  {availableUnits.map(u => <option key={u.id} value={u.id}>{u.unit_number}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Primary Tenant */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '500', margin: '0 0 16px 0', paddingBottom: '8px', borderBottom: '0.5px solid #e2e8f0' }}>Primary tenant</h3>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>
                Full name <span style={{ color: '#A32D2D' }}>*</span>
              </label>
              <input 
                type="text" 
                required
                placeholder="Last, First"
                value={formData.primary_name}
                onChange={(e) => setFormData({...formData, primary_name: e.target.value})}
                style={{ width: '100%' }}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>
                  Email <span style={{ color: '#A32D2D' }}>*</span>
                </label>
                <input 
                  type="email" 
                  required
                  placeholder="tenant@email.com"
                  value={formData.primary_email}
                  onChange={(e) => setFormData({...formData, primary_email: e.target.value})}
                  style={{ width: '100%' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>
                  Phone <span style={{ color: '#A32D2D' }}>*</span>
                </label>
                <input 
                  type="tel" 
                  required
                  placeholder="(555) 555-5555"
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
              <h3 style={{ fontSize: '15px', fontWeight: '500', margin: 0 }}>Secondary tenant (optional)</h3>
              <button 
                type="button"
                onClick={() => setShowSecondary(!showSecondary)}
                style={{ padding: '6px 12px', fontSize: '12px', background: 'transparent', border: '0.5px solid #e2e8f0', borderRadius: '6px' }}
              >
                {showSecondary ? '− Remove' : '+ Add secondary tenant'}
              </button>
            </div>
            {showSecondary && (
              <>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>Full name</label>
                  <input 
                    type="text" 
                    placeholder="Last, First"
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
                      placeholder="tenant@email.com"
                      value={formData.secondary_email}
                      onChange={(e) => setFormData({...formData, secondary_email: e.target.value})}
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>Phone</label>
                    <input 
                      type="tel" 
                      placeholder="(555) 555-5555"
                      value={formData.secondary_phone}
                      onChange={(e) => setFormData({...formData, secondary_phone: e.target.value})}
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Lease Terms */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '500', margin: '0 0 16px 0', paddingBottom: '8px', borderBottom: '0.5px solid #e2e8f0' }}>Lease terms</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>
                  Move-in date <span style={{ color: '#A32D2D' }}>*</span>
                </label>
                <input 
                  type="date" 
                  required
                  value={formData.move_in_date}
                  onChange={(e) => setFormData({...formData, move_in_date: e.target.value})}
                  style={{ width: '100%' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>
                  Lease duration <span style={{ color: '#A32D2D' }}>*</span>
                </label>
                <select 
                  required
                  value={formData.lease_duration}
                  onChange={(e) => setFormData({...formData, lease_duration: e.target.value})}
                  style={{ width: '100%' }}
                >
                  <option value="6">6 months</option>
                  <option value="12">12 months</option>
                  <option value="18">18 months</option>
                  <option value="24">24 months</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>
                  Monthly rent <span style={{ color: '#A32D2D' }}>*</span>
                </label>
                <input 
                  type="number" 
                  required
                  step="0.01"
                  placeholder="0.00"
                  value={formData.monthly_rent}
                  onChange={(e) => setFormData({...formData, monthly_rent: e.target.value})}
                  style={{ width: '100%' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>
                  Security deposit <span style={{ color: '#A32D2D' }}>*</span>
                </label>
                <input 
                  type="number" 
                  required
                  step="0.01"
                  placeholder="0.00"
                  value={formData.security_deposit}
                  onChange={(e) => setFormData({...formData, security_deposit: e.target.value})}
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            {/* Prorated Rent */}
            <div style={{ background: '#f7fafc', borderRadius: '8px', padding: '1rem', marginBottom: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', marginBottom: showProrate ? '12px' : 0 }}>
                <input 
                  type="checkbox" 
                  checked={showProrate}
                  onChange={(e) => setShowProrate(e.target.checked)}
                  style={{ width: '18px', height: '18px' }}
                />
                <span style={{ fontSize: '13px', fontWeight: '500' }}>Prorate first month rent (partial month)</span>
              </label>
              {showProrate && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', marginBottom: '6px', color: '#718096' }}>Days in first month</label>
                    <input 
                      type="number" 
                      placeholder="e.g., 17"
                      min="1"
                      max="31"
                      value={formData.prorated_days}
                      onChange={(e) => setFormData({...formData, prorated_days: e.target.value})}
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', marginBottom: '6px', color: '#718096' }}>Prorated amount</label>
                    <input 
                      type="number" 
                      placeholder="0.00"
                      step="0.01"
                      value={formData.prorated_amount}
                      onChange={(e) => setFormData({...formData, prorated_amount: e.target.value})}
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>
              )}
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

          {/* Summary */}
          {formData.move_in_date && formData.lease_duration && (
            <div style={{ background: '#EEEDFE', borderRadius: '8px', padding: '1.25rem', marginBottom: '2rem' }}>
              <h4 style={{ fontSize: '14px', fontWeight: '500', margin: '0 0 16px 0', color: '#534AB7' }}>Lease summary</h4>
              <div style={{ display: 'grid', gap: '12px', fontSize: '14px' }}>
                {formData.monthly_rent && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#718096' }}>Monthly rent:</span>
                    <span style={{ fontWeight: '500' }}>${parseFloat(formData.monthly_rent).toLocaleString()}</span>
                  </div>
                )}
                {formData.security_deposit && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#718096' }}>Security deposit:</span>
                    <span style={{ fontWeight: '500' }}>${parseFloat(formData.security_deposit).toLocaleString()}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#718096' }}>Lease term:</span>
                  <span style={{ fontWeight: '500' }}>{formData.lease_duration} months</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '12px', borderTop: '0.5px solid #AFA9EC' }}>
                  <span style={{ color: '#718096' }}>Lease ends:</span>
                  <span style={{ fontWeight: '500' }}>{calculateLeaseEnd()}</span>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: '12px', paddingTop: '1.5rem', borderTop: '0.5px solid #e2e8f0' }}>
            <button 
              type="submit" 
              disabled={loading}
              style={{ flex: 1, padding: '14px', background: '#534AB7', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '500', fontSize: '14px', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}
            >
              {loading ? 'Saving...' : 'Save move-in'}
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
