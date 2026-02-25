import { Router } from 'express';
import {
    createFamilyDocument,
    createFamilyMember,
    deleteFamilyDocument,
    deleteFamilyMember,
    getFamilyDocuments,
    getFamilyMembers,
    updateFamilyMember,
} from '../controllers/familyController.js';
import { firebaseAuth } from '../middleware/firebaseAuth.js';

const router = Router();

router.get('/members', firebaseAuth, getFamilyMembers);
router.post('/members', firebaseAuth, createFamilyMember);
router.put('/members/:id', firebaseAuth, updateFamilyMember);
router.delete('/members/:id', firebaseAuth, deleteFamilyMember);

router.get('/documents', firebaseAuth, getFamilyDocuments);
router.post('/documents', firebaseAuth, createFamilyDocument);
router.delete('/documents/:id', firebaseAuth, deleteFamilyDocument);

export default router;
