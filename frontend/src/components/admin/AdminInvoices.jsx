import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchAllInvoices, downloadInvoicePDF } from '../../services/api'
import '../../styles/AdminInvoices.css'
import { formatCurrency } from '../../utils/currency'
import { showToast } from '../../utils/toast'
import {
    Plus,
    Search,
    Calendar,
    Filter,
    MoreVertical,
    FileText,
    Clock,
    AlertCircle,
    Download,
    ChevronLeft,
    ChevronRight
} from 'lucide-react'

export default function AdminInvoices() {
    const [invoices, setInvoices] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('All')

    const categories = ['All', 'Paid', 'Pending', 'Overdue']
    const navigate = useNavigate()

    useEffect(() => {
        loadInvoices()
    }, [])

    async function loadInvoices() {
        try {
            const data = await fetchAllInvoices()
            const sorted = (data.invoices || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            setInvoices(sorted)
        } catch (e) {
            console.error('Failed to fetch admin invoices:', e)
            showToast('Failed to load invoices', 'error')
        } finally {
            setLoading(false)
        }
    }

    async function handleDownloadPDF(e, invoiceId) {
        e.stopPropagation() // Prevent row click
        try {
            showToast('Generating PDF...', 'info')
            await downloadInvoicePDF(invoiceId)
            showToast('Invoice downloaded', 'success')
        } catch (e) {
            showToast('Failed to download PDF', 'error')
            console.error(e)
        }
    }

    const getStatus = (status) => {
        if (!status) return 'completed'
        return status.toLowerCase()
    }

    const getStatusIcon = (status) => {
        const s = getStatus(status)
        if (s === 'paid' || s === 'completed') return <FileText size={20} />
        if (s === 'pending') return <Clock size={20} />
        return <AlertCircle size={20} />
    }

    const getStatusClass = (status) => {
        const s = getStatus(status)
        if (s === 'paid' || s === 'completed') return 'status-paid'
        if (s === 'pending') return 'status-pending'
        return 'status-overdue'
    }

    const filteredInvoices = invoices.filter(inv => {
        const matchesSearch =
            inv.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            inv.customerName?.toLowerCase().includes(searchTerm.toLowerCase())

        const matchesStatus = statusFilter === 'All' || getStatus(inv.status) === statusFilter.toLowerCase()

        return matchesSearch && matchesStatus
    })

    return (
        <div className="admin-invoices-container">
            {/* Header */}
            <div className="admin-header">
                <div className="header-content">
                    <h1>My Invoices</h1>
                    <p>Manage and track your business billing with precision</p>
                </div>
                <button className="new-invoice-btn">
                    <Plus size={18} />
                    New Invoice
                </button>
            </div>

            {/* Filters Bar */}
            <div className="filters-bar">
                <div className="search-container">
                    <Search className="search-icon" size={18} />
                    <input
                        type="text"
                        placeholder="Search by Invoice ID or Customer Name..."
                        className="search-input"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <button className="filter-btn">
                    <Calendar size={16} />
                    Oct 01 - Oct 31, 2023
                </button>

                <button className="filter-btn">
                    <Filter size={16} />
                    Status: {statusFilter}
                </button>

                <button className="kebab-btn">
                    <MoreVertical size={16} />
                </button>
            </div>

            {/* Invoices List */}
            {loading ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading invoices...</div>
            ) : filteredInvoices.length === 0 ? (
                <div style={{ padding: '60px', textAlign: 'center', background: 'white', borderRadius: '12px', color: '#64748b' }}>
                    No invoices match your criteria.
                </div>
            ) : (
                <>
                    <div className="invoices-list">
                        {filteredInvoices.map(inv => {
                            const statusClass = getStatusClass(inv.status)

                            return (
                                <div
                                    key={inv._id}
                                    className={`invoice-card-row ${statusClass}`}
                                    onClick={() => navigate(`/invoices/${inv._id}`)}
                                >
                                    <div className={`card-left-accent ${statusClass}`}></div>

                                    <div className="card-content">
                                        {/* Icon */}
                                        <div className={`icon-box ${statusClass}`}>
                                            {getStatusIcon(inv.status)}
                                        </div>

                                        {/* Invoice ID & Date */}
                                        <div className="info-group">
                                            <div className="info-value">#{inv.invoiceNumber}</div>
                                            <div className="info-sub">Issued on {new Date(inv.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                                        </div>

                                        {/* Customer */}
                                        <div className="info-group">
                                            <div className="info-label">CUSTOMER</div>
                                            <div className="info-value">{inv.customerName || 'Aditya Sharma'}</div>
                                        </div>

                                        {/* Items Summary */}
                                        <div className="info-group items-group">
                                            <div className="info-label">ITEMS SUMMARY</div>
                                            <div className="info-sub" style={{ overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', maxWidth: '300px' }}>
                                                {inv.items.map(i => i.name).join(', ')}
                                            </div>
                                        </div>

                                        {/* Total */}
                                        <div className="amount-group">
                                            <div className="info-label">TOTAL</div>
                                            <div className="amount-value">{formatCurrency(inv.total)}</div>
                                        </div>

                                        {/* Status Badge */}
                                        <div className={`status-badge ${statusClass}`}>
                                            {inv.status || 'PAID'}
                                        </div>

                                        {/* Actions */}
                                        <button
                                            className="action-btn"
                                            onClick={(e) => handleDownloadPDF(e, inv._id)}
                                            title="Download PDF"
                                        >
                                            <Download size={20} />
                                        </button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    {/* Pagination (Mock UI) */}
                    <div className="pagination">
                        <span>Showing <strong>1 - {Math.min(10, filteredInvoices.length)}</strong> of <strong>{filteredInvoices.length}</strong> invoices</span>
                        <div className="page-numbers">
                            <button className="page-btn"><ChevronLeft size={16} /></button>
                            <button className="page-btn active">1</button>
                            <button className="page-btn">2</button>
                            <button className="page-btn">3</button>
                            <span style={{ alignSelf: 'center' }}>...</span>
                            <button className="page-btn">9</button>
                            <button className="page-btn"><ChevronRight size={16} /></button>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}
