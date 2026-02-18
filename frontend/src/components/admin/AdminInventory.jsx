
import React, { useState, useEffect } from 'react'
import { getToken } from '../../services/auth'
import { formatCurrency } from '../../utils/currency'
import '../../styles/AdminInventory.css'

const BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000'

export default function AdminInventory() {
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [showModal, setShowModal] = useState(false)
    const [editingId, setEditingId] = useState(null)
    const [formData, setFormData] = useState({
        name: '', brand: '', price: '', description: '', stock: '', image: '',
        offerName: '', discountPercent: '', offerStartDate: '', offerEndDate: '', offerActive: false
    })

    useEffect(() => {
        loadProducts()
    }, [])

    async function loadProducts() {
        setLoading(true)
        try {
            const token = getToken()
            const res = await fetch(`${BASE}/api/products`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            const data = await res.json()
            setProducts(Array.isArray(data) ? data : [])
        } catch (e) {
            console.error("Failed to load products", e)
        } finally {
            setLoading(false)
        }
    }

    function handleEdit(product) {
        const offer = product.appliedOffers && product.appliedOffers.length > 0 ? product.appliedOffers[0] : null
        setFormData({
            name: product.name,
            brand: product.brand,
            price: product.price,
            description: product.description || '',
            stock: product.stock,
            image: product.image || '',
            offerName: offer?.name || '',
            discountPercent: offer?.discountPercent || '',
            offerStartDate: offer?.startDate ? new Date(offer.startDate).toISOString().slice(0, 10) : '',
            offerEndDate: offer?.endDate ? new Date(offer.endDate).toISOString().slice(0, 10) : '',
            offerActive: !!offer?.active
        })
        setEditingId(product._id)
        setShowModal(true)
    }

    function handleCloseModal() {
        setShowModal(false)
        setEditingId(null)
        setFormData({ name: '', brand: '', price: '', description: '', stock: '', image: '', offerName: '', discountPercent: '', offerStartDate: '', offerEndDate: '', offerActive: false })
    }

    async function handleSubmit(e) {
        e.preventDefault()
        // Logic similar to original AdminPage
        try {
            const token = getToken()
            const method = editingId ? 'PUT' : 'POST'
            const url = editingId ? `${BASE}/api/products/${editingId}` : `${BASE}/api/products`

            // Construct offer object
            let offerObj = undefined
            if (formData.offerName || formData.discountPercent) {
                offerObj = {
                    name: formData.offerName,
                    discountPercent: parseFloat(formData.discountPercent),
                    startDate: formData.offerStartDate || undefined,
                    endDate: formData.offerEndDate || undefined,
                    active: formData.offerActive
                }
            }

            const res = await fetch(url, {
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
                    stock: parseInt(formData.stock),
                    image: formData.image,
                    offer: offerObj
                })
            })

            if (!res.ok) throw new Error('Failed to save')

            handleCloseModal()
            loadProducts()
        } catch (e) {
            alert(e.message)
        }
    }

    async function handleDelete(id) {
        if (!window.confirm("Delete this product?")) return
        try {
            const token = getToken()
            await fetch(`${BASE}/api/products/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            })
            loadProducts()
        } catch (e) { console.error(e) }
    }

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.brand.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="admin-inventory">
            <div className="inventory-header">
                <div>
                    <h2>Manage Inventory</h2>
                    <p className="subtitle">Real-time stock monitoring and product controls</p>
                </div>
                <div className="header-actions">
                    <input
                        type="text"
                        placeholder="Search products..."
                        className="search-input"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                    <button className="add-btn" onClick={() => setShowModal(true)}>+ Add Product</button>
                </div>
            </div>

            <div className="product-grid">
                {filteredProducts.map(product => (
                    <div key={product._id} className="product-card">
                        <div className="card-image">
                            <img src={product.image || 'https://placehold.co/200'} alt={product.name} />
                        </div>
                        <div className="product-card-content">
                            <div className="card-header">
                                <h3>{product.name}</h3>
                                <span className="price">{formatCurrency(product.price)}</span>
                            </div>
                            <p className="brand">{product.brand}</p>

                            <div className="stock-badges">
                                <span className="badge-ram">{product.description?.slice(0, 10)}...</span>
                                {/* Assuming description might hold specs or just general text */}
                            </div>

                            <div className="stock-status">
                                <div className="stock-bar">
                                    <div className="bar-fill" style={{ width: `${Math.min(product.stock, 100)}%`, background: product.stock < 10 ? '#ef4444' : '#10b981' }}></div>
                                </div>
                                <div className="stock-text">
                                    <span className={product.stock < 10 ? 'low-stock' : 'good-stock'}>
                                        {product.stock} left - {product.stock < 10 ? 'Low Stock' : 'Good'}
                                    </span>
                                </div>
                            </div>

                            <div className="card-actions">
                                <button className="edit-btn" onClick={() => handleEdit(product)}>Edit</button>
                                <button className="delete-btn" onClick={() => handleDelete(product._id)}>Delete</button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>{editingId ? 'Edit Product' : 'Add New Product'}</h3>
                            <button className="close-btn" onClick={handleCloseModal}>&times;</button>
                        </div>
                        <form onSubmit={handleSubmit} className="product-form">
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Product Name</label>
                                    <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label>Brand</label>
                                    <select value={formData.brand} onChange={e => setFormData({ ...formData, brand: e.target.value })} required>
                                        <option value="">Select Brand</option>
                                        <option value="Apple">Apple</option>
                                        <option value="Samsung">Samsung</option>
                                        <option value="Google">Google</option>
                                        <option value="OnePlus">OnePlus</option>
                                        <option value="Sony">Sony</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Price</label>
                                    <input type="number" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label>Stock Units</label>
                                    <input type="number" value={formData.stock} onChange={e => setFormData({ ...formData, stock: e.target.value })} required />
                                </div>
                                <div className="form-group full-width">
                                    <label>Image URL</label>
                                    <input type="url" value={formData.image} onChange={e => setFormData({ ...formData, image: e.target.value })} placeholder="https://..." />
                                </div>
                                <div className="form-group full-width">
                                    <label>Description / Specs</label>
                                    <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} rows="3"></textarea>
                                </div>

                                {/* Offer Section */}
                                <div className="form-group full-width offer-section">
                                    <h4>Offer Settings</h4>
                                    <div className="offer-grid">
                                        <input type="text" placeholder="Offer Name" value={formData.offerName} onChange={e => setFormData({ ...formData, offerName: e.target.value })} />
                                        <input type="number" placeholder="Discount %" value={formData.discountPercent} onChange={e => setFormData({ ...formData, discountPercent: e.target.value })} />
                                        <label className="active-check fa-center">
                                            <input type="checkbox" checked={formData.offerActive} onChange={e => setFormData({ ...formData, offerActive: e.target.checked })} /> Active
                                        </label>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="cancel-btn" onClick={handleCloseModal}>Cancel</button>
                                <button type="submit" className="save-btn">Save Product</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
