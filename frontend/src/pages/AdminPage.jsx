import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getUser, logout } from '../services/auth'
import AdminSidebar from '../components/admin/AdminSidebar'
import AdminDashboard from '../components/admin/AdminDashboard'
import AdminInventory from '../components/admin/AdminInventory'
import OfferManagement from '../components/admin/OfferManagement'
import AdminInvoices from '../components/admin/AdminInvoices'
import '../styles/AdminPage.css' // We can keep this for layout container styles if any

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const navigate = useNavigate()
  const user = getUser()

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/')
    }
  }, [user, navigate])

  function handleLogout() {
    logout() // Clear token
    window.location.href = '/'
  }

  return (
    <div className="admin-layout">
      <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleLogout} />

      <main className="admin-content">
        {activeTab === 'dashboard' && <AdminDashboard />}
        {activeTab === 'inventory' && <AdminInventory />}
        {activeTab === 'offers' && <OfferManagement />}
        {activeTab === 'sales' && <AdminInvoices />}
        {activeTab !== 'dashboard' && activeTab !== 'inventory' && activeTab !== 'offers' && activeTab !== 'sales' && (
          <div className="placeholder-page" style={{ padding: '40px', textAlign: 'center' }}>
            <h2>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h2>
            <p>This module is coming soon.</p>
          </div>
        )}
      </main>
    </div>
  )
}

