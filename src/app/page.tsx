'use client'

import { useState, useEffect } from 'react'
import { supabase, getCurrentUser, getUserProfile } from '@/lib/supabase'
import TenantTable from '@/components/TenantTable'
import MoveInForm from '@/components/MoveInForm'
import MoveOutForm from '@/components/MoveOutForm'
import EditTenantForm from '@/components/EditTenantForm'
import LoginScreen from '@/components/LoginScreen'

export default function Home() {
  const [user, setUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeModal, setActiveModal] = useState<'move-in' | 'move-out' | 'edit' | null>(null)
  const [selectedTenantId, setSelectedTenantId] = useState<number | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    checkUser()
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        loadUserProfile(session.user.email!)
      } else {
        setUser(null)
        setUserProfile(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function checkUser() {
    try {
      const currentUser = await getCurrentUser()
      if (currentUser) {
        setUser(currentUser)
        await loadUserProfile(currentUser.email!)
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  async function loadUserProfile(email: string) {
    try {
      const profile = await getUserProfile(email)
      setUserProfile(profile)
    } catch (error) {
      await supabase.auth.signOut()
      alert('Account not authorized. Contact administrator.')
    }
  }

  const handleCloseModal = () => {
    setActiveModal(null)
    setSelectedTenantId(null)
    setRefreshKey(prev => prev + 1)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  if (loading) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div>Loading...</div>
    </div>
  }

  if (!user || !userProfile) {
    return <LoginScreen onSuccess={checkUser} />
  }

  return (
    <div style={{ minHeight: '100vh', padding: '20px', background: '#f5f7fa' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <TenantTable 
          key={refreshKey}
          userEmail={user.email!}
          userRole={userProfile.role}
          onMoveIn={() => setActiveModal('move-in')}
          onMoveOut={() => setActiveModal('move-out')}
          onEditTenant={(id) => { setSelectedTenantId(id); setActiveModal('edit'); }}
          onLogout={handleLogout}
        />
      </div>

      {activeModal === 'move-in' && <MoveInForm onClose={handleCloseModal} userEmail={user.email!} />}
      {activeModal === 'move-out' && <MoveOutForm onClose={handleCloseModal} userEmail={user.email!} />}
      {activeModal === 'edit' && selectedTenantId && <EditTenantForm tenantId={selectedTenantId} onClose={handleCloseModal} userRole={userProfile.role} />}
    </div>
  )
}
