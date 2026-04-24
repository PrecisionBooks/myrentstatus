'use client'

import { useState, useEffect } from 'react'
import styles from './EditTenantForm.module.css'
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

type Props = {
  tenantId: number
  onClose: () => void
  userRole: string
}

export default function EditTenantForm({ tenantId, onClose, userRole }: Props) {
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
      <div>
        <div>Loading...</div>
      </div>
    )
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        
        {/* Header */}
        <div>
          <div className={styles.headerContent}>
            <div>
              <h2>Edit tenant</h2>
              <p>
                {buildings.find(b => b.id === tenant.building_id)?.name}, Unit {tenant.unit_number}
              </p>
            </div>
            <button onClick={onClose} className={styles.closeButton}>
              ×
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className={styles.body}>
          
          {/* Unit Information */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Unit information</h3>
            <div className={styles.row}>
              <div>
                <label>Building</label>
                <select 
                  value={formData.building_id}
                  onChange={(e) => setFormData({...formData, building_id: e.target.value, unit_id: ''})}
                 
                >
                  {buildings.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div>
                <label>Unit number</label>
                <select 
                  value={formData.unit_id}
                  onChange={(e) => setFormData({...formData, unit_id: e.target.value})}
                 
                >
                  {availableUnits.map(u => <option key={u.id} value={u.id}>{u.unit_number}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Primary Tenant */}
          <div className={styles.section}>
            <div>
              <h3>Primary tenant</h3>
              {hasSecondary && (
                <button 
                  type="button"
                  onClick={switchTenants}
                 
                >
                  ↑↓ Switch with secondary
                </button>
              )}
            </div>
            <div className={styles.inputGroup}>
              <label>Full name</label>
              <input 
                type="text" 
                required
                value={formData.primary_name}
                onChange={(e) => setFormData({...formData, primary_name: e.target.value})}
               
              />
            </div>
            <div className={styles.row}>
              <div>
                <label>Email</label>
                <input 
                  type="email" 
                  value={formData.primary_email}
                  onChange={(e) => setFormData({...formData, primary_email: e.target.value})}
                 
                />
              </div>
              <div>
                <label>Phone</label>
                <input 
                  type="tel" 
                  value={formData.primary_phone}
                  onChange={(e) => setFormData({...formData, primary_phone: e.target.value})}
                 
                />
              </div>
            </div>
          </div>

          {/* Secondary Tenant */}
          <div className={styles.section}>
            <div>
              <h3>Secondary tenant</h3>
              {hasSecondary && (
                <button 
                  type="button"
                  onClick={removeSecondary}
                 
                >
                  − Remove
                </button>
              )}
            </div>
            
            {hasSecondary ? (
              <>
                <div className={styles.inputGroup}>
                  <label>Full name</label>
                  <input 
                    type="text" 
                    value={formData.secondary_name}
                    onChange={(e) => setFormData({...formData, secondary_name: e.target.value})}
                   
                  />
                </div>
                <div className={styles.row}>
                  <div>
                    <label>Email</label>
                    <input 
                      type="email" 
                      value={formData.secondary_email}
                      onChange={(e) => setFormData({...formData, secondary_email: e.target.value})}
                     
                    />
                  </div>
                  <div>
                    <label>Phone</label>
                    <input 
                      type="tel" 
                      value={formData.secondary_phone}
                      onChange={(e) => setFormData({...formData, secondary_phone: e.target.value})}
                     
                    />
                  </div>
                </div>
              </>
            ) : (
              <div>
                <p>No secondary tenant on this lease</p>
                <button 
                  type="button"
                  onClick={addSecondary}
                 
                >
                  + Add secondary tenant
                </button>
              </div>
            )}
          </div>

          {/* Rent Information */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Rent information</h3>
            
            {/* Current Rent Display */}
            <div>
              <div>
                <div>
                  <p>Current monthly rent</p>
                  <p>${tenant.current_rent.toLocaleString()}</p>
                </div>
                <div>
                  <p>Rent anniversary date</p>
                  <p>{format(new Date(tenant.rent_anniversary_date), 'MMM d, yyyy')}</p>
                  <p>Next date rent can be increased</p>
                </div>
              </div>
            </div>

            {/* Rent History */}
            <div>
              <div>
                <h4>Rent history</h4>
                <button 
                  type="button"
                  onClick={() => setShowAddIncrease(!showAddIncrease)}
                 
                >
                  + Add increase
                </button>
              </div>
              
              <div>
                {/* Current rent */}
                <div>
                  <div>
                    <span>${tenant.current_rent.toLocaleString()}/mo</span>
                    <span>Current</span>
                  </div>
                  <span>
                    {rentHistory.length > 0 
                      ? format(new Date(rentHistory[0].effective_date), 'MMM d, yyyy')
                      : format(new Date(tenant.move_in_date), 'MMM d, yyyy')}
                  </span>
                </div>
                
                {/* Previous increases */}
                {rentHistory.slice(1).map((increase) => (
                  <div key={increase.id}>
                    <div>
                      <span>${increase.new_rent.toLocaleString()}/mo</span>
                    </div>
                    <span>{format(new Date(increase.effective_date), 'MMM d, yyyy')}</span>
                  </div>
                ))}
                
                {/* Original rent */}
                <div>
                  <div>
                    <span>${tenant.original_rent.toLocaleString()}/mo</span>
                    <span>Original</span>
                  </div>
                  <span>{format(new Date(tenant.move_in_date), 'MMM d, yyyy')}</span>
                </div>
              </div>
            </div>

            {/* Add Rent Increase Form */}
            {showAddIncrease && (
              <div>
                <h4>Record rent increase</h4>
                
                <div>
                  <div>
                    <label>
                      New rent amount <span>*</span>
                    </label>
                    <input 
                      type="number" 
                      step="0.01"
                      placeholder="0.00"
                      value={increaseData.new_rent}
                      onChange={(e) => setIncreaseData({...increaseData, new_rent: e.target.value})}
                     
                    />
                  </div>
                  <div>
                    <label>
                      Effective date <span>*</span>
                    </label>
                    <input 
                      type="date" 
                      value={increaseData.effective_date}
                      onChange={(e) => {
                        setIncreaseData({...increaseData, effective_date: e.target.value})
                      }}
                      onBlur={autoFillAnniversary}
                     
                    />
                  </div>
                </div>
                
                <div className={styles.inputGroup}>
                  <label>
                    New rent anniversary date <span>*</span>
                  </label>
                  <input 
                    type="date" 
                    value={increaseData.new_anniversary_date}
                    onChange={(e) => setIncreaseData({...increaseData, new_anniversary_date: e.target.value})}
                   
                  />
                  <p>
                    Usually 12 months from effective date (first of month)
                  </p>
                </div>
                
                <div>
                  <button 
                    type="button"
                    onClick={handleAddRentIncrease}
                    disabled={!increaseData.new_rent || !increaseData.effective_date || !increaseData.new_anniversary_date}
                   
                  >
                    Save increase
                  </button>
                  <button 
                    type="button"
                    onClick={() => {
                      setShowAddIncrease(false)
                      setIncreaseData({ new_rent: '', effective_date: '', new_anniversary_date: '' })
                    }}
                   
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <div className={styles.row}>
              <div>
                <label>Security deposit</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={formData.security_deposit}
                  onChange={(e) => setFormData({...formData, security_deposit: e.target.value})}
                 
                />
              </div>
              <div>
                <label>Lease end date</label>
                <input 
                  type="date" 
                  value={formData.lease_end_date}
                  onChange={(e) => setFormData({...formData, lease_end_date: e.target.value})}
                 
                />
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Additional information</h3>
            <div>
              <label>
                <input 
                  type="checkbox" 
                  checked={formData.has_pet}
                  onChange={(e) => setFormData({...formData, has_pet: e.target.checked})}
                 
                />
                <span>Pet on premises</span>
              </label>
              <label>
                <input 
                  type="checkbox" 
                  checked={formData.has_parking}
                  onChange={(e) => setFormData({...formData, has_parking: e.target.checked})}
                 
                />
                <span>Parking space included</span>
              </label>
            </div>
            <div>
              <label>Notes</label>
              <textarea 
                placeholder="Any special terms, arrangements, or important details..."
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
               
              />
            </div>
          </div>

          {/* Actions */}
          <div className={styles.actions}>
            <button 
              type="submit" 
              disabled={saving}
             
            >
              {saving ? 'Saving...' : 'Save changes'}
            </button>
            <button 
              type="button"
              onClick={onClose}
              className={styles.cancelButton}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
