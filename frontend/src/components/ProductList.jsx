import React from 'react'
import { formatCurrency } from '../utils/currency'
import { showToast } from '../utils/toast'

export default function ProductList({ products = [], onAdd }) {
  return (
    <section className="product-list">
      {products.map(p => (
        <article className="product-card" key={p.id}>
          <img src={p.image} alt={p.name} />
          <div className="product-info">
            <h3>{p.name}</h3>
            <p className="brand">{p.brand}</p>
            <p className="price">{formatCurrency(p.price)}</p>
            <p className="stock">Stock: {p.stock}</p>
            <button onClick={() => { onAdd(p); showToast(`${p.name} added to cart`, 'success') }}>Add to cart</button>
          </div>
        </article>
      ))}
    </section>
  )
}
