export const formatKES = (value) =>
  new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 0,
  }).format(Number(value) || 0)

export const CURRENCY_SYMBOL = 'KSh'

