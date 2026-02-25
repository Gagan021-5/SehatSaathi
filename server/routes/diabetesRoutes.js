import { Router } from 'express';
import { diabetesPredict } from '../controllers/diabetesController.js';

const router = Router();

router.post('/predict', diabetesPredict);

export default router;
