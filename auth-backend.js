// Savoiré AI v2.0 — Authentication Server
// The Vault — Complete Auth Implementation

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');
const nodemailer = require('nodemailer');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const crypto = require('crypto');

const app = express();
const PORT = process.env.AUTH_PORT || 3001;

// ==================== CONFIGURATION ====================

// Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Email transporter (Gmail SMTP)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Token blacklist (in-memory, would use Redis in production)
const tokenBlacklist = new Set();
const refreshTokenStore = new Map();

// ==================== MIDDLEWARE ====================

app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? ['https://savoireai.vercel.app']
    : ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));

app.use(express.json());
app.use(passport.initialize());

// ==================== PASSPORT GOOGLE OAUTH ====================

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // Check if user exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('*')
        .eq('google_id', profile.id)
        .single();
      
      if (existingUser) {
        return done(null, existingUser);
      }
      
      // Check if email exists
      const { data: emailUser } = await supabase
        .from('users')
        .select('*')
        .eq('email', profile.emails[0].value)
        .single();
      
      if (emailUser) {
        // Link Google account
        await supabase
          .from('users')
          .update({ google_id: profile.id })
          .eq('id', emailUser.id);
        
        return done(null, emailUser);
      }
      
      // Create new user
      const { data: newUser, error } = await supabase
        .from('users')
        .insert([{
          email: profile.emails[0].value,
          name: profile.displayName,
          avatar_url: profile.photos[0]?.value,
          google_id: profile.id,
          email_verified: true,
          plan: 'free'
        }])
        .select()
        .single();
      
      if (error) throw error;
      
      // Initialize credits
      await supabase
        .from('credits')
        .insert([{
          user_id: newUser.id,
          date: new Date().toISOString().split('T')[0]
        }]);
      
      done(null, newUser);
      
    } catch (error) {
      done(error, null);
    }
  }
));

// ==================== JWT HELPER FUNCTIONS ====================

function generateTokens(userId) {
  const accessToken = jwt.sign(
    { userId, type: 'access' },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );
  
  const refreshToken = jwt.sign(
    { userId, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '30d' }
  );
  
  // Store refresh token (rotate)
  refreshTokenStore.set(refreshToken, {
    userId,
    createdAt: Date.now()
  });
  
  return { accessToken, refreshToken };
}

function verifyAccessToken(token) {
  try {
    if (tokenBlacklist.has(token)) {
      return null;
    }
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
}

function verifyRefreshToken(token) {
  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    
    // Check if token exists in store
    if (!refreshTokenStore.has(token)) {
      return null;
    }
    
    return decoded;
  } catch (error) {
    return null;
  }
}

// Authentication middleware
async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  const decoded = verifyAccessToken(token);
  if (!decoded) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
  
  // Get user from database
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', decoded.userId)
    .single();
  
  if (error || !user) {
    return res.status(403).json({ error: 'User not found' });
  }
  
  req.user = user;
  next();
}

// ==================== EMAIL FUNCTIONS ====================

async function sendVerificationEmail(email, token) {
  const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
  
  const mailOptions = {
    from: '"Savoiré AI" <noreply@savoireai.com>',
    to: email,
    subject: 'Verify your email - Savoiré AI',
    html: `
      <div style="font-family: 'Playfair Display', Georgia, serif; max-width: 600px; margin: 0 auto; background: #0A0A0F; color: #E8E6E0; padding: 40px; border: 1px solid #C9A96E;">
        <div style="text-align: center; margin-bottom: 30px;">
          <span style="font-size: 48px; color: #C9A96E;">Ś</span>
          <h1 style="color: #C9A96E; margin: 0;">Savoiré AI</h1>
        </div>
        
        <h2 style="color: #C9A96E;">Welcome to the Library</h2>
        <p>Please verify your email address to begin your scholarly journey.</p>
        
        <div style="text-align: center; margin: 40px 0;">
          <a href="${verificationLink}" style="background: #C9A96E; color: #0A0A0F; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">Verify Email</a>
        </div>
        
        <p style="color: #8A7B6A; font-size: 0.9rem;">If you didn't create an account, you can safely ignore this email.</p>
        
        <hr style="border: 1px solid #C9A96E; opacity: 0.3;">
        <p style="text-align: center; color: #8A7B6A; font-size: 0.8rem;">© 2025 Savoiré AI. All rights reserved.</p>
      </div>
    `
  };
  
  await transporter.sendMail(mailOptions);
}

async function sendPasswordResetEmail(email, token) {
  const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
  
  const mailOptions = {
    from: '"Savoiré AI" <noreply@savoireai.com>',
    to: email,
    subject: 'Reset your password - Savoiré AI',
    html: `
      <div style="font-family: 'Playfair Display', Georgia, serif; max-width: 600px; margin: 0 auto; background: #0A0A0F; color: #E8E6E0; padding: 40px; border: 1px solid #C9A96E;">
        <div style="text-align: center; margin-bottom: 30px;">
          <span style="font-size: 48px; color: #C9A96E;">Ś</span>
          <h1 style="color: #C9A96E; margin: 0;">Savoiré AI</h1>
        </div>
        
        <h2 style="color: #C9A96E;">Reset Your Password</h2>
        <p>Click the button below to reset your password. This link expires in 1 hour.</p>
        
        <div style="text-align: center; margin: 40px 0;">
          <a href="${resetLink}" style="background: #C9A96E; color: #0A0A0F; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">Reset Password</a>
        </div>
        
        <p style="color: #8A7B6A; font-size: 0.9rem;">If you didn't request this, you can safely ignore this email.</p>
        
        <hr style="border: 1px solid #C9A96E; opacity: 0.3;">
        <p style="text-align: center; color: #8A7B6A; font-size: 0.8rem;">© 2025 Savoiré AI. All rights reserved.</p>
      </div>
    `
  };
  
  await transporter.sendMail(mailOptions);
}

// ==================== AUTH ENDPOINTS ====================

/**
 * Register new user
 */
app.post('/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }
    
    // Check if user exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('email')
      .eq('email', email)
      .single();
    
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    
    // Create user
    const { data: user, error } = await supabase
      .from('users')
      .insert([{
        name,
        email,
        password_hash: hashedPassword,
        plan: 'free',
        email_verified: false,
        verification_token: verificationToken
      }])
      .select()
      .single();
    
    if (error) throw error;
    
    // Initialize credits for today
    await supabase
      .from('credits')
      .insert([{
        user_id: user.id,
        date: new Date().toISOString().split('T')[0]
      }]);
    
    // Send verification email
    await sendVerificationEmail(email, verificationToken);
    
    res.json({
      success: true,
      message: 'Registration successful. Please check your email to verify your account.'
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

/**
 * Verify email
 */
app.get('/auth/verify-email', async (req, res) => {
  try {
    const { token } = req.query;
    
    if (!token) {
      return res.status(400).json({ error: 'Invalid token' });
    }
    
    // Find user with this token
    const { data: user, error } = await supabase
      .from('users')
      .update({ email_verified: true, verification_token: null })
      .eq('verification_token', token)
      .select()
      .single();
    
    if (error || !user) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }
    
    res.json({ success: true, message: 'Email verified successfully' });
    
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
});

/**
 * Login
 */
app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    
    // Find user
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Check password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Update last login
    await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id);
    
    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user.id);
    
    res.json({
      success: true,
      token: accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar_url,
        plan: user.plan,
        emailVerified: user.email_verified
      }
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

/**
 * Refresh token
 */
app.post('/auth/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token required' });
    }
    
    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded) {
      return res.status(403).json({ error: 'Invalid refresh token' });
    }
    
    // Remove old token
    refreshTokenStore.delete(refreshToken);
    
    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(decoded.userId);
    
    res.json({
      success: true,
      token: accessToken,
      refreshToken: newRefreshToken
    });
    
  } catch (error) {
    console.error('Refresh error:', error);
    res.status(500).json({ error: 'Token refresh failed' });
  }
});

/**
 * Logout
 */
app.post('/auth/logout', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    const authHeader = req.headers['authorization'];
    const accessToken = authHeader && authHeader.split(' ')[1];
    
    if (accessToken) {
      tokenBlacklist.add(accessToken);
    }
    
    if (refreshToken) {
      refreshTokenStore.delete(refreshToken);
    }
    
    res.json({ success: true });
    
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

/**
 * Get current user
 */
app.get('/auth/me', authenticateToken, async (req, res) => {
  try {
    // Get today's credits
    const today = new Date().toISOString().split('T')[0];
    const { data: credits } = await supabase
      .from('credits')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('date', today)
      .single();
    
    res.json({
      success: true,
      user: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        avatar: req.user.avatar_url,
        plan: req.user.plan,
        planExpires: req.user.plan_expires,
        emailVerified: req.user.email_verified,
        createdAt: req.user.created_at,
        credits: credits || { notes_used: 0, changes_used: 0, uploads_used: 0 }
      }
    });
    
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user data' });
  }
});

/**
 * Forgot password
 */
app.post('/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email required' });
    }
    
    // Find user
    const { data: user } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', email)
      .single();
    
    if (user) {
      // Create reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetExpires = new Date(Date.now() + 3600000); // 1 hour
      
      await supabase
        .from('users')
        .update({
          reset_token: resetToken,
          reset_expires: resetExpires.toISOString()
        })
        .eq('id', user.id);
      
      // Send email
      await sendPasswordResetEmail(email, resetToken);
    }
    
    // Always return success to prevent email enumeration
    res.json({ success: true });
    
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Failed to process request' });
  }
});

/**
 * Reset password
 */
app.post('/auth/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    
    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token and password required' });
    }
    
    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }
    
    // Find user with valid token
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('reset_token', token)
      .gte('reset_expires', new Date().toISOString())
      .single();
    
    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update password and clear token
    await supabase
      .from('users')
      .update({
        password_hash: hashedPassword,
        reset_token: null,
        reset_expires: null
      })
      .eq('id', user.id);
    
    res.json({ success: true });
    
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

/**
 * Update profile
 */
app.put('/auth/profile', authenticateToken, async (req, res) => {
  try {
    const { name, avatar_url } = req.body;
    
    const updates = {};
    if (name) updates.name = name;
    if (avatar_url) updates.avatar_url = avatar_url;
    
    const { data: user, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', req.user.id)
      .select()
      .single();
    
    if (error) throw error;
    
    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar_url
      }
    });
    
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

/**
 * Delete account
 */
app.delete('/auth/account', authenticateToken, async (req, res) => {
  try {
    // Delete user (cascade will handle documents, credits, history)
    await supabase
      .from('users')
      .delete()
      .eq('id', req.user.id);
    
    res.json({ success: true });
    
  } catch (error) {
    console.error('Account deletion error:', error);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

// ==================== GOOGLE OAUTH ROUTES ====================

app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get('/auth/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/auth.html?error=google_failed' }),
  (req, res) => {
    // Generate JWT
    const { accessToken, refreshToken } = generateTokens(req.user.id);
    
    // Redirect to dashboard with tokens
    res.redirect(`${process.env.FRONTEND_URL}/dashboard.html?token=${accessToken}&refresh=${refreshToken}`);
  }
);

// ==================== DOCUMENTS API ====================

/**
 * List user documents
 */
app.get('/api/documents', authenticateToken, async (req, res) => {
  try {
    const { data: documents, error } = await supabase
      .from('documents')
      .select('*')
      .eq('user_id', req.user.id)
      .order('updated_at', { ascending: false });
    
    if (error) throw error;
    
    res.json({ success: true, documents });
    
  } catch (error) {
    console.error('List documents error:', error);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

/**
 * Save document
 */
app.post('/api/documents', authenticateToken, async (req, res) => {
  try {
    const { title, content, plainText, action, tags, starred } = req.body;
    
    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content required' });
    }
    
    const wordCount = plainText ? plainText.split(/\s+/).length : 0;
    
    const { data: document, error } = await supabase
      .from('documents')
      .insert([{
        user_id: req.user.id,
        title,
        content,
        action,
        word_count: wordCount,
        tags: tags || [],
        is_starred: starred || false
      }])
      .select()
      .single();
    
    if (error) throw error;
    
    res.json({ success: true, document });
    
  } catch (error) {
    console.error('Save document error:', error);
    res.status(500).json({ error: 'Failed to save document' });
  }
});

/**
 * Update document
 */
app.put('/api/documents/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, tags, starred } = req.body;
    
    const updates = {};
    if (title) updates.title = title;
    if (content) updates.content = content;
    if (tags) updates.tags = tags;
    if (starred !== undefined) updates.is_starred = starred;
    updates.updated_at = new Date().toISOString();
    
    const { data: document, error } = await supabase
      .from('documents')
      .update(updates)
      .eq('id', id)
      .eq('user_id', req.user.id)
      .select()
      .single();
    
    if (error) throw error;
    
    res.json({ success: true, document });
    
  } catch (error) {
    console.error('Update document error:', error);
    res.status(500).json({ error: 'Failed to update document' });
  }
});

/**
 * Delete document
 */
app.delete('/api/documents/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    await supabase
      .from('documents')
      .delete()
      .eq('id', id)
      .eq('user_id', req.user.id);
    
    res.json({ success: true });
    
  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({ error: 'Failed to delete document' });
  }
});

/**
 * Get single document
 */
app.get('/api/documents/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data: document, error } = await supabase
      .from('documents')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.user.id)
      .single();
    
    if (error) throw error;
    
    res.json({ success: true, document });
    
  } catch (error) {
    console.error('Get document error:', error);
    res.status(500).json({ error: 'Failed to fetch document' });
  }
});

/**
 * Star/unstar document
 */
app.post('/api/documents/:id/star', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { starred } = req.body;
    
    const { data: document, error } = await supabase
      .from('documents')
      .update({ is_starred: starred })
      .eq('id', id)
      .eq('user_id', req.user.id)
      .select()
      .single();
    
    if (error) throw error;
    
    res.json({ success: true, document });
    
  } catch (error) {
    console.error('Star document error:', error);
    res.status(500).json({ error: 'Failed to update star status' });
  }
});

// ==================== HISTORY API ====================

/**
 * Get generation history
 */
app.get('/api/history', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    
    const { data: history, error, count } = await supabase
      .from('history')
      .select('*', { count: 'exact' })
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) throw error;
    
    res.json({
      success: true,
      history,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    });
    
  } catch (error) {
    console.error('History error:', error);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

/**
 * Clear history
 */
app.delete('/api/history', authenticateToken, async (req, res) => {
  try {
    await supabase
      .from('history')
      .delete()
      .eq('user_id', req.user.id);
    
    res.json({ success: true });
    
  } catch (error) {
    console.error('Clear history error:', error);
    res.status(500).json({ error: 'Failed to clear history' });
  }
});

// ==================== SHARE ENDPOINTS ====================

// Share store (in-memory, would use Redis in production)
const shareStore = new Map();

app.post('/api/share', express.json(), async (req, res) => {
  try {
    const { content, plainText } = req.body;
    
    if (!content) {
      return res.status(400).json({ error: 'Content required' });
    }
    
    const shareId = crypto.randomUUID();
    
    shareStore.set(shareId, {
      content,
      plainText,
      createdAt: Date.now(),
      views: 0
    });
    
    res.json({
      success: true,
      id: shareId
    });
    
  } catch (error) {
    console.error('Share error:', error);
    res.status(500).json({ error: 'Failed to create share link' });
  }
});

app.get('/share/:id', (req, res) => {
  const { id } = req.params;
  const shared = shareStore.get(id);
  
  if (!shared) {
    return res.status(404).send('Shared document not found');
  }
  
  shared.views++;
  
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Shared Document - Savoiré AI</title>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display&family=Crimson+Pro&display=swap" rel="stylesheet">
      <style>
        body {
          background: #0A0A0F;
          color: #E8E6E0;
          font-family: 'Crimson Pro', serif;
          max-width: 800px;
          margin: 40px auto;
          padding: 0 20px;
        }
        .header {
          border-bottom: 1px solid #C9A96E;
          padding-bottom: 20px;
          margin-bottom: 40px;
        }
        .logo {
          font-family: 'Playfair Display', serif;
          font-size: 24px;
          color: #C9A96E;
        }
        .content {
          line-height: 1.6;
        }
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #C9A96E;
          color: #8A7B6A;
          font-size: 0.9rem;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">Ś Savoiré AI</div>
      </div>
      <div class="content">
        ${shared.content}
      </div>
      <div class="footer">
        Shared from Savoiré AI · The Grand Library
      </div>
    </body>
    </html>
  `);
});

// ==================== CLEANUP JOBS ====================

// Clean up expired refresh tokens every hour
setInterval(() => {
  const now = Date.now();
  for (const [token, data] of refreshTokenStore.entries()) {
    // 30 days in milliseconds
    if (now - data.createdAt > 30 * 24 * 60 * 60 * 1000) {
      refreshTokenStore.delete(token);
    }
  }
}, 60 * 60 * 1000);

// Clean up expired shares every day
setInterval(() => {
  const now = Date.now();
  for (const [id, data] of shareStore.entries()) {
    // 7 days expiry
    if (now - data.createdAt > 7 * 24 * 60 * 60 * 1000) {
      shareStore.delete(id);
    }
  }
}, 24 * 60 * 60 * 1000);

// ==================== START SERVER ====================

app.listen(PORT, () => {
  console.log(`🔐 Savoiré AI Auth Server running on port ${PORT}`);
});

module.exports = app;