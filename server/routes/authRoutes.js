import { Router } from 'express';
import { syncUser, getProfile, updateProfile } from '../controllers/authController.js';
import { firebaseAuth } from '../middleware/firebaseAuth.js';

const router = Router();

router.post('/sync', firebaseAuth, syncUser);
router.get('/profile', firebaseAuth, getProfile);
router.put('/profile', firebaseAuth, updateProfile);

export default router;
