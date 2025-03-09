# OsunApp Feature Development TODO

## Packages Management (DONE)
- Implement package tracking to show sales data (e.g., "20 packages with yellow stole sold at Cardier")
- Enable beneficiary linking when creating packages
- Add beneficiary data collection:
  - Apellidos (Last Names)
  - Nombres (First Names)
  - Colegio (School) - with foreign key relationship
  - Nivel (Level/Grade)
  - Seccion (Section/Class)

## Recognitions & Certifications (DONE)
- Highlight incomplete beneficiary data in red and mark with "incomplete" status
- Build section templates system for organizations:
  - Add nature/type field (Public/Private)
  - Add city field with table for city management
  - Create organization section management (this is new table):
    - Support multiple levels (Preescolar, 5TO Año, etc.)
    - Store templateLink for each section
    - Make system scalable for different organization types
  - Show dropdown of organization sections with template status

## Dashboard & Metrics (DONE)
- Add metrics dashboard on organization view
- Track pending payments
- Visualize sales data and projections

## Sales & Payment Management (DONE)
- Implement different sale types:
  - Direct sales
  - Pre-sales (with package and client selection)
- Create automatic installment generation based on frequency
- Build payments table to track payments against sales
- Add popover client selector with inline creation capability
- Enable deletion of packages
- Link package sales to organizations for reporting

## Inventory Management (DONE)
- Enhance global and organization-specific package management
- Improve category utilization for package grouping
- Add inventory adjustment functionality:
  - Record inventory changes with reason
  - Track history of inventory modifications
- Create purchase registration module:
  - Select from existing items
  - Update quantity and price
  - Calculate cost averaging when new stock arrives
- Implement margin setting (from cost price or manual)
- Improve inventory table with pagination
- Add top-sold items graph
- Display items needing restock
- Add projection field for inventory planning
- Support soft deletion (disable) of inventory items
- Enable package creation from template/existing packages
- Modify package creation to use inventory sale price by default:
  - Show cost calculation based on items
  - Calculate and display package margin

## UI/UX Improvements (PENDING)
- Fix delete button functionality on package items
- Create Pre-Sale flag to allow selling without stock
- Enhance client search in sales:
  - Search by ID/Name
  - Display client and organization info
