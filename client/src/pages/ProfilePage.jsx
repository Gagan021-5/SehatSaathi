import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { updateProfile } from '../services/api';
import toast from 'react-hot-toast';
import { User, Mail, Phone, Calendar, Heart, Shield, ChevronDown, ChevronUp, Loader2, Save, AlertTriangle } from 'lucide-react';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function ProfilePage() {
    const { user, firebaseUser, updateProfile: updateCtx } = useAuth();
    const [form, setForm] = useState({
        name: user?.name || '', phone: user?.phone || '',
        dateOfBirth: user?.dateOfBirth || '', gender: user?.gender || '',
        bloodGroup: user?.bloodGroup || '',
        allergies: user?.allergies?.join(', ') || '',
        conditions: user?.conditions?.join(', ') || '',
        emergencyName: user?.emergencyContact?.name || '',
        emergencyPhone: user?.emergencyContact?.phone || '',
        emergencyRelation: user?.emergencyContact?.relation || '',
    });
    const [saving, setSaving] = useState(false);
    const [openSections, setOpenSections] = useState({ personal: true, medical: false, emergency: false });

    const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
    const toggle = (s) => setOpenSections(p => ({ ...p, [s]: !p[s] }));

    async function handleSave() {
        setSaving(true);
        try {
            await updateCtx({
                name: form.name, phone: form.phone, dateOfBirth: form.dateOfBirth,
                gender: form.gender, bloodGroup: form.bloodGroup,
                allergies: form.allergies.split(',').map(s => s.trim()).filter(Boolean),
                conditions: form.conditions.split(',').map(s => s.trim()).filter(Boolean),
                emergencyContact: { name: form.emergencyName, phone: form.emergencyPhone, relation: form.emergencyRelation },
            });
            toast.success('Profile updated!');
        } catch { toast.error('Failed to save'); }
        setSaving(false);
    }

    const filled = [form.name, form.phone, form.dateOfBirth, form.gender, form.bloodGroup].filter(Boolean).length;
    const completionPct = Math.round((filled / 5) * 100);

    return (
        <div className="p-4 md:p-6 max-w-3xl mx-auto">
            {/* Header */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6 mb-6 animate-fadeInUp">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-2xl font-bold">
                        {user?.name?.[0]?.toUpperCase() || firebaseUser?.email?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div className="flex-1">
                        <h1 className="text-xl font-bold text-gray-900">{user?.name || 'User'}</h1>
                        <p className="text-sm text-gray-500">{user?.email || firebaseUser?.email}</p>
                        <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-full">
                            {firebaseUser?.providerData?.[0]?.providerId === 'google.com' ? '🔗 Google' : '📧 Email'}
                        </span>
                    </div>
                </div>
                {/* Progress */}
                <div className="mt-4">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Profile Completion</span><span>{completionPct}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full"><div className="h-full bg-gradient-to-r from-blue-500 to-teal-500 rounded-full transition-all" style={{ width: `${completionPct}%` }} /></div>
                </div>
            </div>

            {/* Sections */}
            {[
                {
                    key: 'personal', icon: User, title: 'Personal Information', fields: [
                        { k: 'name', label: 'Full Name', type: 'text', icon: User },
                        { k: 'phone', label: 'Phone', type: 'tel', icon: Phone },
                        { k: 'dateOfBirth', label: 'Date of Birth', type: 'date', icon: Calendar },
                        { k: 'gender', label: 'Gender', type: 'select', options: ['Male', 'Female', 'Other'] },
                        { k: 'bloodGroup', label: 'Blood Group', type: 'select', options: BLOOD_GROUPS },
                    ]
                },
                {
                    key: 'medical', icon: Heart, title: 'Medical Information', fields: [
                        { k: 'allergies', label: 'Allergies (comma-separated)', type: 'text' },
                        { k: 'conditions', label: 'Medical Conditions (comma-separated)', type: 'text' },
                    ]
                },
                {
                    key: 'emergency', icon: AlertTriangle, title: 'Emergency Contact', fields: [
                        { k: 'emergencyName', label: 'Contact Name', type: 'text' },
                        { k: 'emergencyPhone', label: 'Contact Phone', type: 'tel' },
                        { k: 'emergencyRelation', label: 'Relation', type: 'text' },
                    ]
                },
            ].map((section) => {
                const Icon = section.icon;
                const isOpen = openSections[section.key];
                return (
                    <div key={section.key} className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] mb-4 animate-fadeInUp">
                        <button onClick={() => toggle(section.key)} className="w-full flex items-center justify-between p-5 text-left">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center"><Icon size={18} /></div>
                                <span className="font-bold text-gray-900">{section.title}</span>
                            </div>
                            {isOpen ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
                        </button>
                        {isOpen && (
                            <div className="px-5 pb-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {section.fields.map((f) => (
                                    <div key={f.k} className={f.k.includes('allergies') || f.k.includes('conditions') ? 'sm:col-span-2' : ''}>
                                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">{f.label}</label>
                                        {f.type === 'select' ? (
                                            <select value={form[f.k]} onChange={e => set(f.k, e.target.value)}
                                                className="w-full py-2.5 px-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all">
                                                <option value="">Select...</option>
                                                {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                                            </select>
                                        ) : (
                                            <input type={f.type} value={form[f.k]} onChange={e => set(f.k, e.target.value)}
                                                className="w-full py-2.5 px-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all" />
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                );
            })}

            <button onClick={handleSave} disabled={saving}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold shadow-lg shadow-blue-500/20 hover:shadow-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50">
                {saving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />} Save Profile
            </button>
        </div>
    );
}
