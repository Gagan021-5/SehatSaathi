import User from '../models/User.js';

export async function syncUser(req, res) {
    try {
        const { uid, email, name, picture } = req.firebaseUser;

        let user = await User.findOne({ firebaseUid: uid });
        if (!user) {
            user = await User.create({
                firebaseUid: uid,
                email: email || '',
                name: name || email?.split('@')[0] || 'User',
                photoURL: picture || '',
                language: req.body.language || 'en',
            });
        } else {
            if (name && !user.name) user.name = name;
            if (picture && !user.photoURL) user.photoURL = picture;
            await user.save();
        }

        res.json(user);
    } catch (err) {
        console.error('Sync user error:', err.message);
        res.status(500).json({ error: 'Failed to sync user' });
    }
}

export async function getProfile(req, res) {
    try {
        const user = await User.findOne({ firebaseUid: req.firebaseUid });
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: 'Failed to get profile' });
    }
}

export async function updateProfile(req, res) {
    try {
        const allowed = ['name', 'phone', 'dateOfBirth', 'gender', 'bloodGroup',
            'allergies', 'conditions', 'emergencyContact', 'language'];
        const updates = {};
        allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

        const user = await User.findOneAndUpdate(
            { firebaseUid: req.firebaseUid },
            { $set: updates },
            { new: true }
        );
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: 'Failed to update profile' });
    }
}
