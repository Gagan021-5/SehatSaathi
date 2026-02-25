import { AlertTriangle } from 'lucide-react';

export default function ServiceOfflineBanner({ message = 'Service is temporarily offline. Please try again shortly.' }) {
    return (
        <div className="rounded-xl border border-rose-200 bg-rose-50/90 px-4 py-3 text-rose-700 shadow-lg shadow-rose-500/10 backdrop-blur-xl flex items-start gap-2 transition-all duration-300 ease-out">
            <AlertTriangle size={18} className="mt-0.5 shrink-0" />
            <p className="text-sm leading-relaxed">{message}</p>
        </div>
    );
}
