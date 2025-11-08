import express from 'express';
import {
  addAuthorizedUser,
  removeAuthorizedUser,
  getAuthorizedUsers
} from '../services/mongodbService.js';

const router: express.Router = express.Router();

/**
 * Get all authorized users
 */
router.get('/', async (_req, res) => {
  try {
    const users = await getAuthorizedUsers();

    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Error fetching authorized users:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch authorized users'
    });
  }
});

/**
 * Add a new authorized user
 */
router.post('/', async (req, res) => {
  try {
    const { email, name } = req.body;

    if (!email || typeof email !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Valid email is required'
      });
    }

    const success = await addAuthorizedUser(email.trim(), name?.trim());

    if (!success) {
      return res.status(409).json({
        success: false,
        error: 'User already exists or could not be added'
      });
    }

    res.status(201).json({
      success: true,
      message: 'User added successfully'
    });
  } catch (error) {
    console.error('Error adding authorized user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add authorized user'
    });
  }
});

/**
 * Remove an authorized user (soft delete)
 */
router.delete('/:email', async (req, res) => {
  try {
    const { email } = req.params;

    if (!email || typeof email !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Valid email is required'
      });
    }

    const success = await removeAuthorizedUser(email.trim());

    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'User not found or could not be removed'
      });
    }

    res.json({
      success: true,
      message: 'User removed successfully'
    });
  } catch (error) {
    console.error('Error removing authorized user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove authorized user'
    });
  }
});

export default router;
