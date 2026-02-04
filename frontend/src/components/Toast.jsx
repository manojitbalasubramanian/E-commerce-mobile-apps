import React, { useEffect, useState } from 'react'
import { subscribe } from '../utils/toast'
import '../styles/Toast.css'

export default function Toast() {
  const [toasts, setToasts] = useState([])

  useEffect(() => {
    const unsub = subscribe((msg) => {
      if (msg.action === 'add') setToasts(prev => [...prev, msg.toast])
      else if (msg.action === 'remove') setToasts(prev => prev.filter(t => t.id !== msg.id))
      else if (msg.action === 'clear') setToasts([])
    })
    return unsub
  }, [])

  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          <div className="toast-message">{t.message}</div>
        </div>
      ))}
    </div>
  )
}
