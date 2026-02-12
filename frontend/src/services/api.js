const BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000'
import { getAuthHeader } from './auth'

async function handleResponse(r, fallbackMessage) {
  if (r.ok) return r.json()
  let err = { error: fallbackMessage }
  try { err = await r.json() } catch (e) { }
  throw new Error(err.error || err.message || fallbackMessage)
}

// Retry helper with exponential backoff
const sleep = (ms) => new Promise((res) => setTimeout(res, ms))

async function fetchJsonWithRetry(url, fetchOptions = {}, { retries = 3, delay = 500, fallbackMessage } = {}) {
  let attempt = 0
  while (attempt < retries) {
    try {
      const res = await fetch(url, fetchOptions)
      return await handleResponse(res, fallbackMessage)
    } catch (err) {
      attempt++
      if (attempt >= retries) {
        // Include attempt count in final error
        throw new Error(`${err.message || fallbackMessage || 'Request failed'} after ${attempt} attempt${attempt > 1 ? 's' : ''}`)
      }
      // Exponential backoff
      await sleep(delay * Math.pow(2, attempt - 1))
    }
  }
}

export async function fetchProducts({ retries = 3 } = {}) {
  return fetchJsonWithRetry(BASE + '/api/products', {}, { retries, delay: 500, fallbackMessage: 'Failed to fetch products' })
}

// Offers
export async function fetchOffers({ retries = 3 } = {}) {
  const headers = { 'Content-Type': 'application/json', ...getAuthHeader() }
  return fetchJsonWithRetry(BASE + '/api/offers', { headers }, { retries, delay: 500, fallbackMessage: 'Failed to fetch offers' })
}

export async function createOffer(payload) {
  const headers = { 'Content-Type': 'application/json', ...getAuthHeader() }
  const r = await fetch(BASE + '/api/offers', { method: 'POST', headers, body: JSON.stringify(payload) })
  return handleResponse(r, 'Failed to create offer')
}

export async function applyOfferToAll(offerId) {
  const headers = { 'Content-Type': 'application/json', ...getAuthHeader() }
  const r = await fetch(BASE + `/api/offers/${offerId}/apply`, { method: 'POST', headers })
  return handleResponse(r, 'Failed to apply offer')
}

export async function stopOffer(offerId) {
  const headers = { 'Content-Type': 'application/json', ...getAuthHeader() }
  const r = await fetch(BASE + `/api/offers/${offerId}/stop`, { method: 'POST', headers })
  return handleResponse(r, 'Failed to stop offer')
}

export async function checkout(cart, customer) {
  const headers = { 'Content-Type': 'application/json', ...getAuthHeader() }
  const r = await fetch(BASE + '/api/invoices/checkout', {
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

export async function fetchAllInvoices() {
  const headers = { ...getAuthHeader() }
  const r = await fetch(BASE + '/api/invoices/all', { headers })
  return handleResponse(r, 'Failed to fetch all invoices')
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
