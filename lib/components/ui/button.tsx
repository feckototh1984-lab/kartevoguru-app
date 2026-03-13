import React from "react"

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary"
}

export function Button({
  children,
  variant = "primary",
  ...props
}: Props) {
  const base =
    "px-4 py-2 rounded-xl font-semibold transition"

  const styles =
    variant === "primary"
      ? "bg-green-500 text-white hover:bg-green-600"
      : "border border-gray-300 bg-white hover:bg-gray-50"

  return (
    <button className={`${base} ${styles}`} {...props}>
      {children}
    </button>
  )
}