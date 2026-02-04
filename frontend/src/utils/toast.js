let listeners = []

export function subscribe(fn) {
  listeners.push(fn)
  return () => { listeners = listeners.filter(l => l !== fn) }
}

export function showToast(message, type = 'info', timeout = 4000) {
  const id = Date.now() + Math.random()
  const toast = { id, message, type }
  listeners.forEach(fn => fn({ action: 'add', toast }))
  if (timeout > 0) {
    setTimeout(() => listeners.forEach(fn => fn({ action: 'remove', id })), timeout)
  }
  return id
}

export function clearToasts() {
  listeners.forEach(fn => fn({ action: 'clear' }))
}
