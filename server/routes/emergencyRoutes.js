import { Router } from 'express';
import { getGuidance, ussdWebhook } from '../controllers/emergencyController.js';

const router = Router();

router.post('/guidance', getGuidance);
router.post('/ussd-webhook', ussdWebhook);

export default router;
