import { Router } from 'express';
import { getRecords, addVital, analyzeHealth } from '../controllers/healthController.js';
import { firebaseAuth } from '../middleware/firebaseAuth.js';

const router = Router();

router.get('/', firebaseAuth, getRecords);
router.post('/vitals', firebaseAuth, addVital);
router.get('/analyze', firebaseAuth, analyzeHealth);

export default router;
