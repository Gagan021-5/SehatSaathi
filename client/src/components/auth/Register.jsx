import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Loader2, Lock, Mail, ShieldPlus, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Card from '../common/Card';
import PageTransition from '../common/PageTransition';

const firebaseErrors = {
    'auth/email-already-in-use': 'Email already registered.',
    'auth/invalid-email': 'Invalid email address.',
    'auth/weak-password': 'Password is too weak.',
    'auth/unauthorized-domain': 'This domain is not authorized in Firebase Auth.',
    'auth/operation-not-allowed': 'Google sign-in is not enabled in Firebase.',
    'auth/popup-blocked': 'Popup blocked by browser settings.',
};

export default function Register() {
    const { register, loginWithGoogle } = useAuth();
    const navigate = useNavigate();

    const [form, setForm] = useState({
        name: '',
        email: '',
        password: '',
        confirm: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [error, setError] = useState('');

    const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

    async function handleSubmit(event) {
        event.preventDefault();
        if (!form.name || !form.email || !form.password) {
            setError('Name, email, and password are required.');
            return;
        }
        if (form.password !== form.confirm) {
            setError('Passwords do not match.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            await register(form.email, form.password, form.name);
            toast.success('Account created successfully.');
            navigate('/');
        } catch (err) {
            setError(firebaseErrors[err.code] || err.message || 'Registration failed.');
        } finally {
            setLoading(false);
        }
    }

    async function handleGoogle() {
        setGoogleLoading(true);
        setError('');
        try {
            await loginWithGoogle();
            toast.success('Continuing with Google sign-in...');
            navigate('/');
        } catch (err) {
            setError(firebaseErrors[err.code] || err.message || 'Google sign-in failed.');
        } finally {
            setGoogleLoading(false);
        }
    }

    return (
        <PageTransition className="min-h-screen bg-zinc-50 p-4 grid place-items-center">
            <div className="w-full max-w-md">
                <Card className="p-6 md:p-7">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="h-11 w-11 rounded-2xl bg-gradient-to-r from-blue-600 to-teal-500 text-white shadow-lg shadow-blue-500/20 grid place-items-center">
                            <ShieldPlus size={18} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Create Account</h1>
                            <p className="text-sm text-zinc-500 leading-relaxed">
                                Set up your secure medical profile.
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
                        onClick={handleGoogle}
                        disabled={googleLoading}
                        className="w-full rounded-lg border border-zinc-200/70 bg-white/90 backdrop-blur-xl px-4 py-3 text-sm font-medium text-zinc-700 shadow-lg shadow-zinc-200/30 hover:bg-white disabled:opacity-50 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/10 active:translate-y-0 active:scale-95"
                    >
                        {googleLoading ? <Loader2 size={16} className="animate-spin inline mr-2" /> : null}
                        Continue with Google
                    </button>

                    <div className="my-4 h-px bg-zinc-200" />

                    <form onSubmit={handleSubmit} className="space-y-3">
                        <div className="relative">
                            <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                            <input
                                value={form.name}
                                onChange={(event) => setField('name', event.target.value)}
                                placeholder="Full name"
                                className="w-full pl-10"
                            />
                        </div>
                        <div className="relative">
                            <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                            <input
                                type="email"
                                value={form.email}
                                onChange={(event) => setField('email', event.target.value)}
                                placeholder="Email address"
                                className="w-full pl-10"
                            />
                        </div>
                        <div className="relative">
                            <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={form.password}
                                onChange={(event) => setField('password', event.target.value)}
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
                        <div className="relative">
                            <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                            <input
                                type="password"
                                value={form.confirm}
                                onChange={(event) => setField('confirm', event.target.value)}
                                placeholder="Confirm password"
                                className="w-full pl-10"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full rounded-lg bg-gradient-to-r from-blue-600 to-teal-500 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 disabled:opacity-50 inline-flex items-center justify-center gap-2 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/30 active:translate-y-0 active:scale-95"
                        >
                            {loading ? <Loader2 size={16} className="animate-spin" /> : <ShieldPlus size={16} />}
                            Create Account
                        </button>
                    </form>
                </Card>

                <p className="mt-4 text-center text-sm text-zinc-500">
                    Already have an account?{' '}
                    <Link to="/login" className="text-blue-600 font-semibold hover:text-blue-700 transition-all duration-300 ease-out">
                        Sign in
                    </Link>
                </p>
            </div>
        </PageTransition>
    );
}



