import { useState } from 'react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Loader2, Save, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Card from '../components/common/Card';
import PageTransition from '../components/common/PageTransition';

const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function ProfilePage() {
    const { user, firebaseUser, updateProfile } = useAuth();
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        name: user?.name || '',
        phone: user?.phone || '',
        dateOfBirth: user?.dateOfBirth || '',
        gender: user?.gender || '',
        bloodGroup: user?.bloodGroup || '',
        allergies: user?.allergies?.join(', ') || '',
        conditions: user?.conditions?.join(', ') || '',
        emergencyName: user?.emergencyContact?.name || '',
        emergencyPhone: user?.emergencyContact?.phone || '',
        emergencyRelation: user?.emergencyContact?.relation || '',
    });

    const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

    async function handleSave() {
        setSaving(true);
        try {
            await updateProfile({
                name: form.name,
                phone: form.phone,
                dateOfBirth: form.dateOfBirth,
                gender: form.gender,
                bloodGroup: form.bloodGroup,
                allergies: form.allergies.split(',').map((item) => item.trim()).filter(Boolean),
                conditions: form.conditions.split(',').map((item) => item.trim()).filter(Boolean),
                emergencyContact: {
                    name: form.emergencyName,
                    phone: form.emergencyPhone,
                    relation: form.emergencyRelation,
                },
            });
            toast.success('Profile saved successfully.');
        } catch {
            toast.error('Unable to save profile right now.');
        } finally {
            setSaving(false);
        }
    }

    return (
        <PageTransition className="mx-auto max-w-5xl space-y-4">
            <Card className="p-6">
                <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-full bg-gradient-to-r from-blue-600 to-teal-500 text-white text-xl font-semibold shadow-lg shadow-blue-500/20 grid place-items-center">
                        {(user?.name?.[0] || firebaseUser?.email?.[0] || 'U').toUpperCase()}
                    </div>
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
                            {user?.name || 'User Profile'}
                        </h1>
                        <p className="text-sm text-zinc-500">{user?.email || firebaseUser?.email}</p>
                    </div>
                </div>
            </Card>

            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: 'easeOut' }}>
            <Card className="p-6">
                <h2 className="text-base font-semibold tracking-tight text-zinc-900 mb-3">Personal Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs text-zinc-500 uppercase tracking-wide mb-1.5">Full Name</label>
                        <input value={form.name} onChange={(event) => setField('name', event.target.value)} />
                    </div>
                    <div>
                        <label className="block text-xs text-zinc-500 uppercase tracking-wide mb-1.5">Phone</label>
                        <input value={form.phone} onChange={(event) => setField('phone', event.target.value)} />
                    </div>
                    <div>
                        <label className="block text-xs text-zinc-500 uppercase tracking-wide mb-1.5">Date of Birth</label>
                        <input
                            type="date"
                            value={form.dateOfBirth}
                            onChange={(event) => setField('dateOfBirth', event.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-zinc-500 uppercase tracking-wide mb-1.5">Gender</label>
                        <select value={form.gender} onChange={(event) => setField('gender', event.target.value)}>
                            <option value="">Select gender</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs text-zinc-500 uppercase tracking-wide mb-1.5">Blood Group</label>
                        <select value={form.bloodGroup} onChange={(event) => setField('bloodGroup', event.target.value)}>
                            <option value="">Select blood group</option>
                            {bloodGroups.map((group) => (
                                <option key={group} value={group}>
                                    {group}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: 'easeOut', delay: 0.05 }}>
            <Card className="p-6">
                <h2 className="text-base font-semibold tracking-tight text-zinc-900 mb-3">Medical Information</h2>
                <div className="grid grid-cols-1 gap-3">
                    <div>
                        <label className="block text-xs text-zinc-500 uppercase tracking-wide mb-1.5">Allergies</label>
                        <input
                            value={form.allergies}
                            onChange={(event) => setField('allergies', event.target.value)}
                            placeholder="Comma separated values"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-zinc-500 uppercase tracking-wide mb-1.5">Conditions</label>
                        <input
                            value={form.conditions}
                            onChange={(event) => setField('conditions', event.target.value)}
                            placeholder="Comma separated values"
                        />
                    </div>
                </div>
            </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: 'easeOut', delay: 0.1 }}>
            <Card className="p-6">
                <h2 className="text-base font-semibold tracking-tight text-zinc-900 mb-3">Emergency Contact</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input
                        value={form.emergencyName}
                        onChange={(event) => setField('emergencyName', event.target.value)}
                        placeholder="Name"
                    />
                    <input
                        value={form.emergencyPhone}
                        onChange={(event) => setField('emergencyPhone', event.target.value)}
                        placeholder="Phone"
                    />
                    <input
                        value={form.emergencyRelation}
                        onChange={(event) => setField('emergencyRelation', event.target.value)}
                        placeholder="Relation"
                    />
                </div>
            </Card>
            </motion.div>

            <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="w-full rounded-lg bg-gradient-to-r from-blue-600 to-teal-500 py-3 text-white font-semibold inline-flex justify-center items-center gap-2 shadow-lg shadow-blue-500/20 disabled:opacity-50 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/30 active:translate-y-0 active:scale-95"
            >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Save Profile
            </button>
        </PageTransition>
    );
}

