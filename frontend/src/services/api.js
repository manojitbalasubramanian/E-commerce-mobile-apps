const BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000'
import { getAuthHeader } from './auth'

async function handleResponse(r, fallbackMessage) {
  if (r.ok) return r.json()
  let err = { error: fallbackMessage }
  try { err = await r.json() } catch (e) { }
  
  // Clear token if invalid (only if a token was actually present and rejected)
  const token = localStorage.getItem('token');
  if (token && (r.status === 401 || err.error === 'Invalid token')) {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    window.location.href = '/'
  }

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

export async function fetchInvoicePDF(invoiceId) {
  const headers = { ...getAuthHeader() }
  const r = await fetch(BASE + `/api/invoices/${invoiceId}/pdf`, { headers })
  if (!r.ok) {
    // try to parse json error
    try {
      const err = await r.json()
      throw new Error(err.error || 'Failed to fetch PDF')
    } catch {
      throw new Error('Failed to fetch PDF')
    }
  }
  return await r.blob()
}

export async function downloadInvoicePDF(invoiceId) {
  try {
    const blob = await fetchInvoicePDF(invoiceId)
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `invoice-${invoiceId}.pdf`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  } catch (e) {
    throw e
  }
}

// ═══════════════════════════════════════════════════
//  RECOMMENDATION API
// ═══════════════════════════════════════════════════

export async function trackActivity(productId, actionType) {
  try {
    const headers = { 'Content-Type': 'application/json', ...getAuthHeader() }
    const r = await fetch(BASE + '/api/recommendations/track', {
      method: 'POST',
      headers,
      body: JSON.stringify({ productId, actionType })
    })
    return handleResponse(r, 'Failed to track activity')
  } catch (e) {
    // Silently fail — tracking should not block UX
    console.warn('Activity tracking failed:', e.message)
  }
}

export async function fetchPersonalizedRecommendations(limit = 12) {
  const headers = { 'Content-Type': 'application/json', ...getAuthHeader() }
  return fetchJsonWithRetry(
    BASE + `/api/recommendations/personalized?limit=${limit}`,
    { headers },
    { retries: 2, delay: 500, fallbackMessage: 'Failed to fetch recommendations' }
  )
}

export async function fetchSimilarProducts(productId, limit = 8) {
  return fetchJsonWithRetry(
    BASE + `/api/recommendations/similar/${productId}?limit=${limit}`,
    {},
    { retries: 2, delay: 500, fallbackMessage: 'Failed to fetch similar products' }
  )
}

export async function fetchTrendingProducts(category = '', limit = 10) {
  const params = new URLSearchParams({ limit })
  if (category) params.set('category', category)
  return fetchJsonWithRetry(
    BASE + `/api/recommendations/trending?${params}`,
    {},
    { retries: 2, delay: 500, fallbackMessage: 'Failed to fetch trending products' }
  )
}

export async function fetchBoughtTogether(productId, limit = 6) {
  return fetchJsonWithRetry(
    BASE + `/api/recommendations/bought-together/${productId}?limit=${limit}`,
    {},
    { retries: 2, delay: 500, fallbackMessage: 'Failed to fetch bought together products' }
  )
}

export async function fetchCategoryRecommendations(category, limit = 12) {
  return fetchJsonWithRetry(
    BASE + `/api/recommendations/category/${category}?limit=${limit}`,
    {},
    { retries: 2, delay: 500, fallbackMessage: 'Failed to fetch category recommendations' }
  )
}

export async function fetchDeals(limit = 10) {
  return fetchJsonWithRetry(
    BASE + `/api/recommendations/deals?limit=${limit}`,
    {},
    { retries: 2, delay: 500, fallbackMessage: 'Failed to fetch deals' }
  )
}

export async function fetchNewArrivals(category = '', limit = 10) {
  const params = new URLSearchParams({ limit })
  if (category) params.set('category', category)
  return fetchJsonWithRetry(
    BASE + `/api/recommendations/new-arrivals?${params}`,
    {},
    { retries: 2, delay: 500, fallbackMessage: 'Failed to fetch new arrivals' }
  )
}

export async function fetchBudgetRecommendations(min, max, category = '', limit = 12) {
  const params = new URLSearchParams({ min, max, limit })
  if (category) params.set('category', category)
  return fetchJsonWithRetry(
    BASE + `/api/recommendations/budget?${params}`,
    {},
    { retries: 2, delay: 500, fallbackMessage: 'Failed to fetch budget recommendations' }
  )
}

