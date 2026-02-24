import { Router } from 'express';
import multer from 'multer';
import { analyze, explainMedicine } from '../controllers/prescriptionController.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.post('/analyze', upload.single('image'), analyze);
router.post('/explain-medicine', explainMedicine);

export default router;
