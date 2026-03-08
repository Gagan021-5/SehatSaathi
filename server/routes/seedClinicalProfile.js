import express from 'express';
import User from '../models/User.js';

const router = express.Router();

// POST /api/seed/clinical-profile
// Body: { firebaseUid, diabetesRiskScore, activePrescriptions }
router.post('/clinical-profile', async (req, res) => {
    try {
        const { firebaseUid, diabetesRiskScore, activePrescriptions } = req.body;

        if (!firebaseUid) {
            return res.status(400).json({ error: 'firebaseUid is required' });
        }

        const user = await User.findOneAndUpdate(
            { firebaseUid },
            {
                $set: {
                    'clinicalProfile.diabetesRiskScore': diabetesRiskScore ?? null,
                    'clinicalProfile.activePrescriptions': Array.isArray(activePrescriptions)
                        ? activePrescriptions
                        : [],
                },
            },
            { new: true },
        );

        if (!user) {
            return res.status(404).json({ error: 'User not found with that firebaseUid' });
        }

        console.log(`[SEED] Clinical profile updated for ${user.name || firebaseUid}`);
        res.json({ success: true, clinicalProfile: user.clinicalProfile });
    } catch (err) {
        console.error('[SEED] Error:', err.message);
        res.status(500).json({ error: 'Failed to seed clinical profile' });
    }
});

export default router;
