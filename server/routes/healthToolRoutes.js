import { Router } from 'express';
import {
    deleteHealthToolResult,
    getHealthToolResults,
    saveHealthToolResult,
} from '../controllers/healthToolController.js';
import { firebaseAuth } from '../middleware/firebaseAuth.js';

const router = Router();

router.get('/', firebaseAuth, getHealthToolResults);
router.post('/', firebaseAuth, saveHealthToolResult);
router.delete('/:id', firebaseAuth, deleteHealthToolResult);

export default router;
