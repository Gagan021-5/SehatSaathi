import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getModelInfo } from '../services/api';
import {
    Stethoscope, Bot, Brain, FileText, Activity, Building2,
    ArrowRight, Sparkles, TrendingUp, BarChart3, Shield,
} from 'lucide-react';

const features = [
    { path: '/diabetes', icon: Stethoscope, title: 'Diabetes Check', desc: 'AI-powered diabetes risk assessment', color: 'from-blue-500 to-blue-600', badge: 'NEW' },
    { path: '/chat', icon: Bot, title: 'AI Doctor', desc: 'Chat with AI in your language', color: 'from-teal-500 to-emerald-600' },
    { path: '/predict', icon: Brain, title: 'Symptom Checker', desc: 'ML-powered disease prediction', color: 'from-purple-500 to-violet-600' },
    { path: '/prescription', icon: FileText, title: 'Prescription Scanner', desc: 'Upload & analyze prescriptions', color: 'from-orange-500 to-amber-600' },
    { path: '/health', icon: Activity, title: 'Health Records', desc: 'Track your vitals & trends', color: 'from-pink-500 to-rose-600' },
    { path: '/hospitals', icon: Building2, title: 'Find Hospitals', desc: 'Locate nearby health centers', color: 'from-cyan-500 to-sky-600' },
];

export default function Home() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [models, setModels] = useState(null);

    useEffect(() => {
        getModelInfo().then(r => setModels(r.data)).catch(() => { });
    }, []);

    const firstName = user?.name?.split(' ')[0] || 'there';

    return (
        <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
            {/* Hero */}
            <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-teal-600 rounded-2xl p-6 md:p-8 text-white animate-fadeInUp">
                <div className="flex items-start justify-between flex-wrap gap-4">
                    <div>
                        <p className="text-blue-100 text-sm mb-1">Welcome back,</p>
                        <h1 className="text-2xl md:text-3xl font-bold mb-2">Hi, {firstName}! 👋</h1>
                        <p className="text-blue-100 text-sm md:text-base max-w-lg">Your AI-powered health companion. Get instant medical insights, track your vitals, and access healthcare in 8 Indian languages.</p>
                        <button onClick={() => navigate('/diabetes')}
                            className="mt-4 px-6 py-2.5 bg-white text-blue-700 font-semibold rounded-xl text-sm hover:bg-blue-50 transition-all flex items-center gap-2 shadow-lg">
                            <Stethoscope size={18} /> Try Diabetes Assessment <ArrowRight size={16} />
                        </button>
                    </div>
                    <div className="hidden md:flex items-center gap-3">
                        <div className="w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center animate-float">
                            <Sparkles size={36} className="text-white/80" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fadeInUp delay-1">
                {[
                    { label: 'AI Models', value: '3', icon: BarChart3, color: 'text-blue-600 bg-blue-50' },
                    { label: 'Languages', value: '8', icon: Sparkles, color: 'text-teal-600 bg-teal-50' },
                    { label: 'Available', value: '24/7', icon: Shield, color: 'text-purple-600 bg-purple-50' },
                    { label: 'ML Powered', value: '97%', icon: TrendingUp, color: 'text-orange-600 bg-orange-50', sub: 'accuracy' },
                ].map((s, i) => (
                    <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-4 hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] transition-all">
                        <div className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center mb-3`}>
                            <s.icon size={20} />
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                        <p className="text-xs text-gray-500">{s.label}{s.sub ? ` ${s.sub}` : ''}</p>
                    </div>
                ))}
            </div>

            {/* Features Grid */}
            <div>
                <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {features.map((f, i) => (
                        <button key={f.path} onClick={() => navigate(f.path)}
                            className={`relative text-left bg-white rounded-2xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 transition-all duration-300 group animate-fadeInUp delay-${i + 1}`}>
                            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${f.color} flex items-center justify-center text-white mb-3 group-hover:scale-110 transition-transform`}>
                                <f.icon size={22} />
                            </div>
                            <h3 className="font-bold text-gray-900 mb-1">{f.title}</h3>
                            <p className="text-xs text-gray-500">{f.desc}</p>
                            <ArrowRight size={16} className="absolute top-5 right-5 text-gray-300 group-hover:text-gray-500 transition-colors" />
                            {f.badge && (
                                <span className="absolute top-4 right-12 px-2 py-0.5 text-[10px] font-bold bg-gradient-to-r from-blue-600 to-teal-500 text-white rounded-full">{f.badge}</span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Model Transparency */}
            {models && (
                <div className="animate-fadeInUp">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">🤖 AI Model Transparency</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {Object.entries(models).map(([name, info]) => (
                            <div key={name} className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5">
                                <h4 className="font-bold text-gray-900 capitalize mb-3">{name} Model</h4>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm"><span className="text-gray-500">Accuracy</span><span className="font-bold text-green-600">{(info.accuracy * 100).toFixed(1)}%</span></div>
                                    <div className="h-2 bg-gray-100 rounded-full"><div className="h-full bg-green-500 rounded-full" style={{ width: `${info.accuracy * 100}%` }} /></div>
                                    <div className="flex justify-between text-sm"><span className="text-gray-500">F1 Score</span><span className="font-bold text-blue-600">{(info.f1_score * 100).toFixed(1)}%</span></div>
                                    <div className="h-2 bg-gray-100 rounded-full"><div className="h-full bg-blue-500 rounded-full" style={{ width: `${info.f1_score * 100}%` }} /></div>
                                    {info.dataset_size && <p className="text-xs text-gray-400 mt-1">Trained on {info.dataset_size.toLocaleString()} samples</p>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
