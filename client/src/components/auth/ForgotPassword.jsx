import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, CheckCircle2, Loader2, Mail, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
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
        <PageTransition className="min-h-screen relative flex items-center justify-center bg-[#FAFAFA] p-4 sm:p-6 overflow-hidden selection:bg-blue-100 selection:text-blue-900">
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none flex items-center justify-center">
                <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-400/20 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-teal-400/20 rounded-full blur-[120px]" />
            </div>

            <div className="w-full max-w-[420px] relative z-10">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    className="w-full bg-white/70 backdrop-blur-2xl border border-white/60 shadow-[0_8px_40px_rgb(0,0,0,0.04)] rounded-[2rem] p-8 sm:p-10"
                >
                    {!sent ? (
                        <div className="space-y-5">
                            <div className="text-center">
                                <div className="mx-auto h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-600 to-teal-500 text-white shadow-lg shadow-blue-500/20 flex items-center justify-center mb-5">
                                    <Mail size={21} strokeWidth={1.6} />
                                </div>
                                <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Reset password</h1>
                                <p className="mt-2 text-sm text-zinc-500 font-medium">
                                    Enter your email to receive a secure reset link.
                                </p>
                            </div>

                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="rounded-xl border border-red-100 bg-red-50/50 p-3 flex items-start gap-2.5 text-sm text-red-600"
                                >
                                    <span className="mt-1 block w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                                    <p>{error}</p>
                                </motion.div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-3.5">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-zinc-700 ml-1">Email</label>
                                    <div className="relative">
                                        <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(event) => setEmail(event.target.value)}
                                            placeholder="name@example.com"
                                            className="w-full h-11 pl-10 pr-4 bg-white/50 border border-zinc-200/80 rounded-xl text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full h-11 mt-4 rounded-xl bg-zinc-900 text-white text-sm font-medium shadow-md shadow-zinc-900/10 hover:bg-zinc-800 hover:shadow-lg hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-zinc-900/10 disabled:opacity-50 disabled:transform-none transition-all duration-200 flex items-center justify-center gap-2 group"
                                >
                                    {loading ? <Loader2 size={18} className="animate-spin text-zinc-400" /> : (
                                        <>
                                            Send Reset Link
                                            <ArrowRight size={16} className="text-zinc-400 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    ) : (
                        <div className="text-center py-1">
                            <div className="h-14 w-14 rounded-2xl bg-blue-50 text-blue-600 grid place-items-center mx-auto shadow-lg shadow-blue-500/10">
                                <CheckCircle2 size={24} />
                            </div>
                            <h2 className="mt-4 text-xl font-semibold tracking-tight text-zinc-900">Check your email</h2>
                            <p className="mt-2 text-sm text-zinc-500 leading-relaxed">
                                We sent a password reset link to <span className="font-semibold text-zinc-700">{email}</span>.
                            </p>
                        </div>
                    )}
                </motion.div>

                <Link
                    to="/login"
                    className="mt-5 text-sm text-zinc-500 hover:text-zinc-700 inline-flex items-center gap-1.5 transition-colors"
                >
                    <ArrowLeft size={14} /> Back to Sign In
                </Link>
            </div>
        </PageTransition>
    );
}


