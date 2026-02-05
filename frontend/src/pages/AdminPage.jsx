import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getUser } from '../services/auth'
import { getToken } from '../services/auth'
import '../styles/AdminPage.css'
import { formatCurrency } from '../utils/currency'

const BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000'

export default function AdminPage() {
  const [products, setProducts] = useState([])
  const [formData, setFormData] = useState({ name: '', brand: '', price: '', description: '', stock: '', image: '', offerName: '', discountPercent: '', offerStartDate: '', offerEndDate: '', offerActive: false })
  const [editingId, setEditingId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [offers, setOffers] = useState([])
  const [activeTab, setActiveTab] = useState('products')
  const navigate = useNavigate()
  const token = getToken()
  const user = getUser()

  // Check if user is admin
  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/')
    }
    loadProducts()
    loadOffers()
  }, [user, navigate])

  async function loadProducts() {
    try {
      const { fetchProducts } = await import('../services/api')
      const data = await fetchProducts({ retries: 3 })
      setProducts(Array.isArray(data) ? data : [])
    } catch (e) {
      setMessage('Failed to load products')
      try { const { showToast } = await import('../utils/toast'); showToast(e.message || 'Failed to load products', 'error') } catch {}
    }
  }

  async function loadOffers() {
    try {
      const { fetchOffers } = await import('../services/api')
      const data = await fetchOffers({ retries: 3 })
      setOffers(Array.isArray(data) ? data : [])
    } catch (e) {
      try { const { showToast } = await import('../utils/toast'); showToast(e.message || 'Failed to load offers', 'error') } catch {}
    }
  }

  function handleChange(e) {
    const { name, value, type, checked } = e.target
    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: checked }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setMessage('')

    if (!formData.name || !formData.brand || !formData.price) {
      setMessage('Name, brand, and price are required')
      return
    }

    setLoading(true)
    try {
      const method = editingId ? 'PUT' : 'POST'
      const url = editingId
        ? BASE + `/api/products/${editingId}`
        : BASE + '/api/products'

      // Build offer object if provided
      let offerObj = undefined
      if (formData.offerName || formData.discountPercent || formData.offerStartDate || formData.offerEndDate || formData.offerActive) {
        offerObj = {
          name: formData.offerName || undefined,
          discountPercent: formData.discountPercent ? parseFloat(formData.discountPercent) : undefined,
          startDate: formData.offerStartDate ? new Date(formData.offerStartDate).toISOString() : undefined,
          endDate: formData.offerEndDate ? new Date(formData.offerEndDate).toISOString() : undefined,
          active: !!formData.offerActive
        }
      }

      const r = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: formData.name,
          brand: formData.brand,
          price: parseFloat(formData.price),
          description: formData.description,
          stock: parseInt(formData.stock) || 0,
          image: formData.image,
          offer: offerObj
        })
      })

      if (!r.ok) {
        const error = await r.json()
        throw new Error(error.error || 'Failed to save product')
      }

      setMessage(editingId ? '✓ Product updated successfully' : '✓ Product added successfully')
      try { const { showToast } = await import('../utils/toast'); showToast(editingId ? 'Product updated' : 'Product added', 'success') } catch {}
      setFormData({ name: '', brand: '', price: '', description: '', stock: '', image: '' })
      setEditingId(null)
      loadProducts()
    } catch (e) {
      setMessage('❌ ' + e.message)
      try { const { showToast } = await import('../utils/toast'); showToast('Failed to save product', 'error') } catch {}
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Are you sure you want to delete this product?')) return

    try {
      const r = await fetch(BASE + `/api/products/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (!r.ok) throw new Error('Failed to delete')

      setMessage('✓ Product deleted successfully')
      try { const { showToast } = await import('../utils/toast'); showToast('Product deleted', 'success') } catch {}
      loadProducts()
    } catch (e) {
      setMessage('❌ ' + e.message)
      try { const { showToast } = await import('../utils/toast'); showToast('Failed to delete product', 'error') } catch {}
    }
  }

  function handleEdit(product) {
    setFormData({
      name: product.name,
      brand: product.brand,
      price: product.price,
      description: product.description || '',
      stock: product.stock,
      image: product.image || '',
      offerName: product.offer?.name || '',
      discountPercent: product.offer?.discountPercent || '',
      offerStartDate: product.offer?.startDate ? new Date(product.offer.startDate).toISOString().slice(0, 10) : '',
      offerEndDate: product.offer?.endDate ? new Date(product.offer.endDate).toISOString().slice(0, 10) : '',
      offerActive: !!product.offer?.active
    })
    setEditingId(product._id)
  }

  function resetForm() {
    setFormData({ name: '', brand: '', price: '', description: '', stock: '', image: '', offerName: '', discountPercent: '', offerStartDate: '', offerEndDate: '', offerActive: false })
    setEditingId(null)
  }

  return (
    <div className="admin-page">
      <h2>📦 Product Management</h2>

      <div className="admin-tabs">
        <button className={`tab-btn ${activeTab === 'products' ? 'active' : ''}`} onClick={() => setActiveTab('products')}>Products</button>
        <button className={`tab-btn ${activeTab === 'offers' ? 'active' : ''}`} onClick={() => setActiveTab('offers')}>Offers</button>
      </div>

      {activeTab === 'products' && (
        <div className="admin-container">
          <div className="admin-form-section">
            <h3>{editingId ? 'Edit Product' : 'Add New Product'}</h3>
            <form onSubmit={handleSubmit} className="admin-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Product Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g., iPhone 14 Pro"
                    disabled={loading}
                  />
                </div>
                <div className="form-group">
                  <label>Brand *</label>
                  <input
                    type="text"
                    name="brand"
                    value={formData.brand}
                    onChange={handleChange}
                    placeholder="e.g., Apple"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Price (₹) *</label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    disabled={loading}
                  />
                </div>
                <div className="form-group">
                  <label>Stock Quantity</label>
                  <input
                    type="number"
                    name="stock"
                    value={formData.stock}
                    onChange={handleChange}
                    placeholder="0"
                    min="0"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Product description"
                  rows="3"
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label>Image URL</label>
                <input
                  type="url"
                  name="image"
                  value={formData.image}
                  onChange={handleChange}
                  placeholder="https://..."
                  disabled={loading}
                />
              </div>

              <hr />
              <h4>Offer (optional)</h4>
              <div className="form-row">
                <div className="form-group">
                  <label>Offer Name</label>
                  <input type="text" name="offerName" value={formData.offerName} onChange={handleChange} placeholder="e.g., Diwali Sale" disabled={loading} />
                </div>
                <div className="form-group">
                  <label>Discount (%)</label>
                  <input type="number" min="0" max="100" step="0.1" name="discountPercent" value={formData.discountPercent} onChange={handleChange} placeholder="e.g., 10" disabled={loading} />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Start Date</label>
                  <input type="date" name="offerStartDate" value={formData.offerStartDate} onChange={handleChange} disabled={loading} />
                </div>
                <div className="form-group">
                  <label>End Date</label>
                  <input type="date" name="offerEndDate" value={formData.offerEndDate} onChange={handleChange} disabled={loading} />
                </div>
              </div>

              <div className="form-group">
                <label>
                  <input type="checkbox" name="offerActive" checked={formData.offerActive} onChange={handleChange} disabled={loading} /> Active Offer
                </label>
              </div>

              {message && <div className={`message ${message.startsWith('✓') ? 'success' : 'error'}`}>{message}</div>}

              <div className="form-buttons">
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Saving...' : editingId ? 'Update Product' : 'Add Product'}
                </button>
                {editingId && (
                  <button type="button" className="btn btn-secondary" onClick={resetForm} disabled={loading}>
                    Cancel Edit
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className="products-list-section">
            <h3>Products ({products.length})</h3>
            {products.length === 0 ? (
              <p className="empty-state">No products yet. Add one to get started!</p>
            ) : (
              <div className="products-grid">
                {products.map(product => (
                  <div key={product._id} className="product-item">
                    {product.image && <img src={product.image} alt={product.name} />}
                    <div className="product-details">
                      <h4>{product.name}</h4>
                      <p className="brand">{product.brand}</p>
                      {product.discountedPrice ? (
                        <p className="price">
                          <span className="original-price">{formatCurrency(product.price)}</span>
                          <span className="discounted-price">{formatCurrency(product.discountedPrice)}</span>
                        </p>
                      ) : (
                        <p className="price">{formatCurrency(product.price)}</p>
                      )}
                      <p className="stock">Stock: {product.stock}</p>
                      {product.description && <p className="description">{product.description}</p>}
                    </div>
                    <div className="product-actions">
                      <button className="btn btn-edit" onClick={() => handleEdit(product)}>Edit</button>
                      <button className="btn btn-delete" onClick={() => handleDelete(product._id)}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'offers' && (
        <div className="offers-container">
          <div className="offer-form-section">
            <h3>Create Offer</h3>
            <div className="offer-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Offer Name *</label>
                  <input type="text" name="newOfferName" value={formData.newOfferName || ''} onChange={(e) => setFormData(prev => ({ ...prev, newOfferName: e.target.value }))} placeholder="e.g., Diwali Sale" />
                </div>
                <div className="form-group">
                  <label>Discount (%) *</label>
                  <input type="number" min="0" max="100" step="0.1" name="newDiscountPercent" value={formData.newDiscountPercent || ''} onChange={(e) => setFormData(prev => ({ ...prev, newDiscountPercent: e.target.value }))} placeholder="e.g., 10" />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Start Date</label>
                  <input type="date" name="newOfferStart" value={formData.newOfferStart || ''} onChange={(e) => setFormData(prev => ({ ...prev, newOfferStart: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label>End Date</label>
                  <input type="date" name="newOfferEnd" value={formData.newOfferEnd || ''} onChange={(e) => setFormData(prev => ({ ...prev, newOfferEnd: e.target.value }))} />
                </div>
              </div>

              <div className="form-buttons">
                <button className="btn btn-primary" onClick={async () => {
                  try {
                    const { createOffer } = await import('../services/api')
                    const payload = {
                      name: formData.newOfferName,
                      discountPercent: parseFloat(formData.newDiscountPercent),
                      startDate: formData.newOfferStart || undefined,
                      endDate: formData.newOfferEnd || undefined,
                      active: false
                    }
                    await createOffer(payload)
                    await loadOffers()
                    setFormData(prev => ({ ...prev, newOfferName: '', newDiscountPercent: '', newOfferStart: '', newOfferEnd: '' }))
                  } catch (e) {
                    try { const { showToast } = await import('../utils/toast'); showToast('Failed to create offer', 'error') } catch {}
                  }
                }}>Create Offer</button>
              </div>
            </div>
          </div>

          <div className="existing-offers-section">
            <h3>Existing Offers</h3>
            <div className="offers-list">
              {offers.length === 0 ? <p className="empty-state">No offers yet.</p> : offers.map(o => (
                <div key={o._id} className="offer-item">
                  <div>
                    <strong>{o.name}</strong> — {o.discountPercent}% {o.active ? '(Active)' : '(Inactive)'}
                    {o.startDate && <div>Start: {new Date(o.startDate).toLocaleDateString()}</div>}
                    {o.endDate && <div>End: {new Date(o.endDate).toLocaleDateString()}</div>}
                  </div>
                  <div className="offer-actions">
                    <button className="btn btn-primary" onClick={async () => { try { const { applyOfferToAll } = await import('../services/api'); await applyOfferToAll(o._id); await loadProducts(); await loadOffers(); } catch (e) { try { const { showToast } = await import('../utils/toast'); showToast('Failed to apply offer', 'error') } catch {} } }}>Apply to All</button>
                    <button className="btn btn-secondary" onClick={async () => { try { const { stopOffer } = await import('../services/api'); await stopOffer(o._id); await loadProducts(); await loadOffers(); } catch (e) { try { const { showToast } = await import('../utils/toast'); showToast('Failed to stop offer', 'error') } catch {} } }}>Stop Offer</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
