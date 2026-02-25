import { Router } from 'express';
import multer from 'multer';
import { analyze, explainMedicine } from '../controllers/prescriptionController.js';
import { optionalFirebaseAuth } from '../middleware/firebaseAuth.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// Frontend calls /prescription/upload
router.post('/upload', optionalFirebaseAuth, upload.single('image'), analyze);
router.post('/analyze', optionalFirebaseAuth, upload.single('image'), analyze); // alias
router.post('/explain-medicine', optionalFirebaseAuth, explainMedicine);

// List prescriptions (stub — returns empty for now)
router.get('/', optionalFirebaseAuth, (req, res) => res.json([]));
router.get('/:id', optionalFirebaseAuth, (req, res) => res.json(null));

export default router;
