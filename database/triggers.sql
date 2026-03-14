-- database/triggers.sql

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_leads_updated_at ON leads;
CREATE TRIGGER update_leads_updated_at
    BEFORE UPDATE ON leads
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger to update last_activity_at on lead when message is sent
CREATE OR REPLACE FUNCTION update_lead_last_activity()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE leads
    SET last_activity_at = NOW()
    WHERE id = (SELECT lead_id FROM conversations WHERE id = NEW.conversation_id);
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_lead_activity_on_message ON messages;
CREATE TRIGGER update_lead_activity_on_message
    AFTER INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_lead_last_activity();

-- Trigger to update bed status when booking is created
CREATE OR REPLACE FUNCTION update_bed_status_on_booking()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE beds
    SET status = 'booked', move_in_date = NEW.move_in_date
    WHERE id = NEW.bed_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_bed_status ON bookings;
CREATE TRIGGER update_bed_status
    AFTER INSERT ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION update_bed_status_on_booking();

-- Trigger to assign default role to new users
CREATE OR REPLACE FUNCTION assign_default_user_role()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_roles (user_id, role)
    VALUES (NEW.id, 'agent');
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS assign_default_role ON profiles;
CREATE TRIGGER assign_default_role
    AFTER INSERT ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION assign_default_user_role();
