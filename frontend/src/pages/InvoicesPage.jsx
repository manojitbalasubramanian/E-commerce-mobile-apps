import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchInvoices, downloadInvoicePDF } from '../services/api'
import '../styles/InvoicesPage.css'
import { formatCurrency } from '../utils/currency'
import { showToast } from '../utils/toast'
import {
  Search, Calendar, Filter, MoreVertical,
  FileText, Download, Plus
} from 'lucide-react'

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    loadInvoices()
  }, [])

  async function loadInvoices() {
    try {
      const data = await fetchInvoices()
      setInvoices(data.invoices || [])
    } catch (e) {
      console.error('Failed to fetch invoices:', e)
    } finally {
      setLoading(false)
    }
  }

  async function handleDownloadPDF(e, invoiceId) {
    e.stopPropagation()
    try {
      await downloadInvoicePDF(invoiceId)
      showToast('Invoice download started', 'success')
    } catch (e) {
      showToast('Failed to download PDF', 'error')
    }
  }

  const filteredInvoices = invoices.filter(inv =>
    (inv.invoiceNumber && inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (inv.customerName && inv.customerName.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const handleNewInvoice = () => {
    navigate('/') // Redirect to shop for now as creating invoice manually isn't implemented
    showToast('Go to checkout to create new invoice', 'info')
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    )
  }

  return (
    <div className="invoices-page-container">
      {/* Header Section */}
      <div className="page-header">
        <div className="header-titles">
          <h1>My Invoices</h1>
          <p>Manage and track your business billing with precision</p>
        </div>
        <button className="btn-new-invoice" onClick={handleNewInvoice}>
          <Plus size={18} /> New Invoice
        </button>
      </div>

      {/* Filters Bar */}
      <div className="filters-container">
        <div className="search-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search by Invoice ID or Customer Name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-actions">
          <button className="filter-btn date-filter">
            <Calendar size={16} /> Oct 01 - Oct 31, 2023
          </button>
          <button className="filter-btn status-filter">
            <Filter size={16} /> Status: All
          </button>
          <button className="filter-btn icon-only">
            <MoreVertical size={18} />
          </button>
        </div>
      </div>

      {/* Invoices List */}
      <div className="invoices-list-scroll">
        {filteredInvoices.length === 0 ? (
          <div className="empty-state">
            <p>No invoices found matching your search.</p>
          </div>
        ) : (
          filteredInvoices.map((inv) => {
            const issuedDate = new Date(inv.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            const itemSummary = inv.items?.map(i => i.name).join(', ').slice(0, 30) + (inv.items?.length > 1 ? '...' : '') || 'No items';

            return (
              <div
                key={inv._id || inv.id || inv.invoiceNumber}
                className="invoice-row-card"
                onClick={() => navigate(`/invoices/${inv._id || inv.id}`)}
                style={{ cursor: 'pointer' }}
              >

                <div className="invoice-icon-box">
                  <FileText size={24} color="#10b981" />
                </div>

                <div className="col-info col-id">
                  <span className="id-text">#{inv.invoiceNumber}</span>
                  <span className="sub-text">Issued on {issuedDate}</span>
                </div>

                <div className="col-info col-customer">
                  <label>CUSTOMER</label>
                  <span className="main-text">{inv.customerName || 'Unknown'}</span>
                </div>

                <div className="col-info col-summary">
                  <label>ITEMS SUMMARY</label>
                  <span className="main-text faded">{itemSummary}</span>
                </div>

                <div className="col-info col-total">
                  <label>TOTAL</label>
                  <span className="total-text">{formatCurrency(inv.total)}</span>
                </div>

                <div className="col-status">
                  <span className="status-badge completed">COMPLETED</span>
                </div>

                <div className="col-action">
                  <button className="btn-download-icon" onClick={(e) => handleDownloadPDF(e, inv._id)}>
                    <Download size={20} />
                  </button>
                </div>

              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
