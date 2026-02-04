import React from 'react'
import { formatCurrency } from '../utils/currency'

export default function Cart({ cart = [], onChange, onCheckout }) {
  const total = cart.reduce((s, i) => s + i.price * i.quantity, 0)
  return (
    <aside className="cart">
      <h2>Cart</h2>
      {cart.length === 0 && <div>No items</div>}
      <ul>
        {cart.map(item => (
          <li key={item.id}>
            <div className="cart-item">
              <div className="left">
                <strong>{item.name}</strong>
                <div>{formatCurrency(item.price)} x</div>
              </div>
              <div className="right">
                <input type="number" min="0" value={item.quantity} onChange={e => onChange(item.id, Number(e.target.value))} />
              </div>
            </div>
          </li>
        ))}
      </ul>
      <div className="cart-total">Total: {formatCurrency(total)}</div>
      <button disabled={cart.length === 0} onClick={onCheckout}>Checkout</button>
    </aside>
  )
}
