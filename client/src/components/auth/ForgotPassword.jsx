import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, CheckCircle2, Loader2, Mail } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Card from '../common/Card';
import PageTransition from '../common/PageTransition';

export default function ForgotPassword() {
    const { resetPassword } = useAuth();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState('');

    async function handleSubmit(event) {
        event.preventDefault();
        if (!email) {
            setError('Email is required.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            await resetPassword(email);
            setSent(true);
            toast.success('Password reset email sent.');
        } catch (err) {
            setError(
                err?.code === 'auth/user-not-found'
                    ? 'No account exists with this email.'
                    : 'Unable to send reset email right now.'
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <PageTransition className="min-h-screen bg-zinc-50 p-4 grid place-items-center">
            <div className="w-full max-w-md">
                <Card className="p-6 md:p-7">
                    {!sent ? (
                        <>
                            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Reset Password</h1>
                            <p className="mt-1 text-sm text-zinc-500 leading-relaxed">
                                Enter your email to receive a secure reset link.
                            </p>

                            {error && (
                                <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="mt-4 space-y-3">
                                <div className="relative">
                                    <Mail
                                        size={16}
                                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
                                    />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(event) => setEmail(event.target.value)}
                                        placeholder="Email address"
                                        className="w-full pl-10"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full rounded-lg bg-gradient-to-r from-blue-600 to-teal-500 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 disabled:opacity-50 inline-flex items-center justify-center gap-2 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/30 active:translate-y-0 active:scale-95"
                                >
                                    {loading ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
                                    Send Reset Link
                                </button>
                            </form>
                        </>
                    ) : (
                        <div className="text-center py-4">
                            <div className="h-14 w-14 rounded-full bg-blue-50 text-blue-600 grid place-items-center mx-auto">
                                <CheckCircle2 size={24} />
                            </div>
                            <h2 className="mt-3 text-xl font-semibold tracking-tight text-zinc-900">Check Your Email</h2>
                            <p className="mt-1 text-sm text-zinc-500 leading-relaxed">
                                We sent a password reset link to <span className="font-semibold">{email}</span>.
                            </p>
                        </div>
                    )}
                </Card>

                <Link to="/login" className="mt-4 text-sm text-zinc-500 hover:text-zinc-700 inline-flex items-center gap-1 transition-all duration-300 ease-out">
                    <ArrowLeft size={14} /> Back to Sign In
                </Link>
            </div>
        </PageTransition>
    );
}


