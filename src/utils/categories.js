export const CATEGORIES = [
  { id: 'aldi',        label: 'Aldi',              kind: 'brand', initial: 'A', color: '#00549F' },
  { id: 'coles',       label: 'Coles',             kind: 'brand', initial: 'C', color: '#E01A22' },
  { id: 'woolworths',  label: 'Woolworths',        kind: 'brand', initial: 'W', color: '#1E7B34' },
  { id: 'frutiveg',    label: 'Frutas y Verduras', kind: 'icon',  icon: 'Apple',          color: '#65A30D' },
  { id: 'sevenEleven', label: '7-Eleven',          kind: 'brand', initial: '7', color: '#00A651' },
  { id: 'bws',         label: 'BWS',               kind: 'brand', initial: 'B', color: '#C8102E' },
  { id: 'kmart',       label: 'Kmart',             kind: 'brand', initial: 'K', color: '#E4002B' },
  { id: 'target',      label: 'Target',            kind: 'brand', initial: 'T', color: '#CC0000' },
  { id: 'ocio',        label: 'Ocio',              kind: 'icon',  icon: 'PartyPopper',    color: '#F59E0B', hasSubtype: true },
  { id: 'online',      label: 'Compras en línea',  kind: 'icon',  icon: 'ShoppingBag',    color: '#7C3AED' },
  { id: 'gasolina',    label: 'Gasolina',          kind: 'icon',  icon: 'Fuel',           color: '#EA580C' },
  { id: 'renta',       label: 'Renta',             kind: 'icon',  icon: 'Home',           color: '#111827', hasPreset: true },
  { id: 'servicios',   label: 'Servicio público',  kind: 'icon',  icon: 'Zap',            color: '#0EA5E9' },
  { id: 'otro',        label: 'Otro',              kind: 'icon',  icon: 'MoreHorizontal', color: '#6B7280' },
]

export const CATEGORY_GROUPS = [
  { label: 'Supermercado', ids: ['aldi', 'coles', 'woolworths', 'frutiveg'] },
  { label: 'Tiendas',      ids: ['sevenEleven', 'bws', 'kmart', 'target'] },
  { label: 'Gastos fijos y otros', ids: ['ocio', 'online', 'gasolina', 'renta', 'servicios', 'otro'] },
]

export function getCategoryById(id) {
  return CATEGORIES.find(c => c.id === id) ?? CATEGORIES[CATEGORIES.length - 1]
}
