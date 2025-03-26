"use client"

import { useState, useEffect, useTransition, useRef } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { formatDate, cn } from "@/lib/utils"
import {
  ArrowLeft,
  Loader2,
  Package,
  User,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Tag,
  Receipt,
  MapPin,
  Phone,
  Mail,
  Building2,
  CreditCardIcon,
  CalendarRange,
  ChevronRight,
  DollarSign,
  Truck,
  FilePenLine,
  FileCheck,
  Coins,
  Gift,
  RefreshCw,
} from "lucide-react"
import {
  updatePurchaseStatus,
  updateSaleDraftStatus,
  updateSaleVendidoStatus,
  updateSaleCurrency,
  updateSaleDonation,
} from "@/features/sales/actions"
import { useToast } from "@/hooks/use-toast"
import { StatusTimeline } from "@/features/sales/status-timeline"
import { PaymentsTable } from "@/features/sales/views/plan/payments-table"
import { PaymentPlanDialog } from "@/features/sales/views/plan/payment-plan-dialog"
import { PartialPaymentDialog } from "@/features/sales/views/partial-payment-dialog"
import { getPaymentsByPurchase, getPaymentPlan, getRemainingBalance } from "@/features/sales/views/payment-actions"
import { ExportSaleButton } from "@/features/sales/views/export/export-sale-button"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { getBCVRate } from "@/lib/exchangeRates"
import { formatSaleCurrency } from "@/lib/exchangeRates"

const statusLabels = {
  PENDING: "Pendiente",
  APPROVED: "Entregado",
  IN_PROGRESS: "En Proceso",
  COMPLETED: "Completado",
  CANCELLED: "Cancelado",
}

const statusIcons = {
  PENDING: Clock,
  APPROVED: CheckCircle2,
  IN_PROGRESS: Truck,
  COMPLETED: CheckCircle2,
  CANCELLED: XCircle,
}

const statusColors = {
  PENDING: {
    bg: "bg-amber-50 dark:bg-amber-950/30",
    text: "text-amber-700 dark:text-amber-300",
    border: "border-amber-200 dark:border-amber-800/50",
    hover: "hover:bg-amber-100 dark:hover:bg-amber-900/40",
  },
  APPROVED: {
    bg: "bg-blue-50 dark:bg-blue-950/30",
    text: "text-blue-700 dark:text-blue-300",
    border: "border-blue-200 dark:border-blue-800/50",
    hover: "hover:bg-blue-100 dark:hover:bg-blue-900/40",
  },
  IN_PROGRESS: {
    bg: "bg-purple-50 dark:bg-purple-950/30",
    text: "text-purple-700 dark:text-purple-300",
    border: "border-purple-200 dark:border-purple-800/50",
    hover: "hover:bg-purple-100 dark:hover:bg-purple-900/40",
  },
  COMPLETED: {
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    text: "text-emerald-700 dark:text-emerald-300",
    border: "border-emerald-200 dark:border-emerald-800/50",
    hover: "hover:bg-emerald-100 dark:hover:bg-emerald-900/40",
  },
  CANCELLED: {
    bg: "bg-rose-50 dark:bg-rose-950/30",
    text: "text-rose-700 dark:text-rose-300",
    border: "border-rose-200 dark:border-rose-800/50",
    hover: "hover:bg-rose-100 dark:hover:bg-rose-900/40",
  },
}

const saleTypeLabels = {
  DIRECT: "Venta Directa",
  PRESALE: "Preventa",
  DONATION: "Donación",
}

const saleTypeIcons = {
  DIRECT: Package,
  PRESALE: CalendarRange,
  DONATION: Gift,
}

const paymentMethodIcons = {
  CASH: DollarSign,
  CARD: CreditCardIcon,
  TRANSFER: Receipt,
}

export function SaleDetails({ sale }: { sale: any }) {
  const router = useRouter()
  const { toast } = useToast()
  const [currentStatus, setCurrentStatus] = useState(sale.status)
  const [isPending, startTransition] = useTransition()
  const [hoveredItem, setHoveredItem] = useState<number | null>(null)
  const [payments, setPayments] = useState<any[]>([])
  const [paymentPlan, setPaymentPlan] = useState<any>(null)
  const [showPaymentPlanDialog, setShowPaymentPlanDialog] = useState(false)
  const [showPartialPaymentDialog, setShowPartialPaymentDialog] = useState(false)
  const [isLoadingPayments, setIsLoadingPayments] = useState(false)
  const [isDraft, setIsDraft] = useState(sale.isDraft || false)
  const [isUpdatingDraft, setIsUpdatingDraft] = useState(false)
  const [vendido, setVendido] = useState(sale.vendido || false)
  const [isUpdatingVendido, setIsUpdatingVendido] = useState(false)
  const [currencyType, setCurrencyType] = useState(sale.currencyType || "USD")
  const [conversionRate, setConversionRate] = useState(sale.conversionRate || "1")
  const [isUpdatingCurrency, setIsUpdatingCurrency] = useState(false)
  const [remainingBalance, setRemainingBalance] = useState<any>(null)
  const [showVendidoDialog, setShowVendidoDialog] = useState(false)
  const [vendidoCode, setVendidoCode] = useState("")
  const [isDonation, setIsDonation] = useState(sale.isDonation || false)
  const [isUpdatingDonation, setIsUpdatingDonation] = useState(false)
  const [isLoadingBCVRate, setIsLoadingBCVRate] = useState(false)
  const [paymentCurrency, setPaymentCurrency] = useState(sale.currencyType || "USD")
  const [paymentAmount, setPaymentAmount] = useState("")
  const [convertedAmount, setConvertedAmount] = useState("")
  const [showPaymentCurrencyDialog, setShowPaymentCurrencyDialog] = useState(false)

  // Keyboard shortcut for vendido
  const keysPressed = useRef<Set<string>>(new Set())

  useEffect(() => {
    fetchPayments()
    fetchRemainingBalance()

    // Set up keyboard shortcut listener for vendido easter egg
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current.add(e.key.toLowerCase())

      // Check if Ctrl + B + 6 is pressed
      if (keysPressed.current.has("control") && keysPressed.current.has("b") && keysPressed.current.has("6")) {
        setShowVendidoDialog(true)
        keysPressed.current.clear()
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current.delete(e.key.toLowerCase())
    }

    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
      keysPressed.current.clear()
    }
  }, [])

  const fetchPayments = async () => {
    setIsLoadingPayments(true)
    try {
      const [paymentsResult, planResult] = await Promise.all([getPaymentsByPurchase(sale.id), getPaymentPlan(sale.id)])

      if (paymentsResult.success) {
        setPayments(paymentsResult.data || [])
      }
      if (planResult.success) {
        setPaymentPlan(planResult.data)
      }
    } catch (error) {
      console.error("Error fetching payments:", error)
    } finally {
      setIsLoadingPayments(false)
    }
  }

  const fetchRemainingBalance = async () => {
    try {
      const result = await getRemainingBalance(sale.id)
      if (result.success) {
        setRemainingBalance(result.data)
      }
    } catch (error) {
      console.error("Error fetching remaining balance:", error)
    }
  }

  // Update the fetchBCVRate function to use your existing implementation
  const fetchBCVRate = async () => {
    try {
      setIsLoadingBCVRate(true)
      const rateInfo = await getBCVRate()
      setConversionRate(rateInfo.rate.toString())

      toast({
        title: "Tasa BCV actualizada",
        description: `Tasa actual: ${rateInfo.rate} Bs/USD (${rateInfo.isError ? "tasa de respaldo" : "actualizada: " + rateInfo.lastUpdate})`,
        className: "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo obtener la tasa BCV",
        variant: "destructive",
      })
    } finally {
      setIsLoadingBCVRate(false)
    }
  }

  const isValidStatus = (status: string): boolean => {
    return Object.keys(statusLabels).includes(status)
  }

  const handleStatusChange = (newStatus: string) => {
    if (!isValidStatus(newStatus)) {
      toast({
        title: "Error",
        description: "El estado seleccionado no es válido.",
        variant: "destructive",
      })
      return
    }

    startTransition(async () => {
      try {
        const result = await updatePurchaseStatus(sale.id, newStatus)

        if (result.success) {
          setCurrentStatus(newStatus)
          toast({
            title: "Estado actualizado",
            description: `La venta ahora está ${statusLabels[newStatus as keyof typeof statusLabels].toLowerCase()}`,
            className: cn(
              statusColors[newStatus as keyof typeof statusColors].bg,
              statusColors[newStatus as keyof typeof statusColors].text,
              statusColors[newStatus as keyof typeof statusColors].border,
              "border",
            ),
          })
        } else {
          throw new Error(result.error || "Error al actualizar el estado")
        }
      } catch (error) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Error desconocido",
          variant: "destructive",
        })
      }
    })
  }

  const handleDraftChange = async (checked: boolean) => {
    try {
      setIsUpdatingDraft(true)
      const result = await updateSaleDraftStatus(sale.id, checked)

      if (result.success) {
        setIsDraft(checked)
        toast({
          title: checked ? "Venta marcada como borrador" : "Venta aprobada",
          description: checked
            ? "La venta ha sido marcada como borrador"
            : "La venta ha sido aprobada y ya no es un borrador",
          className: checked
            ? "bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800"
            : "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800",
        })
      } else {
        throw new Error(result.error || "Error al actualizar el estado de borrador")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive",
      })
      // Revert the switch if there was an error
      setIsDraft(!checked)
    } finally {
      setIsUpdatingDraft(false)
    }
  }

  const handleVendidoChange = async (checked: boolean) => {
    try {
      setIsUpdatingVendido(true)
      const result = await updateSaleVendidoStatus(sale.id, checked)

      if (result.success) {
        setVendido(checked)
        toast({
          title: checked ? "Venta marcada como vendida" : "Venta desmarcada",
          description: checked ? "La venta ha sido marcada como vendida" : "La venta ha sido desmarcada como vendida",
          className: checked
            ? "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800"
            : "bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800",
        })
      } else {
        throw new Error(result.error || "Error al actualizar el estado de vendido")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive",
      })
      // Revert the switch if there was an error
      setVendido(!checked)
    } finally {
      setIsUpdatingVendido(false)
    }
  }

  const handleDonationChange = async (checked: boolean) => {
    try {
      setIsUpdatingDonation(true)
      const result = await updateSaleDonation(sale.id, checked)

      if (result.success) {
        setIsDonation(checked)
        // If marking as donation, also mark as draft
        if (checked && !isDraft) {
          setIsDraft(true)
        }

        toast({
          title: checked ? "Venta marcada como donación" : "Venta desmarcada como donación",
          description: checked
            ? "La venta ha sido marcada como donación y está pendiente de aprobación"
            : "La venta ya no es una donación",
          className: checked
            ? "bg-purple-50 border-purple-200 dark:bg-purple-900/20 dark:border-purple-800"
            : "bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800",
        })
      } else {
        throw new Error(result.error || "Error al actualizar el estado de donación")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive",
      })
      // Revert the switch if there was an error
      setIsDonation(!checked)
    } finally {
      setIsUpdatingDonation(false)
    }
  }

  const handleCurrencyUpdate = async () => {
    try {
      setIsUpdatingCurrency(true)
      const result = await updateSaleCurrency(sale.id, currencyType, Number(conversionRate))

      if (result.success) {
        toast({
          title: "Moneda actualizada",
          description: `La moneda ha sido actualizada a ${currencyType} con tasa de ${conversionRate}`,
          className: "bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800",
        })
      } else {
        throw new Error(result.error || "Error al actualizar la moneda")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive",
      })
    } finally {
      setIsUpdatingCurrency(false)
    }
  }

  const handleVendidoCodeSubmit = () => {
    // Check if code is correct (hardcoded as 1234)
    if (vendidoCode === "1234") {
      handleVendidoChange(!vendido)
      setShowVendidoDialog(false)
      setVendidoCode("")
    } else {
      toast({
        title: "Código incorrecto",
        description: "El código ingresado no es válido",
        variant: "destructive",
      })
    }
  }

  const handlePaymentCurrencyChange = (value: string) => {
    setPaymentCurrency(value)

    // If changing to BS, calculate the converted amount
    if (value === "BS" && paymentAmount) {
      const converted = (Number.parseFloat(paymentAmount) * Number.parseFloat(conversionRate)).toFixed(2)
      setConvertedAmount(converted)
    } else if (value === "USD" && convertedAmount) {
      // If changing to USD, calculate back from BS
      const original = (Number.parseFloat(convertedAmount) / Number.parseFloat(conversionRate)).toFixed(2)
      setPaymentAmount(original)
    }
  }

  const handlePaymentAmountChange = (value: string) => {
    setPaymentAmount(value)

    // Calculate converted amount if currency is BS
    if (paymentCurrency === "BS" && value) {
      const converted = (Number.parseFloat(value) / Number.parseFloat(conversionRate)).toFixed(2)
      setConvertedAmount(converted)
    }
  }

  const handleConvertedAmountChange = (value: string) => {
    setConvertedAmount(value)

    // Calculate original amount if currency is BS
    if (paymentCurrency === "BS" && value) {
      const original = (Number.parseFloat(value) * Number.parseFloat(conversionRate)).toFixed(2)
      setPaymentAmount(original)
    }
  }

  const PaymentMethodIcon = paymentMethodIcons[sale.paymentMethod as keyof typeof paymentMethodIcons] || CreditCardIcon
  const SaleTypeIcon = saleTypeIcons[(isDonation ? "DONATION" : sale.saleType) as keyof typeof saleTypeIcons] || Package
  const StatusIcon = statusIcons[currentStatus as keyof typeof statusIcons]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="max-w-[90rem] mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col gap-8 mb-8">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="group text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
            >
              <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
              Volver
            </Button>
            <ExportSaleButton saleId={sale.id} variant="outline" />
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex flex-col gap-2">
              <h1 className="text-4xl font-bold tracking-tight flex items-center gap-2">
                Venta #{sale.id.slice(0, 8)}
                {isDraft && (
                  <Badge
                    variant="outline"
                    className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 ml-2"
                  >
                    <FilePenLine className="h-3.5 w-3.5 mr-1" />
                    Borrador
                  </Badge>
                )}
                {isDonation && (
                  <Badge
                    variant="outline"
                    className="bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 ml-2"
                  >
                    <Gift className="h-3.5 w-3.5 mr-1" />
                    Donación
                  </Badge>
                )}
              </h1>
              <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(sale.purchaseDate)}</span>
                <ChevronRight className="h-4 w-4" />
                <Badge className="flex items-center gap-1.5">
                  <SaleTypeIcon className="h-3.5 w-3.5" />
                  {isDonation 
                    ? saleTypeLabels.DONATION 
                    : saleTypeLabels[sale.saleType as keyof typeof saleTypeLabels]}
                </Badge>
              </div>
            </div>

            <Badge
              variant="outline"
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-full",
                statusColors[currentStatus as keyof typeof statusColors].bg,
                statusColors[currentStatus as keyof typeof statusColors].text,
                statusColors[currentStatus as keyof typeof statusColors].border,
              )}
            >
              <StatusIcon className="inline-block h-4 w-4 mr-2" />
              {statusLabels[currentStatus as keyof typeof statusLabels]}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="xl:col-span-2 space-y-8">
            {/* Draft, Vendido, and Donation Status */}
            <Card className="overflow-hidden border-none bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl">
              <div className="p-6">
                <h2 className="text-lg font-semibold mb-4">Estado de la Venta</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FilePenLine className="h-5 w-5 text-amber-500" />
                      <div>
                        <p className="font-medium">Borrador</p>
                        <p className="text-sm text-muted-foreground">Marcar como borrador pendiente de aprobación</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Switch
                        checked={isDraft}
                        onCheckedChange={handleDraftChange}
                        disabled={isUpdatingDraft}
                        className={cn(isDraft ? "bg-amber-500" : "bg-gray-200 dark:bg-gray-700")}
                      />
                      {isUpdatingDraft && <Clock className="ml-2 h-3 w-3 animate-spin text-muted-foreground" />}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileCheck className="h-5 w-5 text-green-500" />
                      <div>
                        <p className="font-medium">Vendido</p>
                        <p className="text-sm text-muted-foreground">Marcar esta venta como vendida</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Switch
                        checked={vendido}
                        onCheckedChange={handleVendidoChange}
                        disabled={isUpdatingVendido}
                        className={cn(vendido ? "bg-green-500" : "bg-gray-200 dark:bg-gray-700")}
                      />
                      {isUpdatingVendido && <Clock className="ml-2 h-3 w-3 animate-spin text-muted-foreground" />}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Gift className="h-5 w-5 text-purple-500" />
                      <div>
                        <p className="font-medium">Donación</p>
                        <p className="text-sm text-muted-foreground">Marcar como donación (solo admin)</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Switch
                        checked={isDonation}
                        onCheckedChange={handleDonationChange}
                        disabled={isUpdatingDonation}
                        className={cn(isDonation ? "bg-purple-500" : "bg-gray-200 dark:bg-gray-700")}
                      />
                      {isUpdatingDonation && <Clock className="ml-2 h-3 w-3 animate-spin text-muted-foreground" />}
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Currency Settings */}
            <Card className="overflow-hidden border-none bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl">
              <div className="p-6">
                <h2 className="text-lg font-semibold mb-4">Configuración de Moneda</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="currencyType">Moneda</Label>
                    <Select value={currencyType} onValueChange={setCurrencyType}>
                      <SelectTrigger id="currencyType">
                        <SelectValue placeholder="Seleccionar moneda" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="BS">BS</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="conversionRate">Tasa de cambio</Label>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={fetchBCVRate} 
                        disabled={isLoadingBCVRate}
                        className="h-6 px-2 text-xs"
                      >
                        <RefreshCw className={`h-3 w-3 mr-1 ${isLoadingBCVRate ? "animate-spin" : ""}`} />
                        Tasa BCV
                      </Button>
                    </div>
                    <Input
                      id="conversionRate"
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={conversionRate}
                      onChange={(e) => setConversionRate(e.target.value)}
                      placeholder="Tasa BS/USD"
                    />
                  </div>

                  <div className="col-span-1 md:col-span-2">
                    <Button onClick={handleCurrencyUpdate} disabled={isUpdatingCurrency} className="w-full">
                      {isUpdatingCurrency ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Actualizando...
                        </>
                      ) : (
                        <>
                          <Coins className="mr-2 h-4 w-4" />
                          Actualizar Moneda
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </Card>

            {/* Status Timeline */}
            <Card className="overflow-hidden border-none bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl">
              <div className="p-6">
                <h2 className="text-lg font-semibold mb-4">Estado del Pedido</h2>
                <StatusTimeline currentStatus={currentStatus} />
              </div>
              <Separator />
              <div className="p-6 bg-gray-50/50 dark:bg-gray-950/50">
                <div className="flex flex-wrap gap-2">
                  {Object.entries(statusLabels).map(([value, label]) => {
                    const StatusIcon = statusIcons[value as keyof typeof statusIcons]
                    const isActive = currentStatus === value
                    const colors = statusColors[value as keyof typeof statusColors]

                    return (
                      <Button
                        key={value}
                        variant={isActive ? "default" : "outline"}
                        size="sm"
                        className={cn(
                          "transition-all duration-300",
                          isActive && colors.bg,
                          isActive && colors.text,
                          isActive && colors.border,
                          !isActive && colors.hover,
                        )}
                        onClick={() => handleStatusChange(value)}
                        disabled={isPending || isActive}
                      >
                        <StatusIcon className="h-4 w-4 mr-2" />
                        {label}
                      </Button>
                    )
                  })}
                </div>
              </div>
            </Card>

            {/* Products */}
            <Card className="overflow-hidden border-none bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl">
              <div className="p-6">
                <h2 className="text-lg font-semibold mb-4">Productos</h2>
                <div className="space-y-4">
                  <AnimatePresence>
                    {sale.items.map((item: any, index: number) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className={cn(
                          "group p-4 rounded-xl transition-all duration-300",
                          "bg-gray-50/50 dark:bg-gray-950/50",
                          "hover:bg-gray-100/50 dark:hover:bg-gray-900/50",
                          hoveredItem === index && "ring-2 ring-primary/10",
                        )}
                        onMouseEnter={() => setHoveredItem(index)}
                        onMouseLeave={() => setHoveredItem(null)}
                      >
                        <div className="flex items-center gap-6">
                          <div className="h-16 w-16 rounded-lg bg-white dark:bg-gray-800 flex items-center justify-center shadow-sm">
                            <Package className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium truncate">{item.inventoryItem?.name || "Producto eliminado"}</h3>
                            <div className="flex items-center gap-4 mt-1 text-sm text-gray-500 dark:text-gray-400">
                              <span>{item.quantity} unidades</span>
                              <span>•</span>
                              <span>{formatSaleCurrency(Number(item.unitPrice), sale.currencyType)} c/u</span>
                              {hoveredItem === index && (
                                <>
                                  <span>•</span>
                                  <span className="flex items-center gap-1">
                                    <Tag className="h-3.5 w-3.5" />
                                    SKU: {item.inventoryItem?.sku || "N/A"}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="font-semibold">{formatSaleCurrency(Number(item.totalPrice), sale.currencyType)}</span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
              <Separator />
              <div className="p-6 bg-gray-50/50 dark:bg-gray-950/50">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Total</span>
                  <span className="text-2xl font-bold">
                    {formatSaleCurrency(Number(sale.totalAmount), sale.currencyType)}
                  </span>
                </div>
              </div>
            </Card>

            {/* Payments */}
            {(payments.length > 0 || sale.saleType === "PRESALE" || remainingBalance) && (
              <Card className="overflow-hidden border-none bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold">Pagos</h2>
                    <div className="flex items-center gap-2">
                      {paymentPlan && (
                        <Badge variant="outline" className="px-3 py-1.5">
                          Plan: {paymentPlan.installmentCount} cuotas{" "}
                          {paymentPlan.installmentFrequency === "WEEKLY"
                            ? "semanales"
                            : paymentPlan.installmentFrequency === "BIWEEKLY"
                              ? "quincenales"
                              : "mensuales"}
                        </Badge>
                      )}

                      {remainingBalance && remainingBalance.remainingAmount > 0 && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => {
                            if (currencyType !== sale.currencyType) {
                              setShowPaymentCurrencyDialog(true)
                            } else {
                              setShowPartialPaymentDialog(true)
                            }
                          }}
                        >
                          <Coins className="mr-2 h-4 w-4" />
                          Registrar Abono
                        </Button>
                      )}
                    </div>
                  </div>

                  {remainingBalance && (
                    <div className="bg-muted/30 p-4 rounded-lg mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Total</p>
                        <p className="text-lg font-bold">
                          {formatSaleCurrency(remainingBalance.totalAmount, remainingBalance.currencyType)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Pagado</p>
                        <p className="text-lg font-bold">
                          {formatSaleCurrency(remainingBalance.totalPaid, remainingBalance.currencyType)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Pendiente</p>
                        <p className="text-lg font-bold">
                          {formatSaleCurrency(remainingBalance.remainingAmount, remainingBalance.currencyType)}
                        </p>
                      </div>
                    </div>
                  )}

                  {isLoadingPayments ? (
                    <div className="flex justify-center items-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : (
                    <PaymentsTable payments={payments} onPaymentUpdated={fetchPayments} />
                  )}
                </div>

                {sale.saleType === "PRESALE" && !paymentPlan && (
                  <>
                    <Separator />
                    <div className="p-6 bg-gray-50/50 dark:bg-gray-950/50">
                      <Button onClick={() => setShowPaymentPlanDialog(true)} className="w-full">
                        <CreditCardIcon className="h-4 w-4 mr-2" />
                        Crear Plan de Pago
                      </Button>
                    </div>
                  </>
                )}
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Client Info */}
            <Card className="overflow-hidden border-none bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl">
              <div className="p-6">
                <h2 className="text-lg font-semibold mb-4">Cliente</h2>
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                      <User className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                    </div>
                    <div>
                      <p className="font-medium">{sale.client?.name || "Cliente no registrado"}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{sale.client?.document}</p>
                    </div>
                  </div>

                  {(sale.client?.address || sale.client?.phone || sale.client?.email) && (
                    <div className="space-y-3 text-sm">
                      {sale.client?.address && (
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                          <MapPin className="h-4 w-4 shrink-0" />
                          <span>{sale.client.address}</span>
                        </div>
                      )}
                      {sale.client?.phone && (
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                          <Phone className="h-4 w-4 shrink-0" />
                          <span>{sale.client.phone}</span>
                        </div>
                      )}
                      {sale.client?.email && (
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                          <Mail className="h-4 w-4 shrink-0" />
                          <span>{sale.client.email}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {sale.organization && (
                <>
                  <Separator />
                  <div className="p-6 bg-gray-50/50 dark:bg-gray-950/50">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                        <Building2 className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                      </div>
                      <div>
                        <p className="font-medium">{sale.organization.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {sale.organization.type === "SCHOOL"
                            ? "Escuela"
                            : sale.organization.type === "COMPANY"
                              ? "Empresa"
                              : "Organización"}
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </Card>

            {/* Payment Info */}
            <Card className="overflow-hidden border-none bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl">
              <div className="p-6">
                <h2 className="text-lg font-semibold mb-4">Pago</h2>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                      <PaymentMethodIcon className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {sale.paymentMethod === "CASH"
                          ? "Efectivo"
                          : sale.paymentMethod === "CARD"
                            ? "Tarjeta"
                            : sale.paymentMethod === "TRANSFER"
                              ? "Transferencia"
                              : sale.paymentMethod}
                      </p>
                      <Badge
                        variant={sale.isPaid ? "success" : "outline"}
                        className={cn(
                          "mt-2",
                          sale.isPaid
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300"
                            : ""
                        )}
                      >
                        {sale.isPaid ? "Pagado" : "Pendiente"}
                      </Badge>
                    </div>
                  </div>

                  {sale.transactionReference && (
                    <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Referencia de pago</p>
                      <code className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 font-mono text-sm">
                        {sale.transactionReference}
                      </code>
                    </div>
                  )}
                </div>
              </div>

              {sale.saleType === "PRESALE" && !paymentPlan && (
                <>
                  <Separator />
                  <div className="p-6 bg-amber-50/50 dark:bg-amber-950/30">
                    <div className="flex items-start gap-3 mb-4">
                      <AlertCircle className="h-5 w-5 text-amber-500 dark:text-amber-400 shrink-0" />
                      <div>
                        <p className="font-medium text-amber-700 dark:text-amber-300">Sin plan de pago</p>
                        <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
                          Esta preventa requiere un plan de pago para gestionar los pagos a plazos.
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={() => setShowPaymentPlanDialog(true)}
                      className="w-full bg-amber-500 hover:bg-amber-600 text-white"
                    >
                      <CreditCardIcon className="h-4 w-4 mr-2" />
                      Crear Plan de Pago
                    </Button>
                  </div>
                </>
              )}
            </Card>
          </div>
        </div>

      {/* Vendido Code Dialog */}
      <Dialog open={showVendidoDialog} onOpenChange={setShowVendidoDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Confirmar acción</DialogTitle>
            <DialogDescription>
              Ingrese el código para marcar esta venta como vendida
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              type="password"
              placeholder="Código de autorización"
              value={vendidoCode}
              onChange={(e) => setVendidoCode(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowVendidoDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleVendidoCodeSubmit}>Confirmar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Plan Dialog */}
      <PaymentPlanDialog
        open={showPaymentPlanDialog}
        onOpenChange={setShowPaymentPlanDialog}
        purchaseId={sale.id}
        totalAmount={Number.parseFloat(sale.totalAmount)}
        onSuccess={() => {
          fetchPayments()
          fetchRemainingBalance()
        }}
      />

      {/* Partial Payment Dialog */}
      <PartialPaymentDialog
        open={showPartialPaymentDialog}
        onOpenChange={setShowPartialPaymentDialog}
        purchaseId={sale.id}
        onSuccess={() => {
          fetchPayments()
          fetchRemainingBalance()
        }}
      />

      {/* Payment Currency Dialog */}
      <Dialog open={showPaymentCurrencyDialog} onOpenChange={setShowPaymentCurrencyDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Configuración de Pago</DialogTitle>
            <DialogDescription>
              La moneda de la venta ({sale.currencyType}) es diferente a la moneda actual ({currencyType}).
              Por favor, configure los detalles del pago.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="paymentCurrency">Moneda de Pago</Label>
              <Select value={paymentCurrency} onValueChange={handlePaymentCurrencyChange}>
                <SelectTrigger id="paymentCurrency">
                  <SelectValue placeholder="Seleccionar moneda" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="BS">BS</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {paymentCurrency === "BS" ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="bsAmount">Monto en Bs</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-muted-foreground">Bs.</span>
                    <Input
                      id="bsAmount"
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={paymentAmount}
                      onChange={(e) => handlePaymentAmountChange(e.target.value)}
                      placeholder="0.00"
                      className="pl-9"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="usdAmount">Equivalente en USD</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="usdAmount"
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={convertedAmount}
                      onChange={(e) => handleConvertedAmountChange(e.target.value)}
                      placeholder="0.00"
                      className="pl-9"
                    />
                  </div>
                  <div className="text-sm text-muted-foreground flex justify-between">
                    <span>Tasa: {conversionRate} Bs/USD</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={fetchBCVRate}
                      disabled={isLoadingBCVRate}
                      className="h-6 px-2 text-xs"
                    >
                      <RefreshCw className={`h-3 w-3 mr-1 ${isLoadingBCVRate ? "animate-spin" : ""}`} />
                      Actualizar Tasa BCV
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="usdAmount">Monto en USD</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="usdAmount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={paymentAmount}
                    onChange={(e) => handlePaymentAmountChange(e.target.value)}
                    placeholder="0.00"
                    className="pl-9"
                  />
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaymentCurrencyDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={() => {
                setShowPaymentCurrencyDialog(false)
                setShowPartialPaymentDialog(true)
              }}
              disabled={!paymentAmount}
            >
              Continuar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  </div>
  )
}


