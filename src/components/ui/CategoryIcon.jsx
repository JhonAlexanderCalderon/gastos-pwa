import {
  Apple, PartyPopper, ShoppingBag, ShoppingCart, Fuel, Home, Zap, MoreHorizontal,
} from 'lucide-react'

const ICONS = { Apple, PartyPopper, ShoppingBag, ShoppingCart, Fuel, Home, Zap, MoreHorizontal }

export function CategoryIcon({ category, size = 40 }) {
  const style = { width: size, height: size }

  if (category.kind === 'brand') {
    return (
      <div
        className="rounded-full flex items-center justify-center font-bold text-white shrink-0"
        style={{ ...style, backgroundColor: category.color, fontSize: size * 0.42 }}
      >
        {category.initial}
      </div>
    )
  }

  const Icon = ICONS[category.icon] ?? MoreHorizontal
  return (
    <div
      className="rounded-full flex items-center justify-center shrink-0"
      style={{ ...style, backgroundColor: `${category.color}1A` }}
    >
      <Icon size={size * 0.5} color={category.color} strokeWidth={2} />
    </div>
  )
}
