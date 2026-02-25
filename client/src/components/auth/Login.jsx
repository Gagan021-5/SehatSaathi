import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Loader2, Lock, LogIn, Mail, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import Card from '../common/Card';
import PageTransition from '../common/PageTransition';
import ServiceOfflineBanner from '../common/ServiceOfflineBanner';

const firebaseErrors = {
    'auth/invalid-email': 'Invalid email address.',
    'auth/user-disabled': 'Account disabled.',
    'auth/user-not-found': 'No account found for this email.',
    'auth/wrong-password': 'Incorrect password.',
    'auth/invalid-credential': 'Invalid email or password.',
    'auth/too-many-requests': 'Too many attempts. Try again later.',
    'auth/unauthorized-domain': 'This domain is not authorized in Firebase Auth.',
    'auth/operation-not-allowed': 'Google sign-in is not enabled in Firebase.',
    'auth/popup-blocked': 'Popup blocked by browser settings.',
    'auth/popup-closed-by-user': 'Popup closed before login completed.',
};

export default function Login() {
    const { login, loginWithGoogle } = useAuth();
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [error, setError] = useState('');
    const [serverError, setServerError] = useState('');

    async function checkBackendReachable() {
        await api.get('/health-check');
    }

    async function handleSubmit(event) {
        event.preventDefault();
        if (!email || !password) {
            setError('Email and password are required.');
            return;
        }
        setLoading(true);
        setError('');
        setServerError('');

        try {
            await checkBackendReachable();
            await login(email, password);
            toast.success('Signed in successfully.');
            navigate('/');
        } catch (err) {
            if (err?.code === 'ERR_NETWORK') {
                setServerError('Service Offline: backend is not reachable. Please try again later.');
            } else {
                setError(firebaseErrors[err.code] || 'Login failed. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    }

    async function handleGoogleLogin() {
        setGoogleLoading(true);
        setError('');
        setServerError('');
        try {
            await checkBackendReachable();
            await loginWithGoogle();
            toast.success('Continuing with Google sign-in...');
            navigate('/');
        } catch (err) {
            if (err?.code === 'ERR_NETWORK') {
                setServerError('Service Offline: backend is not reachable. Please try again later.');
            } else {
                setError(firebaseErrors[err.code] || err.message || 'Google sign-in failed.');
            }
        } finally {
            setGoogleLoading(false);
        }
    }

    return (
        <PageTransition className="min-h-screen bg-zinc-50 p-4 grid place-items-center">
            <div className="w-full max-w-md space-y-4">
                {serverError && <ServiceOfflineBanner message={serverError} />}

                <Card className="p-6 md:p-7">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="h-11 w-11 rounded-2xl bg-gradient-to-r from-blue-600 to-teal-500 text-white shadow-lg shadow-blue-500/20 grid place-items-center">
                            <Shield size={18} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Sign In</h1>
                            <p className="text-sm text-zinc-500 leading-relaxed">
                                Access your medical dashboard securely.
                            </p>
                        </div>
                    </div>

                    {error && (
                        <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                            {error}
                        </div>
                    )}

                    <button
                        type="button"
                        onClick={handleGoogleLogin}
                        disabled={googleLoading}
                        className="w-full rounded-lg border border-zinc-200/70 bg-white/90 backdrop-blur-xl px-4 py-3 text-sm font-medium text-zinc-700 shadow-lg shadow-zinc-200/30 hover:bg-white disabled:opacity-50 inline-flex items-center justify-center gap-2 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/10 active:translate-y-0 active:scale-95"
                    >
                        {googleLoading ? <Loader2 size={16} className="animate-spin" /> : <LogIn size={16} />}
                        Continue with Google
                    </button>

                    <div className="my-4 h-px bg-zinc-200" />

                    <form onSubmit={handleSubmit} className="space-y-3">
                        <div className="relative">
                            <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                            <input
                                type="email"
                                value={email}
                                onChange={(event) => setEmail(event.target.value)}
                                placeholder="Email address"
                                className="w-full pl-10"
                            />
                        </div>
                        <div className="relative">
                            <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(event) => setPassword(event.target.value)}
                                placeholder="Password"
                                className="w-full pl-10 pr-11"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword((prev) => !prev)}
                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 transition-all duration-300 ease-out hover:text-zinc-500"
                            >
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                        <div className="text-right">
                            <Link to="/forgot-password" className="text-sm text-blue-600 hover:text-blue-700 transition-all duration-300 ease-out">
                                Forgot password?
                            </Link>
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full rounded-lg bg-gradient-to-r from-blue-600 to-teal-500 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 disabled:opacity-50 inline-flex items-center justify-center gap-2 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/30 active:translate-y-0 active:scale-95"
                        >
                            {loading ? <Loader2 size={16} className="animate-spin" /> : <LogIn size={16} />}
                            Sign In
                        </button>
                    </form>
                </Card>

                <p className="text-center text-sm text-zinc-500">
                    Need an account?{' '}
                    <Link to="/register" className="text-blue-600 font-semibold hover:text-blue-700 transition-all duration-300 ease-out">
                        Register
                    </Link>
                </p>
            </div>
        </PageTransition>
    );
}



