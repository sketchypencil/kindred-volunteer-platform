import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Standard XAMPP MySQL configuration
export const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  multipleStatements: true,
};

export async function initializeDatabase() {
  console.log('🔄 Connecting to XAMPP MySQL server at', `${dbConfig.host}:${dbConfig.port}...`);
  
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to MySQL server successfully!');

    // Read and run schema
    const sqlPath = path.join(__dirname, '..', 'kindred_db.sql');
    const sqlScript = fs.readFileSync(sqlPath, 'utf8');

    console.log('⚙️ Initializing database schema (kindred_db)...');
    await connection.query(sqlScript);
    console.log('✅ Tables created: users, events, shifts, shift_roles, signups, resources, announcements, discussions.');

    // Switch to kindred_db
    await connection.changeUser({ database: 'kindred_db' });

    // Check if users already seeded
    const [existingUsers] = await connection.query('SELECT COUNT(*) as count FROM users');
    if (existingUsers[0].count === 0) {
      console.log('🌱 Seeding initial demo users and events...');

      const hashedAdminPass = await bcrypt.hash('admin123', 10);
      const hashedVolPass = await bcrypt.hash('volunteer123', 10);

      // Seed Users
      const usersSql = `
        INSERT INTO users (id, name, email, password, phone, role, avatar, emergency_name, emergency_phone, emergency_relation, skills, total_hours_logged, badges, bio)
        VALUES 
        (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?),
        (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?),
        (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?),
        (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      await connection.query(usersSql, [
        // 1. Admin Sarah Jenkins
        'user-admin',
        'Sarah Jenkins',
        'sarah.jenkins@kindred.org',
        hashedAdminPass,
        '(555) 234-5678',
        'admin',
        'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
        'Robert Jenkins',
        '(555) 987-6543',
        'Spouse',
        JSON.stringify(['Event Operations', 'Volunteer Management', 'CPR Certified', 'Crisis Communication']),
        120.0,
        JSON.stringify(['b1', 'b2', 'b3', 'b4', 'b7']),
        'Lead Volunteer Operations Director at Kindred Community Coalition.',

        // 2. Volunteer Alex Rivera
        'user-alex',
        'Alex Rivera',
        'alex.rivera@example.com',
        hashedVolPass,
        '(555) 345-6789',
        'volunteer',
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        'Elena Rivera',
        '(555) 876-5432',
        'Sister',
        JSON.stringify(['First Aid Certified', 'Logistics', 'Bilingual (English/Spanish)', 'Trail Maintenance']),
        18.0,
        JSON.stringify(['b1', 'b2', 'b3', 'b5']),
        'Passionate community volunteer and registered EMT student. Love outdoor restoration and emergency response.',

        // 3. Volunteer Elena Vance
        'user-elena',
        'Elena Vance',
        'elena.vance@example.com',
        hashedVolPass,
        '(555) 456-7890',
        'volunteer',
        'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
        'David Vance',
        '(555) 765-4321',
        'Father',
        JSON.stringify(['Social Media', 'Crowd Management', 'Food Prep', 'Graphic Design']),
        8.0,
        JSON.stringify(['b1', 'b2']),
        'Digital media enthusiast wanting to give back to local community outreach programs.',

        // 4. Volunteer Marcus Brody
        'user-marcus',
        'Marcus Brody',
        'marcus.brody@example.com',
        hashedVolPass,
        '(555) 567-8901',
        'volunteer',
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        'Grace Brody',
        '(555) 654-3210',
        'Mother',
        JSON.stringify(['Heavy Lifting', 'Equipment Transport', 'Carpool Leader']),
        4.0,
        JSON.stringify(['b1']),
        'Weekend volunteer eager to help with neighborhood logistics and heavy gear setups.'
      ]);

      // Seed Events
      await connection.query(`
        INSERT INTO events (id, title, description, category, location_name, location_address, location_map_url, start_date, end_date, status, organizer_name, organizer_email, organizer_org, cover_image, requires_verification)
        VALUES 
        ('evt-1', 'Cascadia River Cleanup & Native Planting', 'Join us for our annual ecosystem restoration along the Cascadia Riverbank. We are clearing invasive species, reinforcing the shoreline with 500 native saplings, and sorting recyclable debris.', 'Environment', 'Cascadia Riverfront Park - Pavilion B', '450 Riverfront Way, Sector 4', 'https://maps.google.com/?q=Cascadia+Riverfront+Park', '2026-10-10', '2026-10-10', 'upcoming', 'Sarah Jenkins', 'sarah.jenkins@kindred.org', 'Cascadia Conservancy Alliance', 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=900&auto=format&fit=crop&q=80', FALSE),
        ('evt-2', 'Metro City Marathon: Aid Station & Course Marshals', 'Over 12,000 runners will tackle the annual city marathon! Our team coordinates Mile 14 Aid Station, providing electrolytes, water hydration, medical spotting, and energetic crowd cheers.', 'Health & Relief', 'Beacon Hill Plaza - Mile 14 Checkpoint', '1280 Beacon Ave & 14th St', 'https://maps.google.com/?q=Beacon+Hill+Plaza', '2026-10-18', '2026-10-18', 'upcoming', 'Sarah Jenkins', 'sarah.jenkins@kindred.org', 'Metro Sports & Community Foundation', 'https://images.unsplash.com/photo-1530549387789-4c1017266635?w=900&auto=format&fit=crop&q=80', TRUE),
        ('evt-3', 'Harvest Food Bank: Family Packing & Distribution', 'Help pack and distribute fresh produce boxes and pantry staples to over 600 low-income families and seniors across the metropolitan district.', 'Community', 'St. Jude Food Pantry & Logistics Center', '742 Maplewood Road', 'https://maps.google.com/?q=St+Jude+Food+Pantry', '2026-10-24', '2026-10-24', 'upcoming', 'Sarah Jenkins', 'sarah.jenkins@kindred.org', 'Hope Alliance Outreach', 'https://images.unsplash.com/photo-1593113598332-cd288d649433?w=900&auto=format&fit=crop&q=80', FALSE),
        ('evt-4', 'Youth STEM & Robotics Discovery Day', 'A hands-on technology camp for 150 middle-school students. Volunteers guided robotics workshops, 3D printing demos, and introductory coding challenges.', 'Education', 'Northwest Technical High School - Gym & Labs', '900 Innovation Parkway', 'https://maps.google.com/?q=Northwest+Tech', '2026-09-20', '2026-09-20', 'completed', 'Sarah Jenkins', 'sarah.jenkins@kindred.org', 'STEM Forward Initiative', 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=900&auto=format&fit=crop&q=80', FALSE)
      `);

      // Seed Shifts
      await connection.query(`
        INSERT INTO shifts (id, event_id, title, start_time, end_time, date, hours)
        VALUES
        ('sh-101', 'evt-1', 'Morning Shift: Setup, Tools & Shoreline Clearing', '08:00 AM', '12:00 PM', '2026-10-10', 4.0),
        ('sh-102', 'evt-1', 'Afternoon Shift: Native Planting & Debris Sorting', '12:30 PM', '04:30 PM', '2026-10-10', 4.0),
        ('sh-201', 'evt-2', 'Morning Flight: Hydration Setup & Lead Pack Wave', '06:30 AM', '11:00 AM', '2026-10-18', 4.5),
        ('sh-301', 'evt-3', 'Packing Shift: Produce & Dry Goods Assembly Line', '09:00 AM', '01:00 PM', '2026-10-24', 4.0),
        ('sh-401', 'evt-4', 'All-Day Lab Mentor & Challenge Facilitator', '08:30 AM', '03:30 PM', '2026-09-20', 7.0)
      `);

      // Seed Shift Roles
      await connection.query(`
        INSERT INTO shift_roles (id, shift_id, name, description, capacity, requires_approval, skills_suggested)
        VALUES
        ('r-101', 'sh-101', 'Logistics & Gear Distribution', 'Unload tool trailers, distribute gloves, grabbers, and safety vests.', 2, FALSE, 'Logistics, Heavy Lifting'),
        ('r-102', 'sh-101', 'First Aid & Safety Officer', 'Stationed at Pavilion B with emergency medical kit, ice packs, and hydration monitor.', 2, TRUE, 'First Aid Certified, CPR Certified'),
        ('r-103', 'sh-101', 'Trail & Riverbank Crew', 'Direct debris removal and invasive blackberry brush cutting along Zone Alpha.', 5, FALSE, 'Outdoor Work, Trail Maintenance'),
        ('r-104', 'sh-102', 'Native Tree & Shrub Planter', 'Dig planting pits, mulch, and install protective mesh around saplings.', 4, FALSE, 'Gardening, Physical Stamina'),
        ('r-105', 'sh-102', 'Recycle & Hazardous Debris Auditor', 'Sort glass, plastics, and metal debris into city compost/recycling dumpsters.', 3, FALSE, 'Sorting, Attention to Detail'),
        ('r-106', 'sh-102', 'Social Media & Photo Lead', 'Capture volunteer action shots, team portraits, and brief video testimonials.', 1, TRUE, 'Social Media, Photography'),
        ('r-201', 'sh-201', 'Hydration Station Captain', 'Pre-fill and stage 3,000 electrolyte cups; monitor water supply line.', 3, FALSE, 'Speed, Team Coordination'),
        ('r-202', 'sh-201', 'First Aid Triage Responder', 'Assist certified medics with cramp relief, bandaging, and thermal blankets.', 2, TRUE, 'First Aid Certified, Emergency Response'),
        ('r-203', 'sh-201', 'Course Marshal & Crowd Safety', 'Keep spectator barriers clear and ensure clear transit for lead runners.', 4, FALSE, 'Crowd Management, Loud Voice'),
        ('r-301', 'sh-301', 'Box Assembly & Quality Inspector', 'Inspect fresh fruit/vegetables and seal 30-lb family staple boxes.', 4, FALSE, 'Organization, Speed'),
        ('r-302', 'sh-301', 'Intake Desk & Family Registration', 'Verify household vouchers, check IDs, and issue trunk pickup passes.', 2, TRUE, 'Bilingual (English/Spanish), Customer Service'),
        ('r-401', 'sh-401', 'Robotics Workshop Mentor', 'Guide student groups through motor assembly and sensor calibration.', 4, FALSE, 'Mentorship, Tech Savvy')
      `);

      // Seed Initial Signups
      await connection.query(`
        INSERT INTO signups (id, event_id, shift_id, role_id, user_id, user_name, user_email, user_phone, emergency_name, emergency_phone, emergency_relation, status, waitlist_position, qr_code_token, registered_at, checked_in_at, notes)
        VALUES
        ('sgn-completed-alex', 'evt-4', 'sh-401', 'r-401', 'user-alex', 'Alex Rivera', 'alex.rivera@example.com', '(555) 345-6789', 'Elena Rivera', '(555) 876-5432', 'Sister', 'attended', NULL, 'VOL-EVT4-SH401-UALEX-7782', '2026-09-10 10:15:00', '2026-09-20 08:25:00', 'Exemplary leadership mentoring students in Python logic.'),
        ('sgn-101', 'evt-1', 'sh-101', 'r-101', 'user-marcus', 'Marcus Brody', 'marcus.brody@example.com', '(555) 567-8901', 'Grace Brody', '(555) 654-3210', 'Mother', 'confirmed', NULL, 'VOL-EVT1-SH101-UMARC-1001', '2026-09-25 14:30:00', NULL, NULL),
        ('sgn-102', 'evt-1', 'sh-101', 'r-102', 'user-alex', 'Alex Rivera', 'alex.rivera@example.com', '(555) 345-6789', 'Elena Rivera', '(555) 876-5432', 'Sister', 'confirmed', NULL, 'VOL-EVT1-SH101-UALEX-1002', '2026-09-26 09:12:00', NULL, 'Brought personal wilderness EMT response kit.'),
        ('sgn-103', 'evt-1', 'sh-101', 'r-102', 'user-elena', 'Elena Vance', 'elena.vance@example.com', '(555) 456-7890', 'David Vance', '(555) 765-4321', 'Father', 'pending_approval', NULL, 'VOL-EVT1-SH101-UELEN-1003', '2026-09-28 16:45:00', NULL, 'Submitted Red Cross CPR card for organizer verification.')
      `);

      // Seed Resources
      await connection.query(`
        INSERT INTO resources (id, event_id, title, type, url, description, file_size, is_pinned, uploaded_at)
        VALUES
        ('res-1', 'evt-1', 'Riverfront Restoration Zone Map & Parking Passes', 'map', 'https://images.unsplash.com/photo-1524661135-423995f22d0b?w=800&auto=format&fit=crop&q=80', 'Detailed schematic of Zone Alpha (Debris Clearing) and Zone Beta (Planting Bed). Show at guard gate for free parking.', '3.4 MB PDF', TRUE, '2026-09-22 08:00:00'),
        ('res-2', 'evt-1', 'Volunteer Health, Safety & Mud Gear Guidelines', 'guideline', '#safety-guidelines', 'Sturdy waterproof boots, thick garden gloves, and high-visibility apparel requirements.', '1.2 MB PDF', TRUE, '2026-09-23 11:20:00'),
        ('res-3', 'evt-1', 'Minor & Adult Liability Waiver 2026', 'waiver', '#waiver-doc', 'Required signature for all participants prior to commencing field work.', '450 KB PDF', FALSE, '2026-09-24 14:10:00'),
        ('res-4', 'evt-2', 'Mile 14 Medical Protocol & Radio Dispatch Frequencies', 'document', '#medical-protocol', 'Direct dispatch channel guide for EMT responders and hydration supervisor phone lines.', '2.1 MB PDF', TRUE, '2026-09-25 10:00:00')
      `);

      // Seed Announcements
      await connection.query(`
        INSERT INTO announcements (id, event_id, event_title, title, message, urgency, sent_at, sent_by, channels)
        VALUES
        ('anc-1', 'evt-1', 'Cascadia River Cleanup & Native Planting', 'Weather & Hydration Station Update', 'Warm sunny weather forecast for Saturday! Free sunscreen, cold filtered water dispensers, and electrolyte packets will be provided at Pavilion B. Please bring a refillable container.', 'normal', '2026-09-29 10:30:00', 'Sarah Jenkins (Coordinator)', 'in_app,email'),
        ('anc-2', 'evt-2', 'Metro City Marathon: Aid Station & Course Marshals', 'Mile 14 Checkpoint Location Adjustment', 'CRITICAL: Due to municipal road paving on 13th St, our aid station has been moved 40 meters north onto Beacon Hill Plaza proper. Please enter via Gate 2.', 'urgent', '2026-09-30 09:15:00', 'Sarah Jenkins (Coordinator)', 'in_app,email')
      `);

      // Seed Discussions
      await connection.query(`
        INSERT INTO discussions (id, event_id, user_id, user_name, user_avatar, user_role, message, category, created_at, likes)
        VALUES
        ('dsc-1', 'evt-1', 'user-admin', 'Sarah Jenkins', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80', 'admin', 'Welcome everyone! If you are on the Morning Shift, please aim to arrive 15 minutes early at 7:45 AM for hot coffee and the briefing circle.', 'General', '2026-09-28 09:00:00', 6),
        ('dsc-2', 'evt-1', 'user-marcus', 'Marcus Brody', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', 'volunteer', 'Carpool offer: Driving a pickup truck from Downtown West transit center at 7:15 AM. Have room for 3 volunteers and can haul extra gear or wheelbarrows if needed!', 'Carpool', '2026-09-28 14:22:00', 4),
        ('dsc-3', 'evt-1', 'user-alex', 'Alex Rivera', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', 'volunteer', 'Quick question on First Aid station: Will we have access to 110V power for cold packs at Pavilion B, or should I pack reusable freeze blocks?', 'Question', '2026-09-29 11:05:00', 2),
        ('dsc-4', 'evt-1', 'user-admin', 'Sarah Jenkins', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80', 'admin', '@Alex Rivera We have a portable Honda quiet generator and AC power strip right beside the tent station!', 'Logistics', '2026-09-29 11:40:00', 3)
      `);

      console.log('✅ Demo data seeded successfully into kindred_db!');
    } else {
      console.log('ℹ️ kindred_db already contains data. Skipping re-seeding.');
    }

    console.log('🎉 MySQL Database Initialization Complete!');
  } catch (err) {
    console.error('❌ Error during database initialization:', err.message);
    throw err;
  } finally {
    if (connection) await connection.end();
  }
}

// If run directly: node server/init-db.js
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  initializeDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
