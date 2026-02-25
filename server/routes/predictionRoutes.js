import { Router } from 'express';
import { diabetesPredict, diseasePredict, riskAssess, modelInfo, diabetesHistory } from '../controllers/predictionController.js';
import { optionalFirebaseAuth } from '../middleware/firebaseAuth.js';

const router = Router();

router.post('/diabetes', optionalFirebaseAuth, diabetesPredict);
router.post('/disease', optionalFirebaseAuth, diseasePredict);
router.post('/risk', optionalFirebaseAuth, riskAssess);
router.get('/model-info', modelInfo);
router.get('/diabetes/history', optionalFirebaseAuth, diabetesHistory);

export default router;
