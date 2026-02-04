const BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000'
import { getAuthHeader } from './auth'

async function handleResponse(r, fallbackMessage) {
  if (r.ok) return r.json()
  let err = { error: fallbackMessage }
  try { err = await r.json() } catch (e) {}
  throw new Error(err.error || err.message || fallbackMessage)
}

export async function fetchProducts() {
  const r = await fetch(BASE + '/api/products')
  return handleResponse(r, 'Failed to fetch products')
}

export async function checkout(cart, customer) {
  const headers = { 'Content-Type': 'application/json', ...getAuthHeader() }
  const r = await fetch(BASE + '/api/checkout', {
    method: 'POST',
    headers,
    body: JSON.stringify({ cart, customer })
  })
  return handleResponse(r, 'Checkout failed')
}

export async function fetchInvoices() {
  const headers = { ...getAuthHeader() }
  const r = await fetch(BASE + '/api/invoices', { headers })
  return handleResponse(r, 'Failed to fetch invoices')
}

export async function fetchInvoice(id) {
  const headers = { ...getAuthHeader() }
  const r = await fetch(BASE + `/api/invoices/${id}`, { headers })
  return handleResponse(r, 'Failed to fetch invoice')
}

export async function downloadInvoicePDF(invoiceId) {
  const headers = { ...getAuthHeader() }
  const r = await fetch(BASE + `/api/invoices/${invoiceId}/pdf`, { headers })
  if (!r.ok) {
    await handleResponse(r, 'Failed to download PDF')
    return
  }
  const blob = await r.blob()
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `invoice-${invoiceId}.pdf`
  document.body.appendChild(a)
  a.click()
  window.URL.revokeObjectURL(url)
  document.body.removeChild(a)
}
