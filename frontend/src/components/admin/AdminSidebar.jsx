
import React from 'react'
import '../../styles/AdminSidebar.css'

export default function AdminSidebar({ activeTab, setActiveTab, onLogout }) {
    const menuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: '📊' },
        { id: 'inventory', label: 'Inventory', icon: '📦' },
        { id: 'offers', label: 'Offers', icon: '🏷️' },
        { id: 'sales', label: 'Sales & Invoices', icon: '🧾' },
        { id: 'customers', label: 'Customer CRM', icon: '👥' },
        { id: 'reports', label: 'Analytics', icon: '📈' },
        { id: 'settings', label: 'System Settings', icon: '⚙️' },
    ]

    return (
        <div className="admin-sidebar">
            <div className="sidebar-header">
                <div className="logo-icon">📱</div>
                <div className="logo-text">
                    <h3>Shree Mobiles</h3>
                    <span className="subtitle">COMMAND CENTER</span>
                </div>
            </div>

            <div className="sidebar-menu">
                <div className="menu-category">MAIN MENU</div>
                {menuItems.slice(0, 4).map(item => (
                    <button
                        key={item.id}
                        className={`menu-item ${activeTab === item.id ? 'active' : ''}`}
                        onClick={() => setActiveTab(item.id)}
                    >
                        <span className="icon">{item.icon}</span>
                        {item.label}
                    </button>
                ))}

                <div className="menu-category">REPORTING</div>
                {menuItems.slice(4, 5).map(item => (
                    <button
                        key={item.id}
                        className={`menu-item ${activeTab === item.id ? 'active' : ''}`}
                        onClick={() => setActiveTab(item.id)}
                    >
                        <span className="icon">{item.icon}</span>
                        {item.label}
                    </button>
                ))}

                <div className="menu-category">SUPPORT</div>
                {menuItems.slice(5).map(item => (
                    <button
                        key={item.id}
                        className={`menu-item ${activeTab === item.id ? 'active' : ''}`}
                        onClick={() => setActiveTab(item.id)}
                    >
                        <span className="icon">{item.icon}</span>
                        {item.label}
                    </button>
                ))}
            </div>

            <div className="sidebar-footer">
                <div className="user-profile">
                    <div className="avatar">A</div>
                    <div className="user-info">
                        <p className="name">Admin User</p>
                        <p className="role">Super Admin</p>
                    </div>
                </div>
                <button className="logout-btn" onClick={onLogout} title="Logout">🚪</button>
            </div>
        </div>
    )
}
