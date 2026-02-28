import { useState } from 'react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import {
    Loader2, Save, User, Phone, Calendar, Droplet,
    Activity, AlertCircle, ShieldCheck, Mail, Users
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import PageTransition from '../components/common/PageTransition';

const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'];

// --- Animation Variants ---
const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

export default function ProfilePage() {
    const { user, firebaseUser, updateProfile } = useAuth();
    const { t } = useLanguage();
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        name: user?.name || '',
        phone: user?.phone || '',
        dateOfBirth: user?.dateOfBirth?.split('T')[0] || '', // Ensure proper date format for input
        gender: user?.gender || '',
        bloodGroup: user?.bloodGroup || '',
        allergies: user?.allergies?.join(', ') || '',
        conditions: user?.conditions?.join(', ') || '',
        emergencyName: user?.emergencyContact?.name || '',
        emergencyPhone: user?.emergencyContact?.phone || '',
        emergencyRelation: user?.emergencyContact?.relation || '',
    });

    const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

    async function handleSave(e) {
        if (e) e.preventDefault();
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
            toast.success(t('profile.saveSuccess'));
        } catch {
            toast.error(t('profile.saveError'));
        } finally {
            setSaving(false);
        }
    }

    const userInitial = (user?.name?.[0] || firebaseUser?.email?.[0] || 'U').toUpperCase();

    return (
        <PageTransition className="mx-auto max-w-[1000px] space-y-8 pb-12 px-2 md:px-4">

            {/* Premium Hero Identity Card */}
            <header className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 px-6 py-10 md:px-10 md:py-12 text-white shadow-2xl shadow-slate-900/20">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.25),transparent_60%)]" />
                <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-8">
                    <div className="relative shrink-0">
                        <div className="h-28 w-28 rounded-[2rem] bg-gradient-to-br from-blue-500 to-indigo-600 shadow-2xl shadow-blue-500/30 flex items-center justify-center text-4xl font-black border-4 border-slate-800 overflow-hidden">
                            {firebaseUser?.photoURL || user?.photoURL ? (
                                <img
                                    src={firebaseUser?.photoURL || user?.photoURL}
                                    alt="Profile"
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                userInitial
                            )}
                        </div>
                        <div className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-emerald-500 border-4 border-slate-900 flex items-center justify-center shadow-lg">
                            <ShieldCheck size={14} className="text-white" />
                        </div>
                    </div>

                    <div className="flex-1">
                        <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-blue-300 ring-1 ring-inset ring-blue-500/30 mb-3">
                            <User size={14} /> {t('profile.secureIdentity')}
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white mb-2">
                            {form.name || t('profile.title')}
                        </h1>
                        <div className="flex flex-wrap items-center gap-4 text-slate-400 text-sm font-medium">
                            <span className="flex items-center gap-1.5"><Mail size={16} /> {user?.email || firebaseUser?.email}</span>
                            {form.bloodGroup && <span className="flex items-center gap-1.5"><Droplet size={16} className="text-rose-400" /> {form.bloodGroup}</span>}
                        </div>
                    </div>
                </div>
            </header>

            <form onSubmit={handleSave} className="space-y-6">
                <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">

                    {/* Demographics Section */}
                    <motion.div variants={itemVariants} className="rounded-[2.5rem] bg-white p-6 md:p-8 shadow-xl shadow-slate-200/40 border border-slate-100">
                        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
                                <User size={20} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold tracking-tight text-slate-900">{t('profile.demographics')}</h2>
                                <p className="text-xs font-medium text-slate-500">{t('profile.demographicsSubtitle')}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <InputField
                                icon={<User size={18} />} label="Legal Name" value={form.name}
                                onChange={(v) => setField('name', v)} placeholder="First & Last Name"
                            />
                            <InputField
                                icon={<Phone size={18} />} label="Contact Number" value={form.phone}
                                onChange={(v) => setField('phone', v)} placeholder="+91 XXXXX XXXXX" type="tel"
                            />
                            <InputField
                                icon={<Calendar size={18} />} label="Date of Birth" value={form.dateOfBirth}
                                onChange={(v) => setField('dateOfBirth', v)} type="date"
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <SelectField
                                    label="Gender" value={form.gender} onChange={(v) => setField('gender', v)}
                                    options={[{ l: 'Select', v: '' }, { l: 'Male', v: 'Male' }, { l: 'Female', v: 'Female' }, { l: 'Other', v: 'Other' }]}
                                />
                                <SelectField
                                    label="Blood Group" value={form.bloodGroup} onChange={(v) => setField('bloodGroup', v)}
                                    options={bloodGroups.map(bg => ({ l: bg, v: bg }))}
                                />
                            </div>
                        </div>
                    </motion.div>

                    {/* Clinical Profile Section */}
                    <motion.div variants={itemVariants} className="rounded-[2.5rem] bg-white p-6 md:p-8 shadow-xl shadow-slate-200/40 border border-slate-100">
                        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
                                <Activity size={20} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold tracking-tight text-slate-900">{t('profile.clinicalProfile')}</h2>
                                <p className="text-xs font-medium text-slate-500">{t('profile.clinicalProfileSubtitle')}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-5">
                            <InputField
                                icon={<AlertCircle size={18} className={form.allergies ? "text-rose-500" : ""} />}
                                label="Known Allergies" value={form.allergies} onChange={(v) => setField('allergies', v)}
                                placeholder="e.g. Penicillin, Peanuts (Comma separated)"
                            />
                            <InputField
                                icon={<Activity size={18} className={form.conditions ? "text-indigo-500" : ""} />}
                                label="Chronic Conditions" value={form.conditions} onChange={(v) => setField('conditions', v)}
                                placeholder="e.g. Hypertension, Asthma (Comma separated)"
                            />
                        </div>
                    </motion.div>

                    {/* Emergency Protocol Section */}
                    <motion.div variants={itemVariants} className="rounded-[2.5rem] bg-white p-6 md:p-8 shadow-xl shadow-slate-200/40 border border-slate-100">
                        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                            <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600">
                                <Users size={20} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold tracking-tight text-slate-900">{t('profile.emergencyProtocol')}</h2>
                                <p className="text-xs font-medium text-slate-500">{t('profile.emergencyProtocolSubtitle')}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            <InputField
                                label="Contact Name" value={form.emergencyName}
                                onChange={(v) => setField('emergencyName', v)} placeholder="Full Name"
                            />
                            <InputField
                                label="Relationship" value={form.emergencyRelation}
                                onChange={(v) => setField('emergencyRelation', v)} placeholder="e.g. Spouse, Parent"
                            />
                            <InputField
                                label="Emergency Phone" value={form.emergencyPhone} type="tel"
                                onChange={(v) => setField('emergencyPhone', v)} placeholder="+91 XXXXX XXXXX"
                            />
                        </div>
                    </motion.div>
                </motion.div>

                {/* Sticky Action Footer */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                    className="sticky bottom-6 z-40 mt-8"
                >
                    <div className="mx-auto max-w-lg rounded-[2rem] bg-white/80 p-2 shadow-2xl shadow-slate-300/50 backdrop-blur-xl border border-white">
                        <button
                            type="submit"
                            disabled={saving}
                            className="group relative flex h-14 w-full items-center justify-center gap-3 overflow-hidden rounded-[1.5rem] bg-slate-900 text-base font-bold text-white shadow-xl transition-all hover:bg-slate-800 active:scale-95 disabled:opacity-70 disabled:shadow-none"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-teal-500/20 opacity-0 transition-opacity group-hover:opacity-100" />
                            {saving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                            <span className="relative z-10">{saving ? t('profile.saving') : t('profile.saveProfile')}</span>
                        </button>
                    </div>
                </motion.div>
            </form>
        </PageTransition>
    );
}

// --- Micro UI Components ---
function InputField({ label, value, onChange, placeholder, type = "text", icon }) {
    return (
        <div className="relative group">
            {icon && (
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-blue-600">
                    {icon}
                </div>
            )}
            <input
                type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
                className={`peer w-full h-16 rounded-[1.25rem] border border-slate-100 bg-slate-50/50 pt-5 text-sm font-bold text-slate-900 outline-none ring-2 ring-transparent transition-all focus:border-blue-300 focus:bg-white focus:ring-blue-500/20 hover:bg-slate-100/50 ${icon ? 'pl-12 pr-4' : 'px-5'}`}
            />
            <label className={`absolute top-2 text-[10px] font-black uppercase tracking-widest transition-all peer-focus:text-blue-600 ${icon ? 'left-12' : 'left-5'} ${value ? 'text-slate-500' : 'text-slate-400'}`}>
                {label}
            </label>
        </div>
    );
}

function SelectField({ value, onChange, options, label }) {
    return (
        <div className="relative group">
            <select
                value={value} onChange={(e) => onChange(e.target.value)}
                className="peer w-full h-16 rounded-[1.25rem] border border-slate-100 bg-slate-50/50 px-5 pt-5 text-sm font-bold text-slate-900 outline-none ring-2 ring-transparent transition-all focus:border-blue-300 focus:bg-white focus:ring-blue-500/20 hover:bg-slate-100/50 appearance-none"
            >
                {options.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
            </select>
            <label className="absolute left-5 top-2 text-[10px] font-black uppercase tracking-widest text-slate-500 transition-all peer-focus:text-blue-600">
                {label}
            </label>
        </div>
    );
}