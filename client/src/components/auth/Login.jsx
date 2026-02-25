import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { Mail, Lock, Eye, EyeOff, Loader2, Sparkles, Stethoscope, Bot, Shield } from 'lucide-react';

const FIREBASE_ERRORS = {
    'auth/invalid-email': 'Invalid email address',
    'auth/user-disabled': 'Account disabled',
    'auth/user-not-found': 'No account with this email',
    'auth/wrong-password': 'Incorrect password',
    'auth/invalid-credential': 'Invalid email or password',
    'auth/too-many-requests': 'Too many attempts. Try again later.',
};

export default function Login() {
    const { login, loginWithGoogle } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPw, setShowPw] = useState(false);
    const [loading, setLoading] = useState(false);
    const [gLoading, setGLoading] = useState(false);
    const [error, setError] = useState('');

    async function handleSubmit(e) {
        e.preventDefault();
        if (!email || !password) { setError('All fields required'); return; }
        setLoading(true); setError('');
        try {
            await login(email, password);
            toast.success('Welcome back!');
            navigate('/');
        } catch (err) {
            setError(FIREBASE_ERRORS[err.code] || 'Login failed');
        }
        setLoading(false);
    }

    async function handleGoogle() {
        setGLoading(true); setError('');
        try {
            await loginWithGoogle();
            toast.success('Welcome!');
            navigate('/');
        } catch (err) {
            setError(FIREBASE_ERRORS[err.code] || 'Google sign-in failed');
        }
        setGLoading(false);
    }

    return (
        <div className="min-h-screen flex">
            {/* Left Panel */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-blue-700 to-teal-600 p-12 flex-col justify-between text-white">
                <div>
                    <div className="flex items-center gap-3 mb-12">
                        <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center"><Sparkles size={24} /></div>
                        <span className="text-2xl font-bold">SehatSaathi</span>
                    </div>
                    <h2 className="text-4xl font-bold mb-4 leading-tight">AI Healthcare<br />for Everyone</h2>
                    <p className="text-blue-100 text-lg mb-8 max-w-sm">Get instant medical insights in 8 Indian languages with voice support.</p>
                    <div className="space-y-4">
                        {[
                            { icon: Stethoscope, text: 'AI-powered diabetes risk assessment' },
                            { icon: Bot, text: 'Chat with AI doctor in your language' },
                            { icon: Shield, text: 'ML-backed disease prediction' },
                        ].map((f, i) => (
                            <div key={i} className="flex items-center gap-3 text-blue-100">
                                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center"><f.icon size={18} /></div>
                                <span className="text-sm">{f.text}</span>
                            </div>
                        ))}
                    </div>
                </div>
                <p className="text-blue-200 text-xs">© 2025 SehatSaathi — AI Health Companion</p>
            </div>

            {/* Right Panel */}
            <div className="flex-1 flex items-center justify-center p-6">
                <div className="w-full max-w-md">
                    <div className="lg:hidden flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-teal-500 flex items-center justify-center text-white"><Sparkles size={18} /></div>
                        <span className="text-xl font-bold text-gray-900">SehatSaathi</span>
                    </div>

                    <h1 className="text-2xl font-bold text-gray-900 mb-1">Welcome back</h1>
                    <p className="text-gray-500 text-sm mb-6">Sign in to your health dashboard</p>

                    {/* Google */}
                    <button onClick={handleGoogle} disabled={gLoading}
                        className="w-full py-3 rounded-xl border-2 border-gray-200 bg-white font-semibold text-gray-700 flex items-center justify-center gap-3 hover:bg-gray-50 hover:border-gray-300 transition-all mb-4 disabled:opacity-50">
                        {gLoading ? <Loader2 size={18} className="animate-spin" /> : (
                            <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" /><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" /><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" /><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" /></svg>
                        )} Continue with Google
                    </button>

                    <div className="flex items-center gap-3 my-4">
                        <div className="flex-1 h-px bg-gray-200" />
                        <span className="text-xs text-gray-400 font-medium">or</span>
                        <div className="flex-1 h-px bg-gray-200" />
                    </div>

                    {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="relative">
                            <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                                placeholder="Email address"
                                className="w-full py-3 pl-11 pr-4 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all" />
                        </div>
                        <div className="relative">
                            <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                                placeholder="Password"
                                className="w-full py-3 pl-11 pr-12 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all" />
                            <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>

                        <div className="flex justify-end">
                            <Link to="/forgot-password" className="text-sm text-blue-600 hover:text-blue-800 font-medium">Forgot password?</Link>
                        </div>

                        <button type="submit" disabled={loading}
                            className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold shadow-lg shadow-blue-500/20 hover:shadow-xl disabled:opacity-50 flex items-center justify-center gap-2 transition-all">
                            {loading ? <Loader2 size={18} className="animate-spin" /> : null} Sign In
                        </button>
                    </form>

                    <p className="text-center text-sm text-gray-500 mt-6">
                        Don't have an account? <Link to="/register" className="text-blue-600 font-semibold hover:text-blue-800">Sign Up</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
