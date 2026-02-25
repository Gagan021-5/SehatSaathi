import mongoose from 'mongoose';
import Document from '../models/Document.js';
import FamilyMember from '../models/FamilyMember.js';
import { resolveAuthUser } from '../utils/resolveAuthUser.js';

const DOC_CATEGORIES = new Set(['Lab Report', 'Prescription', 'Imaging', 'Discharge Summary', 'Other']);

export async function getFamilyMembers(req, res) {
    try {
        const user = await resolveAuthUser(req);
        const members = await FamilyMember.find({ user: user._id }).sort({ createdAt: 1 }).lean();
        res.json(members);
    } catch (error) {
        console.error('Get family members error:', error.message);
        res.status(500).json({ error: 'Failed to load family members' });
    }
}

export async function createFamilyMember(req, res) {
    try {
        const user = await resolveAuthUser(req);
        const { name, relation, age, bloodGroup = '' } = req.body;

        if (!name || !relation || age === undefined) {
            return res.status(400).json({ error: 'name, relation, and age are required' });
        }

        const member = await FamilyMember.create({
            user: user._id,
            name: `${name}`.trim(),
            relation: `${relation}`.trim(),
            age: Number(age),
            bloodGroup: `${bloodGroup}`.trim(),
        });

        res.status(201).json(member);
    } catch (error) {
        console.error('Create family member error:', error.message);
        res.status(500).json({ error: 'Failed to create family member' });
    }
}

export async function updateFamilyMember(req, res) {
    try {
        const user = await resolveAuthUser(req);
        const { id } = req.params;
        const updates = {};

        if (req.body.name !== undefined) updates.name = `${req.body.name}`.trim();
        if (req.body.relation !== undefined) updates.relation = `${req.body.relation}`.trim();
        if (req.body.age !== undefined) updates.age = Number(req.body.age);
        if (req.body.bloodGroup !== undefined) updates.bloodGroup = `${req.body.bloodGroup}`.trim();

        if (!Object.keys(updates).length) {
            return res.status(400).json({ error: 'No valid fields to update' });
        }

        const member = await FamilyMember.findOneAndUpdate(
            { _id: id, user: user._id },
            { $set: updates },
            { new: true }
        );

        if (!member) return res.status(404).json({ error: 'Family member not found' });
        res.json(member);
    } catch (error) {
        console.error('Update family member error:', error.message);
        res.status(500).json({ error: 'Failed to update family member' });
    }
}

export async function deleteFamilyMember(req, res) {
    try {
        const user = await resolveAuthUser(req);
        const { id } = req.params;

        const member = await FamilyMember.findOneAndDelete({ _id: id, user: user._id });
        if (!member) return res.status(404).json({ error: 'Family member not found' });

        await Document.deleteMany({ user: user._id, familyMemberId: member._id });
        res.status(204).send();
    } catch (error) {
        console.error('Delete family member error:', error.message);
        res.status(500).json({ error: 'Failed to delete family member' });
    }
}

export async function getFamilyDocuments(req, res) {
    try {
        const user = await resolveAuthUser(req);
        const filter = { user: user._id };
        const { familyMemberId } = req.query;

        if (familyMemberId) {
            if (!mongoose.Types.ObjectId.isValid(familyMemberId)) {
                return res.status(400).json({ error: 'Invalid familyMemberId' });
            }
            filter.familyMemberId = familyMemberId;
        }

        const docs = await Document.find(filter).sort({ uploadDate: -1 }).lean();
        res.json(docs);
    } catch (error) {
        console.error('Get family documents error:', error.message);
        res.status(500).json({ error: 'Failed to load family documents' });
    }
}

export async function createFamilyDocument(req, res) {
    try {
        const user = await resolveAuthUser(req);
        const { url, fileName, category, familyMemberId } = req.body;

        if (!url || !fileName || !category || !familyMemberId) {
            return res.status(400).json({ error: 'url, fileName, category, and familyMemberId are required' });
        }
        if (!DOC_CATEGORIES.has(category)) {
            return res.status(400).json({ error: 'Unsupported category' });
        }
        if (!mongoose.Types.ObjectId.isValid(familyMemberId)) {
            return res.status(400).json({ error: 'Invalid familyMemberId' });
        }

        const member = await FamilyMember.findOne({ _id: familyMemberId, user: user._id }).lean();
        if (!member) return res.status(404).json({ error: 'Family member not found' });

        const doc = await Document.create({
            user: user._id,
            url: `${url}`.trim(),
            fileName: `${fileName}`.trim(),
            category,
            familyMemberId,
            uploadDate: new Date(),
        });

        res.status(201).json(doc);
    } catch (error) {
        console.error('Create family document error:', error.message);
        res.status(500).json({ error: 'Failed to save document' });
    }
}

export async function deleteFamilyDocument(req, res) {
    try {
        const user = await resolveAuthUser(req);
        const { id } = req.params;

        const doc = await Document.findOneAndDelete({ _id: id, user: user._id });
        if (!doc) return res.status(404).json({ error: 'Document not found' });

        res.status(204).send();
    } catch (error) {
        console.error('Delete family document error:', error.message);
        res.status(500).json({ error: 'Failed to delete document' });
    }
}
