import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { Mail, Lock, Eye, EyeOff, User, Loader2, Sparkles } from 'lucide-react';

function getStrength(pw) {
    let s = 0;
    if (pw.length >= 6) s++;
    if (pw.length >= 8) s++;
    if (/[A-Z]/.test(pw)) s++;
    if (/[0-9]/.test(pw)) s++;
    if (/[^A-Za-z0-9]/.test(pw)) s++;
    return s;
}

const STRENGTH_LABELS = ['', 'Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'];
const STRENGTH_COLORS = ['', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500'];

export default function Register() {
    const { register, loginWithGoogle } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
    const [showPw, setShowPw] = useState(false);
    const [loading, setLoading] = useState(false);
    const [gLoading, setGLoading] = useState(false);
    const [error, setError] = useState('');
    const [agreed, setAgreed] = useState(false);

    const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
    const strength = getStrength(form.password);

    async function handleSubmit(e) {
        e.preventDefault();
        if (!form.name || !form.email || !form.password) { setError('All fields required'); return; }
        if (form.password !== form.confirm) { setError('Passwords do not match'); return; }
        if (form.password.length < 6) { setError('Password must be at least 6 characters'); return; }
        if (!agreed) { setError('Please agree to terms'); return; }
        setLoading(true); setError('');
        try {
            await register(form.email, form.password, form.name);
            toast.success('Account created!');
            navigate('/');
        } catch (err) {
            setError(err.code === 'auth/email-already-in-use' ? 'Email already registered' : err.message);
        }
        setLoading(false);
    }

    async function handleGoogle() {
        setGLoading(true);
        try { await loginWithGoogle(); toast.success('Welcome!'); navigate('/'); }
        catch { setError('Google sign-in failed'); }
        setGLoading(false);
    }

    return (
        <div className="min-h-screen flex">
            {/* Left */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-blue-700 to-teal-600 p-12 flex-col justify-between text-white">
                <div>
                    <div className="flex items-center gap-3 mb-12">
                        <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center"><Sparkles size={24} /></div>
                        <span className="text-2xl font-bold">SehatSaathi</span>
                    </div>
                    <h2 className="text-4xl font-bold mb-4 leading-tight">Join SehatSaathi<br />Today</h2>
                    <p className="text-blue-100 text-lg max-w-sm">Create your free account and access AI-powered healthcare in your language.</p>
                </div>
                <p className="text-blue-200 text-xs">© 2025 SehatSaathi — AI Health Companion</p>
            </div>

            {/* Right */}
            <div className="flex-1 flex items-center justify-center p-6">
                <div className="w-full max-w-md">
                    <div className="lg:hidden flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-teal-500 flex items-center justify-center text-white"><Sparkles size={18} /></div>
                        <span className="text-xl font-bold text-gray-900">SehatSaathi</span>
                    </div>

                    <h1 className="text-2xl font-bold text-gray-900 mb-1">Create Account</h1>
                    <p className="text-gray-500 text-sm mb-6">Start your health journey</p>

                    <button onClick={handleGoogle} disabled={gLoading}
                        className="w-full py-3 rounded-xl border-2 border-gray-200 bg-white font-semibold text-gray-700 flex items-center justify-center gap-3 hover:bg-gray-50 hover:border-gray-300 transition-all mb-4 disabled:opacity-50">
                        {gLoading ? <Loader2 size={18} className="animate-spin" /> : (
                            <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" /><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" /><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" /><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" /></svg>
                        )} Continue with Google
                    </button>

                    <div className="flex items-center gap-3 my-4"><div className="flex-1 h-px bg-gray-200" /><span className="text-xs text-gray-400">or</span><div className="flex-1 h-px bg-gray-200" /></div>

                    {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>}

                    <form onSubmit={handleSubmit} className="space-y-3">
                        <div className="relative">
                            <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Full name"
                                className="w-full py-3 pl-11 pr-4 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all" />
                        </div>
                        <div className="relative">
                            <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="Email address"
                                className="w-full py-3 pl-11 pr-4 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all" />
                        </div>
                        <div>
                            <div className="relative">
                                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input type={showPw ? 'text' : 'password'} value={form.password} onChange={e => set('password', e.target.value)} placeholder="Password"
                                    className="w-full py-3 pl-11 pr-12 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all" />
                                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                    {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            {form.password && (
                                <div className="mt-2">
                                    <div className="flex gap-1 mb-1">{[1, 2, 3, 4, 5].map(i => <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= strength ? STRENGTH_COLORS[strength] : 'bg-gray-200'}`} />)}</div>
                                    <p className={`text-[11px] font-medium ${strength <= 2 ? 'text-red-500' : strength <= 3 ? 'text-yellow-600' : 'text-green-600'}`}>{STRENGTH_LABELS[strength]}</p>
                                </div>
                            )}
                        </div>
                        <div className="relative">
                            <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input type="password" value={form.confirm} onChange={e => set('confirm', e.target.value)} placeholder="Confirm password"
                                className="w-full py-3 pl-11 pr-4 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all" />
                        </div>

                        <label className="flex items-start gap-2 cursor-pointer">
                            <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)}
                                className="mt-1 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                            <span className="text-xs text-gray-500">I agree to the <span className="text-blue-600 font-medium">Terms of Service</span> and <span className="text-blue-600 font-medium">Privacy Policy</span></span>
                        </label>

                        <button type="submit" disabled={loading}
                            className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold shadow-lg shadow-blue-500/20 hover:shadow-xl disabled:opacity-50 flex items-center justify-center gap-2 transition-all">
                            {loading ? <Loader2 size={18} className="animate-spin" /> : null} Create Account
                        </button>
                    </form>

                    <p className="text-center text-sm text-gray-500 mt-6">Already have an account? <Link to="/login" className="text-blue-600 font-semibold hover:text-blue-800">Sign In</Link></p>
                </div>
            </div>
        </div>
    );
}
