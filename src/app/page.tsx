'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import TenantTable from '@/components/TenantTable'
import MoveInForm from '@/components/MoveInForm'
import MoveOutForm from '@/components/MoveOutForm'
import EditTenantForm from '@/components/EditTenantForm'

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [activeModal, setActiveModal] = useState<'move-in' | 'move-out' | 'edit' | null>(null)
  const [selectedTenantId, setSelectedTenantId] = useState<number | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  // Check if already authenticated in session
  useEffect(() => {
    const isAuth = sessionStorage.getItem('tenant_manager_auth')
    if (isAuth === 'true') {
      setIsAuthenticated(true)
    }
  }, [])

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    const correctPassword = process.env.NEXT_PUBLIC_APP_PASSWORD || 'admin123'
    
    if (password === correctPassword) {
      setIsAuthenticated(true)
      sessionStorage.setItem('tenant_manager_auth', 'true')
      setError('')
    } else {
      setError('Incorrect password')
    }
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    sessionStorage.removeItem('tenant_manager_auth')
    setPassword('')
  }

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1)
  }

  const handleCloseModal = () => {
    setActiveModal(null)
    setSelectedTenantId(null)
    handleRefresh()
  }

  const handleEditTenant = (tenantId: number) => {
    setSelectedTenantId(tenantId)
    setActiveModal('edit')
  }

  if (!isAuthenticated) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div style={{
          background: 'white',
          padding: '2.5rem',
          borderRadius: '12px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
          width: '100%',
          maxWidth: '400px'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h1 style={{ fontSize: '28px', fontWeight: '600', marginBottom: '0.5rem', color: '#1a202c' }}>
              Tenant Manager
            </h1>
            <p style={{ color: '#718096', fontSize: '14px' }}>Enter password to continue</p>
          </div>

          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px', color: '#4a5568' }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                style={{ width: '100%' }}
                autoFocus
              />
            </div>

            {error && (
              <div style={{ 
                padding: '10px 12px', 
                background: '#fed7d7', 
                color: '#742a2a', 
                borderRadius: '6px', 
                fontSize: '13px',
                marginBottom: '1rem'
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              style={{
                width: '100%',
                padding: '12px',
                background: '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Login
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', padding: '20px', background: '#f5f7fa' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <TenantTable 
          key={refreshKey}
          onMoveIn={() => setActiveModal('move-in')}
          onMoveOut={() => setActiveModal('move-out')}
          onEditTenant={handleEditTenant}
          onLogout={handleLogout}
        />
      </div>

      {activeModal === 'move-in' && (
        <MoveInForm onClose={handleCloseModal} />
      )}

      {activeModal === 'move-out' && (
        <MoveOutForm onClose={handleCloseModal} />
      )}

      {activeModal === 'edit' && selectedTenantId && (
        <EditTenantForm tenantId={selectedTenantId} onClose={handleCloseModal} />
      )}
    </div>
  )
}
