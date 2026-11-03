import type { ComponentProps } from "react"
import { Card as WhisperinkCard } from "@versavolta/whisperink/components/Card/Card.js"
import { CardContent as WhisperinkCardContent } from "@versavolta/whisperink/components/Card/CardContent.js"
import { CardFooter as WhisperinkCardFooter } from "@versavolta/whisperink/components/Card/CardFooter.js"
import { cn } from "@/lib/utils"

function Card({ className, ...props }: ComponentProps<"div">) {
  return <WhisperinkCard data-slot="card" className={className} {...props} />
}

function CardHeader({ className, ...props }: ComponentProps<"div">) {
  return <div data-slot="card-header" className={cn("flex flex-col gap-1 px-5 py-4", className)} {...props} />
}

function CardTitle({ className, ...props }: ComponentProps<"div">) {
  return <div data-slot="card-title" className={cn("font-heading text-base font-semibold", className)} {...props} />
}

function CardDescription({ className, ...props }: ComponentProps<"div">) {
  return <div data-slot="card-description" className={cn("text-sm text-fg-muted", className)} {...props} />
}

function CardAction({ className, ...props }: ComponentProps<"div">) {
  return <div data-slot="card-action" className={cn("col-start-2 row-span-2 row-start-1 self-start justify-self-end", className)} {...props} />
}

function CardContent({ className, ...props }: ComponentProps<"div">) {
  return <WhisperinkCardContent data-slot="card-content" className={className} {...props} />
}

function CardFooter({ className, ...props }: ComponentProps<"div">) {
  return <WhisperinkCardFooter data-slot="card-footer" className={className} {...props} />
}

export { Card, CardHeader, CardFooter, CardTitle, CardAction, CardDescription, CardContent }
