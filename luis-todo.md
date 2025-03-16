
# OsunApp New Features TODO

## Inventory Management (DONE)
- Manage cost prices and display when assembling bundles:
  - Show cost price and base price (sale price) during bundle creation
  - Enhance bundle assembly interface for easier use
- Enhance purchase management:
  - Add credit purchase support with file uploads
  - Generate accounts payable (cuentas por pagar)
  - Improve structure to handle payments and partial payments
  - Track pending payments

  (Solo queda resolver lo del pago completo, para que puedas pagar exacto, colocar en la ruta de bundles, para que se pueda asignar una organizacion a un bundle en especifico y tambien, poder crear una categoria.)

## Sales & Payment Management
- Implement draft sales system:
  - Add draft/pending status for sales
  - Create separate table view for sales pending approval
  - Move draft sales from main table
- Enhance payment tracking:
  - Register partial payments (abonos)
  - Update purchase pending amounts
  - Example flow:
    * Sale total: $30
    * Payment received: $20
    * Track remaining balance
- Add daily sales reporting:
  - Break down direct sales vs payments
  - Create daily closure report (cierre)
- Implement dual currency support:
  - Track payments in BS and USD  
  - Add conversion rate management
  - Allow payment currency selection
  - Track conversion rates for payments
- Add button to mark sale as vendido (true/false) (this is not for vendido exactly, just add a field vendido on sale to make it work)

(Me falta hacer que calcule de usd a bs o viceverza a una tasa insertada.)

## Client Management (DONE)
- Implement payment tracking:
  - Send payment confirmation messages
  - Show payment breakdown:
    * Total payment
    * Partial payments (abonos)
    * Remaining balance
  - Manual collection tracking
- Add pending account detection:
  - Check for last payment > 30 days
  - Set deudor parameter automatically


## Parameter Updates
- Rename "Cancelado" parameter to "anulado"
