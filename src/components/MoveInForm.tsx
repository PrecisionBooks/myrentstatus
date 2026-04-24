'use client'

import { useState, useEffect } from 'react'
import styles from './MoveInForm.module.css'
import { supabase } from '@/lib/supabase'
import { format, addMonths, startOfMonth } from 'date-fns'

type Building = { id: number; name: string }
type Unit = { id: number; unit_number: string; building_id: number }

type Props = {
  onClose: () => void
  userEmail: string
}

export default function MoveInForm({ onClose, userEmail }: Props) {
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
    <div className={styles.overlay}>
      <div className={styles.modal}>
        
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <div>
              <h2>New move-in</h2>
              <p>Complete all fields to record a new tenant lease</p>
            </div>
            <button onClick={onClose} className={styles.closeButton}>
              ×
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className={styles.body}>
          
          {/* Unit Details */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Unit details</h3>
            <div className={styles.row}>
              <div>
                <label>
                  Building <span>*</span>
                </label>
                <select 
                  required
                  value={formData.building_id}
                  onChange={(e) => setFormData({...formData, building_id: e.target.value, unit_id: ''})}
                 
                >
                  <option value="">Select building</option>
                  {buildings.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div>
                <label>
                  Unit number <span>*</span>
                </label>
                <select 
                  required
                  value={formData.unit_id}
                  onChange={(e) => setFormData({...formData, unit_id: e.target.value})}
                 
                  disabled={!formData.building_id}
                >
                  <option value="">Select unit</option>
                  {availableUnits.map(u => <option key={u.id} value={u.id}>{u.unit_number}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Primary Tenant */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Primary tenant</h3>
            <div className={styles.inputGroup}>
              <label>
                Full name <span>*</span>
              </label>
              <input 
                type="text" 
                required
                placeholder="Last, First"
                value={formData.primary_name}
                onChange={(e) => setFormData({...formData, primary_name: e.target.value})}
               
              />
            </div>
            <div className={styles.row}>
              <div>
                <label>
                  Email <span>*</span>
                </label>
                <input 
                  type="email" 
                  required
                  placeholder="tenant@email.com"
                  value={formData.primary_email}
                  onChange={(e) => setFormData({...formData, primary_email: e.target.value})}
                 
                />
              </div>
              <div>
                <label>
                  Phone <span>*</span>
                </label>
                <input 
                  type="tel" 
                  required
                  placeholder="(555) 555-5555"
                  value={formData.primary_phone}
                  onChange={(e) => setFormData({...formData, primary_phone: e.target.value})}
                 
                />
              </div>
            </div>
          </div>

          {/* Secondary Tenant */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h3>Secondary tenant (optional)</h3>
              <button 
                type="button"
                onClick={() => setShowSecondary(!showSecondary)}
                className={styles.addButton}
              >
                {showSecondary ? '− Remove' : '+ Add secondary tenant'}
              </button>
            </div>
            {showSecondary && (
              <>
                <div className={styles.inputGroup}>
                  <label>Full name</label>
                  <input 
                    type="text" 
                    placeholder="Last, First"
                    value={formData.secondary_name}
                    onChange={(e) => setFormData({...formData, secondary_name: e.target.value})}
                   
                  />
                </div>
                <div className={styles.row}>
                  <div>
                    <label>Email</label>
                    <input 
                      type="email" 
                      placeholder="tenant@email.com"
                      value={formData.secondary_email}
                      onChange={(e) => setFormData({...formData, secondary_email: e.target.value})}
                     
                    />
                  </div>
                  <div>
                    <label>Phone</label>
                    <input 
                      type="tel" 
                      placeholder="(555) 555-5555"
                      value={formData.secondary_phone}
                      onChange={(e) => setFormData({...formData, secondary_phone: e.target.value})}
                     
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Lease Terms */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Lease terms</h3>
            <div className={styles.row}>
              <div>
                <label>
                  Move-in date <span>*</span>
                </label>
                <input 
                  type="date" 
                  required
                  value={formData.move_in_date}
                  onChange={(e) => setFormData({...formData, move_in_date: e.target.value})}
                 
                />
              </div>
              <div>
                <label>
                  Lease duration <span>*</span>
                </label>
                <select 
                  required
                  value={formData.lease_duration}
                  onChange={(e) => setFormData({...formData, lease_duration: e.target.value})}
                 
                >
                  <option value="6">6 months</option>
                  <option value="12">12 months</option>
                  <option value="18">18 months</option>
                  <option value="24">24 months</option>
                </select>
              </div>
            </div>

            <div className={styles.row}>
              <div>
                <label>
                  Monthly rent <span>*</span>
                </label>
                <input 
                  type="number" 
                  required
                  step="0.01"
                  placeholder="0.00"
                  value={formData.monthly_rent}
                  onChange={(e) => setFormData({...formData, monthly_rent: e.target.value})}
                 
                />
              </div>
              <div>
                <label>
                  Security deposit <span>*</span>
                </label>
                <input 
                  type="number" 
                  required
                  step="0.01"
                  placeholder="0.00"
                  value={formData.security_deposit}
                  onChange={(e) => setFormData({...formData, security_deposit: e.target.value})}
                 
                />
              </div>
            </div>

            {/* Prorated Rent */}
            <div>
              <label>
                <input 
                  type="checkbox" 
                  checked={showProrate}
                  onChange={(e) => setShowProrate(e.target.checked)}
                 
                />
                <span>Prorate first month rent (partial month)</span>
              </label>
              {showProrate && (
                <div>
                  <div>
                    <label>Days in first month</label>
                    <input 
                      type="number" 
                      placeholder="e.g., 17"
                      min="1"
                      max="31"
                      value={formData.prorated_days}
                      onChange={(e) => setFormData({...formData, prorated_days: e.target.value})}
                     
                    />
                  </div>
                  <div>
                    <label>Prorated amount</label>
                    <input 
                      type="number" 
                      placeholder="0.00"
                      step="0.01"
                      value={formData.prorated_amount}
                      onChange={(e) => setFormData({...formData, prorated_amount: e.target.value})}
                     
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Additional Information */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Additional information</h3>
            <div className={styles.row}>
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

          {/* Summary */}
          {formData.move_in_date && formData.lease_duration && (
            <div>
              <h4>Lease summary</h4>
              <div>
                {formData.monthly_rent && (
                  <div>
                    <span>Monthly rent:</span>
                    <span>${parseFloat(formData.monthly_rent).toLocaleString()}</span>
                  </div>
                )}
                {formData.security_deposit && (
                  <div>
                    <span>Security deposit:</span>
                    <span>${parseFloat(formData.security_deposit).toLocaleString()}</span>
                  </div>
                )}
                <div>
                  <span>Lease term:</span>
                  <span>{formData.lease_duration} months</span>
                </div>
                <div>
                  <span>Lease ends:</span>
                  <span>{calculateLeaseEnd()}</span>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div>
            <button 
              type="submit" 
              disabled={loading}
             className={styles.saveButton} disabled={loading}
            >
              {loading ? 'Saving...' : 'Save move-in'}
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
