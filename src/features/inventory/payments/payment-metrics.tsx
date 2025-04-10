import { Card } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import { BadgeDollarSign, Clock, CheckCircle, XCircle } from "lucide-react"

interface Metrics {
  totalUSD: number
  totalBS: number
  pendingPayments: number
  overduePayments: number
  totalPaid: number
  totalCancelled: number
}

export function PaymentMetrics({ metrics }: { metrics: Metrics }) {
  const cards = [
    {
      title: "Total en USD",
      value: formatCurrency(metrics.totalUSD, "USD"),
      icon: BadgeDollarSign,
      description: `${metrics.totalPaid} pagos completados`,
      className: "bg-green-100 dark:bg-green-900/20",
      iconClassName: "text-green-600 dark:text-green-400",
      trend: {
        value: "+12.5%",
        label: "vs. mes anterior",
        positive: true
      }
    },
    {
      title: "Total en BS",
      value: formatCurrency(metrics.totalBS, "BS"),
      icon: BadgeDollarSign,
      description: `≈ ${formatCurrency(metrics.totalBS / 35, "USD")}`,
      className: "bg-blue-100 dark:bg-blue-900/20",
      iconClassName: "text-blue-600 dark:text-blue-400",
      trend: {
        value: "+8.3%",
        label: "vs. mes anterior",
        positive: true
      }
    },
    {
      title: "Pagos Pendientes",
      value: metrics.pendingPayments,
      icon: Clock,
      description: "En espera de confirmación",
      className: "bg-yellow-100 dark:bg-yellow-900/20",
      iconClassName: "text-yellow-600 dark:text-yellow-400",
      trend: {
        value: "-2.1%",
        label: "vs. mes anterior",
        positive: true
      }
    },
    {
      title: "Pagos Vencidos",
      value: metrics.overduePayments,
      icon: XCircle,
      description: "Requieren atención inmediata",
      className: "bg-red-100 dark:bg-red-900/20",
      iconClassName: "text-red-600 dark:text-red-400",
      trend: {
        value: "+5.2%",
        label: "vs. mes anterior",
        positive: false
      }
    },
  ]

  return (
    <>
      {cards.map((card, index) => (
        <Card 
          key={index} 
          className={`${card.className} border-none transition-all hover:scale-[1.02] group cursor-default`}
        >
          <div className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                {card.title}
              </p>
              <card.icon className={`h-5 w-5 ${card.iconClassName} transition-transform group-hover:scale-110`} />
            </div>
            <div className="mt-2">
              <p className="text-2xl font-bold">
                {typeof card.value === "number" ? card.value.toLocaleString() : card.value}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {card.description}
              </p>
              <div className={`mt-2 text-xs inline-flex items-center rounded-full px-2 py-1 font-medium ${
                card.trend.positive 
                  ? 'text-green-700 bg-green-100 dark:text-green-400 dark:bg-green-900/30' 
                  : 'text-red-700 bg-red-100 dark:text-red-400 dark:bg-red-900/30'
              }`}>
                {card.trend.positive ? '↑' : '↓'} {card.trend.value}
                <span className="ml-1 text-muted-foreground">
                  {card.trend.label}
                </span>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </>
  )
}