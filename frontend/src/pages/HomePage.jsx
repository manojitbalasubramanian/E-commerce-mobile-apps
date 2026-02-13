import React, { useState, useEffect } from 'react'
import '../styles/HomePage.css'
import { fetchProducts } from '../services/api'

export default function HomePage({ onAddToCart }) {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadProducts() {
      try {
        const data = await fetchProducts()
        // Filter out products with no stock
        const inStock = data.filter(p => p.stock > 0)

        // Map backend data to UI format
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
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <span className="tag-caps">Next Gen Performance</span>
          <h1 className="hero-title">
            The Future <span className="highlight">In Your Hands</span>
          </h1>
          <p className="hero-desc">
            Experience the revolutionary Neo-X flagship. Powered by the world's first AI-integrated processor and an ultra-vivid 165Hz display.
          </p>
          <div className="hero-actions">
            <button className="btn-primary">Explore Now →</button>
            <button className="btn-outline">View Specs</button>
          </div>
        </div>

        <div className="hero-visual">
          <div className="phone-placeholder"></div>

          <div className="float-tag" style={{ top: '20%', right: '-20px' }}>
            <span style={{ color: '#10b981' }}>●</span> Snapdragon 8 Gen 3
          </div>
          <div className="float-tag" style={{ bottom: '30%', left: '-50px' }}>
            50MP Ultra-Leica
          </div>
          <div className="float-tag" style={{ bottom: '15%', right: '-30px', background: '#0033ff', color: 'white' }}>
            ⚡ 120W Fast Charging
          </div>
        </div>
      </section>

      {/* New Arrivals */}
      <section className="products-section">
        <div className="section-title">
          <div>
            <h2>New Arrivals</h2>
            <p>The latest tech masterpieces curated just for you.</p>
          </div>
          <a href="/smartphones" className="view-all">View All ›</a>
        </div>

        <div className="products-grid">
          {products.length === 0 ? (
            <div className="no-products">No products available at the moment.</div>
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
                    <button className="btn-cart-circle" onClick={() => onAddToCart(product)}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="9" cy="21" r="1"></circle>
                        <circle cx="20" cy="21" r="1"></circle>
                        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Newsletter */}
      <section className="newsletter-section">
        <div className="newsletter-box">
          <div className="newsletter-content">
            <h2>Get the First Access.</h2>
            <p>Join the inner circle and receive exclusive offers, early access to new launches, and professional tech tips directly to your inbox.</p>
            <div className="subscribe-form">
              <input type="email" placeholder="Enter your email" className="input-glass" />
              <button className="btn-white">Subscribe Now</button>
            </div>
          </div>
          <div className="circle-deco"></div>
        </div>
      </section>
    </div>
  )
}
