import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-none text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none border-black border-3 shadow-pixel-sm active:shadow-none active:translate-x-[2px] active:translate-y-[2px]",
  {
    variants: {
      variant: {
        default:
          "bg-blue-600 text-white hover:bg-blue-700",
        destructive:
          "bg-red-600 text-white hover:bg-red-700",
        outline:
          "border border-black bg-white hover:bg-gray-100 text-black",
        secondary:
          "bg-gray-300 text-black hover:bg-gray-400",
        ghost:
          "hover:bg-gray-200 text-black border-transparent shadow-none active:shadow-none active:translate-x-0 active:translate-y-0",
        link: "text-blue-600 underline-offset-4 hover:underline border-transparent shadow-none active:shadow-none active:translate-x-0 active:translate-y-0",
      },
      size: {
        default: "h-10 px-4 py-2 has-[>svg]:px-3",
        sm: "h-9 rounded-none px-3 has-[>svg]:px-2.5",
        lg: "h-12 rounded-none px-8 has-[>svg]:px-4",
        icon: "size-10 rounded-none",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
