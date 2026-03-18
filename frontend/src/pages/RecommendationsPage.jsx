import React, { useState, useEffect } from 'react'
import { isAuthenticated } from '../services/auth'
import {
  fetchTrendingProducts,
  fetchPersonalizedRecommendations,
  fetchCategoryRecommendations,
  fetchDeals,
  fetchNewArrivals,
  fetchBudgetRecommendations
} from '../services/api'
import RecommendationCarousel from '../components/RecommendationCarousel'
import '../styles/RecommendationsPage.css'

export default function RecommendationsPage({ onAddToCart }) {
  const [personalized, setPersonalized] = useState(null)
  const [trendingMobiles, setTrendingMobiles] = useState([])
  const [trendingTablets, setTrendingTablets] = useState([])
  const [accessories, setAccessories] = useState([])
  const [deals, setDeals] = useState([])
  const [newArrivals, setNewArrivals] = useState([])
  const [budgetPicks, setBudgetPicks] = useState([])
  const [premiumPicks, setPremiumPicks] = useState([])
  const [loading, setLoading] = useState(true)
  const loggedIn = isAuthenticated()

  useEffect(() => {
    async function loadRecommendations() {
      try {
        const promises = [
          fetchTrendingProducts('mobile', 12).catch(() => ({ products: [] })),
          fetchTrendingProducts('tablet', 12).catch(() => ({ products: [] })),
          fetchCategoryRecommendations('accessory', 12).catch(() => ({ products: [] })),
          fetchDeals(10).catch(() => ({ products: [] })),
          fetchNewArrivals('', 10).catch(() => ({ products: [] })),
          fetchBudgetRecommendations(1000, 15000, '', 10).catch(() => ({ products: [] })),
          fetchBudgetRecommendations(30000, 200000, '', 10).catch(() => ({ products: [] })),
        ]

        if (loggedIn) {
          promises.push(
            fetchPersonalizedRecommendations(12).catch(() => null)
          )
        }

        const results = await Promise.all(promises)

        setTrendingMobiles(results[0]?.products || [])
        setTrendingTablets(results[1]?.products || [])
        setAccessories(results[2]?.products || [])
        setDeals(results[3]?.products || [])
        setNewArrivals(results[4]?.products || [])
        setBudgetPicks(results[5]?.products || [])
        setPremiumPicks(results[6]?.products || [])

        if (loggedIn && results[7]) {
          setPersonalized(results[7])
        }
      } catch (err) {
        console.error('Failed to load recommendations:', err)
      } finally {
        setLoading(false)
      }
    }
    loadRecommendations()
  }, [loggedIn])

  if (loading) {
    return (
      <div className="rec-page">
        <div className="rec-page-loader">
          <div className="rec-loader-spinner"></div>
          <p>Building your personalized experience...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="rec-page">
      {/* Page Header */}
      <section className="rec-page-hero">
        <div className="rec-page-hero-content">
          <span className="rec-page-tag">AI-Powered</span>
          <h1 className="rec-page-title">
            Discover What's <span className="rec-page-highlight">Perfect For You</span>
          </h1>
          <p className="rec-page-desc">
            Our smart recommendation engine analyzes trends, your preferences, and what other shoppers love to bring you the perfect picks.
          </p>
        </div>
        <div className="rec-page-hero-visual">
          <div className="rec-hero-orb orb-1"></div>
          <div className="rec-hero-orb orb-2"></div>
          <div className="rec-hero-orb orb-3"></div>
          <div className="rec-hero-icon">🧠</div>
        </div>
      </section>

      {/* Personalized - Only for logged-in users */}
      {loggedIn && personalized && personalized.products && personalized.products.length > 0 && (
        <RecommendationCarousel
          title="Recommended For You"
          subtitle={personalized.preferences ? `Based on your love for ${personalized.preferences.topBrands?.join(', ')}` : 'Picked just for you'}
          products={personalized.products}
          onAddToCart={onAddToCart}
          icon="🎯"
          accentColor="#8b5cf6"
          strategy={personalized.strategy}
        />
      )}

      {/* Trending Mobiles */}
      <RecommendationCarousel
        title="Trending Mobiles"
        subtitle="Most popular smartphones right now"
        products={trendingMobiles}
        onAddToCart={onAddToCart}
        icon="📱"
        accentColor="#3b82f6"
        strategy="trending"
        showViewAll
        viewAllLink="/smartphones"
      />

      {/* Hot Deals */}
      {deals.length > 0 && (
        <RecommendationCarousel
          title="Hot Deals & Offers"
          subtitle="Grab these before they're gone!"
          products={deals}
          onAddToCart={onAddToCart}
          icon="🔥"
          accentColor="#ef4444"
          strategy="deals"
        />
      )}

      {/* Trending Tablets */}
      <RecommendationCarousel
        title="Top Tablets"
        subtitle="Premium tablets for work and play"
        products={trendingTablets}
        onAddToCart={onAddToCart}
        icon="💻"
        accentColor="#06b6d4"
        strategy="trending"
        showViewAll
        viewAllLink="/tablets"
      />

      {/* New Arrivals */}
      {newArrivals.length > 0 && (
        <RecommendationCarousel
          title="Just Landed"
          subtitle="Fresh arrivals you don't want to miss"
          products={newArrivals}
          onAddToCart={onAddToCart}
          icon="✨"
          accentColor="#10b981"
          strategy="new_arrivals"
        />
      )}

      {/* Accessories */}
      <RecommendationCarousel
        title="Must-Have Accessories"
        subtitle="Complete your setup with premium accessories"
        products={accessories}
        onAddToCart={onAddToCart}
        icon="🎧"
        accentColor="#f59e0b"
        strategy="category"
        showViewAll
        viewAllLink="/accessories"
      />

      {/* Budget Friendly */}
      {budgetPicks.length > 0 && (
        <RecommendationCarousel
          title="Budget Friendly"
          subtitle="Great quality under ₹15,000"
          products={budgetPicks}
          onAddToCart={onAddToCart}
          icon="💰"
          accentColor="#22c55e"
          strategy="budget"
        />
      )}

      {/* Premium Collection */}
      {premiumPicks.length > 0 && (
        <RecommendationCarousel
          title="Premium Collection"
          subtitle="Flagship devices for the discerning buyer"
          products={premiumPicks}
          onAddToCart={onAddToCart}
          icon="👑"
          accentColor="#a855f7"
          strategy="budget"
        />
      )}
    </div>
  )
}
