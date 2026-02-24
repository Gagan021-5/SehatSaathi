import { Router } from 'express';
import { getGuidance } from '../controllers/emergencyController.js';

const router = Router();

router.post('/guidance', getGuidance);

export default router;
