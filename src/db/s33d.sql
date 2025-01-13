-- Insert Organizations
INSERT INTO "organizations" (id, name, type, address, contact_info, status) VALUES
('11111111-1111-1111-1111-111111111111', 'Saint Mary''s School', 'SCHOOL', '123 Education Ave, City', '{"phone": "555-0101", "email": "contact@stmarys.edu"}', 'ACTIVE'),
('22222222-2222-2222-2222-222222222222', 'Lincoln High School', 'SCHOOL', '456 Learning Blvd, City', '{"phone": "555-0102", "email": "info@lincoln.edu"}', 'ACTIVE'),
('33333333-3333-3333-3333-333333333333', 'Corporate Events Co.', 'COMPANY', '789 Business St, City', '{"phone": "555-0103", "email": "contact@corpevents.com"}', 'ACTIVE');

-- Insert Clients
INSERT INTO "clients" (id, name, contact_info, organization_id, role, status) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'John Smith', '{"phone": "555-1001", "email": "john@email.com"}', '11111111-1111-1111-1111-111111111111', 'PARENT', 'ACTIVE'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Maria Garcia', '{"phone": "555-1002", "email": "maria@email.com"}', '22222222-2222-2222-2222-222222222222', 'PARENT', 'ACTIVE'),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Robert Johnson', '{"phone": "555-1003", "email": "robert@email.com"}', '33333333-3333-3333-3333-333333333333', 'EMPLOYEE', 'ACTIVE');

-- Insert Children
INSERT INTO "children" (id, name, client_id, organization_id, grade, section, status) VALUES
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Tommy Smith', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', '5th', 'A', 'ACTIVE'),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Sofia Garcia', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', '7th', 'B', 'ACTIVE');

-- Insert Inventory Items
INSERT INTO "inventory_items" (id, name, description, type, base_price, current_stock, minimum_stock, status) VALUES
('ffffffff-ffff-ffff-ffff-ffffffffffff', 'Digital Photo Package', 'High-resolution digital photos, 5 poses', 'DIGITAL', 29.99, NULL, NULL, 'ACTIVE'),
('gggggggg-gggg-gggg-gggg-gggggggggggg', 'Graduation Medal', 'Gold-plated commemorative medal', 'PHYSICAL', 19.99, 100, 20, 'ACTIVE'),
('hhhhhhhh-hhhh-hhhh-hhhh-hhhhhhhhhhhh', 'Printed Photo Set', 'Set of 5 printed photos, various sizes', 'PHYSICAL', 24.99, 50, 10, 'ACTIVE');

-- Insert Bundles
INSERT INTO "bundles" (id, name, description, type, organization_id, base_price, discount_percentage, status) VALUES
('iiiiiiii-iiii-iiii-iiii-iiiiiiiiiiii', 'Graduation Special', 'Complete graduation package with photos and medal', 'SCHOOL_PACKAGE', '11111111-1111-1111-1111-111111111111', 59.99, 10.00, 'ACTIVE'),
('jjjjjjjj-jjjj-jjjj-jjjj-jjjjjjjjjjjj', 'Corporate Headshot Package', 'Professional headshots with digital delivery', 'ORGANIZATION_PACKAGE', '33333333-3333-3333-3333-333333333333', 79.99, 0, 'ACTIVE');

-- Insert Bundle Items
INSERT INTO "bundle_items" (id, bundle_id, item_id, quantity, override_price) VALUES
('kkkkkkkk-kkkk-kkkk-kkkk-kkkkkkkkkkkk', 'iiiiiiii-iiii-iiii-iiii-iiiiiiiiiiii', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 1, 24.99),
('llllllll-llll-llll-llll-llllllllllll', 'iiiiiiii-iiii-iiii-iiii-iiiiiiiiiiii', 'gggggggg-gggg-gggg-gggg-gggggggggggg', 1, 15.99);

-- Insert Purchases
INSERT INTO "purchases" (id, client_id, child_id, bundle_id, organization_id, status, total_amount, payment_status, payment_metadata) VALUES
('a9f10fae-fcfc-4210-bc48-ce7cf9781091', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'dddddddd-dddd-dddd-dddd-dddddddddddd', '9b474a42-b64f-4dee-aa4d-f5fdd2f5f68e', '11111111-1111-1111-1111-111111111111', 'COMPLETED', 59.99, 'PAID', '{"method": "CREDIT_CARD", "transactionId": "tx_123456"}');

-- Insert Purchase Items
INSERT INTO "purchase_items" (id, purchase_id, item_id, quantity, unit_price, total_price, metadata) VALUES
('36858be9-6bc0-48bd-8e66-544184b64fed', 'a9f10fae-fcfc-4210-bc48-ce7cf9781091', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 1, 24.99, 24.99, '{"format": "DIGITAL", "deliveryMethod": "EMAIL"}'),
('1c6eb61a-9638-4d8c-85cf-3b85b233147d', 'a9f10fae-fcfc-4210-bc48-ce7cf9781091', '7cd97e43-e7ba-4b0c-a1df-453c1cb97082', 1, 15.99, 15.99, '{"format": "PHYSICAL", "deliveryMethod": "PICKUP"}');

-- Insert Organization Members
INSERT INTO "organization_members" (id, organization_id, client_id, role, status) VALUES
('2d2b6540-c8e0-4d88-9812-d8f2a6b3426c', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'MEMBER', 'ACTIVE'),
('3399dd26-55a5-4aef-9d24-c64798e15920', '33333333-3333-3333-3333-333333333333', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'ADMIN', 'ACTIVE');