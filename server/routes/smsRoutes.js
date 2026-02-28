import express, { Router } from 'express';
import { firebaseAuth } from '../middleware/firebaseAuth.js';
import {
    addRuralReminder,
    createRuralPatient,
    deleteRuralPatient,
    listRuralPatients,
    removeRuralReminder,
    sendEmergencySOS,
    simulateInboundSMS,
    smsWebhook,
    updateRuralPatient,
    updateRuralReminder,
} from '../controllers/smsController.js';

const router = Router();

// SMS provider inbound callbacks commonly use x-www-form-urlencoded payloads.
router.post('/webhook', express.urlencoded({ extended: false }), smsWebhook);
router.post('/simulate-inbound', simulateInboundSMS);
router.post('/emergency', firebaseAuth, sendEmergencySOS);

router.get('/patients', firebaseAuth, listRuralPatients);
router.post('/patients', firebaseAuth, createRuralPatient);
router.patch('/patients/:id', firebaseAuth, updateRuralPatient);
router.delete('/patients/:id', firebaseAuth, deleteRuralPatient);

router.post('/patients/:id/reminders', firebaseAuth, addRuralReminder);
router.patch('/patients/:id/reminders/:reminderId', firebaseAuth, updateRuralReminder);
router.delete('/patients/:id/reminders/:reminderId', firebaseAuth, removeRuralReminder);

export default router;
