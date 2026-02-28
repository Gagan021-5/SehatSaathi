import { Router } from 'express';
import { sendMessage, getHistory, getSessions, synthesizeSpeechEndpoint } from '../controllers/chatController.js';
import { getGuidance } from '../controllers/emergencyController.js';
import { optionalFirebaseAuth } from '../middleware/firebaseAuth.js';

const router = Router();

// Start a new chat session — just returns a new sessionId
router.post('/start', optionalFirebaseAuth, (req, res) => {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    res.json({ sessionId });
});

router.post('/message', optionalFirebaseAuth, sendMessage);
router.get('/history', optionalFirebaseAuth, getSessions);
router.get('/history/:sessionId', optionalFirebaseAuth, getHistory);
router.post('/emergency', optionalFirebaseAuth, getGuidance);
router.post('/synthesize', optionalFirebaseAuth, synthesizeSpeechEndpoint);

export default router;
