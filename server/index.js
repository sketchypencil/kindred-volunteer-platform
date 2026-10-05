import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import { dbConfig, initializeDatabase } from './init-db.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// MySQL connection pool
const pool = mysql.createPool({
  ...dbConfig,
  database: 'kindred_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Helper to format User from DB row
function formatUser(row) {
  let skills = [];
  try {
    skills = typeof row.skills === 'string' ? JSON.parse(row.skills) : row.skills || [];
  } catch {
    skills = row.skills ? row.skills.split(',').map((s) => s.trim()) : [];
  }

  let badges = [];
  try {
    badges = typeof row.badges === 'string' ? JSON.parse(row.badges) : row.badges || [];
  } catch {
    badges = [];
  }

  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone || '',
    role: row.role,
    avatar:
      row.avatar ||
      `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(row.name)}`,
    emergencyContact: {
      name: row.emergency_name || '',
      phone: row.emergency_phone || '',
      relation: row.emergency_relation || 'Relative',
    },
    skills,
    totalHoursLogged: parseFloat(row.total_hours_logged) || 0,
    badges,
    bio: row.bio || '',
    createdAt: row.created_at,
  };
}

// ----------------------------------------------------
// AUTHENTICATION ROUTES
// ----------------------------------------------------

// 1. Sign Up (Register new Volunteer or Admin)
app.post('/api/auth/register', async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role = 'volunteer',
      phone = '',
      emergencyContact = {},
      skills = [],
      bio = '',
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check if user already exists
    const [existing] = await pool.query('SELECT id FROM users WHERE LOWER(email) = ?', [cleanEmail]);
    if (existing.length > 0) {
      return res.status(409).json({ error: 'An account with this email address already exists.' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = `user-${Date.now()}`;
    const avatarUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`;

    const insertSql = `
      INSERT INTO users (id, name, email, password, phone, role, avatar, emergency_name, emergency_phone, emergency_relation, skills, total_hours_logged, badges, bio)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0.0, ?, ?)
    `;

    await pool.query(insertSql, [
      userId,
      name.trim(),
      cleanEmail,
      hashedPassword,
      phone.trim(),
      role === 'admin' ? 'admin' : 'volunteer',
      avatarUrl,
      emergencyContact.name || '',
      emergencyContact.phone || '',
      emergencyContact.relation || '',
      JSON.stringify(Array.isArray(skills) ? skills : [skills]),
      JSON.stringify([]),
      bio.trim(),
    ]);

    const [createdRows] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
    const user = formatUser(createdRows[0]);

    console.log(`✅ [Kindred Auth] New user registered: ${user.name} (${user.email}) as ${user.role}`);
    return res.status(201).json({ success: true, user, message: 'Account created successfully!' });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({ error: 'Internal server error while registering user.' });
  }
});

// 2. Log In
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const [rows] = await pool.query('SELECT * FROM users WHERE LOWER(email) = ?', [cleanEmail]);

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const dbUser = rows[0];
    const isMatch = await bcrypt.compare(password, dbUser.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const user = formatUser(dbUser);
    console.log(`🔑 [Kindred Auth] User logged in: ${user.name} (${user.role})`);
    return res.json({ success: true, user, message: `Welcome back, ${user.name}!` });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Internal server error while logging in.' });
  }
});

// 3. Get All Users
app.get('/api/users', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM users ORDER BY name ASC');
    const users = rows.map(formatUser);
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// EVENTS & SHIFTS ROUTES
// ----------------------------------------------------

// Get all events with nested shifts and roles
app.get('/api/events', async (req, res) => {
  try {
    const [eventRows] = await pool.query('SELECT * FROM events ORDER BY start_date ASC');
    const [shiftRows] = await pool.query('SELECT * FROM shifts ORDER BY date ASC, start_time ASC');
    const [roleRows] = await pool.query('SELECT * FROM shift_roles');

    const events = eventRows.map((ev) => {
      const shiftsForEvent = shiftRows.filter((s) => s.event_id === ev.id);

      const nestedShifts = shiftsForEvent.map((sh) => {
        const rolesForShift = roleRows
          .filter((r) => r.shift_id === sh.id)
          .map((r) => ({
            id: r.id,
            name: r.name,
            description: r.description || '',
            capacity: parseInt(r.capacity, 10) || 1,
            requiresApproval: Boolean(r.requires_approval),
            skillsSuggested: r.skills_suggested
              ? r.skills_suggested.split(',').map((s) => s.trim())
              : [],
          }));

        return {
          id: sh.id,
          eventId: sh.event_id,
          title: sh.title,
          startTime: sh.start_time,
          endTime: sh.end_time,
          date: sh.date ? new Date(sh.date).toISOString().split('T')[0] : '',
          hours: parseFloat(sh.hours) || 4.0,
          roles: rolesForShift,
        };
      });

      return {
        id: ev.id,
        title: ev.title,
        description: ev.description,
        category: ev.category,
        location: {
          name: ev.location_name,
          address: ev.location_address,
          mapUrl: ev.location_map_url || undefined,
        },
        startDate: ev.start_date ? new Date(ev.start_date).toISOString().split('T')[0] : '',
        endDate: ev.end_date ? new Date(ev.end_date).toISOString().split('T')[0] : '',
        status: ev.status,
        organizer: {
          name: ev.organizer_name,
          email: ev.organizer_email,
          organization: ev.organizer_org,
        },
        coverImage: ev.cover_image,
        requiresVerification: Boolean(ev.requires_verification),
        shifts: nestedShifts,
      };
    });

    res.json(events);
  } catch (err) {
    console.error('Error fetching events:', err);
    res.status(500).json({ error: err.message });
  }
});

// Create new event with multi-slot shifts and roles
app.post('/api/events', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const ev = req.body;
    const eventId = `evt-${Date.now()}`;

    await connection.query(
      `INSERT INTO events (id, title, description, category, location_name, location_address, location_map_url, start_date, end_date, status, organizer_name, organizer_email, organizer_org, cover_image, requires_verification)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        eventId,
        ev.title,
        ev.description,
        ev.category,
        ev.location.name,
        ev.location.address,
        ev.location.mapUrl || null,
        ev.startDate,
        ev.endDate || ev.startDate,
        ev.status || 'upcoming',
        ev.organizer.name,
        ev.organizer.email,
        ev.organizer.organization,
        ev.coverImage,
        ev.requiresVerification ? 1 : 0,
      ]
    );

    if (ev.shifts && Array.isArray(ev.shifts)) {
      for (let sIdx = 0; sIdx < ev.shifts.length; sIdx++) {
        const sh = ev.shifts[sIdx];
        const shiftId = sh.id || `sh-${Date.now()}-${sIdx}`;

        await connection.query(
          `INSERT INTO shifts (id, event_id, title, start_time, end_time, date, hours)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [shiftId, eventId, sh.title, sh.startTime, sh.endTime, sh.date || ev.startDate, sh.hours || 4.0]
        );

        if (sh.roles && Array.isArray(sh.roles)) {
          for (let rIdx = 0; rIdx < sh.roles.length; rIdx++) {
            const r = sh.roles[rIdx];
            const roleId = r.id || `r-${Date.now()}-${sIdx}-${rIdx}`;
            const skillsStr = Array.isArray(r.skillsSuggested)
              ? r.skillsSuggested.join(', ')
              : r.skillsSuggested || '';

            await connection.query(
              `INSERT INTO shift_roles (id, shift_id, name, description, capacity, requires_approval, skills_suggested)
               VALUES (?, ?, ?, ?, ?, ?, ?)`,
              [
                roleId,
                shiftId,
                r.name,
                r.description || '',
                parseInt(r.capacity, 10) || 1,
                r.requiresApproval ? 1 : 0,
                skillsStr,
              ]
            );
          }
        }
      }
    }

    await connection.commit();
    res.status(201).json({ success: true, id: eventId });
  } catch (err) {
    await connection.rollback();
    console.error('Error creating event:', err);
    res.status(500).json({ error: err.message });
  } finally {
    connection.release();
  }
});

// Update event status
app.patch('/api/events/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    await pool.query('UPDATE events SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// SIGNUPS & WAITLIST ROUTES
// ----------------------------------------------------

app.get('/api/signups', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM signups ORDER BY registered_at DESC');
    const signups = rows.map((r) => ({
      id: r.id,
      eventId: r.event_id,
      shiftId: r.shift_id,
      roleId: r.role_id,
      userId: r.user_id,
      userName: r.user_name,
      userEmail: r.user_email,
      userPhone: r.user_phone || '',
      emergencyContact: {
        name: r.emergency_name || '',
        phone: r.emergency_phone || '',
        relation: r.emergency_relation || '',
      },
      status: r.status,
      waitlistPosition: r.waitlist_position || undefined,
      qrCodeToken: r.qr_code_token,
      registeredAt: r.registered_at,
      checkedInAt: r.checked_in_at || undefined,
      notes: r.notes || '',
    }));
    res.json(signups);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Volunteer Sign Up (with automated waitlist and approval check)
app.post('/api/signups', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { eventId, shiftId, roleId, userId, notes = '' } = req.body;

    // Check user
    const [userRows] = await connection.query('SELECT * FROM users WHERE id = ?', [userId]);
    if (userRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'User not found' });
    }
    const user = userRows[0];

    // Check role capacity and requirements
    const [roleRows] = await connection.query('SELECT * FROM shift_roles WHERE id = ?', [roleId]);
    if (roleRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Role not found' });
    }
    const role = roleRows[0];

    // Check event verification requirement
    const [evRows] = await connection.query('SELECT requires_verification FROM events WHERE id = ?', [eventId]);
    const eventRequiresVerif = evRows.length > 0 && Boolean(evRows[0].requires_verification);

    // Active signups for this role
    const [activeSignups] = await connection.query(
      `SELECT COUNT(*) as count FROM signups 
       WHERE event_id = ? AND shift_id = ? AND role_id = ? AND status IN ('confirmed', 'attended', 'pending_approval')`,
      [eventId, shiftId, roleId]
    );
    const confirmedCount = activeSignups[0].count;

    // Current waitlist count
    const [waitlistRows] = await connection.query(
      `SELECT COUNT(*) as count FROM signups 
       WHERE event_id = ? AND shift_id = ? AND role_id = ? AND status = 'waitlisted'`,
      [eventId, shiftId, roleId]
    );
    const waitlistCount = waitlistRows[0].count;

    let assignedStatus = 'confirmed';
    let waitlistPos = null;

    if (confirmedCount >= role.capacity) {
      assignedStatus = 'waitlisted';
      waitlistPos = waitlistCount + 1;
    } else if (role.requires_approval || eventRequiresVerif) {
      assignedStatus = 'pending_approval';
    } else {
      assignedStatus = 'confirmed';
    }

    const tokenHex = Math.random().toString(36).substring(2, 6).toUpperCase();
    const qrCodeToken = `VOL-${eventId.toUpperCase()}-${shiftId.toUpperCase()}-${user.name.substring(0, 4).toUpperCase()}-${tokenHex}`;
    const signupId = `sgn-${Date.now()}`;

    await connection.query(
      `INSERT INTO signups (id, event_id, shift_id, role_id, user_id, user_name, user_email, user_phone, emergency_name, emergency_phone, emergency_relation, status, waitlist_position, qr_code_token, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        signupId,
        eventId,
        shiftId,
        roleId,
        user.id,
        user.name,
        user.email,
        user.phone,
        user.emergency_name,
        user.emergency_phone,
        user.emergency_relation,
        assignedStatus,
        waitlistPos,
        qrCodeToken,
        notes,
      ]
    );

    await connection.commit();

    return res.status(201).json({
      success: true,
      signupId,
      status: assignedStatus,
      waitlistPosition: waitlistPos,
      qrCodeToken,
    });
  } catch (err) {
    await connection.rollback();
    console.error('Error creating signup:', err);
    res.status(500).json({ error: err.message });
  } finally {
    connection.release();
  }
});

// Cancel signup and execute AUTOMATED WAITLIST PROMOTION
app.post('/api/signups/:id/cancel', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const signupId = req.params.id;
    const [targetRows] = await connection.query('SELECT * FROM signups WHERE id = ?', [signupId]);
    if (targetRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Signup not found' });
    }
    const target = targetRows[0];

    // Mark as canceled
    await connection.query('UPDATE signups SET status = "canceled", waitlist_position = NULL WHERE id = ?', [signupId]);

    let promotedUser = null;

    // If canceled signup held a confirmed or pending spot, promote waitlist #1
    if (target.status === 'confirmed' || target.status === 'pending_approval') {
      const [waitlist] = await connection.query(
        `SELECT * FROM signups 
         WHERE event_id = ? AND shift_id = ? AND role_id = ? AND status = 'waitlisted'
         ORDER BY waitlist_position ASC`,
        [target.event_id, target.shift_id, target.role_id]
      );

      if (waitlist.length > 0) {
        const nextInLine = waitlist[0];

        // Check if role requires approval
        const [roleRows] = await connection.query('SELECT requires_approval FROM shift_roles WHERE id = ?', [target.role_id]);
        const requiresApproval = roleRows.length > 0 && Boolean(roleRows[0].requires_approval);
        const newStatus = requiresApproval ? 'pending_approval' : 'confirmed';

        await connection.query(
          'UPDATE signups SET status = ?, waitlist_position = NULL WHERE id = ?',
          [newStatus, nextInLine.id]
        );

        // Decrement remaining positions
        await connection.query(
          `UPDATE signups 
           SET waitlist_position = waitlist_position - 1 
           WHERE event_id = ? AND shift_id = ? AND role_id = ? AND status = 'waitlisted' AND id != ?`,
          [target.event_id, target.shift_id, target.role_id, nextInLine.id]
        );

        promotedUser = nextInLine.user_name;
        console.log(`🎉 [Kindred Waitlist Engine] Auto-promoted ${nextInLine.user_name} to ${newStatus}!`);
      }
    }

    await connection.commit();
    res.json({ success: true, promotedUser });
  } catch (err) {
    await connection.rollback();
    console.error('Error canceling signup:', err);
    res.status(500).json({ error: err.message });
  } finally {
    connection.release();
  }
});

// Update attendance status (Attended, Confirmed, No-show) & compute volunteer hours
app.patch('/api/signups/:id/status', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { status } = req.body;
    const signupId = req.params.id;

    const [rows] = await connection.query('SELECT * FROM signups WHERE id = ?', [signupId]);
    if (rows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Signup not found' });
    }
    const signup = rows[0];
    const prevStatus = signup.status;

    // Get shift hours
    const [shiftRows] = await connection.query('SELECT hours FROM shifts WHERE id = ?', [signup.shift_id]);
    const shiftHours = shiftRows.length > 0 ? parseFloat(shiftRows[0].hours) : 4.0;

    const checkedInAt = status === 'attended' ? new Date() : signup.checked_in_at;

    await connection.query(
      'UPDATE signups SET status = ?, checked_in_at = ? WHERE id = ?',
      [status, checkedInAt, signupId]
    );

    // If transitioned to 'attended', add hours to volunteer profile in MySQL!
    if (status === 'attended' && prevStatus !== 'attended') {
      await connection.query(
        'UPDATE users SET total_hours_logged = total_hours_logged + ? WHERE id = ?',
        [shiftHours, signup.user_id]
      );
      console.log(`⏱️ [Kindred Hours] Added +${shiftHours} hours to user ${signup.user_name} (${signup.user_id})`);
    } else if (prevStatus === 'attended' && status !== 'attended') {
      await connection.query(
        'UPDATE users SET total_hours_logged = GREATEST(0, total_hours_logged - ?) WHERE id = ?',
        [shiftHours, signup.user_id]
      );
    }

    await connection.commit();
    res.json({ success: true, shiftHours });
  } catch (err) {
    await connection.rollback();
    console.error('Error updating signup status:', err);
    res.status(500).json({ error: err.message });
  } finally {
    connection.release();
  }
});

// QR Code Check-In Scanner Endpoint
app.post('/api/signups/scan', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { token } = req.body;
    if (!token) {
      await connection.rollback();
      return res.status(400).json({ success: false, message: 'QR token is required' });
    }

    const cleanToken = token.trim();
    const [rows] = await connection.query(
      'SELECT * FROM signups WHERE LOWER(qr_code_token) = ?',
      [cleanToken.toLowerCase()]
    );

    if (rows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: `Unrecognized QR token: "${cleanToken}"` });
    }

    const signup = rows[0];

    if (signup.status === 'attended') {
      await connection.commit();
      return res.json({
        success: true,
        alreadyCheckedIn: true,
        userName: signup.user_name,
        message: `${signup.user_name} is already checked in!`,
      });
    }

    // Get shift hours
    const [shiftRows] = await connection.query('SELECT hours FROM shifts WHERE id = ?', [signup.shift_id]);
    const shiftHours = shiftRows.length > 0 ? parseFloat(shiftRows[0].hours) : 4.0;

    await connection.query(
      'UPDATE signups SET status = "attended", checked_in_at = NOW() WHERE id = ?',
      [signup.id]
    );

    await connection.query(
      'UPDATE users SET total_hours_logged = total_hours_logged + ? WHERE id = ?',
      [shiftHours, signup.user_id]
    );

    await connection.commit();
    return res.json({
      success: true,
      userName: signup.user_name,
      shiftHours,
      message: `Verified! Welcome ${signup.user_name}! Marked Attended (+${shiftHours} hours logged).`,
    });
  } catch (err) {
    await connection.rollback();
    console.error('Error during QR scan:', err);
    res.status(500).json({ success: false, error: err.message });
  } finally {
    connection.release();
  }
});

// ----------------------------------------------------
// RESOURCES, ANNOUNCEMENTS & DISCUSSIONS
// ----------------------------------------------------

app.get('/api/resources', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM resources ORDER BY uploaded_at DESC');
    res.json(
      rows.map((r) => ({
        id: r.id,
        eventId: r.event_id,
        title: r.title,
        type: r.type,
        url: r.url || '',
        description: r.description || '',
        fileSize: r.file_size,
        isPinned: Boolean(r.is_pinned),
        uploadedAt: r.uploaded_at,
      }))
    );
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/resources', async (req, res) => {
  try {
    const { eventId, title, type, description = '', fileSize = '1.5 MB PDF', isPinned = false } = req.body;
    const id = `res-${Date.now()}`;
    await pool.query(
      `INSERT INTO resources (id, event_id, title, type, url, description, file_size, is_pinned)
       VALUES (?, ?, ?, ?, '#sample-doc', ?, ?, ?)`,
      [id, eventId, title, type, description, fileSize, isPinned ? 1 : 0]
    );
    res.status(201).json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/resources/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM resources WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/announcements', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM announcements ORDER BY sent_at DESC');
    res.json(
      rows.map((a) => ({
        id: a.id,
        eventId: a.event_id,
        eventTitle: a.event_title || '',
        title: a.title,
        message: a.message,
        urgency: a.urgency,
        sentAt: a.sent_at,
        sentBy: a.sent_by,
        channels: a.channels ? a.channels.split(',') : ['in_app'],
      }))
    );
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/announcements', async (req, res) => {
  try {
    const { eventId, eventTitle, title, message, urgency = 'normal', sentBy, channels = ['in_app', 'email'] } = req.body;
    const id = `anc-${Date.now()}`;
    await pool.query(
      `INSERT INTO announcements (id, event_id, event_title, title, message, urgency, sent_by, channels)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, eventId, eventTitle, title, message, urgency, sentBy, channels.join(',')]
    );
    res.status(201).json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/discussions', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM discussions ORDER BY created_at ASC');
    res.json(
      rows.map((d) => ({
        id: d.id,
        eventId: d.event_id,
        userId: d.user_id,
        userName: d.user_name,
        userAvatar: d.user_avatar,
        userRole: d.user_role,
        message: d.message,
        category: d.category,
        createdAt: d.created_at,
        likes: parseInt(d.likes, 10) || 0,
      }))
    );
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/discussions', async (req, res) => {
  try {
    const { eventId, userId, userName, userAvatar, userRole, message, category = 'General' } = req.body;
    const id = `dsc-${Date.now()}`;
    await pool.query(
      `INSERT INTO discussions (id, event_id, user_id, user_name, user_avatar, user_role, message, category, likes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      [id, eventId, userId, userName, userAvatar, userRole, message, category]
    );
    res.status(201).json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/discussions/:id/like', async (req, res) => {
  try {
    await pool.query('UPDATE discussions SET likes = likes + 1 WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reset data back to default initial state in MySQL
app.post('/api/reset-data', async (req, res) => {
  try {
    await initializeDatabase();
    res.json({ success: true, message: 'Database reset to initial demo state.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start Express server
app.listen(PORT, () => {
  console.log(`🚀 Kindred API Backend listening on http://localhost:${PORT}`);
  console.log(`🗄️  Connected to MySQL Database: kindred_db at ${dbConfig.host}:${dbConfig.port}`);
});
