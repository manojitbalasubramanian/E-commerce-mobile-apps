
import React, { useEffect, useState } from 'react'
import { formatCurrency } from '../../utils/currency'
import { getToken } from '../../services/auth'
import '../../styles/AdminDashboard.css'

const BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000'

export default function AdminDashboard() {
    const [stats, setStats] = useState({
        totalSales: 0,
        transactionCount: 0,
        stockAlerts: 0,
        pendingOrders: 0,
        recentTransactions: [],
        revenueByBrand: []
    })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchData() {
            try {
                const token = getToken()
                const headers = { 'Authorization': `Bearer ${token}` }

                // Fetch Invoices (Admin All)
                const invRes = await fetch(`${BASE}/api/invoices/all`, { headers })
                const invData = await invRes.json()
                const invoices = invData.invoices || []

                // Fetch Products for Stock Alerts
                const prodRes = await fetch(`${BASE}/api/products`, { headers }) // Assuming this returns all products
                const products = await prodRes.json()

                // Calculate Stats
                const totalSales = invoices.reduce((sum, inv) => sum + (inv.total || 0), 0)
                const pendingOrders = invoices.filter(inv => inv.status === 'pending').length
                const stockAlerts = Array.isArray(products) ? products.filter(p => p.stock < 5).length : 0

                // Revenue by Brand (Simple Aggregation)
                const brandMap = {}
                invoices.forEach(inv => {
                    inv.items.forEach(item => {
                        // If we populated product, we can access brand. If not, we might miss it.
                        // The new route populates 'items.productId'.
                        const brand = item.productId?.brand || 'Other'
                        if (!brandMap[brand]) brandMap[brand] = 0
                        brandMap[brand] += item.price * item.quantity // Revenue
                    })
                })
                const revenueByBrand = Object.entries(brandMap)
                    .map(([brand, value]) => ({ brand, value }))
                    .sort((a, b) => b.value - a.value)
                    .slice(0, 5) // Top 5

                setStats({
                    totalSales,
                    transactionCount: invoices.length,
                    stockAlerts,
                    pendingOrders,
                    recentTransactions: invoices.slice(0, 5),
                    revenueByBrand
                })
            } catch (e) {
                console.error("Failed to load dashboard data", e)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [])

    if (loading) return <div className="dashboard-loading">Loading Dashboard...</div>

    return (
        <div className="admin-dashboard">
            <div className="dashboard-header">
                <h2>Dashboard</h2>
                <p className="welcome-text">Overview of your store performance</p>
            </div>

            <div className="stats-grid">
                <div className="stat-card sales">
                    <div className="stat-icon">📈</div>
                    <div className="stat-content">
                        <h3>Real-Time Sales</h3>
                        <div className="stat-value">{formatCurrency(stats.totalSales)}</div>
                        <span className="stat-trend positive">+12.5%</span>
                    </div>
                </div>

                <div className="stat-card transactions">
                    <div className="stat-icon">🧾</div>
                    <div className="stat-content">
                        <h3>Transactions</h3>
                        <div className="stat-value">{stats.transactionCount}</div>
                        <span className="stat-sub">New customers today</span>
                    </div>
                </div>

                <div className="stat-card stock">
                    <div className="stat-icon">⚠️</div>
                    <div className="stat-content">
                        <h3>Stock Alerts</h3>
                        <div className="stat-value">{stats.stockAlerts}</div>
                        <span className="stat-label critical">CRITICAL</span>
                    </div>
                </div>

                <div className="stat-card pending">
                    <div className="stat-icon">🚚</div>
                    <div className="stat-content">
                        <h3>Pending Orders</h3>
                        <div className="stat-value">{stats.pendingOrders}</div>
                        <span className="stat-link">View All</span>
                    </div>
                </div>
            </div>

            <div className="dashboard-charts">
                <div className="chart-container revenue-chart">
                    <h3>Revenue Overview</h3>
                    <p className="chart-subtitle">Monthly revenue trends</p>
                    {/* Placeholder for chart - implementing full chart library might be overkill, using CSS bars */}
                    <div className="css-bar-chart">
                        <div className="bar" style={{ height: '40%' }} data-label="Jan"></div>
                        <div className="bar" style={{ height: '60%' }} data-label="Feb"></div>
                        <div className="bar" style={{ height: '45%' }} data-label="Mar"></div>
                        <div className="bar" style={{ height: '70%' }} data-label="Apr"></div>
                        <div className="bar" style={{ height: '55%' }} data-label="May"></div>
                        <div className="bar active" style={{ height: '85%' }} data-label="Jun"></div>
                    </div>
                </div>

                <div className="chart-container brand-chart">
                    <h3>Brand Distribution</h3>
                    <div className="donut-chart">
                        <div className="donut-hole">
                            <span className="donut-value">{stats.transactionCount}</span>
                            <span className="donut-label">Units Sold</span>
                        </div>
                        {/* Simple CSS conic gradient for donut */}
                        <div className="donut-ring" style={{
                            background: `conic-gradient(
                    #3b82f6 0% 45%,
                    #60a5fa 45% 75%,
                    #93c5fd 75% 100%
                )`
                        }}></div>
                    </div>
                    <div className="legend">
                        {stats.revenueByBrand.map((item, idx) => (
                            <div key={item.brand} className="legend-item">
                                <span className="dot" style={{ background: idx === 0 ? '#3b82f6' : idx === 1 ? '#60a5fa' : '#93c5fd' }}></span>
                                <span className="label">{item.brand}</span>
                                <span className="value">{((item.value / stats.totalSales) * 100).toFixed(0)}%</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="recent-transactions">
                <div className="section-header">
                    <h3>Recent Transactions</h3>
                    <button className="view-all-btn">View Transaction Log</button>
                </div>
                <table className="transactions-table">
                    <thead>
                        <tr>
                            <th>Invoice ID</th>
                            <th>Customer</th>
                            <th>Product Detail</th>
                            <th>Amount</th>
                            <th>Status</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {stats.recentTransactions.map(inv => (
                            <tr key={inv._id}>
                                <td className="inv-id">#{inv.invoiceNumber}</td>
                                <td>
                                    <div className="customer-name">{inv.customerName || 'Guest'}</div>
                                    <div className="customer-phone">{inv.customerEmail || '-'}</div>
                                </td>
                                <td>
                                    <div className="prod-name">{inv.items[0]?.name}</div>
                                    {inv.items.length > 1 && <div className="prod-more">+{inv.items.length - 1} more</div>}
                                </td>
                                <td className="amount">{formatCurrency(inv.total)}</td>
                                <td>
                                    <span className={`status-pill ${inv.status || 'paid'}`}>
                                        {inv.status || 'Paid'}
                                    </span>
                                </td>
                                <td><button className="action-btn">⋮</button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
