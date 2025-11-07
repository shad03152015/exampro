import express from 'express';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { validateEmail, getUsersCollection } from '../services/mongodbService.js';

const router = express.Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * Validate Google ID token and return JWT
 */
router.post('/google', async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({
        success: false,
        error: 'ID token is required'
      });
    }

    // Verify Google ID token
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    if (!payload) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token'
      });
    }

    const { email, name, sub: googleId } = payload;

    if (!email) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token: missing email'
      });
    }

    // Validate email against authorized users
    const isAuthorized = await validateEmail(email);
    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        error: 'Email not authorized'
      });
    }

    // Update user record with Google ID if not already present
    try {
      const collection = await getUsersCollection();
      await collection.updateOne(
        { email: email.toLowerCase() },
        {
          $set: {
            google_id: googleId,
            updated_at: new Date()
          }
        }
      );
    } catch (error) {
      console.warn('Failed to update user record:', error);
    }

    // Generate JWT
    const token = jwt.sign(
      {
        email,
        name: name || 'User',
        googleId
      },
      process.env.JWT_SECRET || 'your-jwt-secret',
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      data: {
        token,
        user: {
          email,
          name: name || 'User'
        }
      }
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication failed'
    });
  }
});

/**
 * Refresh JWT token
 */
router.post('/refresh', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Token is required'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-jwt-secret') as any;

    // Generate new token
    const newToken = jwt.sign(
      {
        email: decoded.email,
        name: decoded.name,
        googleId: decoded.googleId
      },
      process.env.JWT_SECRET || 'your-jwt-secret',
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      data: { token: newToken }
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Invalid token'
    });
  }
});

/**
 * Logout functionality (client-side token removal)
 */
router.post('/logout', (req, res) => {
  res.json({
    success: true,
    message: 'Logout successful'
  });
});

export default router;