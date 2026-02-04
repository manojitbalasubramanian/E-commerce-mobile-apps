import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getUser } from '../services/auth'
import { getToken } from '../services/auth'
import '../styles/AdminPage.css'
import { formatCurrency } from '../utils/currency'

export default function AdminPage() {
  const [products, setProducts] = useState([])
  const [formData, setFormData] = useState({ name: '', brand: '', price: '', description: '', stock: '', image: '' })
  const [editingId, setEditingId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const navigate = useNavigate()
  const token = getToken()
  const user = getUser()

  // Check if user is admin
  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/')
    }
    loadProducts()
  }, [user, navigate])

  async function loadProducts() {
    try {
      const r = await fetch('http://localhost:3000/api/products')
      const data = await r.json()
      setProducts(Array.isArray(data) ? data : [])
    } catch (e) {
      setMessage('Failed to load products')
      try { const { showToast } = await import('../utils/toast'); showToast('Failed to load products', 'error') } catch {}
    }
  }

  function handleChange(e) {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
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
        ? `http://localhost:3000/api/products/${editingId}`
        : 'http://localhost:3000/api/products'

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
          image: formData.image
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
      const r = await fetch(`http://localhost:3000/api/products/${id}`, {
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
      image: product.image || ''
    })
    setEditingId(product._id)
  }

  function resetForm() {
    setFormData({ name: '', brand: '', price: '', description: '', stock: '', image: '' })
    setEditingId(null)
  }

  return (
    <div className="admin-page">
      <h2>📦 Product Management</h2>

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
                    <p className="price">{formatCurrency(product.price)}</p>
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
    </div>
  )
}
