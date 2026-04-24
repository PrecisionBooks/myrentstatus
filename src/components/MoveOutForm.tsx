'use client'

import { useState, useEffect } from 'react'
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

export default function MoveOutForm({ onClose }: { onClose: () => void }) {
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
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
      <div style={{ background: 'white', borderRadius: '12px', width: '100%', maxWidth: '800px', maxHeight: '90vh', overflow: 'auto' }}>
        
        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg, #D85A30 0%, #F0997B 100%)', padding: '2rem', color: 'white', borderRadius: '12px 12px 0 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
            <div>
              <h2 style={{ fontSize: '24px', fontWeight: '500', margin: 0, color: 'white' }}>Record move-out</h2>
              <p style={{ fontSize: '14px', margin: '8px 0 0 0', opacity: 0.9 }}>Document tenant departure and process security deposit</p>
            </div>
            <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '28px', cursor: 'pointer', padding: 0, width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>
              ×
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '2rem' }}>
          
          {/* Select Tenant */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '500', margin: '0 0 16px 0', paddingBottom: '8px', borderBottom: '0.5px solid #e2e8f0' }}>Select tenant</h3>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>
                Building <span style={{ color: '#A32D2D' }}>*</span>
              </label>
              <select 
                required
                value={formData.building_id}
                onChange={(e) => setFormData({...formData, building_id: e.target.value, tenant_id: ''})}
                style={{ width: '100%' }}
              >
                <option value="">Select building first</option>
                {buildings.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>
                Tenant <span style={{ color: '#A32D2D' }}>*</span>
              </label>
              <select 
                required
                value={formData.tenant_id}
                onChange={(e) => setFormData({...formData, tenant_id: e.target.value})}
                style={{ width: '100%', padding: '12px' }}
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
              <div style={{ background: '#f7fafc', borderRadius: '8px', padding: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px', paddingBottom: '16px', borderBottom: '0.5px solid #e2e8f0' }}>
                  <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: '#FBEAF0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '500', fontSize: '16px', color: '#993556' }}>
                    {selectedTenant.primary_tenant_name.split(', ').reverse().map(n => n[0]).join('')}
                  </div>
                  <div>
                    <p style={{ fontWeight: '500', margin: 0, fontSize: '16px' }}>{selectedTenant.primary_tenant_name}</p>
                    <p style={{ fontSize: '13px', color: '#718096', margin: '4px 0 0 0' }}>
                      {selectedTenant.building_name}, Unit {selectedTenant.unit_number}
                    </p>
                  </div>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '14px' }}>
                  <div>
                    <p style={{ color: '#718096', margin: '0 0 6px 0', fontSize: '12px' }}>Monthly rent</p>
                    <p style={{ fontWeight: '500', fontSize: '18px', margin: 0 }}>${selectedTenant.current_rent.toLocaleString()}</p>
                  </div>
                  <div>
                    <p style={{ color: '#718096', margin: '0 0 6px 0', fontSize: '12px' }}>Security deposit on file</p>
                    <p style={{ fontWeight: '500', fontSize: '18px', margin: 0 }}>${selectedTenant.security_deposit.toLocaleString()}</p>
                  </div>
                  <div>
                    <p style={{ color: '#718096', margin: '0 0 6px 0', fontSize: '12px' }}>Move-in date</p>
                    <p style={{ fontSize: '14px', margin: 0 }}>{format(new Date(selectedTenant.move_in_date), 'MMMM d, yyyy')}</p>
                  </div>
                  <div>
                    <p style={{ color: '#718096', margin: '0 0 6px 0', fontSize: '12px' }}>Lease end</p>
                    <p style={{ fontSize: '14px', margin: 0 }}>{format(new Date(selectedTenant.lease_end_date), 'MMMM d, yyyy')}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Move-Out Details */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '500', margin: '0 0 16px 0', paddingBottom: '8px', borderBottom: '0.5px solid #e2e8f0' }}>Move-out details</h3>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>
                Move-out date <span style={{ color: '#A32D2D' }}>*</span>
              </label>
              <input 
                type="date" 
                required
                value={formData.move_out_date}
                onChange={(e) => setFormData({...formData, move_out_date: e.target.value})}
                style={{ width: '100%' }}
              />
            </div>
          </div>

          {/* Security Deposit Refund */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '500', margin: '0 0 16px 0', paddingBottom: '8px', borderBottom: '0.5px solid #e2e8f0' }}>Security deposit refund</h3>
            
            {selectedTenant && (
              <div style={{ background: '#f7fafc', borderRadius: '8px', padding: '1.25rem', marginBottom: '16px' }}>
                <div style={{ marginBottom: '16px' }}>
                  <p style={{ fontSize: '12px', color: '#718096', margin: '0 0 4px 0' }}>Original deposit on file</p>
                  <p style={{ fontSize: '24px', fontWeight: '500', margin: 0 }}>${selectedTenant.security_deposit.toLocaleString()}</p>
                </div>
                
                <div style={{ borderTop: '0.5px solid #e2e8f0', paddingTop: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>
                    Amount to refund <span style={{ color: '#A32D2D' }}>*</span>
                  </label>
                  <input 
                    type="number" 
                    required
                    step="0.01"
                    placeholder="0.00"
                    value={formData.deposit_refund_amount}
                    onChange={(e) => setFormData({...formData, deposit_refund_amount: e.target.value})}
                    style={{ width: '100%', fontSize: '16px', fontWeight: '500' }}
                  />
                  <p style={{ fontSize: '12px', color: '#718096', margin: '8px 0 0 0' }}>
                    Enter the full amount or reduced amount after deductions
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '500', margin: '0 0 16px 0', paddingBottom: '8px', borderBottom: '0.5px solid #e2e8f0' }}>Notes</h3>
            <div>
              <textarea 
                placeholder="Unit condition, keys returned, deductions, or any other relevant information..."
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                style={{ width: '100%', minHeight: '120px', resize: 'vertical' }}
              />
            </div>
          </div>

          {/* Summary */}
          {selectedTenant && formData.move_out_date && formData.deposit_refund_amount && (
            <div style={{ background: '#FAECE7', borderRadius: '8px', padding: '1.25rem', marginBottom: '2rem' }}>
              <h4 style={{ fontSize: '14px', fontWeight: '500', margin: '0 0 16px 0', color: '#993C1D' }}>Move-out summary</h4>
              <div style={{ display: 'grid', gap: '12px', fontSize: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#718096' }}>Tenant:</span>
                  <span style={{ fontWeight: '500' }}>{selectedTenant.primary_tenant_name}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#718096' }}>Unit:</span>
                  <span style={{ fontWeight: '500' }}>{selectedTenant.building_name}, Unit {selectedTenant.unit_number}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#718096' }}>Move-out date:</span>
                  <span style={{ fontWeight: '500' }}>{format(new Date(formData.move_out_date), 'MMMM d, yyyy')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '12px', borderTop: '0.5px solid #F0997B' }}>
                  <span style={{ color: '#718096' }}>Deposit refund:</span>
                  <span style={{ fontWeight: '500', fontSize: '16px', color: '#1D9E75' }}>
                    ${parseFloat(formData.deposit_refund_amount).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: '12px', paddingTop: '1.5rem', borderTop: '0.5px solid #e2e8f0' }}>
            <button 
              type="submit" 
              disabled={loading}
              style={{ flex: 1, padding: '14px', background: '#D85A30', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '500', fontSize: '14px', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}
            >
              {loading ? 'Processing...' : 'Record move-out'}
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
