import { motion } from 'framer-motion';

export default function Card({ as: Tag = 'div', className = '', ...props }) {
    // We use motion.div by default. If it's a routing link or special tag, we wrap it in motion()
    const Component = typeof Tag === 'string' && motion[Tag] ? motion[Tag] : motion(Tag);

    return (
        <Component
            whileHover={{ y: -5 }}
            whileTap={{ scale: 0.98 }}
            className={`rounded-[2rem] border border-white/40 bg-white/70 backdrop-blur-2xl ring-1 ring-slate-900/[0.02] shadow-2xl shadow-slate-200/50 transition-colors duration-300 ease-out hover:bg-white/90 ${className}`}
            {...props}
        />
    );
}

