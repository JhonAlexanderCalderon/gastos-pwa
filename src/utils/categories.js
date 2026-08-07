export const CATEGORIES = [
  { id: 'mercado',        label: 'Mercado',        color: '#4CAF50', icon: '🛒' },
  { id: 'renta',          label: 'Renta',           color: '#2196F3', icon: '🏠' },
  { id: 'gasolina',       label: 'Gasolina',        color: '#FF9800', icon: '⛽' },
  { id: 'servicios',      label: 'Servicios',       color: '#FFC107', icon: '⚡' },
  { id: 'hogar',          label: 'Hogar',           color: '#9C27B0', icon: '🪑' },
  { id: 'seguro',         label: 'Seguro',          color: '#00BCD4', icon: '🛡️' },
  { id: 'salud',          label: 'Salud',           color: '#F44336', icon: '❤️' },
  { id: 'restaurante',    label: 'Restaurante',     color: '#FF5722', icon: '🍽️' },
  { id: 'entretenimiento',label: 'Entret.',         color: '#E91E63', icon: '🎬' },
  { id: 'transporte',     label: 'Transporte',      color: '#607D8B', icon: '🚌' },
  { id: 'otro',           label: 'Otro',            color: '#9E9E9E', icon: '•••' },
]

export function getCategoryById(id) {
  return CATEGORIES.find(c => c.id === id) ?? CATEGORIES[CATEGORIES.length - 1]
}
