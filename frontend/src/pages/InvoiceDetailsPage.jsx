import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { fetchInvoice, fetchInvoicePDF, downloadInvoicePDF } from '../services/api'
import { formatCurrency } from '../utils/currency'
import { showToast } from '../utils/toast'
import '../styles/InvoiceDetails.css'
import {
    Printer,
    Download,
    Share2,
    HelpCircle,
    History,
    ArrowLeft
} from 'lucide-react'

export default function InvoiceDetailsPage() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [invoice, setInvoice] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadInvoice()
    }, [id])

    async function loadInvoice() {
        try {
            const data = await fetchInvoice(id)
            setInvoice(data.invoice)
        } catch (e) {
            console.error('Failed to load invoice:', e)
            showToast('Failed to load invoice details', 'error')
            navigate(-1) // Go back on error
        } finally {
            setLoading(false)
        }
    }

    const handlePrint = async () => {
        try {
            showToast('Opening PDF for printing...', 'info')
            const blob = await fetchInvoicePDF(id)
            if (!blob) return

            const url = URL.createObjectURL(blob)

            // Open in new window for reliable printing across browsers
            const printWindow = window.open(url, '_blank')
            if (printWindow) {
                printWindow.onload = () => {
                    printWindow.print()
                }
            } else {
                showToast('Please allow popups to print', 'error')
            }

            // Cleanup URL after a delay
            setTimeout(() => URL.revokeObjectURL(url), 60000)
        } catch (e) {
            showToast('Failed to open print dialog', 'error')
            console.error(e)
        }
    }

    const handleDownload = async () => {
        try {
            showToast('Downloading PDF...', 'info')
            await downloadInvoicePDF(id)
            showToast('Download complete', 'success')
        } catch (e) {
            showToast('Failed to download PDF', 'error')
        }
    }

    if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading Invoice...</div>
    if (!invoice) return null

    // Calculate totals
    const total = invoice.total || 0
    // Reverse engineering the tax/subtotal from total for display if not stored
    // Assuming 18% tax included in total or added? 
    // Backend calc: total = subtotalDiscounted + tax
    // tax = subtotalDiscounted * 0.18
    // total = subtotalDiscounted * 1.18
    const subtotal = total / 1.18
    const tax = total - subtotal

    return (
        <div className="invoice-details-container">
            {/* Header Actions */}
            <header className="invoice-actions-header">
                <div className="brand-wrapper">
                    <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', marginRight: '1rem' }}>
                        <ArrowLeft size={24} color="#4b5563" />
                    </button>
                    <div className="brand-logo-sm">SM</div>
                    <span className="brand-text">Invoice Manager</span>
                </div>

                <div className="header-buttons">
                    <button onClick={handlePrint} className="btn-print">
                        <Printer size={18} />
                        Print
                    </button>
                    <button onClick={handleDownload} className="btn-download">
                        <Download size={18} />
                        Download PDF
                    </button>
                    <div className="user-avatar">
                        <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#b45309' }}>AS</span>
                    </div>
                </div>
            </header>

            {/* Invoice Paper Card */}
            <div className="invoice-paper">
                {/* Paper Header */}
                <div className="paper-header">
                    <div className="company-details">
                        <div className="company-logo-row">
                            <div className="logo-square">SM</div>
                            <h2 className="company-name">SHREE MOBILES</h2>
                        </div>
                        <div className="address-lines">
                            <p>123 Tech Plaza, MG Road</p>
                            <p>Mumbai, Maharashtra 400001</p>
                            <p>GSTIN: 27AAAAA0000A1Z5</p>
                            <p>Email: billing@shreemobiles.in</p>
                        </div>
                    </div>

                    <div className="invoice-total-section">
                        <span className="total-label">INVOICE TOTAL</span>
                        <div className="total-amount">{formatCurrency(total)}</div>
                    </div>
                </div>

                {/* Billing Grid */}
                <div className="billing-grid">
                    <div className="bill-col">
                        <h3>TO</h3>
                        <p className="bill-name">{invoice.customerName || 'Customer'}</p>
                        <div className="bill-address">
                            <p>456 Skyline Apartments, Worli</p>
                            <p>Mumbai, Maharashtra 400018</p>
                            <p>Phone: {invoice.customerPhone || '+91 98765 43210'}</p>
                            <p>GSTIN: 27BBBBB1111B1Z2</p>
                        </div>
                    </div>

                    {/* Empty middle column for spacing/layout balance */}
                    <div className="bill-col"></div>

                    <div className="bill-col">
                        <h3>PAYMENT METHOD</h3>
                        <p className="bill-name">Online / UPI</p>
                        <div className="bill-address">
                            <p className="status-badge-inline" style={{
                                color: (invoice.status || 'paid').toLowerCase() === 'paid' ? '#d97706' : '#1f2937', // Orange/Gold for Paid
                                fontWeight: '700',
                                fontSize: '0.9rem',
                                marginBottom: '0.25rem',
                                marginTop: '0.25rem',
                                display: 'inline-block'
                            }}>
                                {(invoice.status || 'PAID').toUpperCase()}
                            </p>
                            <p style={{ fontSize: '0.8rem', color: '#6b7280' }}>Transaction ID: TXN-{invoice._id.slice(-8).toUpperCase()}</p>
                            <p style={{ fontSize: '0.8rem', color: '#6b7280' }}>Paid on: {new Date(invoice.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                    </div>
                </div>

                {/* Items Table */}
                <div className="items-table-container">
                    <div className="items-header">
                        <span className="col-header">DESCRIPTION</span>
                        <span className="col-header text-center">QTY</span>
                        <span className="col-header text-right">UNIT PRICE</span>
                        <span className="col-header text-right">TOTAL</span>
                    </div>

                    {invoice.items.map((item, idx) => (
                        <div key={idx} className="item-row">
                            <div className="item-desc">
                                <h4>{item.name}</h4>
                                <div className="item-sub">256GB, Blue Titanium - Includes 1 Year Warranty</div>
                            </div>
                            <div className="item-qty text-center">{item.quantity}</div>
                            <div className="item-price text-right">{formatCurrency(item.price)}</div>
                            <div className="item-total text-right">{formatCurrency(item.price * item.quantity)}</div>
                        </div>
                    ))}
                </div>

                {/* Footer Section */}
                <div className="invoice-footer">
                    <div className="notes-section">
                        <div className="notes-title">NOTES & TERMS</div>
                        <div className="notes-text">
                            <p>Please pay the invoice within 15 days. Make all checks payable to Shree Mobiles. Thank you for your business!</p>
                        </div>
                    </div>

                    <div className="summary-section">
                        <div className="summary-row">
                            <span>Subtotal</span>
                            <span>{formatCurrency(subtotal)}</span>
                        </div>
                        <div className="summary-row">
                            <span>GST (18%)</span>
                            <span>{formatCurrency(tax)}</span>
                        </div>
                        <div className="summary-row" style={{ color: '#10b981' }}>
                            <span>Discount (0%)</span>
                            <span>-{formatCurrency(0)}</span>
                        </div>

                        <div className="grand-total-row">
                            <span className="label-lg">GRAND TOTAL</span>
                            <span className="value-lg">{formatCurrency(total)}</span>
                        </div>

                        <div className="authorized-sig">
                            <span className="sig-label">AUTHORIZED SIGNATORY</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Actions */}
            <div className="bottom-actions">
                <a className="action-link"><History size={16} /> View Transaction History</a>
                <a className="action-link"><HelpCircle size={16} /> Contact Support</a>
                <a className="action-link"><Share2 size={16} /> Share Link</a>
            </div>

            <footer className="page-footer">
                © 2023 Shree Mobiles Private Limited. All Rights Reserved.
            </footer>
        </div>
    )
}
