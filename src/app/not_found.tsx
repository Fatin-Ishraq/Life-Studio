'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { MoveLeft, Zap, Orbit } from 'lucide-react';

export default function NotFound() {
    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex flex-col items-center justify-center p-6 text-center select-none overflow-hidden relative">
            {/* Background Decorations */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/5 blur-[120px] rounded-full animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-500/5 blur-[120px] rounded-full animate-pulse delay-1000" />

                {/* Orbital lines decoration */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] dark:opacity-[0.05]">
                    <Orbit className="w-[600px] h-[600px] animate-spin-slow" />
                </div>
            </div>

            {/* Logo */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-12 relative"
            >
                <div className="w-16 h-16 rounded-[24px] bg-neutral-900 dark:bg-white flex items-center justify-center shadow-2xl relative z-10">
                    <Zap className="h-8 w-8 text-white dark:text-neutral-900" />
                </div>
                <div className="absolute inset-0 bg-neutral-900 dark:bg-white blur-xl opacity-20 scale-110" />
            </motion.div>

            {/* 404 Text */}
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="relative"
            >
                <h1 className="text-[180px] font-black text-neutral-900 dark:text-white leading-none tracking-tighter opacity-[0.03] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap">
                    SYSTEM 404
                </h1>
                <h2 className="text-8xl font-black text-neutral-900 dark:text-white relative z-10 tracking-[ -0.05em]">
                    404
                </h2>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mt-6 max-w-sm"
            >
                <p className="text-xl font-bold text-neutral-900 dark:text-white mb-3">
                    Signal Lost.
                </p>
                <p className="text-neutral-500 dark:text-neutral-400 font-medium leading-relaxed">
                    This coordinate hasn't been mapped in the Cockpit yet. The system is still in active development.
                </p>
            </motion.div>

            {/* Action Button */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-12"
            >
                <Link
                    href="/dashboard"
                    className="group flex items-center gap-3 px-8 py-4 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-2xl font-black text-sm uppercase tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all"
                >
                    <MoveLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    Back to Command
                </Link>
            </motion.div>

            {/* Footer Tag */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.4 }}
                transition={{ delay: 0.5 }}
                className="absolute bottom-12"
            >
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-neutral-500">
                    Cockpit Core Integration v0.4
                </p>
            </motion.div>
        </div>
    );
}
