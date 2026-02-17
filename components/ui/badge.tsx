import * as React from "react"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  variant?: "default" | "secondary" | "destructive" | "outline"
  className?: string
}

export function Badge({ children, variant = "default", className = "", ...props }: BadgeProps) {
  const baseStyles = {
    default: "bg-zinc-800 text-zinc-100",
    secondary: "bg-zinc-700 text-zinc-200",
    destructive: "bg-red-900 text-red-100",
    outline: "border border-zinc-700 text-zinc-300",
  }

  const variantStyles = baseStyles[variant] || baseStyles.default

  return (
    <div
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variantStyles} ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
