export function Button({ children, onClick, variant = 'primary', disabled, className = '', type = 'button' }) {
  const base = 'inline-flex items-center justify-center gap-2 rounded-2xl font-semibold transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none px-6 py-3 text-sm'
  const variants = {
    primary: 'bg-gray-900 text-white shadow-sm hover:bg-black',
    secondary: 'bg-amber-100 text-amber-900 hover:bg-amber-200',
    ghost: 'text-gray-700 hover:bg-gray-100',
    danger: 'bg-red-100 text-red-700 hover:bg-red-200',
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${variants[variant]} ${className}`}>
      {children}
    </button>
  )
}
