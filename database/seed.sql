-- database/seed.sql

-- Insert Zones
INSERT INTO zones (name, areas)
SELECT 'Koramangala', '["1st Block", "4th Block", "5th Block", "6th Block"]'
WHERE NOT EXISTS (SELECT 1 FROM zones WHERE name = 'Koramangala');

INSERT INTO zones (name, areas)
SELECT 'HSR Layout', '["Sector 1", "Sector 2", "Sector 3"]'
WHERE NOT EXISTS (SELECT 1 FROM zones WHERE name = 'HSR Layout');

INSERT INTO zones (name, areas)
SELECT 'Indiranagar', '["100ft Road", "CMH Road", "Defence Colony"]'
WHERE NOT EXISTS (SELECT 1 FROM zones WHERE name = 'Indiranagar');

INSERT INTO zones (name, areas)
SELECT 'Whitefield', '["ITPL", "Hope Farm", "Varthur"]'
WHERE NOT EXISTS (SELECT 1 FROM zones WHERE name = 'Whitefield');

INSERT INTO zones (name, areas)
SELECT 'Bellandur', '["Outer Ring Road", "Ecospace", "Green Glen"]'
WHERE NOT EXISTS (SELECT 1 FROM zones WHERE name = 'Bellandur');

INSERT INTO zones (name, areas)
SELECT 'Jayanagar', '["4th Block", "7th Block", "9th Block"]'
WHERE NOT EXISTS (SELECT 1 FROM zones WHERE name = 'Jayanagar');

INSERT INTO zones (name, areas)
SELECT 'Marathahalli', '["Spice Garden", "Bridge", "HAL"]'
WHERE NOT EXISTS (SELECT 1 FROM zones WHERE name = 'Marathahalli');

-- Insert Profiles
INSERT INTO profiles (id, full_name, avatar_url) VALUES
('00000000-0000-0000-0000-000000000001', 'Admin User', 'https://i.pravatar.cc/150?u=1'),
('00000000-0000-0000-0000-000000000002', 'Manager User', 'https://i.pravatar.cc/150?u=2'),
('00000000-0000-0000-0000-000000000003', 'Agent User', 'https://i.pravatar.cc/150?u=3'),
('00000000-0000-0000-0000-000000000004', 'Owner User', 'https://i.pravatar.cc/150?u=4'),
('00000000-0000-0000-0000-000000000005', 'Aisha Khan', 'https://i.pravatar.cc/150?u=5'),
('00000000-0000-0000-0000-000000000006', 'Vikram Rao', 'https://i.pravatar.cc/150?u=6'),
('00000000-0000-0000-0000-000000000007', 'Meera Iyer', 'https://i.pravatar.cc/150?u=7'),
('00000000-0000-0000-0000-000000000008', 'Rohan Gupta', 'https://i.pravatar.cc/150?u=8'),
('00000000-0000-0000-0000-000000000009', 'Nisha Verma', 'https://i.pravatar.cc/150?u=9'),
('00000000-0000-0000-0000-000000000010', 'Arjun Das', 'https://i.pravatar.cc/150?u=10')
ON CONFLICT (id) DO NOTHING;

-- Insert User Settings
INSERT INTO user_settings (user_id, auto_assign, visit_reminders, daily_digest, desktop_notifications, compact_sidebar, timezone, language, crm_landing_page) VALUES
('00000000-0000-0000-0000-000000000001', true, true, true, true, false, 'Asia/Kolkata', 'en-IN', '/dashboard'),
('00000000-0000-0000-0000-000000000002', true, true, true, false, true, 'Asia/Kolkata', 'en-IN', '/dashboard'),
('00000000-0000-0000-0000-000000000003', true, true, false, true, false, 'Asia/Kolkata', 'en-IN', '/dashboard'),
('00000000-0000-0000-0000-000000000004', false, true, true, true, false, 'Asia/Kolkata', 'en-IN', '/dashboard')
ON CONFLICT (user_id) DO NOTHING;

-- Insert Additional Agents
INSERT INTO agents (id, user_id, name, email, phone, role, zone_id) VALUES
('11111111-1111-1111-1111-111111111112', '00000000-0000-0000-0000-000000000005', 'Aisha Khan', 'aisha@gharpayy.com', '9876543212', 'agent', (SELECT id FROM zones WHERE name = 'HSR Layout')),
('11111111-1111-1111-1111-111111111113', '00000000-0000-0000-0000-000000000006', 'Vikram Rao', 'vikram@gharpayy.com', '9876543213', 'agent', (SELECT id FROM zones WHERE name = 'Indiranagar')),
('11111111-1111-1111-1111-111111111114', '00000000-0000-0000-0000-000000000008', 'Rohan Gupta', 'rohan@gharpayy.com', '9876543214', 'agent', (SELECT id FROM zones WHERE name = 'Whitefield'))
ON CONFLICT (id) DO NOTHING;

-- Insert Team Queues
INSERT INTO team_queues (id, zone_id, agent_id) VALUES
('12121212-1212-1212-1212-121212121212', (SELECT id FROM zones WHERE name = 'Koramangala'), '11111111-1111-1111-1111-111111111111'),
('12121212-1212-1212-1212-121212121213', (SELECT id FROM zones WHERE name = 'HSR Layout'), '11111111-1111-1111-1111-111111111112'),
('12121212-1212-1212-1212-121212121214', (SELECT id FROM zones WHERE name = 'Indiranagar'), '11111111-1111-1111-1111-111111111113')
ON CONFLICT (id) DO NOTHING;

-- Insert Additional Owner
INSERT INTO owners (id, user_id, name, email, phone) VALUES
('22222222-2222-2222-2222-222222222223', '00000000-0000-0000-0000-000000000009', 'Nisha Verma', 'nisha.owner@gharpayy.com', '9876543333')
ON CONFLICT (id) DO NOTHING;

-- Extra Property for Owner
INSERT INTO properties (id, name, owner_id, zone_id, city, area, address, latitude, longitude, photos, amenities, gender_allowed, total_rooms, total_beds) VALUES
('33333333-3333-3333-3333-333333333343', 'Gharpayy Indiranagar Loft', '22222222-2222-2222-2222-222222222223', (SELECT id FROM zones WHERE name = 'Indiranagar'), 'Bangalore', 'Indiranagar', '55, CMH Road, Indiranagar', 12.9781, 77.6408, '["https://picsum.photos/seed/pg11/800/600"]', '["WiFi", "Meals", "Parking"]', 'any', 5, 10)
ON CONFLICT (id) DO NOTHING;

-- Insert Extra Rooms + Beds
INSERT INTO rooms (id, property_id, room_type, bed_count, status, price) VALUES
('44444444-4444-4444-4444-444444444454', '33333333-3333-3333-3333-333333333343', 'Double Sharing', 2, 'available', 12000),
('44444444-4444-4444-4444-444444444455', '33333333-3333-3333-3333-333333333343', 'Single Sharing', 1, 'available', 16000)
ON CONFLICT (id) DO NOTHING;

INSERT INTO beds (id, room_id, status) VALUES
('55555555-5555-5555-5555-555555555570', '44444444-4444-4444-4444-444444444454', 'available'),
('55555555-5555-5555-5555-555555555571', '44444444-4444-4444-4444-444444444454', 'available'),
('55555555-5555-5555-5555-555555555572', '44444444-4444-4444-4444-444444444455', 'available')
ON CONFLICT (id) DO NOTHING;

-- Insert Visits
INSERT INTO visits (id, lead_id, property_id, scheduled_at, visit_status, outcome) VALUES
('77777777-7777-7777-7777-777777777771', '66666666-6666-6666-6666-666666666670', '33333333-3333-3333-3333-333333333337', NOW() + INTERVAL '1 day', 'scheduled', NULL),
('77777777-7777-7777-7777-777777777772', '66666666-6666-6666-6666-666666666673', '33333333-3333-3333-3333-333333333340', NOW() - INTERVAL '2 days', 'completed', 'considering'),
('77777777-7777-7777-7777-777777777773', '66666666-6666-6666-6666-666666666674', '33333333-3333-3333-3333-333333333341', NOW() - INTERVAL '4 days', 'completed', 'booked')
ON CONFLICT (id) DO NOTHING;

-- Insert Reservations + Soft Locks
INSERT INTO reservations (id, lead_id, bed_id, status, payment_status, hold_expires_at, created_at) VALUES
('88888888-8888-8888-8888-888888888881', '66666666-6666-6666-6666-666666666674', '55555555-5555-5555-5555-555555555566', 'confirmed', 'paid', NOW() + INTERVAL '1 hour', NOW() - INTERVAL '1 day'),
('88888888-8888-8888-8888-888888888882', '66666666-6666-6666-6666-666666666672', '55555555-5555-5555-5555-555555555561', 'pending', 'pending', NOW() + INTERVAL '2 hours', NOW() - INTERVAL '2 hours')
ON CONFLICT (id) DO NOTHING;

INSERT INTO soft_locks (id, reservation_id, bed_id, expires_at) VALUES
('99999999-9999-9999-9999-999999999991', '88888888-8888-8888-8888-888888888882', '55555555-5555-5555-5555-555555555561', NOW() + INTERVAL '2 hours')
ON CONFLICT (id) DO NOTHING;

-- Insert Bookings
INSERT INTO bookings (id, reservation_id, lead_id, property_id, room_id, bed_id, status, payment_status, move_in_date, created_at) VALUES
('aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaa1', '88888888-8888-8888-8888-888888888881', '66666666-6666-6666-6666-666666666674', '33333333-3333-3333-3333-333333333341', '44444444-4444-4444-4444-444444444452', '55555555-5555-5555-5555-555555555566', 'confirmed', 'paid', CURRENT_DATE + 7, NOW() - INTERVAL '3 hours'),
('aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaa2', NULL, '66666666-6666-6666-6666-666666666673', '33333333-3333-3333-3333-333333333340', '44444444-4444-4444-4444-444444444451', '55555555-5555-5555-5555-555555555565', 'pending', 'pending', CURRENT_DATE + 14, NOW() - INTERVAL '2 days')
ON CONFLICT (id) DO NOTHING;

-- Insert Payment Transactions
INSERT INTO payment_transactions (id, reservation_id, amount, gateway_transaction_id, status) VALUES
('bbbbbbb1-bbbb-bbbb-bbbb-bbbbbbbbbbb1', '88888888-8888-8888-8888-888888888881', 15000, 'txn_demo_001', 'success'),
('bbbbbbb1-bbbb-bbbb-bbbb-bbbbbbbbbbb2', '88888888-8888-8888-8888-888888888882', 12000, 'txn_demo_002', 'pending')
ON CONFLICT (id) DO NOTHING;

-- Insert Follow-ups
INSERT INTO follow_up_reminders (id, lead_id, assigned_agent_id, title, note, due_at, priority, status, created_by) VALUES
('ccccccc1-cccc-cccc-cccc-ccccccccccc1', '66666666-6666-6666-6666-666666666666', '11111111-1111-1111-1111-111111111111', 'Call Rahul for requirements', 'Asked for Koramangala options', NOW() + INTERVAL '6 hours', 'high', 'pending', '00000000-0000-0000-0000-000000000001'),
('ccccccc1-cccc-cccc-cccc-ccccccccccc2', '66666666-6666-6666-6666-666666666670', '11111111-1111-1111-1111-111111111111', 'Confirm visit slot', 'Schedule visit details', NOW() + INTERVAL '1 day', 'medium', 'pending', '00000000-0000-0000-0000-000000000002')
ON CONFLICT (id) DO NOTHING;

-- Insert Notifications
INSERT INTO notifications (id, user_id, title, body, type, entity_type, entity_id, is_read, created_at) VALUES
('ddddddd1-dddd-dddd-dddd-ddddddddddd1', '00000000-0000-0000-0000-000000000001', 'Daily CRM summary', '4 new leads today', 'info', 'lead', '66666666-6666-6666-6666-666666666666', false, NOW() - INTERVAL '3 hours'),
('ddddddd1-dddd-dddd-dddd-ddddddddddd2', '00000000-0000-0000-0000-000000000002', 'Follow-up due', 'Visit reminder for Rohan', 'follow_up', 'lead', '66666666-6666-6666-6666-666666666670', false, NOW() - INTERVAL '2 hours'),
('ddddddd1-dddd-dddd-dddd-ddddddddddd3', '00000000-0000-0000-0000-000000000003', 'New booking', 'Karan booked a room', 'booking', 'booking', 'aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaa1', true, NOW() - INTERVAL '6 hours'),
('ddddddd1-dddd-dddd-dddd-ddddddddddd4', '00000000-0000-0000-0000-000000000004', 'Owner alert', 'Room status pending confirmation', 'alert', 'room', '44444444-4444-4444-4444-444444444451', false, NOW() - INTERVAL '1 hour')
ON CONFLICT (id) DO NOTHING;

-- Insert Conversations + Messages
INSERT INTO conversations (id, lead_id, agent_id, created_at) VALUES
('eeeeeee1-eeee-eeee-eeee-eeeeeeeeeee1', '66666666-6666-6666-6666-666666666666', '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '5 days'),
('eeeeeee1-eeee-eeee-eeee-eeeeeeeeeee2', '66666666-6666-6666-6666-666666666673', '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '2 days')
ON CONFLICT (id) DO NOTHING;

INSERT INTO messages (id, conversation_id, sender_id, message, channel, created_at) VALUES
('fffffff1-ffff-ffff-ffff-fffffffffff1', 'eeeeeee1-eeee-eeee-eeee-eeeeeeeeeee1', '66666666-6666-6666-6666-666666666666', 'Hi, I want details on Koramangala property.', 'internal', NOW() - INTERVAL '5 days'),
('fffffff1-ffff-ffff-ffff-fffffffffff2', 'eeeeeee1-eeee-eeee-eeee-eeeeeeeeeee1', '11111111-1111-1111-1111-111111111111', 'Sure! Sharing options now.', 'internal', NOW() - INTERVAL '5 days'),
('fffffff1-ffff-ffff-ffff-fffffffffff3', 'eeeeeee1-eeee-eeee-eeee-eeeeeeeeeee2', '66666666-6666-6666-6666-666666666673', 'Any update on availability?', 'internal', NOW() - INTERVAL '1 day')
ON CONFLICT (id) DO NOTHING;

-- Insert Lead Activities
INSERT INTO lead_activities (id, lead_id, user_id, action, details, created_at) VALUES
('abababab-abab-abab-abab-ababababab01', '66666666-6666-6666-6666-666666666666', '00000000-0000-0000-0000-000000000003', 'follow_up_created', '{"note":"Initial outreach scheduled"}', NOW() - INTERVAL '1 day'),
('abababab-abab-abab-abab-ababababab02', '66666666-6666-6666-6666-666666666673', '00000000-0000-0000-0000-000000000003', 'visit_completed', '{"outcome":"considering"}', NOW() - INTERVAL '2 days')
ON CONFLICT (id) DO NOTHING;

-- Insert Room Status Logs (for owner alerts)
INSERT INTO room_status_log (id, room_id, owner_id, status, confirmed_at) VALUES
('cdcdcdcd-cdcd-cdcd-cdcd-cdcdcdcdcd01', '44444444-4444-4444-4444-444444444451', '22222222-2222-2222-2222-222222222222', 'available', NOW() - INTERVAL '3 days')
ON CONFLICT (id) DO NOTHING;

-- Insert Activity Log
INSERT INTO activity_log (id, actor_user_id, action, entity_type, entity_id, before_state, after_state, request_id, created_at) VALUES
('edededed-eded-eded-eded-ededededed01', '00000000-0000-0000-0000-000000000001', 'lead_status_update', 'lead', '66666666-6666-6666-6666-666666666670', '{"status":"new"}', '{"status":"visit_scheduled"}', 'seed-req-1', NOW() - INTERVAL '12 hours')
ON CONFLICT (id) DO NOTHING;

-- Update Bed Statuses for Inventory/Alerts
UPDATE beds
SET status = 'booked', updated_at = NOW()
WHERE id IN ('55555555-5555-5555-5555-555555555566');

UPDATE beds
SET status = 'reserved', updated_at = NOW()
WHERE id IN ('55555555-5555-5555-5555-555555555561');

UPDATE beds
SET status = 'occupied',
    current_tenant_name = 'Sana Ali',
    move_in_date = CURRENT_DATE - INTERVAL '45 days',
    updated_at = NOW()
WHERE id IN ('55555555-5555-5555-5555-555555555552');

UPDATE beds
SET status = 'occupied',
    current_tenant_name = 'Priya Singh',
    move_in_date = CURRENT_DATE - INTERVAL '60 days',
    updated_at = NOW()
WHERE id IN ('55555555-5555-5555-5555-555555555559');

-- Insert Roles
INSERT INTO user_roles (user_id, role) VALUES
('00000000-0000-0000-0000-000000000001', 'admin'),
('00000000-0000-0000-0000-000000000002', 'manager'),
('00000000-0000-0000-0000-000000000003', 'agent'),
('00000000-0000-0000-0000-000000000004', 'owner'),
('00000000-0000-0000-0000-000000000005', 'agent'),
('00000000-0000-0000-0000-000000000006', 'agent'),
('00000000-0000-0000-0000-000000000007', 'manager'),
('00000000-0000-0000-0000-000000000008', 'agent'),
('00000000-0000-0000-0000-000000000009', 'owner'),
('00000000-0000-0000-0000-000000000010', 'agent')
ON CONFLICT (user_id, role) DO NOTHING;

-- Insert Agents
INSERT INTO agents (id, user_id, name, email, phone, role, zone_id) VALUES
('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000003', 'Agent User', 'agent@gharpayy.com', '9876543210', 'agent', (SELECT id FROM zones WHERE name = 'Koramangala'))
ON CONFLICT (id) DO NOTHING;

-- Insert Owners
INSERT INTO owners (id, user_id, name, email, phone) VALUES
('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000004', 'Owner User', 'owner@gharpayy.com', '9876543211')
ON CONFLICT (id) DO NOTHING;

-- Insert Properties
INSERT INTO properties (id, name, owner_id, zone_id, city, area, address, latitude, longitude, photos, amenities, gender_allowed, total_rooms, total_beds) VALUES
('33333333-3333-3333-3333-333333333333', 'Gharpayy Premium Co-living', '22222222-2222-2222-2222-222222222222', (SELECT id FROM zones WHERE name = 'Koramangala'), 'Bangalore', 'Koramangala', '123, 4th Block, Koramangala', 12.9352, 77.6245, '["https://picsum.photos/seed/pg1/800/600"]', '["WiFi", "AC", "Washing Machine"]', 'any', 10, 20)
,
('33333333-3333-3333-3333-333333333334', 'Gharpayy HSR Hub', '22222222-2222-2222-2222-222222222222', (SELECT id FROM zones WHERE name = 'HSR Layout'), 'Bangalore', 'HSR Layout', '45, Sector 2, HSR Layout', 12.9121, 77.6446, '["https://picsum.photos/seed/pg2/800/600"]', '["WiFi", "Gym", "Housekeeping"]', 'any', 8, 16),
('33333333-3333-3333-3333-333333333335', 'Gharpayy Indiranagar Stay', '22222222-2222-2222-2222-222222222222', (SELECT id FROM zones WHERE name = 'Indiranagar'), 'Bangalore', 'Indiranagar', '12, 100ft Road, Indiranagar', 12.9716, 77.6412, '["https://picsum.photos/seed/pg3/800/600"]', '["WiFi", "Power Backup", "Security"]', 'female', 6, 12),
('33333333-3333-3333-3333-333333333336', 'Gharpayy Whitefield Rise', '22222222-2222-2222-2222-222222222222', (SELECT id FROM zones WHERE name = 'Whitefield'), 'Bangalore', 'Whitefield', '88, ITPL Main Rd, Whitefield', 12.9698, 77.7500, '["https://picsum.photos/seed/pg4/800/600"]', '["WiFi", "Cafeteria", "Laundry"]', 'any', 12, 24),
('33333333-3333-3333-3333-333333333337', 'Gharpayy Bellandur Edge', '22222222-2222-2222-2222-222222222222', (SELECT id FROM zones WHERE name = 'Bellandur'), 'Bangalore', 'Bellandur', '3, ORR, Bellandur', 12.9304, 77.6784, '["https://picsum.photos/seed/pg5/800/600"]', '["WiFi", "AC", "Meals"]', 'male', 9, 18),
('33333333-3333-3333-3333-333333333338', 'Gharpayy Jayanagar Nest', '22222222-2222-2222-2222-222222222222', (SELECT id FROM zones WHERE name = 'Jayanagar'), 'Bangalore', 'Jayanagar', '22, 4th Block, Jayanagar', 12.9250, 77.5938, '["https://picsum.photos/seed/pg6/800/600"]', '["WiFi", "Terrace", "Security"]', 'any', 7, 14),
('33333333-3333-3333-3333-333333333339', 'Gharpayy Marathahalli Base', '22222222-2222-2222-2222-222222222222', (SELECT id FROM zones WHERE name = 'Marathahalli'), 'Bangalore', 'Marathahalli', '11, HAL Rd, Marathahalli', 12.9592, 77.6974, '["https://picsum.photos/seed/pg7/800/600"]', '["WiFi", "Gym", "Security"]', 'any', 10, 20),
('33333333-3333-3333-3333-333333333340', 'Gharpayy Koramangala Court', '22222222-2222-2222-2222-222222222222', (SELECT id FROM zones WHERE name = 'Koramangala'), 'Bangalore', 'Koramangala', '9, 6th Block, Koramangala', 12.9345, 77.6132, '["https://picsum.photos/seed/pg8/800/600"]', '["WiFi", "AC", "Housekeeping"]', 'any', 8, 16),
('33333333-3333-3333-3333-333333333341', 'Gharpayy HSR Commons', '22222222-2222-2222-2222-222222222222', (SELECT id FROM zones WHERE name = 'HSR Layout'), 'Bangalore', 'HSR Layout', '67, Sector 1, HSR Layout', 12.9101, 77.6388, '["https://picsum.photos/seed/pg9/800/600"]', '["WiFi", "Meals", "Laundry"]', 'female', 6, 12),
('33333333-3333-3333-3333-333333333342', 'Gharpayy Whitefield Grove', '22222222-2222-2222-2222-222222222222', (SELECT id FROM zones WHERE name = 'Whitefield'), 'Bangalore', 'Whitefield', '15, Varthur Rd, Whitefield', 12.9507, 77.7358, '["https://picsum.photos/seed/pg10/800/600"]', '["WiFi", "Cafeteria", "Security"]', 'any', 11, 22)
ON CONFLICT (id) DO NOTHING;

-- Insert Rooms
INSERT INTO rooms (id, property_id, room_type, bed_count, status) VALUES
('44444444-4444-4444-4444-444444444444', '33333333-3333-3333-3333-333333333333', 'Double Sharing', 2, 'available')
,
('44444444-4444-4444-4444-444444444445', '33333333-3333-3333-3333-333333333334', 'Double Sharing', 2, 'available'),
('44444444-4444-4444-4444-444444444446', '33333333-3333-3333-3333-333333333335', 'Single Sharing', 1, 'available'),
('44444444-4444-4444-4444-444444444447', '33333333-3333-3333-3333-333333333336', 'Triple Sharing', 3, 'available'),
('44444444-4444-4444-4444-444444444448', '33333333-3333-3333-3333-333333333337', 'Double Sharing', 2, 'available'),
('44444444-4444-4444-4444-444444444449', '33333333-3333-3333-3333-333333333338', 'Single Sharing', 1, 'available'),
('44444444-4444-4444-4444-444444444450', '33333333-3333-3333-3333-333333333339', 'Double Sharing', 2, 'available'),
('44444444-4444-4444-4444-444444444451', '33333333-3333-3333-3333-333333333340', 'Double Sharing', 2, 'available'),
('44444444-4444-4444-4444-444444444452', '33333333-3333-3333-3333-333333333341', 'Single Sharing', 1, 'available'),
('44444444-4444-4444-4444-444444444453', '33333333-3333-3333-3333-333333333342', 'Triple Sharing', 3, 'available')
ON CONFLICT (id) DO NOTHING;

-- Insert Beds
INSERT INTO beds (id, room_id, status) VALUES
('55555555-5555-5555-5555-555555555551', '44444444-4444-4444-4444-444444444444', 'available'),
('55555555-5555-5555-5555-555555555552', '44444444-4444-4444-4444-444444444444', 'available'),
('55555555-5555-5555-5555-555555555553', '44444444-4444-4444-4444-444444444445', 'available'),
('55555555-5555-5555-5555-555555555554', '44444444-4444-4444-4444-444444444445', 'available'),
('55555555-5555-5555-5555-555555555555', '44444444-4444-4444-4444-444444444446', 'available'),
('55555555-5555-5555-5555-555555555556', '44444444-4444-4444-4444-444444444447', 'available'),
('55555555-5555-5555-5555-555555555557', '44444444-4444-4444-4444-444444444447', 'available'),
('55555555-5555-5555-5555-555555555558', '44444444-4444-4444-4444-444444444447', 'available'),
('55555555-5555-5555-5555-555555555559', '44444444-4444-4444-4444-444444444448', 'available'),
('55555555-5555-5555-5555-555555555560', '44444444-4444-4444-4444-444444444448', 'available'),
('55555555-5555-5555-5555-555555555561', '44444444-4444-4444-4444-444444444449', 'available'),
('55555555-5555-5555-5555-555555555562', '44444444-4444-4444-4444-444444444450', 'available'),
('55555555-5555-5555-5555-555555555563', '44444444-4444-4444-4444-444444444450', 'available'),
('55555555-5555-5555-5555-555555555564', '44444444-4444-4444-4444-444444444451', 'available'),
('55555555-5555-5555-5555-555555555565', '44444444-4444-4444-4444-444444444451', 'available'),
('55555555-5555-5555-5555-555555555566', '44444444-4444-4444-4444-444444444452', 'available'),
('55555555-5555-5555-5555-555555555567', '44444444-4444-4444-4444-444444444453', 'available'),
('55555555-5555-5555-5555-555555555568', '44444444-4444-4444-4444-444444444453', 'available'),
('55555555-5555-5555-5555-555555555569', '44444444-4444-4444-4444-444444444453', 'available')
ON CONFLICT (id) DO NOTHING;

-- Insert Leads
INSERT INTO leads (id, name, phone, email, source, status, lead_score, assigned_agent_id, property_id) VALUES
('66666666-6666-6666-6666-666666666666', 'Rahul Sharma', '9876543212', 'rahul@example.com', 'website', 'new', 85, '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333'),
('66666666-6666-6666-6666-666666666667', 'Aisha Khan', '9876543213', 'aisha@example.com', 'ads', 'contacted', 72, '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333334'),
('66666666-6666-6666-6666-666666666668', 'Vikram Rao', '9876543214', 'vikram@example.com', 'website', 'requirement_collected', 68, '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333335'),
('66666666-6666-6666-6666-666666666669', 'Meera Iyer', '9876543215', 'meera@example.com', 'referral', 'property_suggested', 80, '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333336'),
('66666666-6666-6666-6666-666666666670', 'Rohan Gupta', '9876543216', 'rohan@example.com', 'website', 'visit_scheduled', 77, '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333337'),
('66666666-6666-6666-6666-666666666671', 'Nisha Verma', '9876543217', 'nisha@example.com', 'ads', 'new', 60, '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333338'),
('66666666-6666-6666-6666-666666666672', 'Arjun Das', '9876543218', 'arjun@example.com', 'website', 'contacted', 74, '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333339'),
('66666666-6666-6666-6666-666666666673', 'Sana Ali', '9876543219', 'sana@example.com', 'referral', 'visit_completed', 88, '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333340'),
('66666666-6666-6666-6666-666666666674', 'Karan Patel', '9876543220', 'karan@example.com', 'website', 'booked', 92, '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333341'),
('66666666-6666-6666-6666-666666666675', 'Priya Singh', '9876543221', 'priya@example.com', 'ads', 'new', 55, '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333342')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Seed Enhancements (frontend coverage: effort/analytics/inventory/public)
-- ============================================================

-- Expand user settings for all profiles
INSERT INTO user_settings (user_id, auto_assign, visit_reminders, daily_digest, desktop_notifications, compact_sidebar, timezone, language, crm_landing_page) VALUES
('00000000-0000-0000-0000-000000000001', true, true, true, true, false, 'Asia/Kolkata', 'en-IN', '/dashboard'),
('00000000-0000-0000-0000-000000000002', true, true, true, true, false, 'Asia/Kolkata', 'en-IN', '/dashboard'),
('00000000-0000-0000-0000-000000000003', true, true, true, true, true, 'Asia/Kolkata', 'en-IN', '/leads'),
('00000000-0000-0000-0000-000000000004', false, true, true, true, false, 'Asia/Kolkata', 'en-IN', '/dashboard'),
('00000000-0000-0000-0000-000000000005', true, true, false, true, false, 'Asia/Kolkata', 'en-IN', '/follow-ups'),
('00000000-0000-0000-0000-000000000006', true, true, true, false, false, 'Asia/Kolkata', 'en-IN', '/leads'),
('00000000-0000-0000-0000-000000000007', true, true, true, true, true, 'Asia/Kolkata', 'en-IN', '/dashboard'),
('00000000-0000-0000-0000-000000000008', true, true, true, true, false, 'Asia/Kolkata', 'en-IN', '/leads'),
('00000000-0000-0000-0000-000000000009', false, true, true, true, false, 'Asia/Kolkata', 'en-IN', '/dashboard'),
('00000000-0000-0000-0000-000000000010', true, false, false, true, true, 'Asia/Kolkata', 'en-IN', '/follow-ups')
ON CONFLICT (user_id) DO UPDATE SET
  auto_assign = EXCLUDED.auto_assign,
  visit_reminders = EXCLUDED.visit_reminders,
  daily_digest = EXCLUDED.daily_digest,
  desktop_notifications = EXCLUDED.desktop_notifications,
  compact_sidebar = EXCLUDED.compact_sidebar,
  timezone = EXCLUDED.timezone,
  language = EXCLUDED.language,
  crm_landing_page = EXCLUDED.crm_landing_page,
  updated_at = NOW();

-- Add missing agent profiles (manager + extra agent)
INSERT INTO agents (id, user_id, name, email, phone, role, zone_id) VALUES
('11111111-1111-1111-1111-111111111115', '00000000-0000-0000-0000-000000000007', 'Meera Iyer', 'meera@gharpayy.com', '9876543227', 'manager', (SELECT id FROM zones WHERE name = 'Whitefield')),
('11111111-1111-1111-1111-111111111116', '00000000-0000-0000-0000-000000000010', 'Arjun Das', 'arjun@gharpayy.com', '9876543228', 'agent', (SELECT id FROM zones WHERE name = 'Marathahalli'))
ON CONFLICT (id) DO NOTHING;

-- Extend team queues for routing
INSERT INTO team_queues (id, zone_id, agent_id) VALUES
('12121212-1212-1212-1212-121212121215', (SELECT id FROM zones WHERE name = 'Whitefield'), '11111111-1111-1111-1111-111111111115'),
('12121212-1212-1212-1212-121212121216', (SELECT id FROM zones WHERE name = 'Marathahalli'), '11111111-1111-1111-1111-111111111116'),
('12121212-1212-1212-1212-121212121217', (SELECT id FROM zones WHERE name = 'Bellandur'), '11111111-1111-1111-1111-111111111114')
ON CONFLICT (id) DO NOTHING;

-- Add another owner property for marketplace variety
INSERT INTO properties (id, name, owner_id, zone_id, city, area, address, latitude, longitude, photos, amenities, gender_allowed, total_rooms, total_beds) VALUES
('33333333-3333-3333-3333-333333333344', 'Gharpayy Whitefield Heights', '22222222-2222-2222-2222-222222222223', (SELECT id FROM zones WHERE name = 'Whitefield'), 'Bangalore', 'Whitefield', '88, Hope Farm Junction, Whitefield', 12.9691, 77.7510, '["https://picsum.photos/seed/pg12/800/600"]', '["WiFi", "Gym", "Power Backup"]', 'any', 8, 16)
ON CONFLICT (id) DO NOTHING;

INSERT INTO rooms (id, property_id, room_type, bed_count, status, price) VALUES
('44444444-4444-4444-4444-444444444456', '33333333-3333-3333-3333-333333333344', 'Single Sharing', 1, 'available', 17000),
('44444444-4444-4444-4444-444444444457', '33333333-3333-3333-3333-333333333344', 'Double Sharing', 2, 'available', 13500)
ON CONFLICT (id) DO NOTHING;

INSERT INTO beds (id, room_id, status, current_tenant_name, move_in_date) VALUES
('55555555-5555-5555-5555-555555555576', '44444444-4444-4444-4444-444444444456', 'available', NULL, NULL),
('55555555-5555-5555-5555-555555555577', '44444444-4444-4444-4444-444444444457', 'available', NULL, NULL),
('55555555-5555-5555-5555-555555555578', '44444444-4444-4444-4444-444444444457', 'maintenance', NULL, NULL)
ON CONFLICT (id) DO NOTHING;

-- Update room prices for public marketplace cards
UPDATE rooms SET price = 12000 WHERE id = '44444444-4444-4444-4444-444444444444';
UPDATE rooms SET price = 11000 WHERE id = '44444444-4444-4444-4444-444444444445';
UPDATE rooms SET price = 15000 WHERE id = '44444444-4444-4444-4444-444444444446';
UPDATE rooms SET price = 9000 WHERE id = '44444444-4444-4444-4444-444444444447';
UPDATE rooms SET price = 13000 WHERE id = '44444444-4444-4444-4444-444444444448';
UPDATE rooms SET price = 16000 WHERE id = '44444444-4444-4444-4444-444444444449';
UPDATE rooms SET price = 12500 WHERE id = '44444444-4444-4444-4444-444444444450';
UPDATE rooms SET price = 11800 WHERE id = '44444444-4444-4444-4444-444444444451';
UPDATE rooms SET price = 15500 WHERE id = '44444444-4444-4444-4444-444444444452';
UPDATE rooms SET price = 9500 WHERE id = '44444444-4444-4444-4444-444444444453';
UPDATE rooms SET price = 12000 WHERE id = '44444444-4444-4444-4444-444444444454';
UPDATE rooms SET price = 16000 WHERE id = '44444444-4444-4444-4444-444444444455';

-- Enrich lead fields for matching and analytics
UPDATE leads SET
  city = 'Bangalore',
  area = 'Koramangala',
  budget = 12000,
  gender = 'male',
  sharing_type = 'double',
  last_activity_at = NOW() - INTERVAL '2 hours'
WHERE id = '66666666-6666-6666-6666-666666666666';

UPDATE leads SET
  city = 'Bangalore',
  area = 'HSR Layout',
  budget = 11000,
  gender = 'female',
  sharing_type = 'double',
  first_response_at = NOW() - INTERVAL '1 day',
  last_activity_at = NOW() - INTERVAL '6 hours',
  assigned_agent_id = '11111111-1111-1111-1111-111111111112'
WHERE id = '66666666-6666-6666-6666-666666666667';

UPDATE leads SET
  city = 'Bangalore',
  area = 'Indiranagar',
  budget = 15000,
  gender = 'male',
  sharing_type = 'single',
  first_response_at = NOW() - INTERVAL '3 days',
  last_activity_at = NOW() - INTERVAL '1 day',
  assigned_agent_id = '11111111-1111-1111-1111-111111111113'
WHERE id = '66666666-6666-6666-6666-666666666668';

UPDATE leads SET
  city = 'Bangalore',
  area = 'Whitefield',
  budget = 9000,
  gender = 'female',
  sharing_type = 'triple',
  first_response_at = NOW() - INTERVAL '5 days',
  last_activity_at = NOW() - INTERVAL '2 days',
  assigned_agent_id = '11111111-1111-1111-1111-111111111115'
WHERE id = '66666666-6666-6666-6666-666666666669';

UPDATE leads SET
  city = 'Bangalore',
  area = 'Bellandur',
  budget = 13000,
  gender = 'male',
  sharing_type = 'double',
  first_response_at = NOW() - INTERVAL '4 days',
  last_activity_at = NOW() - INTERVAL '12 hours',
  assigned_agent_id = '11111111-1111-1111-1111-111111111114'
WHERE id = '66666666-6666-6666-6666-666666666670';

UPDATE leads SET
  city = 'Bangalore',
  area = 'Jayanagar',
  budget = 16000,
  gender = 'female',
  sharing_type = 'single',
  last_activity_at = NOW() - INTERVAL '3 hours',
  assigned_agent_id = '11111111-1111-1111-1111-111111111116'
WHERE id = '66666666-6666-6666-6666-666666666671';

UPDATE leads SET
  city = 'Bangalore',
  area = 'Marathahalli',
  budget = 12500,
  gender = 'male',
  sharing_type = 'double',
  first_response_at = NOW() - INTERVAL '2 days',
  last_activity_at = NOW() - INTERVAL '8 hours',
  assigned_agent_id = '11111111-1111-1111-1111-111111111116'
WHERE id = '66666666-6666-6666-6666-666666666672';

UPDATE leads SET
  city = 'Bangalore',
  area = 'Koramangala',
  budget = 11800,
  gender = 'female',
  sharing_type = 'double',
  first_response_at = NOW() - INTERVAL '6 days',
  last_activity_at = NOW() - INTERVAL '1 day'
WHERE id = '66666666-6666-6666-6666-666666666673';

UPDATE leads SET
  city = 'Bangalore',
  area = 'HSR Layout',
  budget = 15500,
  gender = 'male',
  sharing_type = 'single',
  first_response_at = NOW() - INTERVAL '7 days',
  last_activity_at = NOW() - INTERVAL '4 hours',
  assigned_agent_id = '11111111-1111-1111-1111-111111111112'
WHERE id = '66666666-6666-6666-6666-666666666674';

UPDATE leads SET
  city = 'Bangalore',
  area = 'Whitefield',
  budget = 9500,
  gender = 'female',
  sharing_type = 'triple',
  last_activity_at = NOW() - INTERVAL '1 hour',
  assigned_agent_id = '11111111-1111-1111-1111-111111111113'
WHERE id = '66666666-6666-6666-6666-666666666675';

-- Add richer lead activities
INSERT INTO lead_activities (id, lead_id, user_id, action, details, created_at) VALUES
('abababab-abab-abab-abab-ababababab11', '66666666-6666-6666-6666-666666666667', '00000000-0000-0000-0000-000000000005', 'call_attempted', '{"outcome":"connected"}', NOW() - INTERVAL '5 hours'),
('abababab-abab-abab-abab-ababababab12', '66666666-6666-6666-6666-666666666668', '00000000-0000-0000-0000-000000000006', 'requirements_captured', '{"budget":15000,"sharing":"single"}', NOW() - INTERVAL '1 day'),
('abababab-abab-abab-abab-ababababab13', '66666666-6666-6666-6666-666666666670', '00000000-0000-0000-0000-000000000008', 'visit_scheduled', jsonb_build_object('scheduled_at', NOW() + INTERVAL '1 day'), NOW() - INTERVAL '10 hours'),
('abababab-abab-abab-abab-ababababab14', '66666666-6666-6666-6666-666666666674', '00000000-0000-0000-0000-000000000005', 'booking_confirmed', '{"booking_id":"aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaa1"}', NOW() - INTERVAL '3 hours')
ON CONFLICT (id) DO NOTHING;

-- Additional follow-ups for Kanban/CRM
INSERT INTO follow_up_reminders (id, lead_id, assigned_agent_id, title, note, due_at, priority, status, created_by) VALUES
('ccccccc1-cccc-cccc-cccc-ccccccccccc3', '66666666-6666-6666-6666-666666666667', '11111111-1111-1111-1111-111111111112', 'Share visit photos', 'Send gallery and amenities list', NOW() + INTERVAL '8 hours', 'medium', 'pending', '00000000-0000-0000-0000-000000000005'),
('ccccccc1-cccc-cccc-cccc-ccccccccccc4', '66666666-6666-6666-6666-666666666668', '11111111-1111-1111-1111-111111111113', 'Budget confirmation', 'Recheck monthly budget', NOW() - INTERVAL '3 hours', 'high', 'overdue', '00000000-0000-0000-0000-000000000006')
ON CONFLICT (id) DO NOTHING;

-- Visits for effort & analytics
INSERT INTO visits (id, lead_id, property_id, scheduled_at, visit_status, outcome) VALUES
('77777777-7777-7777-7777-777777777774', '66666666-6666-6666-6666-666666666667', '33333333-3333-3333-3333-333333333334', NOW() + INTERVAL '2 days', 'scheduled', NULL),
('77777777-7777-7777-7777-777777777775', '66666666-6666-6666-6666-666666666668', '33333333-3333-3333-3333-333333333335', NOW() - INTERVAL '3 days', 'completed', 'not_interested')
ON CONFLICT (id) DO NOTHING;

-- Owner alerts: extra room confirmations
INSERT INTO room_status_log (id, room_id, owner_id, status, confirmed_at) VALUES
('cdcdcdcd-cdcd-cdcd-cdcd-cdcdcdcdcd02', '44444444-4444-4444-4444-444444444452', '22222222-2222-2222-2222-222222222222', 'available', NOW() - INTERVAL '5 days'),
('cdcdcdcd-cdcd-cdcd-cdcd-cdcdcdcdcd03', '44444444-4444-4444-4444-444444444456', '22222222-2222-2222-2222-222222222223', 'available', NOW() - INTERVAL '6 days')
ON CONFLICT (id) DO NOTHING;

-- Payment intent + webhook trail (payments page)
INSERT INTO payment_intents (id, reservation_id, provider, provider_intent_id, amount, currency, status, idempotency_key, metadata) VALUES
('f1111111-1111-1111-1111-111111111112', '88888888-8888-8888-8888-888888888881', 'razorpay', 'pay_intent_gharpayy_002', 15000.00, 'INR', 'succeeded', 'idem_gharpayy_002', '{"source":"public_checkout"}')
ON CONFLICT (id) DO NOTHING;

INSERT INTO payment_events (id, payment_intent_id, provider_event_id, event_type, payload) VALUES
('f2222222-2222-2222-2222-222222222223', 'f1111111-1111-1111-1111-111111111112', 'evt_razorpay_002', 'payment.captured', '{"amount":15000,"status":"captured"}')
ON CONFLICT (id) DO NOTHING;

INSERT INTO webhook_events (id, provider, provider_event_id, event_type, payload, processed, processed_at) VALUES
('f5555555-5555-5555-5555-555555555556', 'razorpay', 'wh_razorpay_002', 'payment.captured', '{"reservation_id":"88888888-8888-8888-8888-888888888881"}', true, NOW() - INTERVAL '2 hours')
ON CONFLICT (provider, provider_event_id) DO NOTHING;

INSERT INTO payment_webhooks (id, provider, provider_event_id, event_type, payload, processed, processed_at) VALUES
('f6666666-6666-6666-6666-666666666667', 'razorpay', 'wh_razorpay_002', 'payment.captured', '{"status":"captured"}', true, NOW() - INTERVAL '2 hours')
ON CONFLICT (provider, provider_event_id) DO NOTHING;
