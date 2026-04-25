'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'
import styles from './TenantTable.module.css'

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
  userEmail: string
  userRole: string
  onMoveIn: () => void
  onMoveOut: () => void
  onEditTenant: (tenantId: number) => void
  onLogout: () => void
}

export default function TenantTable({ userEmail, userRole, onMoveIn, onMoveOut, onEditTenant, onLogout }: Props) {
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
        switch (sortBy) {
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
    return <div className={styles.loading}>Loading...</div>
  }

  return (
    <>
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.headerTop}>
            <div className={styles.headerTitle}>
              <h1>Tenant Management</h1>
              <p>7 buildings · 63 units · {stats.occupied} active leases</p>
            </div>
            <div className={styles.headerButtons}>
              <button onClick={onMoveIn} className={`${styles.headerButton} ${styles.primary}`}>
                Move-in
              </button>
              <button onClick={onMoveOut} className={styles.headerButton}>
                Move-out
              </button>
              <button onClick={exportCSV} className={styles.headerButton}>
                Export list
              </button>
              <button onClick={onLogout} className={styles.headerButton}>
                Logout
              </button>
            </div>
          </div>
        </div>

        <div className={styles.stats}>
          {/* Stats */}
          <div className={styles.statCard}>
            <h3>Occupied</h3>
            <p>{stats.occupied}</p>
          </div>
          <div className={styles.statCard}>
            <h3>Vacant</h3>
            <p>{stats.vacant}</p>
          </div>
          <div className={styles.statCard}>
            <h3>Projected monthly rental income</h3>
            <p>${stats.totalRent.toLocaleString()}</p>
          </div>
          <div className={styles.statCard}>
            <h3>Deposits held</h3>
            <p>${stats.totalDeposits.toLocaleString()}</p>
          </div>
        </div>

        {/* Filters */}
        <div className={styles.filters}>
          <input
            type="text"
            placeholder="Search by name, unit, or building..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
          <select value={buildingFilter} onChange={(e) => setBuildingFilter(e.target.value)} className={styles.filterSelect}>
            <option value="">All buildings</option>
            {[1, 2, 3, 4, 5, 6, 7].map(n => <option key={n} value={`Building ${n}`}>Building {n}</option>)}
          </select>
          <select value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)} className={styles.filterSelect}>
            <option value="">All months</option>
            {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map((m, i) =>
              <option key={i} value={String(i + 1).padStart(2, '0')}>{m}</option>
            )}
          </select>
          <select value={rentRangeFilter} onChange={(e) => setRentRangeFilter(e.target.value)} className={styles.filterSelect}>
            <option value="">All rent ranges</option>
            <option value="0-1500">Under $1,500</option>
            <option value="1500-1800">$1,500 - $1,800</option>
            <option value="1800-2000">$1,800 - $2,000</option>
            <option value="2000-10000">Over $2,000</option>
          </select>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className={styles.filterSelect}>
            <option value="">Sort by...</option>
            <option value="rent-asc">Rent (low to high)</option>
            <option value="rent-desc">Rent (high to low)</option>
            <option value="deposit-asc">Deposit (low to high)</option>
            <option value="deposit-desc">Deposit (high to low)</option>
            <option value="movein-asc">Move-in (oldest)</option>
            <option value="movein-desc">Move-in (newest)</option>
          </select>
          <button onClick={clearFilters} className={styles.clearButton}>
            Clear filters
          </button>
        </div>

        {/* Table */}
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Tenant</th>
                <th>Unit</th>
                <th>Rent</th>
                <th>Deposit</th>
                <th>Move-in</th>
                <th>Lease end</th>
                <th>Next increase</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredTenants.length === 0 ? (
                <tr>
                  <td colSpan={8} className={styles.loading}>
                    No tenants found
                  </td>
                </tr>
              ) : (
                filteredTenants.map((tenant) => {
                  const initials = tenant.primary_tenant_name.split(', ').reverse().map(n => n[0]).join('')
                  const status = getAnniversaryStatus(tenant.rent_anniversary_date)

                  return (
                    <tr key={tenant.id}>
                      <td>
                        <div className={styles.tenantCell}>
                          <div className={styles.avatar} style={{ background: '#EEEDFE', color: '#534AB7' }}>
                            {initials}
                          </div>
                          <div className={styles.tenantInfo}>
                            <p className={styles.tenantName}>{tenant.primary_tenant_name}</p>
                            <p className={styles.tenantEmail}>{tenant.primary_tenant_email}</p>
                          </div>
                        </div>
                      </td>
                      <td>{tenant.building_name}, #{tenant.unit_number}</td>
                      <td style={{ fontWeight: '500' }}>${tenant.current_rent.toLocaleString()}</td>
                      <td>${tenant.security_deposit.toLocaleString()}</td>
                      <td style={{ color: '#718096' }}>{format(new Date(tenant.move_in_date), 'MMM d, yyyy')}</td>
                      <td style={{ color: '#718096' }}>{format(new Date(tenant.lease_end_date), 'MMM d, yyyy')}</td>
                      <td>
                        <span className={styles.badge} style={{ background: status.color, color: status.textColor }}>
                          {status.label}
                        </span>
                      </td>
                      <td>
                        <button onClick={() => onEditTenant(tenant.id)} className={styles.editButton}>
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

        <div className={styles.pagination}>
          <p className={styles.paginationInfo}>
            Showing {filteredTenants.length} of {tenants.length} tenants
          </p>
        </div>
      </div>
    </div >
    </>
  )
}
