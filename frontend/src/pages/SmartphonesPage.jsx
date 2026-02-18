import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchProducts } from '../services/api'
import '../styles/HomePage.css'
// Reusing HomePage CSS for consistent design, can be refactored into a shared CSS later if needed

export default function SmartphonesPage({ onAddToCart }) {
    const navigate = useNavigate()
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function loadProducts() {
            try {
                const data = await fetchProducts()
                // Filter out products with no stock
                // Assuming all products are smartphones as per current data structure,
                // or we can filter by category/brand if added later.
                // For now, filtering by stock > 0 as requested ("in inventory")
                const inStock = data.filter(p => p.stock > 0)

                // Map backend data to UI format (same logic as HomePage)
                const mapped = inStock.map(p => {
                    const hasDiscount = p.discountedPrice && p.discountedPrice < p.price
                    let badge = null

                    if (hasDiscount) {
                        const discountPercent = Math.round(((p.price - p.discountedPrice) / p.price) * 100)
                        badge = `${discountPercent}% OFF`
                    } else if (p.stock < 5) {
                        badge = "LOW STOCK"
                    } else if (Math.random() > 0.7) {
                        badge = "HOT"
                    }

                    return {
                        ...p, // Spread original backend fields to keep _id, appliedOffers, etc.
                        id: p._id,
                        name: p.name,
                        specs: p.description || p.brand, // Use description or brand as fallback
                        price: hasDiscount ? p.discountedPrice : p.price,
                        originalPrice: hasDiscount ? p.price : null,
                        rating: 4.0 + (Math.random() * 1.0), // Mock rating 4.0-5.0
                        reviews: Math.floor(Math.random() * 500) + 10, // Mock reviews
                        badge: badge,
                        image: p.image // Ensure image is passed if available
                    }
                })

                setProducts(mapped)
            } catch (err) {
                console.error("Failed to load products:", err)
            } finally {
                setLoading(false)
            }
        }
        loadProducts()
    }, [])

    if (loading) {
        return <div className="home-page" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="loader">Loading...</div>
        </div>
    }

    return (
        <div className="home-page">
            {/* Header Section */}
            <section className="products-section" style={{ paddingTop: '120px' }}>
                <div className="section-title">
                    <div>
                        <h2>Smartphones</h2>
                        <p>Explore our latest collection of premium devices.</p>
                    </div>
                </div>

                <div className="products-grid">
                    {products.length === 0 ? (
                        <div className="no-products">No smartphones available in inventory at the moment.</div>
                    ) : (
                        products.map(product => (
                            <div className="card" key={product.id}>
                                <div className="card-img-box">
                                    {product.badge && (
                                        <span className={`badge ${product.badge.includes('OFF') ? 'sale' : 'hot'}`}>
                                            {product.badge}
                                        </span>
                                    )}
                                    {/* If product has an image URL, use it, otherwise placeholder */}
                                    {product.image && <img src={product.image} alt={product.name} className="product-img" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />}
                                </div>

                                <div className="card-info">
                                    <h3 className="card-title">{product.name}</h3>
                                    <p className="card-specs">{product.specs}</p>

                                    <div className="card-rating">
                                        {'★'.repeat(Math.round(product.rating))}
                                        <span style={{ color: '#e2e8f0' }}>
                                            {'★'.repeat(5 - Math.round(product.rating))}
                                        </span>
                                        <span className="count">({product.reviews})</span>
                                    </div>

                                    <div className="card-footer">
                                        <div>
                                            {product.originalPrice && <span className="old-price">₹ {product.originalPrice.toLocaleString()}</span>}
                                            <div className="card-price">₹ {product.price.toLocaleString()}</div>
                                        </div>
                                        <div className="card-actions">
                                            <button className="btn-cart-circle" onClick={() => onAddToCart(product)}>
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <circle cx="9" cy="21" r="1"></circle>
                                                    <circle cx="20" cy="21" r="1"></circle>
                                                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                                                </svg>
                                            </button>
                                            <button className="btn-quick-buy" onClick={() => navigate('/checkout', { state: { buyNowItem: { ...product, quantity: 1 } } })} title="Quick Buy">
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path>
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </section>
        </div>
    )
}
