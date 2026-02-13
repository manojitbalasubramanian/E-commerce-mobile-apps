import React, { useEffect, useState } from 'react'
import { fetchAllInvoices, downloadInvoicePDF } from '../../services/api'
import '../../styles/InvoicesPage.css'
import { formatCurrency } from '../../utils/currency'
import { showToast } from '../../utils/toast'

export default function AdminInvoices() {
    const [invoices, setInvoices] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadInvoices()
    }, [])

    async function loadInvoices() {
        try {
            const data = await fetchAllInvoices()
            // Sort by latest first if not already sorted
            const sorted = (data.invoices || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            setInvoices(sorted)
        } catch (e) {
            console.error('Failed to fetch admin invoices:', e)
            showToast('Failed to load invoices', 'error')
        } finally {
            setLoading(false)
        }
    }

    async function handleDownloadPDF(invoiceId) {
        try {
            showToast('Generating PDF...', 'info')
            await downloadInvoicePDF(invoiceId)
            showToast('Invoice downloaded', 'success')
        } catch (e) {
            showToast('Failed to download PDF', 'error')
            console.error(e)
        }
    }

    function getStatusColor(status) {
        switch ((status || '').toLowerCase()) {
            case 'paid': return '#10b981'
            case 'pending': return '#f59e0b'
            case 'cancelled': return '#ef4444'
            default: return '#64748b'
        }
    }

    return (
        <div className="admin-invoices" style={{ padding: '24px' }}>
            <div className="header" style={{ marginBottom: '24px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: 'bold' }}>Sales & Invoices</h2>
                <p style={{ color: '#64748b' }}>Manage all customer orders and invoices</p>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>Loading invoices...</div>
            ) : invoices.length === 0 ? (
                <div className="empty-state" style={{
                    textAlign: 'center',
                    padding: '60px',
                    background: 'white',
                    borderRadius: '12px',
                    color: '#64748b'
                }}>
                    No invoices found in the system.
                </div>
            ) : (
                <div className="invoices-table-container" style={{
                    background: 'white',
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                    overflow: 'hidden'
                }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                <th style={{ padding: '16px', fontWeight: '600', color: '#475569' }}>Invoice #</th>
                                <th style={{ padding: '16px', fontWeight: '600', color: '#475569' }}>Date</th>
                                <th style={{ padding: '16px', fontWeight: '600', color: '#475569' }}>Customer</th>
                                <th style={{ padding: '16px', fontWeight: '600', color: '#475569' }}>Items</th>
                                <th style={{ padding: '16px', fontWeight: '600', color: '#475569' }}>Amount</th>
                                <th style={{ padding: '16px', fontWeight: '600', color: '#475569' }}>Status</th>
                                <th style={{ padding: '16px', fontWeight: '600', color: '#475569' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoices.map(inv => (
                                <tr key={inv._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <td style={{ padding: '16px', fontFamily: 'monospace' }}>#{inv.invoiceNumber}</td>
                                    <td style={{ padding: '16px' }}>
                                        {new Date(inv.createdAt).toLocaleDateString()}
                                        <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                                            {new Date(inv.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </td>
                                    <td style={{ padding: '16px' }}>
                                        <div style={{ fontWeight: '500' }}>{inv.customerName || 'Guest'}</div>
                                        <div style={{ fontSize: '12px', color: '#94a3b8' }}>{inv.customerEmail}</div>
                                    </td>
                                    <td style={{ padding: '16px' }}>
                                        {inv.items.length} item(s)
                                        <div style={{ fontSize: '12px', color: '#64748b', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {inv.items.map(i => i.name).join(', ')}
                                        </div>
                                    </td>
                                    <td style={{ padding: '16px', fontWeight: '600' }}>{formatCurrency(inv.total)}</td>
                                    <td style={{ padding: '16px' }}>
                                        <span style={{
                                            padding: '4px 12px',
                                            borderRadius: '20px',
                                            fontSize: '12px',
                                            fontWeight: '500',
                                            background: `${getStatusColor(inv.status)}20`,
                                            color: getStatusColor(inv.status)
                                        }}>
                                            {inv.status || 'Paid'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '16px' }}>
                                        <button
                                            onClick={() => handleDownloadPDF(inv._id)}
                                            style={{
                                                background: 'white',
                                                border: '1px solid #e2e8f0',
                                                borderRadius: '6px',
                                                padding: '6px 12px',
                                                cursor: 'pointer',
                                                color: '#3b82f6',
                                                fontSize: '14px',
                                                transition: 'all 0.2s'
                                            }}
                                            onMouseOver={(e) => {
                                                e.target.style.background = '#eff6ff'
                                                e.target.style.borderColor = '#3b82f6'
                                            }}
                                            onMouseOut={(e) => {
                                                e.target.style.background = 'white'
                                                e.target.style.borderColor = '#e2e8f0'
                                            }}
                                        >
                                            Download PDF
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}
