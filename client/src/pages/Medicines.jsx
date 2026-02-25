import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Clock3, Pill, Plus, Trash2, X } from 'lucide-react';
import {
    createMedicineReminder,
    deleteMedicineReminder,
    getMedicineReminders,
    markMedicineTaken,
} from '../services/api';
import Card from '../components/common/Card';
import PageTransition from '../components/common/PageTransition';

const initialForm = {
    medicineName: '',
    dosage: '',
    times: [],
    stockRemaining: 10,
    withFood: false,
};

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
            toast.error('Unable to load medicine reminders.');
        } finally {
            if (showLoader) setLoading(false);
        }
    }

    useEffect(() => {
        loadReminders();
    }, []);

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

                const title = `💊 Time to take ${reminder.medicineName}`;
                const body = `${reminder.dosage}${reminder.withFood ? ' • with food' : ''}`;

                if ('Notification' in window && Notification.permission === 'granted') {
                    new Notification(title, { body, icon: '/icons/icon-192.png' });
                } else {
                    toast(title, { id: uniqueKey });
                }
                notifiedRef.current[uniqueKey] = true;
            });
        };

        checkReminders();
        const intervalId = window.setInterval(checkReminders, 60 * 1000);
        return () => window.clearInterval(intervalId);
    }, [reminders]);

    function resetForm() {
        setForm(initialForm);
        setTimeInput('08:00');
    }

    function addTime() {
        if (!timeInput) return;
        setForm((prev) => {
            if (prev.times.includes(timeInput)) return prev;
            return { ...prev, times: [...prev.times, timeInput].sort() };
        });
    }

    function removeTime(time) {
        setForm((prev) => ({ ...prev, times: prev.times.filter((entry) => entry !== time) }));
    }

    async function handleCreateReminder(event) {
        event.preventDefault();
        if (!form.medicineName.trim() || !form.dosage.trim()) {
            toast.error('Medicine name and dosage are required.');
            return;
        }
        if (!form.times.length) {
            toast.error('Add at least one reminder time.');
            return;
        }

        setSaving(true);
        try {
            const { data } = await createMedicineReminder(form);
            setReminders((prev) => [data, ...prev]);
            setShowModal(false);
            resetForm();
            toast.success('Reminder added.');
        } catch {
            toast.error('Failed to add reminder.');
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
            toast.success('Dose marked as taken.');
        } catch {
            toast.error('Unable to mark dose as taken.');
        } finally {
            setTakingId('');
        }
    }

    async function handleDelete(reminderId) {
        if (!reminderId) return;
        try {
            await deleteMedicineReminder(reminderId);
            setReminders((prev) => prev.filter((item) => item._id !== reminderId));
            toast.success('Reminder deleted.');
        } catch {
            toast.error('Unable to delete reminder.');
        }
    }

    const reminderStats = useMemo(
        () => ({
            total: reminders.length,
            lowStock: reminders.filter((item) => Number(item.stockRemaining) < 3).length,
        }),
        [reminders]
    );

    return (
        <PageTransition className="mx-auto max-w-7xl space-y-4">
            <Card className="p-6 md:p-7 bg-gradient-to-r from-zinc-900 via-blue-900 to-teal-700 text-white border-transparent">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <p className="text-sm text-blue-100">Medicine Tracker & Inventory Alarm</p>
                        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-white">Medication Dashboard</h1>
                        <p className="mt-2 text-sm text-blue-100">
                            System reminders run every minute and alerts trigger when it is time to take each dose.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setShowModal(true)}
                        className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-blue-700 shadow-lg shadow-slate-950/20"
                    >
                        <Plus size={16} /> Add Reminder
                    </button>
                </div>
                <div className="mt-5 grid grid-cols-2 gap-3 md:max-w-md">
                    <div className="rounded-xl border border-white/20 bg-white/10 px-3 py-2">
                        <p className="text-xs text-blue-100">Active Medicines</p>
                        <p className="text-xl font-semibold text-white">{reminderStats.total}</p>
                    </div>
                    <div className="rounded-xl border border-white/20 bg-white/10 px-3 py-2">
                        <p className="text-xs text-blue-100">Low Stock Alerts</p>
                        <p className="text-xl font-semibold text-white">{reminderStats.lowStock}</p>
                    </div>
                </div>
            </Card>

            {loading ? (
                <Card className="p-8 text-center">
                    <p className="text-sm text-slate-500">Loading reminders...</p>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {reminders.map((reminder, index) => {
                        const planned = Number(reminder.dosesPlannedToday || reminder.times?.length || 0);
                        const taken = Number(reminder.dosesTakenToday || 0);
                        const progress = planned > 0 ? Math.min(100, Math.round((taken / planned) * 100)) : 0;
                        const lowStock = Number(reminder.stockRemaining) < 3;

                        return (
                            <motion.div
                                key={reminder._id}
                                initial={{ opacity: 0, y: 14 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.35, ease: 'easeOut', delay: index * 0.03 }}
                            >
                                <Card className="p-5">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                                                <Pill size={13} /> {reminder.withFood ? 'With Food' : 'Any Time'}
                                            </div>
                                            <h2 className="mt-2 text-lg font-semibold tracking-tight text-slate-900">{reminder.medicineName}</h2>
                                            <p className="text-sm text-slate-500">{reminder.dosage}</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleDelete(reminder._id)}
                                            className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                                            title="Delete reminder"
                                        >
                                            <Trash2 size={15} />
                                        </button>
                                    </div>

                                    <div className="mt-4">
                                        <div className="flex items-center justify-between text-xs text-slate-500">
                                            <span>Doses taken today</span>
                                            <span>
                                                {taken}/{planned || '--'}
                                            </span>
                                        </div>
                                        <div className="mt-2 h-2.5 rounded-full bg-slate-100 overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${progress}%` }}
                                                transition={{ duration: 0.4, ease: 'easeOut' }}
                                                className="h-full rounded-full bg-gradient-to-r from-blue-600 to-teal-500"
                                            />
                                        </div>
                                    </div>

                                    <div className="mt-4 flex flex-wrap gap-2">
                                        {reminder.times?.map((time) => (
                                            <span
                                                key={`${reminder._id}-${time}`}
                                                className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600"
                                            >
                                                <Clock3 size={12} /> {formatClock(time)}
                                            </span>
                                        ))}
                                    </div>

                                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                                        <div className="text-sm text-slate-600">
                                            Stock: <span className="font-semibold text-slate-900">{reminder.stockRemaining}</span>
                                        </div>
                                        {lowStock ? (
                                            <span className="rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700">
                                                Low Stock
                                            </span>
                                        ) : null}
                                    </div>

                                    <button
                                        type="button"
                                        role="switch"
                                        aria-checked={false}
                                        onClick={() => handleMarkTaken(reminder._id)}
                                        disabled={takingId === reminder._id}
                                        className={`mt-4 inline-flex w-full items-center justify-between rounded-xl border px-3 py-2 text-sm font-medium transition-all ${
                                            takingId === reminder._id
                                                ? 'border-blue-200 bg-blue-50 text-blue-600'
                                                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                                        }`}
                                    >
                                        <span>Mark as Taken</span>
                                        <span
                                            className={`h-5 w-10 rounded-full p-0.5 transition-all ${
                                                takingId === reminder._id ? 'bg-blue-600' : 'bg-slate-300'
                                            }`}
                                        >
                                            <span
                                                className={`block h-4 w-4 rounded-full bg-white transition-transform ${
                                                    takingId === reminder._id ? 'translate-x-5' : 'translate-x-0'
                                                }`}
                                            />
                                        </span>
                                    </button>
                                </Card>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {!loading && !reminders.length ? (
                <Card className="p-8 text-center">
                    <p className="text-sm text-slate-500">No medicine reminders yet. Add your first reminder to start tracking.</p>
                </Card>
            ) : null}

            <AnimatePresence>
                {showModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ opacity: 0, y: 20, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 16, scale: 0.98 }}
                            transition={{ duration: 0.25, ease: 'easeOut' }}
                            className="w-full max-w-lg rounded-[1.6rem] border border-white/65 bg-white/90 p-5 shadow-[0_28px_80px_rgba(15,23,42,0.22)]"
                        >
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-semibold tracking-tight text-slate-900">Add Reminder</h3>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowModal(false);
                                        resetForm();
                                    }}
                                    className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            <form onSubmit={handleCreateReminder} className="mt-4 space-y-3">
                                <input
                                    value={form.medicineName}
                                    onChange={(event) => setForm((prev) => ({ ...prev, medicineName: event.target.value }))}
                                    placeholder="Medicine name"
                                />
                                <input
                                    value={form.dosage}
                                    onChange={(event) => setForm((prev) => ({ ...prev, dosage: event.target.value }))}
                                    placeholder="Dosage (e.g. 500 mg)"
                                />

                                <div className="flex items-end gap-2">
                                    <div className="flex-1">
                                        <label className="mb-1 block text-xs font-medium text-slate-500">Reminder time</label>
                                        <input
                                            type="time"
                                            value={timeInput}
                                            onChange={(event) => setTimeInput(event.target.value)}
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={addTime}
                                        className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white"
                                    >
                                        Add
                                    </button>
                                </div>

                                {form.times.length ? (
                                    <div className="flex flex-wrap gap-2">
                                        {form.times.map((time) => (
                                            <button
                                                key={time}
                                                type="button"
                                                onClick={() => removeTime(time)}
                                                className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600"
                                            >
                                                {formatClock(time)} <X size={12} />
                                            </button>
                                        ))}
                                    </div>
                                ) : null}

                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="mb-1 block text-xs font-medium text-slate-500">Stock Remaining</label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={form.stockRemaining}
                                            onChange={(event) =>
                                                setForm((prev) => ({ ...prev, stockRemaining: Number(event.target.value) }))
                                            }
                                        />
                                    </div>
                                    <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">
                                        <input
                                            type="checkbox"
                                            checked={form.withFood}
                                            onChange={(event) => setForm((prev) => ({ ...prev, withFood: event.target.checked }))}
                                        />
                                        Take with food
                                    </label>
                                </div>

                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-teal-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 disabled:opacity-60"
                                >
                                    {saving ? 'Saving...' : 'Save Reminder'}
                                </button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </PageTransition>
    );
}
