'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'

type Tenant = {
  id: number
  unit_id: number
  primary_tenant_name: string
  primary_tenant_email: string | null
  current_rent: number
  security_deposit: number
  move_in_date: string
  lease_end_date: string
  rent_anniversary_date: string
  building_name: string
  unit_number: string
}

type Props = {
  onMoveIn: () => void
  onMoveOut: () => void
  onEditTenant: (tenantId: number) => void
  onLogout: () => void
}

export default function TenantTable({ onMoveIn, onMoveOut, onEditTenant, onLogout }: Props) {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [filteredTenants, setFilteredTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [buildingFilter, setBuildingFilter] = useState('')
  const [monthFilter, setMonthFilter] = useState('')
  const [rentRangeFilter, setRentRangeFilter] = useState('')
  const [sortBy, setSortBy] = useState('')

  // Stats
  const [stats, setStats] = useState({
    occupied: 0,
    vacant: 0,
    totalRent: 0,
    totalDeposits: 0
  })

  useEffect(() => {
    fetchTenants()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [tenants, searchTerm, buildingFilter, monthFilter, rentRangeFilter, sortBy])

  const fetchTenants = async () => {
    try {
      const { data, error } = await supabase
        .from('tenants')
        .select(`
          *,
          units!inner (
            id,
            unit_number,
            buildings!inner (
              name
            )
          )
        `)
        .eq('status', 'active')

      if (error) throw error

      const formattedTenants = (data || []).map((tenant: any) => ({
        id: tenant.id,
        unit_id: tenant.unit_id,
        primary_tenant_name: tenant.primary_tenant_name,
        primary_tenant_email: tenant.primary_tenant_email,
        current_rent: tenant.current_rent,
        security_deposit: tenant.security_deposit,
        move_in_date: tenant.move_in_date,
        lease_end_date: tenant.lease_end_date,
        rent_anniversary_date: tenant.rent_anniversary_date,
        building_name: tenant.units.buildings.name,
        unit_number: tenant.units.unit_number
      }))

      setTenants(formattedTenants)
      calculateStats(formattedTenants)
    } catch (error) {
      console.error('Error fetching tenants:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (tenantList: Tenant[]) => {
    const occupied = tenantList.length
    const totalRent = tenantList.reduce((sum, t) => sum + t.current_rent, 0)
    const totalDeposits = tenantList.reduce((sum, t) => sum + t.security_deposit, 0)
    
    setStats({
      occupied,
      vacant: 63 - occupied,
      totalRent,
      totalDeposits
    })
  }

  const applyFilters = () => {
    let filtered = [...tenants]

    // Search
    if (searchTerm) {
      filtered = filtered.filter(t => 
        t.primary_tenant_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.unit_number.includes(searchTerm) ||
        t.building_name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Building filter
    if (buildingFilter) {
      filtered = filtered.filter(t => t.building_name === buildingFilter)
    }

    // Month filter
    if (monthFilter) {
      filtered = filtered.filter(t => {
        const moveInMonth = new Date(t.move_in_date).getMonth() + 1
        return moveInMonth === parseInt(monthFilter)
      })
    }

    // Rent range filter
    if (rentRangeFilter) {
      const [min, max] = rentRangeFilter.split('-').map(Number)
      filtered = filtered.filter(t => t.current_rent >= min && t.current_rent <= max)
    }

    // Sort
    if (sortBy) {
      filtered.sort((a, b) => {
        switch(sortBy) {
          case 'rent-asc': return a.current_rent - b.current_rent
          case 'rent-desc': return b.current_rent - a.current_rent
          case 'deposit-asc': return a.security_deposit - b.security_deposit
          case 'deposit-desc': return b.security_deposit - a.security_deposit
          case 'movein-asc': return new Date(a.move_in_date).getTime() - new Date(b.move_in_date).getTime()
          case 'movein-desc': return new Date(b.move_in_date).getTime() - new Date(a.move_in_date).getTime()
          default: return 0
        }
      })
    }

    setFilteredTenants(filtered)
  }

  const clearFilters = () => {
    setSearchTerm('')
    setBuildingFilter('')
    setMonthFilter('')
    setRentRangeFilter('')
    setSortBy('')
  }

  const exportCSV = () => {
    const headers = ['Tenant Name', 'Building', 'Unit', 'Monthly Rent', 'Security Deposit', 'Move-in Date', 'Lease End', 'Email']
    const rows = filteredTenants.map(t => [
      t.primary_tenant_name,
      t.building_name,
      t.unit_number,
      `$${t.current_rent.toFixed(2)}`,
      `$${t.security_deposit.toFixed(2)}`,
      format(new Date(t.move_in_date), 'MM/dd/yyyy'),
      format(new Date(t.lease_end_date), 'MM/dd/yyyy'),
      t.primary_tenant_email || ''
    ])

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `tenant_list_${format(new Date(), 'yyyy-MM-dd')}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  const getAnniversaryStatus = (date: string) => {
    const today = new Date()
    const anniversary = new Date(date)
    const diffMonths = (anniversary.getFullYear() - today.getFullYear()) * 12 + (anniversary.getMonth() - today.getMonth())
    
    if (diffMonths < 0) return { label: 'Due now', color: '#FCEBEB', textColor: '#A32D2D' }
    if (diffMonths <= 1) return { label: format(anniversary, 'MMM yyyy'), color: '#FAEEDA', textColor: '#854F0B' }
    return { label: format(anniversary, 'MMM yyyy'), color: '#EAF3DE', textColor: '#3B6D11' }
  }

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '3rem' }}>Loading...</div>
  }

  return (
    <>
      <div style={{ background: 'white', borderRadius: '12px', marginBottom: '24px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <div style={{ background: 'linear-gradient(135deg, #534AB7 0%, #7F77DD 100%)', padding: '2rem', color: 'white' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ fontSize: '28px', fontWeight: '500', marginBottom: '8px', color: 'white' }}>Tenant Management</h1>
              <p style={{ fontSize: '14px', margin: 0, opacity: 0.9 }}>7 buildings · 63 units · {stats.occupied} active leases</p>
            </div>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button onClick={onMoveIn} style={{ padding: '12px 20px', background: 'white', color: '#534AB7', border: 'none', borderRadius: '8px', fontWeight: '500', fontSize: '14px' }}>
                Move-in
              </button>
              <button onClick={onMoveOut} style={{ padding: '12px 20px', background: 'rgba(255,255,255,0.2)', color: 'white', border: '0.5px solid rgba(255,255,255,0.5)', borderRadius: '8px', fontWeight: '500', fontSize: '14px' }}>
                Move-out
              </button>
              <button onClick={exportCSV} style={{ padding: '12px 20px', background: 'rgba(255,255,255,0.2)', color: 'white', border: '0.5px solid rgba(255,255,255,0.5)', borderRadius: '8px', fontWeight: '500', fontSize: '14px' }}>
                Export list
              </button>
              <button onClick={onLogout} style={{ padding: '12px 20px', background: 'rgba(255,255,255,0.1)', color: 'white', border: '0.5px solid rgba(255,255,255,0.5)', borderRadius: '8px', fontWeight: '500', fontSize: '14px' }}>
                Logout
              </button>
            </div>
          </div>
        </div>

        <div style={{ padding: '2rem' }}>
          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '1.5rem' }}>
            <div style={{ background: '#f7fafc', borderRadius: '8px', padding: '1rem' }}>
              <p style={{ fontSize: '13px', color: '#718096', margin: '0 0 4px 0' }}>Occupied</p>
              <p style={{ fontSize: '24px', fontWeight: '500', margin: 0, color: '#1a202c' }}>{stats.occupied}</p>
            </div>
            <div style={{ background: '#f7fafc', borderRadius: '8px', padding: '1rem' }}>
              <p style={{ fontSize: '13px', color: '#718096', margin: '0 0 4px 0' }}>Vacant</p>
              <p style={{ fontSize: '24px', fontWeight: '500', margin: 0, color: '#1a202c' }}>{stats.vacant}</p>
            </div>
            <div style={{ background: '#f7fafc', borderRadius: '8px', padding: '1rem' }}>
              <p style={{ fontSize: '13px', color: '#718096', margin: '0 0 4px 0' }}>Projected monthly rental income</p>
              <p style={{ fontSize: '24px', fontWeight: '500', margin: 0, color: '#1a202c' }}>${stats.totalRent.toLocaleString()}</p>
            </div>
            <div style={{ background: '#f7fafc', borderRadius: '8px', padding: '1rem' }}>
              <p style={{ fontSize: '13px', color: '#718096', margin: '0 0 4px 0' }}>Deposits held</p>
              <p style={{ fontSize: '24px', fontWeight: '500', margin: 0, color: '#1a202c' }}>${stats.totalDeposits.toLocaleString()}</p>
            </div>
          </div>

          {/* Filters */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr repeat(5, 1fr)', gap: '12px', marginBottom: '1.5rem' }}>
            <input
              type="text"
              placeholder="Search by name, unit, or building..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '12px' }}
            />
            <select value={buildingFilter} onChange={(e) => setBuildingFilter(e.target.value)}>
              <option value="">All buildings</option>
              {[1,2,3,4,5,6,7].map(n => <option key={n} value={`Building ${n}`}>Building {n}</option>)}
            </select>
            <select value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)}>
              <option value="">All months</option>
              {['January','February','March','April','May','June','July','August','September','October','November','December'].map((m, i) => 
                <option key={i} value={String(i+1).padStart(2,'0')}>{m}</option>
              )}
            </select>
            <select value={rentRangeFilter} onChange={(e) => setRentRangeFilter(e.target.value)}>
              <option value="">All rent ranges</option>
              <option value="0-1500">Under $1,500</option>
              <option value="1500-1800">$1,500 - $1,800</option>
              <option value="1800-2000">$1,800 - $2,000</option>
              <option value="2000-10000">Over $2,000</option>
            </select>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="">Sort by...</option>
              <option value="rent-asc">Rent (low to high)</option>
              <option value="rent-desc">Rent (high to low)</option>
              <option value="deposit-asc">Deposit (low to high)</option>
              <option value="deposit-desc">Deposit (high to low)</option>
              <option value="movein-asc">Move-in (oldest)</option>
              <option value="movein-desc">Move-in (newest)</option>
            </select>
            <button onClick={clearFilters} style={{ padding: '10px 16px', fontSize: '13px', whiteSpace: 'nowrap' }}>
              Clear filters
            </button>
          </div>

          {/* Table */}
          <div style={{ border: '0.5px solid #e2e8f0', borderRadius: '8px', overflow: 'auto' }}>
            <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f7fafc', borderBottom: '0.5px solid #e2e8f0' }}>
                  <th style={{ textAlign: 'left', padding: '14px 16px', fontWeight: '500', color: '#718096' }}>Tenant</th>
                  <th style={{ textAlign: 'left', padding: '14px 16px', fontWeight: '500', color: '#718096' }}>Unit</th>
                  <th style={{ textAlign: 'left', padding: '14px 16px', fontWeight: '500', color: '#718096' }}>Rent</th>
                  <th style={{ textAlign: 'left', padding: '14px 16px', fontWeight: '500', color: '#718096' }}>Deposit</th>
                  <th style={{ textAlign: 'left', padding: '14px 16px', fontWeight: '500', color: '#718096' }}>Move-in</th>
                  <th style={{ textAlign: 'left', padding: '14px 16px', fontWeight: '500', color: '#718096' }}>Lease end</th>
                  <th style={{ textAlign: 'left', padding: '14px 16px', fontWeight: '500', color: '#718096' }}>Next increase</th>
                  <th style={{ textAlign: 'left', padding: '14px 16px', fontWeight: '500', color: '#718096' }}></th>
                </tr>
              </thead>
              <tbody>
                {filteredTenants.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: '#718096' }}>
                      No tenants found
                    </td>
                  </tr>
                ) : (
                  filteredTenants.map((tenant) => {
                    const initials = tenant.primary_tenant_name.split(', ').reverse().map(n => n[0]).join('')
                    const status = getAnniversaryStatus(tenant.rent_anniversary_date)
                    
                    return (
                      <tr key={tenant.id} style={{ borderBottom: '0.5px solid #e2e8f0' }}>
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#EEEDFE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '500', fontSize: '13px', color: '#534AB7' }}>
                              {initials}
                            </div>
                            <div>
                              <p style={{ fontWeight: '500', margin: 0 }}>{tenant.primary_tenant_name}</p>
                              <p style={{ fontSize: '12px', color: '#718096', margin: '2px 0 0 0' }}>{tenant.primary_tenant_email}</p>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '14px 16px' }}>{tenant.building_name}, #{tenant.unit_number}</td>
                        <td style={{ padding: '14px 16px', fontWeight: '500' }}>${tenant.current_rent.toLocaleString()}</td>
                        <td style={{ padding: '14px 16px' }}>${tenant.security_deposit.toLocaleString()}</td>
                        <td style={{ padding: '14px 16px', color: '#718096' }}>{format(new Date(tenant.move_in_date), 'MMM d, yyyy')}</td>
                        <td style={{ padding: '14px 16px', color: '#718096' }}>{format(new Date(tenant.lease_end_date), 'MMM d, yyyy')}</td>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{ padding: '4px 8px', background: status.color, color: status.textColor, fontSize: '11px', fontWeight: '500', borderRadius: '8px' }}>
                            {status.label}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <button onClick={() => onEditTenant(tenant.id)} style={{ padding: '6px 14px', fontSize: '12px', fontWeight: '500' }}>
                            Edit
                          </button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem' }}>
            <p style={{ fontSize: '13px', color: '#718096', margin: 0 }}>
              Showing {filteredTenants.length} of {tenants.length} tenants
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
