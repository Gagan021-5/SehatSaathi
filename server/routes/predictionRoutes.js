import { Router } from 'express';
import { predictAndExplain } from '../controllers/predictionController.js';

const router = Router();

router.post('/', predictAndExplain);

export default router;
