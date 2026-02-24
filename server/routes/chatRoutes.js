import { Router } from 'express';
import { sendMessage, getHistory, getSessions } from '../controllers/chatController.js';

const router = Router();

router.post('/message', sendMessage);
router.get('/history/:sessionId', getHistory);
router.get('/sessions', getSessions);

export default router;
