import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Safe JSON parsing helper
function safeJsonParse(data, fallback = []) {
  if (!data) return fallback;
  if (typeof data === 'object') return data;
  try {
    return JSON.parse(data);
  } catch {
    return fallback;
  }
}

// XAMPP MySQL Connection Pool
export const db = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'kindred_db',
  port: Number(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Auto-initialize tables if missing in kindred_db
const initDb = async () => {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'volunteer',
        skills TEXT,
        badges TEXT,
        total_hours_logged INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS events (
        id VARCHAR(255) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        category VARCHAR(100),
        status VARCHAR(50) DEFAULT 'upcoming',
        cover_image TEXT,
        start_date VARCHAR(100),
        end_date VARCHAR(100),
        location_name VARCHAR(255),
        location_address TEXT,
        location_lat DOUBLE,
        location_lng DOUBLE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS shifts (
        id VARCHAR(255) PRIMARY KEY,
        event_id VARCHAR(255),
        title VARCHAR(255),
        start_time VARCHAR(100),
        end_time VARCHAR(100)
      );
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS shift_roles (
        id VARCHAR(255) PRIMARY KEY,
        shift_id VARCHAR(255),
        title VARCHAR(255),
        capacity INT DEFAULT 0,
        filled INT DEFAULT 0,
        required_skills TEXT
      );
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS signups (
        id VARCHAR(255) PRIMARY KEY,
        event_id VARCHAR(255),
        shift_id VARCHAR(255),
        role_id VARCHAR(255),
        user_id VARCHAR(255),
        user_name VARCHAR(255),
        user_email VARCHAR(255),
        status VARCHAR(50) DEFAULT 'pending',
        hours_logged FLOAT DEFAULT 0,
        qr_code_token VARCHAR(255),
        check_in_time DATETIME NULL,
        check_out_time DATETIME NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS announcements (
        id VARCHAR(255) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        content TEXT,
        category VARCHAR(100) DEFAULT 'General',
        author VARCHAR(255) DEFAULT 'Admin',
        pinned TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Database schema checked and initialized.');
  } catch (err) {
    console.warn('⚠️ Database init check failed (Ensure MySQL is running):', err.message);
  }
};

initDb();

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT 1 + 1 AS result');
    res.json({ status: 'ok', database: 'connected', result: rows });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// ------------------------------------------------------------------
// 1. AUTHENTICATION ENDPOINTS
// ------------------------------------------------------------------

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (!users || users.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const user = users[0];

    // Check plaintext password or bcrypt hash match
    const isPasswordValid =
      user.password === password ||
      (await bcrypt.compare(password, user.password).catch(() => false));

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    user.skills = safeJsonParse(user.skills);
    user.badges = safeJsonParse(user.badges);

    delete user.password;
    res.json({ user });
  } catch (err) {
    console.error('Login Error:', err);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// POST /api/auth/register
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password, role = 'volunteer' } = req.body;
  try {
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing && existing.length > 0) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const userId = `usr-${Date.now()}`;
    const hashedPassword = await bcrypt.hash(password, 10);

    await db.query(
      `INSERT INTO users (id, name, email, password, role, skills, badges, total_hours_logged)
       VALUES (?, ?, ?, ?, ?, '[]', '[]', 0)`,
      [userId, name, email, hashedPassword, role]
    );

    const [newUser] = await db.query('SELECT id, name, email, role FROM users WHERE id = ?', [userId]);
    res.status(201).json({ user: newUser[0] });
  } catch (err) {
    console.error('Register Error:', err);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// ------------------------------------------------------------------
// 2. EVENTS, SHIFTS & ROLES ENDPOINTS
// ------------------------------------------------------------------

// GET /api/events - Retrieve events with dynamic capacity filled based ONLY on approved signups
app.get('/api/events', async (req, res) => {
  try {
    const [events] = await db.query('SELECT * FROM events ORDER BY start_date ASC');
    const [shifts] = await db.query('SELECT * FROM shifts');
    const [roles] = await db.query('SELECT * FROM shift_roles');

    // Count approved signups per role
    const [approvedSignups] = await db.query(
      "SELECT role_id, COUNT(*) as approved_count FROM signups WHERE status IN ('approved', 'confirmed') GROUP BY role_id"
    );

    const approvedMap = new Map((approvedSignups || []).map((s) => [s.role_id, s.approved_count]));

    // Group shift roles under shifts
    const shiftsWithRoles = (shifts || []).map((sh) => ({
      ...sh,
      id: sh.id,
      eventId: sh.event_id ?? sh.eventId,
      title: sh.title,
      startTime: sh.start_time ?? sh.startTime,
      endTime: sh.end_time ?? sh.endTime,
      roles: (roles || [])
        .filter((r) => (r.shift_id ?? r.shiftId) === sh.id)
        .map((r) => {
          const approvedCount = Number(approvedMap.get(r.id) || 0);
          return {
            id: r.id,
            shiftId: r.shift_id ?? r.shiftId,
            title: r.title,
            capacity: Number(r.capacity || 0),
            filled: approvedCount, // Only count accepted/approved volunteers
            requiredSkills: safeJsonParse(r.required_skills ?? r.requiredSkills),
          };
        }),
    }));

    // Group shifts under events
    const formattedEvents = (events || []).map((ev) => ({
      id: ev.id,
      title: ev.title,
      description: ev.description,
      category: ev.category,
      status: ev.status,
      coverImage: ev.cover_image ?? ev.coverImage,
      startDate: ev.start_date ?? ev.startDate,
      endDate: ev.end_date ?? ev.endDate,
      location: {
        name: ev.location_name ?? ev.locationName ?? '',
        address: ev.location_address ?? ev.locationAddress ?? '',
        lat: ev.location_lat ?? ev.locationLat ?? 0,
        lng: ev.location_lng ?? ev.locationLng ?? 0,
      },
      shifts: shiftsWithRoles.filter((s) => s.eventId === ev.id),
    }));

    res.json(formattedEvents);
  } catch (err) {
    console.error('Get Events Error:', err.message);
    res.json([]);
  }
});

// ------------------------------------------------------------------
// 3. SIGNUPS & ATTENDANCE ENDPOINTS
// ------------------------------------------------------------------

// GET /api/signups
app.get('/api/signups', async (req, res) => {
  try {
    const [signups] = await db.query('SELECT * FROM signups ORDER BY created_at DESC');
    const formattedSignups = (signups || []).map((s) => ({
      id: s.id,
      eventId: s.event_id ?? s.eventId,
      shiftId: s.shift_id ?? s.shiftId,
      roleId: s.role_id ?? s.roleId,
      userId: s.user_id ?? s.userId,
      userName: s.user_name ?? s.userName,
      userEmail: s.user_email ?? s.userEmail,
      status: s.status,
      hoursLogged: s.hours_logged ?? s.hoursLogged ?? 0,
      qrCodeToken: s.qr_code_token ?? s.qrCodeToken,
      checkInTime: s.check_in_time ?? s.checkInTime,
      checkOutTime: s.check_out_time ?? s.checkOutTime,
      createdAt: s.created_at ?? s.createdAt,
    }));

    res.json(formattedSignups);
  } catch (err) {
    console.error('Get Signups Error:', err.message);
    res.json([]);
  }
});

// POST /api/signups - Submit new volunteer request with status 'pending'
app.post('/api/signups', async (req, res) => {
  const { eventId, shiftId, roleId, userId, userName, userEmail } = req.body;

  try {
    // Prevent duplicate signups for the same role
    const [existing] = await db.query(
      'SELECT id, status FROM signups WHERE user_id = ? AND role_id = ?',
      [userId, roleId]
    );

    if (existing && existing.length > 0) {
      return res.status(400).json({
        message: 'You have already submitted a request for this shift.',
        signup: existing[0],
      });
    }

    const signupId = `sgn-${Date.now()}`;
    const qrToken = `QR-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

    // Status is set to 'pending' upon initial sign-up
    await db.query(
      `INSERT INTO signups (id, event_id, shift_id, role_id, user_id, user_name, user_email, status, qr_code_token)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?)`,
      [signupId, eventId, shiftId, roleId, userId, userName, userEmail, qrToken]
    );

    const [newSignup] = await db.query('SELECT * FROM signups WHERE id = ?', [signupId]);

    const created = newSignup?.[0] || {
      id: signupId,
      eventId,
      shiftId,
      roleId,
      userId,
      userName,
      userEmail,
      status: 'pending',
      qrCodeToken: qrToken,
    };

    res.status(201).json({
      id: created.id,
      eventId: created.event_id ?? created.eventId,
      shiftId: created.shift_id ?? created.shiftId,
      roleId: created.role_id ?? created.roleId,
      userId: created.user_id ?? created.userId,
      userName: created.user_name ?? created.userName,
      userEmail: created.user_email ?? created.userEmail,
      status: created.status,
      qrCodeToken: created.qr_code_token ?? created.qrCodeToken,
    });
  } catch (err) {
    console.error('Create Signup Error:', err);
    res.status(500).json({ message: 'Failed to process signup', error: err.message });
  }
});

// PATCH /api/signups/:id/approve - Admin approves a pending request
app.patch('/api/signups/:id/approve', async (req, res) => {
  const { id } = req.params;
  try {
    const [signups] = await db.query('SELECT * FROM signups WHERE id = ?', [id]);
    if (!signups || signups.length === 0) {
      return res.status(404).json({ message: 'Signup request not found' });
    }

    const signup = signups[0];

    // Update status to approved
    await db.query("UPDATE signups SET status = 'approved' WHERE id = ?", [id]);

    // Increment role capacity filled count
    if (signup.role_id) {
      await db.query('UPDATE shift_roles SET filled = filled + 1 WHERE id = ?', [signup.role_id]).catch(() => {});
    }

    res.json({ message: 'Signup approved successfully', id, status: 'approved' });
  } catch (err) {
    console.error('Approve Signup Error:', err);
    res.status(500).json({ message: 'Failed to approve signup', error: err.message });
  }
});

// PATCH /api/signups/:id/reject - Admin rejects a pending request
app.patch('/api/signups/:id/reject', async (req, res) => {
  const { id } = req.params;
  try {
    await db.query("UPDATE signups SET status = 'rejected' WHERE id = ?", [id]);
    res.json({ message: 'Signup request rejected', id, status: 'rejected' });
  } catch (err) {
    console.error('Reject Signup Error:', err);
    res.status(500).json({ message: 'Failed to reject signup', error: err.message });
  }
});

// ------------------------------------------------------------------
// 4. ANNOUNCEMENTS ENDPOINT
// ------------------------------------------------------------------

// GET /api/announcements
app.get('/api/announcements', async (req, res) => {
  try {
    const [announcements] = await db.query('SELECT * FROM announcements ORDER BY created_at DESC');
    res.json(announcements || []);
  } catch (err) {
    console.error('Get Announcements Error:', err.message);
    res.json([]);
  }
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Kindred Backend connected to XAMPP MySQL at http://localhost:${PORT}`);
});