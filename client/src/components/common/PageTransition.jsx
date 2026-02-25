import { motion } from 'framer-motion';

export default function PageTransition({ className = '', children }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 22, scale: 0.992 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className={className}
        >
            {children}
        </motion.div>
    );
}
