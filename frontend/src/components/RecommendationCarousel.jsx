import React, { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../styles/RecommendationCarousel.css'

export default function RecommendationCarousel({
  title,
  subtitle,
  products = [],
  onAddToCart,
  icon,
  accentColor = '#6366f1',
  strategy = '',
  showViewAll = false,
  viewAllLink = '/smartphones'
}) {
  const scrollRef = useRef(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)
  const navigate = useNavigate()

  function checkScroll() {
    if (!scrollRef.current) return
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
    setCanScrollLeft(scrollLeft > 10)
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10)
  }

  function scroll(direction) {
    if (!scrollRef.current) return
    const amount = 340
    scrollRef.current.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' })
    setTimeout(checkScroll, 400)
  }

  if (!products || products.length === 0) return null

  // Map product data for display
  const displayProducts = products.map(p => {
    const hasDiscount = p.discountedPrice && p.discountedPrice < p.price
    return {
      ...p,
      id: p._id || p.id,
      displayPrice: hasDiscount ? p.discountedPrice : p.price,
      originalPrice: hasDiscount ? p.price : null,
      discountPercent: hasDiscount ? Math.round(((p.price - p.discountedPrice) / p.price) * 100) : null,
      specs: p.description || p.brand,
      rating: p.rating || (4.0 + Math.random() * 0.9),
      reviews: p.reviews || Math.floor(Math.random() * 300 + 20)
    }
  })

  const strategyBadges = {
    personalized: '🎯 For You',
    trending: '🔥 Trending',
    similar: '✨ Similar',
    bought_together: '🤝 Bought Together',
    deals: '💰 Deals',
    new_arrivals: '🆕 New',
    category: '📱 Category',
    budget: '💎 Budget Pick',
    trending_fallback: '🔥 Trending'
  }

  const categoryIcons = {
    mobile: '📱',
    tablet: '📱',
    accessory: '🎧'
  }

  return (
    <section className="rec-carousel-section" style={{ '--accent': accentColor }}>
      <div className="rec-carousel-header">
        <div className="rec-carousel-title-group">
          {icon && <span className="rec-carousel-icon">{icon}</span>}
          <div>
            <h2 className="rec-carousel-title">{title}</h2>
            {subtitle && <p className="rec-carousel-subtitle">{subtitle}</p>}
          </div>
          {strategy && strategyBadges[strategy] && (
            <span className="rec-strategy-badge">{strategyBadges[strategy]}</span>
          )}
        </div>
        <div className="rec-carousel-controls">
          {showViewAll && (
            <a href={viewAllLink} className="rec-view-all">View All ›</a>
          )}
          <button
            className={`rec-scroll-btn ${!canScrollLeft ? 'disabled' : ''}`}
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            aria-label="Scroll left"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>
          <button
            className={`rec-scroll-btn ${!canScrollRight ? 'disabled' : ''}`}
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            aria-label="Scroll right"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
        </div>
      </div>

      <div className="rec-carousel-track" ref={scrollRef} onScroll={checkScroll}>
        {displayProducts.map((product, idx) => (
          <div className="rec-card" key={product.id || idx} style={{ animationDelay: `${idx * 0.05}s` }}>
            {/* Badges */}
            <div className="rec-card-badges">
              {product.discountPercent && (
                <span className="rec-badge rec-badge-sale">{product.discountPercent}% OFF</span>
              )}
              {product.category && (
                <span className="rec-badge rec-badge-category">
                  {categoryIcons[product.category] || '📦'} {product.category}
                </span>
              )}
            </div>

            <div className="rec-card-img-container">
              {product.image ? (
                <img src={product.image} alt={product.name} className="rec-card-img" loading="lazy" />
              ) : (
                <div className="rec-card-img-placeholder">
                  <span>{categoryIcons[product.category] || '📦'}</span>
                </div>
              )}
              {/* Quick action overlay */}
              <div className="rec-card-overlay">
                <button
                  className="rec-overlay-btn rec-overlay-cart"
                  onClick={(e) => { e.stopPropagation(); onAddToCart && onAddToCart({ ...product, price: product.displayPrice, originalPrice: product.originalPrice || product.price, appliedOffers: product.appliedOffers || [] }) }}
                  title="Add to Cart"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="9" cy="21" r="1"></circle>
                    <circle cx="20" cy="21" r="1"></circle>
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                  </svg>
                </button>
                <button
                  className="rec-overlay-btn rec-overlay-buy"
                  onClick={(e) => {
                    e.stopPropagation()
                    navigate('/checkout', { state: { buyNowItem: { ...product, price: product.displayPrice, originalPrice: product.originalPrice || product.price, quantity: 1, appliedOffers: product.appliedOffers || [] } } })
                  }}
                  title="Quick Buy"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path>
                  </svg>
                </button>
              </div>
            </div>

            <div className="rec-card-body">
              <span className="rec-card-brand">{product.brand}</span>
              <h3 className="rec-card-name">{product.name}</h3>
              {product.specs && <p className="rec-card-specs">{product.specs}</p>}

              <div className="rec-card-rating">
                <div className="rec-stars">
                  {[1, 2, 3, 4, 5].map(star => (
                    <span key={star} className={star <= Math.round(product.rating) ? 'star filled' : 'star'}>★</span>
                  ))}
                </div>
                <span className="rec-review-count">({product.reviews})</span>
              </div>

              <div className="rec-card-price-row">
                <div className="rec-price-group">
                  <span className="rec-card-price">₹{product.displayPrice?.toLocaleString()}</span>
                  {product.originalPrice && (
                    <span className="rec-card-old-price">₹{product.originalPrice?.toLocaleString()}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
