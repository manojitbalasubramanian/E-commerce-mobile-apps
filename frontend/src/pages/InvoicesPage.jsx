import React, { useEffect, useState } from 'react'
import { fetchInvoices, downloadInvoicePDF } from '../services/api'
import '../styles/InvoicesPage.css'
import { formatCurrency } from '../utils/currency'
import { showToast } from '../utils/toast'

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)

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

  async function handleDownloadPDF(invoiceId) {
    try {
      await downloadInvoicePDF(invoiceId)
      showToast('Invoice download started', 'success')
    } catch (e) {
      showToast('Failed to download PDF', 'error')
    }
  }

  if (loading) {
    return <div className="invoices-page"><p>Loading invoices...</p></div>
  }

  return (
    <div className="invoices-page">
      <h2>My Invoices</h2>

      {invoices.length === 0 ? (
        <div className="empty-invoices">
          <p>No invoices yet</p>
          <a href="/">Start shopping</a>
        </div>
      ) : (
        <div className="invoices-list">
          {invoices.map(invoice => {
            const id = invoice._id || invoice.id || invoice.invoiceNumber
            return (
              <div key={id} className="invoice-card">
                <div className="invoice-header">
                  <h4>Invoice #{invoice.invoiceNumber || id}</h4>
                  <span className="invoice-date">
                    {invoice.createdAt ? new Date(invoice.createdAt).toLocaleDateString() : ''}
                  </span>
                </div>

                <div className="invoice-customer">
                  <p><strong>Customer:</strong> {invoice.customerName || (invoice.customer && invoice.customer.name) || 'N/A'}</p>
                </div>

                <div className="invoice-items">
                  <h5>Items:</h5>
                  {Array.isArray(invoice.items) && invoice.items.map((item, idx) => (
                    <div key={idx} className="invoice-item">
                      <span>{item.name} x{item.quantity}</span>
                      <span>{formatCurrency((item.price || 0) * (item.quantity || 1))}</span>
                    </div>
                  ))}
                </div>

                <div className="invoice-product-ids">
                  <h5>Product Details:</h5>
                  {Array.isArray(invoice.items) && invoice.items.map((item, idx) => {
                    const pid = typeof item.productId === 'string' ? item.productId : (item.productId?._id || item.productId || 'N/A')
                    return (
                      <div key={idx} className="product-id-row">
                        <span><strong>ID:</strong> {pid}</span>
                        <span>{item.name}</span>
                      </div>
                    )
                  })}
                </div>

                <div className="invoice-total">
                  <strong>Total: {formatCurrency(invoice.total || 0)}</strong>
                </div>

                <button
                  className="download-btn"
                  onClick={() => handleDownloadPDF(id)}
                >
                  Download PDF
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
