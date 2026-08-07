export function Avatar({ src, name, size = 32, className = '' }) {
  if (src) {
    return (
      <img
        src={src}
        alt=""
        className={`rounded-full object-cover shrink-0 ${className}`}
        style={{ width: size, height: size }}
      />
    )
  }
  return (
    <div
      className={`rounded-full bg-amber-100 flex items-center justify-center text-amber-800 font-bold shrink-0 ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.42 }}
    >
      {name?.[0]?.toUpperCase() ?? '?'}
    </div>
  )
}
