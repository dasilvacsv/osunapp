Below is the SQL script to insert mock data into your PostgreSQL database using Drizzle ORM. This script focuses on the **items-related tables** (`inventory_items`, `inventory_transactions`, `bundles`, and `bundle_items`). The data is structured in a way that ensures relationships between tables are maintained.

---

### SQL Script for Mock Data

```sql
-- Insert mock data into inventory_items
INSERT INTO inventory_items (id, name, sku, description, type, base_price, current_stock, reserved_stock, minimum_stock, metadata, status)
VALUES 
('123e4567-e89b-12d3-a456-426614174001', 'Laptop', 'SKU-LAPTOP-001', 'High-performance laptop for students', 'PHYSICAL', 1200.00, 10, 2, 5, '{"brand": "Dell", "model": "XPS 13"}', 'ACTIVE'),
('123e4567-e89b-12d3-a456-426614174002', 'E-book Reader', 'SKU-EREADER-002', 'Portable e-book reader with backlight', 'DIGITAL', 150.00, 20, 0, 3, '{"brand": "Kindle", "model": "Paperwhite"}', 'ACTIVE'),
('123e4567-e89b-12d3-a456-426614174003', 'Consultation Service', 'SKU-SERVICE-003', 'One-on-one academic consultation', 'SERVICE', 50.00, 0, 0, '{"duration": "1 hour", "expertise": "Mathematics"}', 'ACTIVE');

-- Insert mock data into inventory_transactions
INSERT INTO inventory_transactions (id, item_id, quantity, transaction_type, reference, notes)
VALUES 
('123e4567-e89b-12d3-a456-426614175001', '123e4567-e89b-12d3-a456-426614174001', 5, 'RESTOCK', '{"purchase_order": "PO-12345"}', 'Restocked laptops from supplier'),
('123e4567-e89b-12d3-a456-426614175002', '123e4567-e89b-12d3-a456-426614174002', -3, 'SALE', '{"sale_order": "SO-67890"}', 'Sold 3 e-book readers'),
('123e4567-e89b-12d3-a456-426614175003', '123e4567-e89b-12d3-a456-426614174003', -1, 'SERVICE_BOOKING', '{"booking_id": "BK-11223"}', 'Booked consultation service');

-- Insert mock data into bundles
INSERT INTO bundles (id, name, description, type, organization_id, base_price, discount_percentage, status)
VALUES 
('123e4567-e89b-12d3-a456-426614176001', 'Student Starter Pack', 'Bundle for new students', 'SCHOOL_PACKAGE', NULL, 1300.00, 10.00, 'ACTIVE'),
('123e4567-e89b-12d3-a456-426614176002', 'Digital Learning Kit', 'Bundle for digital learning', 'REGULAR', NULL, 200.00, 5.00, 'ACTIVE');

-- Insert mock data into bundle_items
INSERT INTO bundle_items (id, bundle_id, item_id, quantity, override_price)
VALUES 
('123e4567-e89b-12d3-a456-426614177001', '123e4567-e89b-12d3-a456-426614176001', '123e4567-e89b-12d3-a456-426614174001', 1, 1100.00),
('123e4567-e89b-12d3-a456-426614177002', '123e4567-e89b-12d3-a456-426614176001', '123e4567-e89b-12d3-a456-426614174002', 1, 150.00),
('123e4567-e89b-12d3-a456-426614177003', '123e4567-e89b-12d3-a456-426614176002', '123e4567-e89b-12d3-a456-426614174002', 2, 140.00),
('123e4567-e89b-12d3-a456-426614177004', '123e4567-e89b-12d3-a456-426614176002', '123e4567-e89b-12d3-a456-426614174003', 1, 45.00);
```

---

### Explanation of the Data

1. **`inventory_items` Table**:
   - Contains three items: a physical laptop, a digital e-book reader, and a service (consultation).
   - Each item has a unique SKU, base price, stock details, and metadata.

2. **`inventory_transactions` Table**:
   - Tracks transactions related to the items:
     - A restock of 5 laptops.
     - A sale of 3 e-book readers.
     - A booking of 1 consultation service.

3. **`bundles` Table**:
   - Two bundles are created:
     - A "Student Starter Pack" containing a laptop and an e-book reader.
     - A "Digital Learning Kit" containing multiple e-book readers and a consultation service.

4. **`bundle_items` Table**:
   - Links items to bundles with quantities and optional override prices:
     - The "Student Starter Pack" includes 1 laptop and 1 e-book reader.
     - The "Digital Learning Kit" includes 2 e-book readers and 1 consultation service.

---

### How to Use This Script

1. Copy the SQL script into your Drizzle SQL console or any PostgreSQL client.
2. Execute the script to populate the database with mock data.
3. Query the tables to visualize the relationships between items, transactions, and bundles.

For example:
```sql
-- View all inventory items
SELECT * FROM inventory_items;

-- View all transactions
SELECT * FROM inventory_transactions;

-- View all bundles and their items
SELECT b.name AS bundle_name, i.name AS item_name, bi.quantity, bi.override_price
FROM bundle_items bi
JOIN bundles b ON bi.bundle_id = b.id
JOIN inventory_items i ON bi.item_id = i.id;
```

This setup will help you test and visualize the relationships between items, transactions, and bundles effectively.