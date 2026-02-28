import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Loader2, Lock, Mail, User, ShieldCheck, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import AuthSplitShell from './AuthSplitShell';

const firebaseErrors = {
    'auth/email-already-in-use': 'This email is already linked to an active account.',
    'auth/invalid-email': 'Please provide a valid email identifier.',
    'auth/weak-password': 'Your security key must be stronger (min. 6 characters).',
    'auth/too-many-requests': 'Security block: Too many attempts. Try again later.',
};

const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    show: {
        opacity: 1,
        y: 0,
        transition: { staggerChildren: 0.1, delayChildren: 0.1, ease: "easeOut" },
    },
};

const itemVariants = {
    hidden: { opacity: 0, scale: 0.98 },
    show: { opacity: 1, scale: 1 },
};

export default function Register() {
    const { register, loginWithGoogle } = useAuth();
    const navigate = useNavigate();

    const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [error, setError] = useState('');

    const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

    async function handleSubmit(event) {
        event.preventDefault();
        if (!form.name || !form.email || !form.password) {
            setError('Please complete all clinical profile fields.');
            return;
        }
        if (form.password !== form.confirm) {
            setError('Security keys do not match. Please verify.');
            return;
        }
        setLoading(true);
        setError('');
        
        try {
            await register(form.email, form.password, form.name);
            toast.success('Profile Initialized Successfully.');
            navigate('/');
        } catch (err) {
            setError(firebaseErrors[err.code] || 'Registration protocol failed. Please try again.');
        } finally {
            setLoading(false);
        }
    }

    async function handleGoogle() {
        setGoogleLoading(true);
        setError('');
        try {
            const mode = await loginWithGoogle();
            if (mode === 'popup') {
                toast.success('Profile created via Google Authentication.');
                navigate('/');
            }
        } catch (err) {
            setError(firebaseErrors[err.code] || 'Google connection interrupted.');
        } finally {
            setGoogleLoading(false);
        }
    }

    return (
        <AuthSplitShell
            heroTitle="Intelligent Clinical Care Begins Here."
            heroSubtitle="Create your encrypted workspace for AI diagnostics, unified records, and rapid emergency response."
            cardTitle="Initialize Workspace"
            cardSubtitle="Set up your secure medical identity"
            footer={(
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="mt-8 text-center text-xs font-medium text-slate-400 uppercase tracking-widest"
                >
                    Already initialized?{' '}
                    {/* Deepened link colors */}
                    <Link to="/login" className="text-blue-800 hover:text-blue-950 transition-all font-bold">
                        Access Portal
                    </Link>
                </motion.p>
            )}
        >
            <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
                
                {/* Error Alert */}
                <AnimatePresence>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, x: -10 }}
                            animate={{ opacity: 1, scale: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="p-4 rounded-2xl border border-rose-100 bg-rose-50/50 backdrop-blur-md flex items-center gap-3 text-sm text-rose-600 font-medium"
                        >
                            <ShieldCheck size={18} className="shrink-0" />
                            {error}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Google Login with Glow */}
                <motion.button
                    variants={itemVariants}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleGoogle}
                    disabled={googleLoading}
                    // Deepened hover shadow
                    className="group relative w-full h-14 rounded-2xl border border-slate-200 bg-white text-sm font-bold text-slate-700 shadow-sm hover:shadow-blue-900/5 flex items-center justify-center gap-3 transition-all overflow-hidden"
                >
                    {/* Deepened background gradient color */}
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-900/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    {googleLoading ? <Loader2 size={20} className="animate-spin text-blue-800" /> : (
                        <svg width="20" height="20" viewBox="0 0 48 48" className="z-10">
                            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                        </svg>
                    )}
                    <span className="z-10">Continue with Google</span>
                </motion.button>

                <div className="relative flex items-center">
                    <div className="flex-grow border-t border-slate-100"></div>
                    <span className="flex-shrink mx-4 text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">End-to-End Encrypted</span>
                    <div className="flex-grow border-t border-slate-100"></div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Name Input */}
                    <div className="space-y-2">
                        <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400 ml-1">Legal Name</label>
                        <div className="relative group">
                            {/* Deepened focus icon color */}
                            <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-800 transition-colors" />
                            <input
                                value={form.name}
                                onChange={(e) => setField('name', e.target.value)}
                                placeholder="First & Last Name"
                                className="w-full h-14 rounded-2xl border border-slate-100 bg-slate-50 pl-12 pr-4 text-sm font-medium text-slate-900 outline-none ring-blue-900/10 focus:ring-4 focus:bg-white focus:border-blue-800/30 transition-all"
                            />
                        </div>
                    </div>

                    {/* Email Input */}
                    <div className="space-y-2">
                        <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400 ml-1">Email Identifier</label>
                        <div className="relative group">
                            {/* Deepened focus icon color */}
                            <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-800 transition-colors" />
                            <input
                                type="email"
                                value={form.email}
                                onChange={(e) => setField('email', e.target.value)}
                                placeholder="name@domain.com"
                                className="w-full h-14 rounded-2xl border border-slate-100 bg-slate-50 pl-12 pr-4 text-sm font-medium text-slate-900 outline-none ring-blue-900/10 focus:ring-4 focus:bg-white focus:border-blue-800/30 transition-all"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {/* Password Input */}
                        <div className="space-y-2">
                            <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400 ml-1">Security Key</label>
                            <div className="relative group">
                                {/* Deepened focus icon color */}
                                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-800 transition-colors" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={form.password}
                                    onChange={(e) => setField('password', e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full h-14 rounded-2xl border border-slate-100 bg-slate-50 pl-12 pr-12 text-sm font-medium text-slate-900 outline-none ring-blue-900/10 focus:ring-4 focus:bg-white focus:border-blue-800/30 transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        {/* Confirm Password Input */}
                        <div className="space-y-2">
                            <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400 ml-1">Verify Key</label>
                            <div className="relative group">
                                {/* Deepened focus icon color */}
                                <ShieldCheck size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-800 transition-colors" />
                                <input
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    value={form.confirm}
                                    onChange={(e) => setField('confirm', e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full h-14 rounded-2xl border border-slate-100 bg-slate-50 pl-12 pr-12 text-sm font-medium text-slate-900 outline-none ring-blue-900/10 focus:ring-4 focus:bg-white focus:border-blue-800/30 transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <motion.button
                        // Matching the dark blue shadow
                        whileHover={{ y: -2, shadow: "0 20px 40px -10px rgba(30, 58, 138, 0.3)" }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        disabled={loading}
                        className="relative mt-2 w-full h-14 rounded-2xl bg-zinc-900 text-white text-sm font-bold flex items-center justify-center gap-3 transition-all disabled:opacity-50 overflow-hidden"
                    >
                        {loading ? <Loader2 size={20} className="animate-spin" /> : (
                            <>
                                <span>Initialize Workspace</span>
                                {/* Softer blue sparkle */}
                                <Sparkles size={16} className="text-blue-300" />
                            </>
                        )}
                    </motion.button>
                </form>
            </motion.div>
        </AuthSplitShell>
    );
}