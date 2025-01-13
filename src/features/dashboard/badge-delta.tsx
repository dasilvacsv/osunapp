// components/ui/badge-delta.tsx
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { TrendingDown, TrendingUp } from "lucide-react"

interface BadgeDeltaProps {
  trend: "up" | "down"
  children: React.ReactNode
  className?: string
}

export function BadgeDelta({ trend, children, className }: BadgeDeltaProps) {
  return (
    <Badge 
      variant="outline" 
      className={cn(
        "flex items-center gap-1",
        trend === "up" ? "text-green-600" : "text-red-600",
        className
      )}
    >
      {trend === "up" ? (
        <TrendingUp className="h-3 w-3" />
      ) : (
        <TrendingDown className="h-3 w-3" />
      )}
      {children}
    </Badge>
  )
}