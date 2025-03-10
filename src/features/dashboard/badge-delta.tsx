import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { TrendingDown, TrendingUp } from "lucide-react"

interface BadgeDeltaProps {
  trend: "up" | "down"
  value: string | number
  metric?: string
  className?: string
}

export function BadgeDelta({ trend, value, metric, className }: BadgeDeltaProps) {
  return (
    <Badge 
      variant="outline" 
      className={cn(
        "flex items-center gap-1 px-2 py-1",
        trend === "up" ? "text-green-600 bg-green-50" : "text-red-600 bg-red-50",
        className
      )}
    >
      {trend === "up" ? (
        <TrendingUp className="h-3 w-3" />
      ) : (
        <TrendingDown className="h-3 w-3" />
      )}
      <span>{value}%</span>
      {metric && <span className="text-xs opacity-75">vs {metric}</span>}
    </Badge>
  )
}