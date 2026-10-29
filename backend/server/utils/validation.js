const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function normalizeEmail(email) {
  return typeof email === 'string' ? email.trim().toLowerCase() : ''
}

export function isValidEmail(email) {
  return email.length <= 254 && emailPattern.test(email)
}

export function parsePositiveInteger(value) {
  const number = Number(value)
  return Number.isInteger(number) && number > 0 ? number : null
}

export function validateItem(data) {
  if (typeof data.inventory_number !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9._-]{0,99}$/.test(data.inventory_number.trim()))
    return 'Numer inwentarzowy ma nieprawidłowy format'

  if (data.purchase_price !== null && data.purchase_price !== undefined) {
    const purchasePrice = Number(data.purchase_price)
    if (!Number.isFinite(purchasePrice) || purchasePrice < 0)
      return 'Purchase price must be a non-negative number'
  }

  return null
}
