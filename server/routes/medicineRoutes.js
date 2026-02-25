import { Router } from 'express';
import {
    createMedicineReminder,
    deleteMedicineReminder,
    getMedicineReminders,
    markMedicineTaken,
    updateMedicineReminder,
} from '../controllers/medicineController.js';
import { firebaseAuth } from '../middleware/firebaseAuth.js';

const router = Router();

router.get('/', firebaseAuth, getMedicineReminders);
router.post('/', firebaseAuth, createMedicineReminder);
router.put('/:id', firebaseAuth, updateMedicineReminder);
router.delete('/:id', firebaseAuth, deleteMedicineReminder);
router.post('/:id/taken', firebaseAuth, markMedicineTaken);

export default router;
