import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Clock3, Pill, Plus, Trash2, X, AlertTriangle, CheckCircle2, Package, Info,Loader2 ,Save} from 'lucide-react';
import {
    createMedicineReminder,
    deleteMedicineReminder,
    getMedicineReminders,
    markMedicineTaken,
} from '../services/api';
import PageTransition from '../components/common/PageTransition';

// --- Logic & Helpers ---
const initialForm = { medicineName: '', dosage: '', times: [], stockRemaining: 10, withFood: false };

function formatClock(value) {
    if (!value || !/^([01]\d|2[0-3]):([0-5]\d)$/.test(value)) return value;
    const [hourRaw, minute] = value.split(':');
    const hour = Number(hourRaw);
    const meridiem = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minute} ${meridiem}`;
}

function todaysKey() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

// --- Main Component ---
export default function Medicines() {
    const [loading, setLoading] = useState(true);
    const [reminders, setReminders] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [takingId, setTakingId] = useState('');
    const [form, setForm] = useState(initialForm);
    const [timeInput, setTimeInput] = useState('08:00');
    const notifiedRef = useRef({});

    async function loadReminders(showLoader = true) {
        if (showLoader) setLoading(true);
        try {
            const { data } = await getMedicineReminders();
            setReminders(Array.isArray(data) ? data : []);
        } catch {
            toast.error('Network latency: Unable to sync regimen.');
        } finally {
            if (showLoader) setLoading(false);
        }
    }

    useEffect(() => { loadReminders(); }, []);

    useEffect(() => {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission().catch(() => {});
        }
    }, []);

    useEffect(() => {
        const checkReminders = () => {
            if (!reminders.length) return;
            const now = new Date();
            const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
            const today = todaysKey();

            reminders.forEach((reminder) => {
                if (!reminder?.times?.includes(currentTime)) return;
                const uniqueKey = `${reminder._id}:${today}:${currentTime}`;
                if (notifiedRef.current[uniqueKey]) return;

                const title = `Time for ${reminder.medicineName}`;
                const body = `Dosage: ${reminder.dosage} ${reminder.withFood ? '(Take with food)' : ''}`;

                if ('Notification' in window && Notification.permission === 'granted') {
                    new Notification(title, { body, icon: '/icons/icon-192.png' });
                } else {
                    toast(title, { id: uniqueKey, icon: '💊' });
                }
                notifiedRef.current[uniqueKey] = true;
            });
        };

        checkReminders();
        const intervalId = window.setInterval(checkReminders, 60 * 1000);
        return () => window.clearInterval(intervalId);
    }, [reminders]);

    function resetForm() { setForm(initialForm); setTimeInput('08:00'); }

    function addTime() {
        if (!timeInput) return;
        setForm((prev) => prev.times.includes(timeInput) ? prev : { ...prev, times: [...prev.times, timeInput].sort() });
    }

    function removeTime(time) {
        setForm((prev) => ({ ...prev, times: prev.times.filter((entry) => entry !== time) }));
    }

    async function handleCreateReminder(event) {
        event.preventDefault();
        if (!form.medicineName.trim() || !form.dosage.trim()) {
            toast.error('Please specify the medication and dosage.'); return;
        }
        if (!form.times.length) {
            toast.error('At least one schedule time is required.'); return;
        }

        setSaving(true);
        try {
            const { data } = await createMedicineReminder(form);
            setReminders((prev) => [data, ...prev]);
            setShowModal(false);
            resetForm();
            toast.success('Medication added to regimen.');
        } catch {
            toast.error('System error: Failed to log medication.');
        } finally {
            setSaving(false);
        }
    }

    async function handleMarkTaken(reminderId) {
        if (!reminderId || takingId) return;
        setTakingId(reminderId);
        try {
            const { data } = await markMedicineTaken(reminderId);
            setReminders((prev) => prev.map((item) => (item._id === reminderId ? data : item)));
            toast.success('Dose administered and logged.');
        } catch {
            toast.error('Sync failed. Please try again.');
        } finally {
            setTakingId('');
        }
    }

    async function handleDelete(reminderId) {
        if (!reminderId) return;
        try {
            await deleteMedicineReminder(reminderId);
            setReminders((prev) => prev.filter((item) => item._id !== reminderId));
            toast.success('Medication removed from regimen.');
        } catch {
            toast.error('Unable to delete record.');
        }
    }

    const reminderStats = useMemo(() => ({
        total: reminders.length,
        lowStock: reminders.filter((item) => Number(item.stockRemaining) < 3).length,
    }), [reminders]);

    return (
        <PageTransition className="mx-auto max-w-[1400px] space-y-6 pb-12 px-2">
            
            {/* Premium Header */}
            <header className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 px-8 py-10 text-white shadow-2xl shadow-slate-900/20">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.25),transparent_60%)]" />
                <div className="relative z-10 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                    <div className="max-w-2xl">
                        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-300 ring-1 ring-inset ring-emerald-500/30 mb-4">
                            <Pill size={14} /> Pharmacy Manager
                        </div>
                        <h1 className="text-4xl font-black tracking-tight text-white lg:text-5xl">
                            Medication <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">Regimen</span>
                        </h1>
                        <p className="mt-3 text-slate-400 text-lg">
                            Automated dosage tracking, intelligent stock alerts, and synchronized push notifications.
                        </p>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <div className="flex gap-4 pr-6 border-r border-slate-700">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Active</p>
                                <p className="text-2xl font-black text-white">{reminderStats.total}</p>
                            </div>
                            <div>
                                <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Low Stock</p>
                                <p className={`text-2xl font-black ${reminderStats.lowStock > 0 ? 'text-amber-400' : 'text-white'}`}>
                                    {reminderStats.lowStock}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowModal(true)}
                            className="group flex h-14 items-center gap-3 rounded-2xl bg-white px-6 text-sm font-bold text-slate-900 shadow-xl transition-all hover:bg-slate-50 active:scale-95"
                        >
                            <div className="rounded-full bg-slate-900 p-1 text-white transition-transform group-hover:rotate-90">
                                <Plus size={16} />
                            </div>
                            Add Medication
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            {loading ? (
                <div className="flex h-64 items-center justify-center rounded-[2rem] border border-slate-100 bg-white shadow-sm">
                    <Loader2 size={32} className="animate-spin text-emerald-500" />
                </div>
            ) : !reminders.length ? (
                <div className="flex flex-col items-center justify-center py-20 rounded-[2rem] border border-dashed border-slate-300 bg-white/50 text-center">
                    <div className="h-20 w-20 rounded-full bg-slate-100 flex items-center justify-center mb-6 text-slate-300">
                        <Pill size={40} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800">Your regimen is empty</h3>
                    <p className="mt-2 text-sm text-slate-500 max-w-sm">Add your first prescription or supplement to begin automated tracking and receive timely reminders.</p>
                    <button onClick={() => setShowModal(true)} className="mt-6 font-bold text-emerald-600 hover:text-emerald-700">
                        + Configure First Medication
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    <AnimatePresence>
                        {reminders.map((reminder, index) => {
                            const planned = Number(reminder.dosesPlannedToday || reminder.times?.length || 0);
                            const taken = Number(reminder.dosesTakenToday || 0);
                            const progress = planned > 0 ? Math.min(100, Math.round((taken / planned) * 100)) : 0;
                            const lowStock = Number(reminder.stockRemaining) < 3;
                            const isComplete = taken >= planned && planned > 0;

                            return (
                                <motion.div
                                    key={reminder._id} layout
                                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.3, delay: index * 0.05 }}
                                    className="group relative flex flex-col justify-between overflow-hidden rounded-[2rem] border border-slate-100 bg-white p-6 shadow-xl shadow-slate-200/40 hover:-translate-y-1 hover:shadow-2xl transition-all duration-300"
                                >
                                    {/* Card Header */}
                                    <div>
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl shadow-inner ${isComplete ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                                                    {isComplete ? <CheckCircle2 size={24} /> : <Pill size={24} />}
                                                </div>
                                                <div>
                                                    <h2 className="text-lg font-bold tracking-tight text-slate-900 leading-tight">{reminder.medicineName}</h2>
                                                    <p className="text-xs font-semibold text-slate-500">{reminder.dosage}</p>
                                                </div>
                                            </div>
                                            <button onClick={() => handleDelete(reminder._id)} className="p-2 text-slate-300 hover:bg-rose-50 hover:text-rose-600 rounded-xl transition-colors opacity-0 group-hover:opacity-100">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>

                                        <div className="flex flex-wrap gap-2 mb-6">
                                            {reminder.withFood && (
                                                <span className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-amber-700">
                                                    <Info size={12} /> With Food
                                                </span>
                                            )}
                                            {lowStock && (
                                                <span className="inline-flex items-center gap-1 rounded-lg bg-rose-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-rose-700">
                                                    <AlertTriangle size={12} /> Low Stock ({reminder.stockRemaining})
                                                </span>
                                            )}
                                            {!lowStock && (
                                                <span className="inline-flex items-center gap-1 rounded-lg bg-slate-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-slate-500">
                                                    <Package size={12} /> Stock: {reminder.stockRemaining}
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex flex-wrap gap-2 mb-6">
                                            {reminder.times?.map((time) => (
                                                <span key={`${reminder._id}-${time}`} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-100 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-600">
                                                    <Clock3 size={12} className="text-blue-500" /> {formatClock(time)}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Action & Progress */}
                                    <div>
                                        <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-2">
                                            <span className="uppercase tracking-widest">Daily Progress</span>
                                            <span className={isComplete ? 'text-emerald-600' : 'text-blue-600'}>{taken} / {planned || '--'} Doses</span>
                                        </div>
                                        <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden shadow-inner mb-4">
                                            <motion.div
                                                initial={{ width: 0 }} animate={{ width: `${progress}%` }}
                                                transition={{ duration: 0.8, ease: 'easeOut' }}
                                                className={`h-full rounded-full ${isComplete ? 'bg-emerald-500' : 'bg-blue-500'}`}
                                            />
                                        </div>

                                        <button
                                            onClick={() => handleMarkTaken(reminder._id)}
                                            disabled={takingId === reminder._id || isComplete}
                                            className={`w-full h-12 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-95 ${
                                                isComplete 
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                                                    : 'bg-slate-900 text-white shadow-lg shadow-slate-900/20 hover:bg-slate-800 disabled:opacity-50'
                                            }`}
                                        >
                                            {takingId === reminder._id ? <Loader2 size={18} className="animate-spin" /> : isComplete ? <CheckCircle2 size={18} /> : 'Log Dose as Taken'}
                                            {isComplete ? 'Completed' : ''}
                                        </button>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            )}

            {/* Premium Add Reminder Modal */}
            <AnimatePresence>
                {showModal && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-md"
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="w-full max-w-md rounded-[2.5rem] bg-white p-8 shadow-2xl border border-white"
                        >
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h3 className="text-2xl font-black tracking-tight text-slate-900">New Regimen</h3>
                                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mt-1">Configure details</p>
                                </div>
                                <button onClick={() => { setShowModal(false); resetForm(); }} className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors">
                                    <X size={18} />
                                </button>
                            </div>

                            <form onSubmit={handleCreateReminder} className="space-y-5">
                                <InputField label="Medication Name" value={form.medicineName} onChange={(v) => setForm(p => ({ ...p, medicineName: v }))} placeholder="e.g. Amoxicillin" />
                                <InputField label="Dosage" value={form.dosage} onChange={(v) => setForm(p => ({ ...p, dosage: v }))} placeholder="e.g. 500mg, 1 Tablet" />

                                <div className="grid grid-cols-2 gap-4">
                                    <InputField label="Stock count" type="number" value={form.stockRemaining} onChange={(v) => setForm(p => ({ ...p, stockRemaining: Number(v) }))} min="0" />
                                    
                                    {/* Custom Toggle for Food */}
                                    <button
                                        type="button"
                                        onClick={() => setForm(p => ({ ...p, withFood: !p.withFood }))}
                                        className={`flex flex-col items-start justify-center px-4 h-14 rounded-2xl border-2 transition-all ${form.withFood ? 'border-blue-600 bg-blue-50' : 'border-slate-100 bg-slate-50'}`}
                                    >
                                        <span className={`text-[10px] font-bold uppercase tracking-widest ${form.withFood ? 'text-blue-600' : 'text-slate-400'}`}>Instruction</span>
                                        <span className={`text-sm font-bold ${form.withFood ? 'text-blue-900' : 'text-slate-700'}`}>Take with food</span>
                                    </button>
                                </div>

                                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-2">Schedule Times</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="time" value={timeInput} onChange={(e) => setTimeInput(e.target.value)}
                                            className="h-12 flex-1 rounded-xl border-none bg-white px-4 text-sm font-bold text-slate-900 shadow-sm outline-none ring-2 ring-transparent focus:ring-blue-500/20"
                                        />
                                        <button type="button" onClick={addTime} className="h-12 px-6 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-slate-800 transition-colors">
                                            Add
                                        </button>
                                    </div>
                                    {form.times.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-200">
                                            {form.times.map((time) => (
                                                <span key={time} className="flex items-center gap-2 rounded-lg bg-white border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 shadow-sm">
                                                    {formatClock(time)}
                                                    <button type="button" onClick={() => removeTime(time)} className="text-slate-400 hover:text-rose-500"><X size={14} /></button>
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <button
                                    type="submit" disabled={saving}
                                    className="mt-4 w-full h-14 rounded-2xl bg-emerald-500 text-white text-base font-bold shadow-xl shadow-emerald-500/20 transition-all hover:bg-emerald-600 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {saving ? <Loader2 size={20} className="animate-spin" /> : <Save size={18} />}
                                    Save to Regimen
                                </button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </PageTransition>
    );
}

// --- Micro Components ---
function InputField({ label, value, onChange, placeholder, type = "text", min }) {
    return (
        <div className="relative group">
            <input 
                type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} min={min}
                className="peer w-full h-14 rounded-2xl border-none bg-slate-50 px-4 pt-4 text-sm font-bold text-slate-900 outline-none ring-2 ring-transparent focus:bg-white focus:ring-blue-500/20 focus:border-blue-300 transition-all shadow-inner"
            />
            <label className="absolute left-4 top-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 transition-all peer-focus:text-blue-600">
                {label}
            </label>
        </div>
    );
}