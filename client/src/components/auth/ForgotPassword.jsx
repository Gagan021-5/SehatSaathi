import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { Mail, Loader2, CheckCircle, ArrowLeft, Sparkles } from 'lucide-react';

export default function ForgotPassword() {
    const { resetPassword } = useAuth();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState('');

    async function handleSubmit(e) {
        e.preventDefault();
        if (!email) { setError('Email required'); return; }
        setLoading(true); setError('');
        try {
            await resetPassword(email);
            setSent(true);
            toast.success('Reset email sent!');
        } catch (err) {
            setError(err.code === 'auth/user-not-found' ? 'No account with this email' : 'Failed to send reset email');
        }
        setLoading(false);
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
            <div className="w-full max-w-md">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-teal-500 flex items-center justify-center text-white"><Sparkles size={18} /></div>
                    <span className="text-xl font-bold text-gray-900">SehatSaathi</span>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-8">
                    {!sent ? (
                        <>
                            <h1 className="text-2xl font-bold text-gray-900 mb-1">Reset Password</h1>
                            <p className="text-gray-500 text-sm mb-6">Enter your email and we'll send a reset link</p>

                            {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>}

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="relative">
                                    <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email address"
                                        className="w-full py-3 pl-11 pr-4 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all" />
                                </div>
                                <button type="submit" disabled={loading}
                                    className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold shadow-lg shadow-blue-500/20 hover:shadow-xl disabled:opacity-50 flex items-center justify-center gap-2 transition-all">
                                    {loading ? <Loader2 size={18} className="animate-spin" /> : <Mail size={18} />} Send Reset Link
                                </button>
                            </form>
                        </>
                    ) : (
                        <div className="text-center py-6">
                            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4 animate-bounceIn">
                                <CheckCircle size={32} className="text-green-600" />
                            </div>
                            <h2 className="text-xl font-bold text-gray-900 mb-2">Check Your Email</h2>
                            <p className="text-gray-500 text-sm mb-4">We sent a password reset link to <strong>{email}</strong></p>
                            <p className="text-xs text-gray-400">Didn't get it? Check spam or <button onClick={() => setSent(false)} className="text-blue-600 font-medium">try again</button></p>
                        </div>
                    )}
                </div>

                <Link to="/login" className="flex items-center justify-center gap-2 mt-6 text-sm text-gray-500 hover:text-gray-700 font-medium">
                    <ArrowLeft size={16} /> Back to Sign In
                </Link>
            </div>
        </div>
    );
}
