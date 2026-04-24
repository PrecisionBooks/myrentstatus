'use client'

import { useState, useEffect } from 'react'
import styles from './MoveOutForm.module.css'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'

type Building = { id: number; name: string }
type Tenant = {
  id: number
  unit_id: number
  primary_tenant_name: string
  primary_tenant_email: string | null
  current_rent: number
  security_deposit: number
  move_in_date: string
  lease_end_date: string
  unit_number: string
  building_name: string
}

type Props = {
  onClose: () => void
  userEmail: string
}

export default function MoveOutForm({ onClose, userEmail }: Props) {
  const [buildings, setBuildings] = useState<Building[]>([])
  const [allTenants, setAllTenants] = useState<Tenant[]>([])
  const [filteredTenants, setFilteredTenants] = useState<Tenant[]>([])
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null)
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    building_id: '',
    tenant_id: '',
    move_out_date: '',
    deposit_refund_amount: '',
    notes: ''
  })

  useEffect(() => {
    fetchBuildings()
    fetchTenants()
  }, [])

  useEffect(() => {
    if (formData.building_id) {
      const filtered = allTenants.filter(t => 
        t.building_name === buildings.find(b => b.id === parseInt(formData.building_id))?.name
      )
      setFilteredTenants(filtered.sort((a, b) => a.unit_number.localeCompare(b.unit_number)))
    } else {
      setFilteredTenants([])
    }
  }, [formData.building_id, allTenants, buildings])

  useEffect(() => {
    if (formData.tenant_id) {
      const tenant = allTenants.find(t => t.id === parseInt(formData.tenant_id))
      setSelectedTenant(tenant || null)
      if (tenant) {
        setFormData(prev => ({ ...prev, deposit_refund_amount: tenant.security_deposit.toString() }))
      }
    } else {
      setSelectedTenant(null)
    }
  }, [formData.tenant_id, allTenants])

  const fetchBuildings = async () => {
    const { data } = await supabase.from('buildings').select('*').order('name')
    if (data) setBuildings(data)
  }

  const fetchTenants = async () => {
    const { data } = await supabase
      .from('tenants')
      .select(`
        *,
        units!inner (
          unit_number,
          buildings!inner (
            name
          )
        )
      `)
      .eq('status', 'active')

    if (data) {
      const formatted = data.map((t: any) => ({
        id: t.id,
        unit_id: t.unit_id,
        primary_tenant_name: t.primary_tenant_name,
        primary_tenant_email: t.primary_tenant_email,
        current_rent: t.current_rent,
        security_deposit: t.security_deposit,
        move_in_date: t.move_in_date,
        lease_end_date: t.lease_end_date,
        unit_number: t.units.unit_number,
        building_name: t.units.buildings.name
      }))
      setAllTenants(formatted)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Create move-out record
      const { error: moveOutError } = await supabase.from('move_outs').insert([{
        tenant_id: parseInt(formData.tenant_id),
        move_out_date: formData.move_out_date,
        deposit_refund_amount: parseFloat(formData.deposit_refund_amount),
        notes: formData.notes || null
      }])

      if (moveOutError) throw moveOutError

      // Update tenant status to moved_out
      const { error: updateError } = await supabase
        .from('tenants')
        .update({ status: 'moved_out', updated_at: new Date().toISOString() })
        .eq('id', parseInt(formData.tenant_id))

      if (updateError) throw updateError

      onClose()
    } catch (error) {
      console.error('Error processing move-out:', error)
      alert('Error processing move-out. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        
        {/* Header */}
        <div>
          <div className={styles.headerContent}>
            <div>
              <h2>Record move-out</h2>
              <p>Document tenant departure and process security deposit</p>
            </div>
            <button onClick={onClose} className={styles.closeButton}>
              ×
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className={styles.body}>
          
          {/* Select Tenant */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Select tenant</h3>
            
            <div className={styles.inputGroup}>
              <label>
                Building <span>*</span>
              </label>
              <select 
                required
                value={formData.building_id}
                onChange={(e) => setFormData({...formData, building_id: e.target.value, tenant_id: ''})}
               
              >
                <option value="">Select building first</option>
                {buildings.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>

            <div className={styles.inputGroup}>
              <label>
                Tenant <span>*</span>
              </label>
              <select 
                required
                value={formData.tenant_id}
                onChange={(e) => setFormData({...formData, tenant_id: e.target.value})}
               
                disabled={!formData.building_id}
              >
                <option value="">Select tenant...</option>
                {filteredTenants.map(t => (
                  <option key={t.id} value={t.id}>
                    Unit {t.unit_number} - {t.primary_tenant_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Tenant Info Card */}
            {selectedTenant && (
              <div>
                <div>
                  <div>
                    {selectedTenant.primary_tenant_name.split(', ').reverse().map(n => n[0]).join('')}
                  </div>
                  <div>
                    <p>{selectedTenant.primary_tenant_name}</p>
                    <p>
                      {selectedTenant.building_name}, Unit {selectedTenant.unit_number}
                    </p>
                  </div>
                </div>
                
                <div>
                  <div>
                    <p>Monthly rent</p>
                    <p>${selectedTenant.current_rent.toLocaleString()}</p>
                  </div>
                  <div>
                    <p>Security deposit on file</p>
                    <p>${selectedTenant.security_deposit.toLocaleString()}</p>
                  </div>
                  <div>
                    <p>Move-in date</p>
                    <p>{format(new Date(selectedTenant.move_in_date), 'MMMM d, yyyy')}</p>
                  </div>
                  <div>
                    <p>Lease end</p>
                    <p>{format(new Date(selectedTenant.lease_end_date), 'MMMM d, yyyy')}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Move-Out Details */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Move-out details</h3>
            <div>
              <label>
                Move-out date <span>*</span>
              </label>
              <input 
                type="date" 
                required
                value={formData.move_out_date}
                onChange={(e) => setFormData({...formData, move_out_date: e.target.value})}
               
              />
            </div>
          </div>

          {/* Security Deposit Refund */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Security deposit refund</h3>
            
            {selectedTenant && (
              <div>
                <div className={styles.inputGroup}>
                  <p>Original deposit on file</p>
                  <p>${selectedTenant.security_deposit.toLocaleString()}</p>
                </div>
                
                <div>
                  <label>
                    Amount to refund <span>*</span>
                  </label>
                  <input 
                    type="number" 
                    required
                    step="0.01"
                    placeholder="0.00"
                    value={formData.deposit_refund_amount}
                    onChange={(e) => setFormData({...formData, deposit_refund_amount: e.target.value})}
                   
                  />
                  <p>
                    Enter the full amount or reduced amount after deductions
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Notes</h3>
            <div>
              <textarea 
                placeholder="Unit condition, keys returned, deductions, or any other relevant information..."
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
               
              />
            </div>
          </div>

          {/* Summary */}
          {selectedTenant && formData.move_out_date && formData.deposit_refund_amount && (
            <div>
              <h4>Move-out summary</h4>
              <div>
                <div>
                  <span>Tenant:</span>
                  <span>{selectedTenant.primary_tenant_name}</span>
                </div>
                <div>
                  <span>Unit:</span>
                  <span>{selectedTenant.building_name}, Unit {selectedTenant.unit_number}</span>
                </div>
                <div>
                  <span>Move-out date:</span>
                  <span>{format(new Date(formData.move_out_date), 'MMMM d, yyyy')}</span>
                </div>
                <div>
                  <span>Deposit refund:</span>
                  <span>
                    ${parseFloat(formData.deposit_refund_amount).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className={styles.actions}>
            <button 
              type="submit" 
              disabled={loading}
              className={styles.saveButton} disabled={loading}
            >
              {loading ? 'Processing...' : 'Record move-out'}
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
