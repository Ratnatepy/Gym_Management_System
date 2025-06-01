// Load environment variables from .env file
require('dotenv').config();

// Import required modules
const path = require('path');
const express = require('express');
const cors = require('cors');
const pool = require('./db'); // Database connection pool
const bcrypt = require('bcrypt'); // Password hashing
const rateLimit = require('express-rate-limit'); // Rate limiting
const { body, validationResult } = require('express-validator'); // Input validation
const { exec, spawn } = require('child_process'); // For executing shell commands
const fs = require('fs');


// Initialize Express application
const app = express();
const port = process.env.PORT || 5000; // Use environment port or default to 5000

// Middleware setup
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Parse JSON request bodies

// Root endpoint - Basic health check
app.get('/', (req, res) => {
  res.send('BigBoss Gym Backend Running!');
});

/**
 * Rate limiting configuration for login endpoint
 * Limits to 10 requests per 15 minutes
 */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per window
  handler: (req, res) => {
    res.status(429).json({ error: 'Too many login attempts, please try again later.' });
  }
});

/**
 * LOGIN ENDPOINT
 * Validates email and password, authenticates user
 */
app.post('/api/login', loginLimiter, [
  // Input validation
  body('email').isEmail(),
  body('password').notEmpty()
], async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Validation failed', details: errors.array() });
  }

  const { email, password } = req.body;

  try {
    // Query database for user
    const [rows] = await pool.query(`SELECT * FROM members WHERE member_email = ?`, [email]);
    if (!rows.length) return res.status(401).json({ error: 'Invalid email or password' });

    const user = rows[0];
    // Compare hashed passwords
    const isValid = await bcrypt.compare(password, user.member_password);
    if (!isValid) return res.status(401).json({ error: 'Invalid email or password' });

    // Successful login response
    res.json({
      id: user.member_id,
      name: user.member_name,
      phone: user.member_tel,
      email: user.member_email,
      dob: user.dob,
      membership_type: user.membership_type || 'Standard Membership'
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

/**
 * MEMBER REGISTRATION ENDPOINT
 * Creates a new member account
 */
// Helper function to convert ISO date string to MySQL DATE format (YYYY-MM-DD)
function toMysqlDate(dateString) {
  if (!dateString) return null;
  const date = new Date(dateString);
  if (isNaN(date)) return null;
  return date.toISOString().slice(0, 10); // Extract YYYY-MM-DD
}

app.post('/api/members', [
  body('member_name').notEmpty().withMessage('Name is required'),
  body('member_email').isEmail().withMessage('Valid email is required'),
  body('member_tel').notEmpty().withMessage('Phone number is required'),
  body('member_password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('dob').optional({ nullable: true }).isISO8601().withMessage('Invalid date of birth'),
  body('join_date').optional({ nullable: true }).isISO8601().withMessage('Invalid join date')
], async (req, res) => {
 
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('Validation errors:', errors.array());
    return res.status(400).json({ error: 'Validation failed', details: errors.array() });
  }

  let { member_name, member_email, member_tel, membership_type = 'Standard', join_date, dob, member_password } = req.body;

  // Convert incoming dates to MySQL DATE format (YYYY-MM-DD)
  dob = toMysqlDate(dob);
  join_date = toMysqlDate(join_date) || new Date().toISOString().slice(0, 10);

  try {
    // Generate unique member ID
    let member_id;
    let isUnique = false;
    while (!isUnique) {
      member_id = `MBR${Math.floor(100000 + Math.random() * 900000)}`;
      const [existing] = await pool.query('SELECT 1 FROM members WHERE member_id = ?', [member_id]);
      if (existing.length === 0) isUnique = true;
    }

    const hashedPassword = await bcrypt.hash(member_password, 10);

    await pool.query(`
      INSERT INTO members (
        member_id,
        member_name,
        member_email,
        member_password,
        member_tel,
        dob,
        join_date,
        membership_type
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        member_id,
        member_name,
        member_email,
        hashedPassword,
        member_tel,
        dob,
        join_date,
        membership_type
      ]
    );

    res.status(201).json({ message: 'Member added successfully', member_id });
  } catch (err) {
    console.error('Insert member error:', err);
    res.status(500).json({ error: 'Failed to register member', details: err.sqlMessage });
  }
  

}); 

/// ✅ Move this first
app.get('/api/members/count', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT COUNT(*) AS totalMembers FROM members');
    res.json({ totalMembers: rows[0].totalMembers });
  } catch (err) {
    console.error('Count members error:', err);
    res.status(500).json({ error: 'Failed to count members' });
  }
});

// ✅ THEN define this route AFTER
app.get('/api/members/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query('SELECT * FROM members WHERE member_id = ?', [id]);
    if (!rows.length) return res.status(404).json({ error: 'Member not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error('Fetch member error:', err);
    res.status(500).json({ error: 'Fetch member failed' });
  }
});

app.get('/api/members', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM members');
    res.json(rows);
  } catch (err) {
    console.error('Error fetching members:', err);
    res.status(500).json({ error: 'Failed to fetch members' });
  }
});

/**
 * UPDATE MEMBER ENDPOINT
 * Modifies member details
 */
app.put('/api/members/:id', async (req, res) => {
  const { id } = req.params;
  const { name, email, phone, dob, membership_type, join_date } = req.body;

  if (!name || !email || !phone || !dob || !membership_type || !join_date) {
    return res.status(400).json({ error: 'All fields required' });
  }

  try {
    await pool.query(`
      UPDATE members 
      SET member_name = ?, member_email = ?, member_tel = ?, dob = ?, membership_type = ?, join_date = ?
      WHERE member_id = ?
    `, [name, email, phone, dob, membership_type, join_date, id]);

    res.json({ message: 'Member updated successfully' });
  } catch (err) {
    console.error('Update member error:', err);
    res.status(500).json({ error: 'Update failed' });
  }
});

/**
 * DELETE MEMBER ENDPOINT
 */
app.delete('/api/members/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM members WHERE member_id = ?', [id]);
    res.json({ message: 'Member deleted successfully' });
  } catch (err) {
    console.error('Delete member error:', err);
    res.status(500).json({ error: 'Delete failed' });
  }
});

/**
 * UPDATE PASSWORD ENDPOINT
 * Changes member password
 */
app.post('/api/members/password', async (req, res) => {
  const { id, new_password } = req.body;
  
  // Validate required fields
  if (!id || !new_password) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  try {
    // Hash new password before storing
    const hashed = await bcrypt.hash(new_password, 10);
    await pool.query(`UPDATE members SET member_password = ? WHERE member_id = ?`, [hashed, id]);
    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error('Password update error:', err);
    res.status(500).json({ error: 'Password update failed' });
  }
});

/**
 * FEEDBACK SUBMISSION ENDPOINT
 * Stores member feedback about trainers
 */
app.post('/api/feedback', async (req, res) => {
  const { trainer_name, member_id, rating, comment } = req.body;
  

  // Validate required fields
  if (!trainer_name || !member_id || !rating || !comment) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  try {
    await pool.query(`
      INSERT INTO feedback (trainer_name, member_id, rating, comment)
      VALUES (?, ?, ?, ?)`,
      [trainer_name, member_id, rating, comment]
    );
    res.status(201).json({ message: 'Feedback submitted' });
  } catch (err) {
    console.error('Feedback insert error:', err);
    res.status(500).json({ error: 'Save feedback failed' });
  }
});

/**
 * GET ALL TRAINERS ENDPOINT
 * Returns list of all gym trainers
 */
app.get('/api/trainers', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM trainers');
    res.json(rows);
  } catch (err) {
    console.error('Fetch trainers error:', err);
    res.status(500).json({ error: 'Fetch trainers failed' });
  }
});
// CREATE new trainer
app.post('/api/trainers', [
  body('name').notEmpty(),
  body('email').isEmail(),
  body('specialty').notEmpty(),
  body('experience').isInt(),
  body('schedule').notEmpty(),
  body('rating').isFloat({ min: 0, max: 5 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Validation failed', details: errors.array() });
  }

  const { name, email, specialty, experience, schedule, rating } = req.body;

  try {
    const [result] = await pool.query(`
      INSERT INTO trainers (name, email, specialty, experience, schedule, rating)
      VALUES (?, ?, ?, ?, ?, ?)`, 
      [name, email, specialty, experience, schedule, rating]
    );
    res.status(201).json({ message: 'Trainer added', trainer_id: result.insertId });
  } catch (err) {
    console.error('Add trainer error:', err);
    res.status(500).json({ error: 'Failed to add trainer' });
  }
});

// UPDATE trainer
app.put('/api/trainers/:id', async (req, res) => {
  const { id } = req.params;
  const { name, email, specialty, experience, schedule, rating } = req.body;

  if (!name || !email || !specialty || !experience || !schedule || !rating) {
    return res.status(400).json({ error: 'All fields required' });
  }

  try {
    await pool.query(`
      UPDATE trainers
      SET name = ?, email = ?, specialty = ?, experience = ?, schedule = ?, rating = ?
      WHERE trainer_id = ?`,  // <-- Use trainer_id here
      [name, email, specialty, experience, schedule, rating, id]
    );
    res.json({ message: 'Trainer updated successfully' });
  } catch (err) {
    console.error('Update trainer error:', err);
    res.status(500).json({ error: 'Failed to update trainer' });
  }
});

// DELETE trainer
app.delete('/api/trainers/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query('DELETE FROM trainers WHERE trainer_id = ?', [id]); // <-- Use trainer_id here
    res.json({ message: 'Trainer deleted successfully' });
  } catch (err) {
    console.error('Delete trainer error:', err);
    res.status(500).json({ error: 'Failed to delete trainer' });
  }
});


// POST /api/contacts 
app.post('/api/contacts', [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('subject').optional().isString(),
  body('message').notEmpty().withMessage('Message is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Validation failed', details: errors.array() });
  }

  const { name, email, subject, message } = req.body;

  try {
    await pool.query(`
      INSERT INTO contacts (name, email, subject, message)
      VALUES (?, ?, ?, ?)`,
      [name, email, subject || null, message]
    );
    res.status(201).json({ message: 'Contact message received' });
  } catch (err) {
    console.error('Insert contact error:', err);
    res.status(500).json({ error: 'Failed to save contact message' });
  }
});


// POST /api/bookings

app.post('/api/bookings', [
  body('member_id').notEmpty().withMessage('Member ID is required'),
  body('workout_name').notEmpty().withMessage('Workout name is required'),
  body('booking_date').optional().isISO8601().withMessage('Invalid booking date'),

], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Validation failed', details: errors.array() });
  }

  const { member_id, workout_name, booking_date } = req.body;

  try {
    // Use NOW() if booking_date is not provided
    const bookingDateValue = booking_date ? new Date(booking_date) : new Date();

    const [result] = await pool.query(`
      INSERT INTO bookings (member_id, workout_name, booking_date)
      VALUES (?, ?, ?)`,
      [member_id, workout_name, bookingDateValue]
    );

    res.status(201).json({ message: 'Booking created successfully', booking_id: result.insertId });
  } catch (err) {
    console.error('Create booking error:', err);
    res.status(500).json({ error: 'Failed to create booking' });
  }
});



/**
 * MEMBER COUNT ENDPOINT
 * Returns total number of members
 */
app.get('/api/members/count', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT COUNT(*) AS totalMembers FROM members');
    res.json({ totalMembers: rows[0].totalMembers });
  } catch (err) {
    console.error('Count members error:', err);
    res.status(500).json({ error: 'Failed to count members' });
  }
});

/**
 * TRAINER COUNT ENDPOINT
 * Returns total number of trainers
 */
app.get('/api/trainers/count', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT COUNT(*) AS totalTrainers FROM trainers');
    res.json({ totalTrainers: rows[0].totalTrainers });
  } catch (err) {
    console.error('Count trainers error:', err);
    res.status(500).json({ error: 'Failed to count trainers' });
  }
});

/**
 * TOTAL INCOME ENDPOINT
 * Returns sum of all payments
 */
app.get('/api/payments/total', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT SUM(total_amount) AS totalIncome FROM payments');
    res.json({ 
      totalIncome: rows[0].totalIncome ? parseFloat(rows[0].totalIncome).toFixed(2) : '0.00' 
    });
  } catch (err) {
    console.error('Total income error:', err);
    res.status(500).json({ error: 'Failed to calculate income' });
  }
});

/**
 * GET ALL PAYMENTS
 */
app.get('/api/payments', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM payments ORDER BY payment_date DESC');
    res.json(rows);
  } catch (err) {
    console.error('Fetch payments error:', err);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

// PUT update payment
app.put('/api/payments/:id', [
  body('member_id').notEmpty(),
  body('total_amount').isDecimal(),
  body('payment_method').notEmpty()
], async (req, res) => {
  const { id } = req.params;
  const { member_id, total_amount, payment_method, promo_used } = req.body;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const [result] = await pool.query(`
      UPDATE payments 
      SET member_id = ?, total_amount = ?, payment_method = ?, promo_used = ?
      WHERE payment_id = ?
    `, [member_id, total_amount, payment_method, promo_used || null, id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    res.json({ message: 'Payment updated successfully' });
  } catch (err) {
    console.error('Update payment error:', err);
    res.status(500).json({ error: 'Failed to update payment' });
  }
});


// DELETE payment
app.delete('/api/payments/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query('DELETE FROM payments WHERE payment_id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    res.json({ message: 'Payment deleted successfully' });
  } catch (err) {
    console.error('Delete payment error:', err);
    res.status(500).json({ error: 'Failed to delete payment' });
  }
});

/**
 * CREATE NEW PAYMENT
 */
app.post('/api/payments', [
  body('member_id').notEmpty(),
  body('total_amount').isDecimal(),
  body('payment_method').notEmpty()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { member_id, total_amount, payment_method, promo_used } = req.body;

  try {
    const [result] = await pool.query(`
      INSERT INTO payments (member_id, total_amount, payment_method, promo_used, payment_date)
      VALUES (?, ?, ?, ?, NOW())`,
      [member_id, total_amount, payment_method, promo_used || null]
    );
    res.status(201).json({ 
      message: 'Payment recorded successfully',
      payment_id: result.insertId 
    });
  } catch (err) {
    console.error('Payment creation error:', err);
    res.status(500).json({ error: 'Failed to record payment' });
  }
});

app.get('/api/payments/monthly', async (req, res) => {
  try {
    const ALLOWED_MEMBERSHIPS = ['Standard Membership', 'Premium Membership', 'Family Membership'];

    let query = `
      SELECT 
        DATE_FORMAT(p.payment_date, '%Y-%m') AS month,
        m.membership_type,
        SUM(p.total_amount) AS total
      FROM payments p
      JOIN members m ON p.member_id = m.member_id
    `;

    const conditions = [];
    const params = [];

    // Year filter
    if (req.query.year) {
      conditions.push('YEAR(p.payment_date) = ?');
      params.push(req.query.year);
    } else {
      return res.status(400).json({ error: 'Year is required' });
    }

    // Month range filter
    if (req.query.fromMonth && req.query.toMonth) {
      conditions.push('MONTH(p.payment_date) BETWEEN ? AND ?');
      params.push(req.query.fromMonth, req.query.toMonth);
    }

    // Membership type filter with validation
    if (req.query.membershipType && req.query.membershipType !== '') {
      if (!ALLOWED_MEMBERSHIPS.includes(req.query.membershipType)) {
        return res.status(400).json({ error: 'Invalid membershipType filter' });
      }
      conditions.push('m.membership_type = ?');
      params.push(req.query.membershipType);
    } else {
      // Filter only allowed membership types if no specific membershipType filter
      conditions.push(`m.membership_type IN (${ALLOWED_MEMBERSHIPS.map(() => '?').join(',')})`);
      params.push(...ALLOWED_MEMBERSHIPS);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' GROUP BY month, m.membership_type';
    query += ' ORDER BY month ASC, m.membership_type ASC';

    const [rows] = await pool.query(query, params);

    const response = rows.map(row => ({
      month: row.month,
      membership_type: row.membership_type,
      total: parseFloat(row.total)
    }));

    res.json(response);
  } catch (err) {
    console.error('Monthly income error:', err);
    res.status(500).json({ error: 'Failed to fetch monthly income' });
  }
});


/**
 * CHATBOT ENDPOINT - Handles message forwarding to Java RMI chatbot
 */
app.get('/chatbot', async (req, res) => {
  const msg = req.query.msg;
  if (!msg) {
    console.error('[CHATBOT] [ERROR] Missing message parameter');
    return res.status(400).send('Please enter your question');
  }

  try {
    const backend_root = path.resolve(__dirname);
    const root_project = path.join(backend_root, '..');

    const sanitizedMsg = msg.replace(/"/g, '\\"').replace(/\n/g, ' ');

    const command = `java -cp "${root_project}/bigboss_rmi;${root_project}" bigboss_rmi.ChatBridge "${sanitizedMsg}"`;

    const child = exec(command, {
      cwd: root_project,
      timeout: 5000
    });

    let stdoutData = '';
    let stderrData = '';

    child.stdout.on('data', (data) => {
      stdoutData += data;
      if (!data.startsWith('CHATBOT_RESPONSE:')) {
        console.log('[JAVA]', data.trim());
      }
    });

    child.stderr.on('data', (data) => {
      stderrData += data;
      console.error('[JAVA] [ERROR]', data.trim());
    });

    child.on('close', (code) => {
      const lines = stdoutData
        .replace(/\r\n/g, '\n')
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);

      console.log('[CHATBOT] [DEBUG] All output lines:', lines);

      const startIndex = lines.findIndex(line => line.startsWith('CHATBOT_RESPONSE:'));
      
      if (startIndex !== -1) {
        const responseLines = lines.slice(startIndex).map(line =>
          line.replace(/^CHATBOT_RESPONSE:\s*/, '') // remove the prefix from the first line
        );
        const response = responseLines.join('\n').trim();
        console.log('[CHATBOT] [INFO] Response ready');
        res.send(response);
      } else if (lines.some(line => line.startsWith('CHATBOT_ERROR:'))) {
        const errorLine = lines.find(line => line.startsWith('CHATBOT_ERROR:'));
        const error = errorLine.replace('CHATBOT_ERROR:', '').trim();
        console.error('[CHATBOT] [ERROR]', error);
        res.status(500).send('Unable to process your request');
      } else {
        console.error('[CHATBOT] [ERROR] Invalid response format');
        res.status(500).send('Service error');
      }
    });

  } catch (err) {
    console.error('[SYSTEM] [ERROR]', err);
    res.status(500).send('Service unavailable');
  }
});





async function insertSampleTrainers() {
  try {
    const [results] = await pool.query('SELECT COUNT(*) as count FROM trainers');
    if (results[0].count === 0) {
      const trainers = [
        ['Bun Ratnatepy', 'bunratnatepy@gmail.com', 'Yoga', 2, 'Mon-Fri 6AM-12PM', 4.8],
        ['Chhin Visal', 'chhinvisal@gmail.com', 'Cardio', 8, 'Tue-Thu 10AM-6PM', 4.9],
        ['Haysavin RongRavidwin', 'winwin@gmail.com', 'Strength', 5, 'Tue-Thu 8AM-4PM', 4.9],
        ["HOUN Sithai", "sithai@gmail.com", "Pilates", 1, "Wed-Fri 7AM-2PM", 4.0]
      ];

      for (let t of trainers) {
        await pool.query(
          `INSERT INTO trainers (name, email, specialty, experience, schedule, rating) 
           VALUES (?, ?, ?, ?, ?, ?)`, t
        );
      }
      console.log("Sample trainers inserted.");
    }
  } catch (err) {
    console.error("Error inserting sample trainers:", err);
  }
}

// Start the server
insertSampleTrainers().then(() => {
  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });
});