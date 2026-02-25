import { Router } from 'express';
import { diabetesPredict, riskAssess, modelInfo, diabetesHistory } from '../controllers/predictionController.js';
import { optionalFirebaseAuth } from '../middleware/firebaseAuth.js';

const router = Router();

router.post('/diabetes', optionalFirebaseAuth, diabetesPredict);
router.post('/risk', optionalFirebaseAuth, riskAssess);
router.get('/model-info', modelInfo);
router.get('/diabetes/history', optionalFirebaseAuth, diabetesHistory);

export default router;
