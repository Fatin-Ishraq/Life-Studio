'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Edit2, Timer, Zap, Clock, Coffee, Minimize2, Maximize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth/AuthContext';
import { createSession } from '@/lib/supabase/sessionService';
import { getUserPreferences } from '@/lib/supabase/settingsService';
import type { UserPreferences } from '@/types/database';

type SessionType = 'pomodoro' | 'deep_work' | 'custom' | 'break';

interface FocusTimerProps {
    initialMinutes?: number;
    onComplete?: () => void;
    showAmbientMode?: boolean;
}

// Pre-generate particle positions to avoid Math.random during render
interface ParticlePosition {
    left: number;
    top: number;
    duration: number;
    delay: number;
}

function generateParticles(count: number, spread: { min: number; max: number }): ParticlePosition[] {
    const range = spread.max - spread.min;
    return Array.from({ length: count }, () => ({
        left: spread.min + Math.random() * range,
        top: spread.min + Math.random() * range,
        duration: 8 + Math.random() * 12,
        delay: Math.random() * 5,
    }));
}

export function FocusTimer({ initialMinutes = 25, onComplete, showAmbientMode }: FocusTimerProps) {
    const [minutes, setMinutes] = useState(initialMinutes);
    const [seconds, setSeconds] = useState(0);
    const [customHours, setCustomHours] = useState(0);
    const [customMinutes, setCustomMinutes] = useState(25);
    const [customSeconds, setCustomSeconds] = useState(0);
    const [isActive, setIsActive] = useState(false);
    const [sessionType, setSessionType] = useState<SessionType>('pomodoro');
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [isEditingCustom, setIsEditingCustom] = useState(false);
    const [startedAt, setStartedAt] = useState<string | null>(null);
    const [preferences, setPreferences] = useState<UserPreferences | null>(null);
    const [isAmbientMode, setIsAmbientMode] = useState(false);

    const { supabaseUser } = useAuth();
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Pre-generate particle positions using useMemo
    const ambientParticles = useMemo(() => generateParticles(20, { min: 0, max: 100 }), []);
    const timerParticles = useMemo(() => generateParticles(8, { min: 20, max: 80 }), []);

    const currentTotalSeconds = sessionType === 'pomodoro'
        ? (preferences?.pomo_duration || 25) * 60
        : sessionType === 'deep_work'
            ? (preferences?.deep_work_duration || 50) * 60
            : sessionType === 'break'
                ? (preferences?.short_break_duration || 5) * 60
                : customHours * 3600 + customMinutes * 60 + customSeconds;
    const remainingSeconds = minutes * 60 + seconds;

    useEffect(() => {
        const audio = new Audio('/sounds/bell.mp3');
        audio.volume = 0.7;
        audioRef.current = audio;

        if (supabaseUser) {
            getUserPreferences(supabaseUser.id)
                .then(prefs => {
                    setPreferences(prefs);
                    setSoundEnabled(prefs.timer_sound);
                    if (sessionType === 'pomodoro') setMinutes(prefs.pomo_duration);
                    if (sessionType === 'deep_work') setMinutes(prefs.deep_work_duration);
                    if (sessionType === 'break') setMinutes(prefs.short_break_duration);
                })
                .catch(err => console.error('Error loading preferences:', err));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [supabaseUser]);

    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (isActive) {
            interval = setInterval(() => {
                if (seconds === 0) {
                    if (minutes === 0) {
                        clearInterval(interval);
                        setIsActive(false);
                        setIsAmbientMode(false);

                        if (supabaseUser && startedAt && sessionType !== 'break') {
                            createSession(
                                supabaseUser.id,
                                sessionType,
                                Math.round(currentTotalSeconds / 60),
                                startedAt
                            ).catch((err: Error) => console.error('Failed to log focus session:', err));
                        }

                        if (soundEnabled && audioRef.current) {
                            const playPromise = audioRef.current.play();
                            if (playPromise !== undefined) {
                                playPromise.catch(error => {
                                    console.error("Audio playback failed:", error);
                                });
                            }
                        }

                        onComplete?.();
                    } else {
                        setMinutes(prev => prev - 1);
                        setSeconds(59);
                    }
                } else {
                    setSeconds(prev => prev - 1);
                }
            }, 1000);
        }

        return () => clearInterval(interval);
    }, [isActive, minutes, seconds, onComplete, soundEnabled, supabaseUser, startedAt, sessionType, currentTotalSeconds]);

    const toggleTimer = () => {
        if (!isActive && remainingSeconds > 0) {
            if (!startedAt) {
                setStartedAt(new Date().toISOString());
            }
        }
        setIsActive(!isActive);
    };

    const resetTimer = () => {
        setIsActive(false);
        setSeconds(0);
        setStartedAt(null);
        setIsAmbientMode(false);
        if (sessionType === 'pomodoro') setMinutes(preferences?.pomo_duration || 25);
        else if (sessionType === 'deep_work') setMinutes(preferences?.deep_work_duration || 50);
        else if (sessionType === 'break') setMinutes(preferences?.short_break_duration || 5);
        else {
            const totalSeconds = customHours * 3600 + customMinutes * 60 + customSeconds;
            setMinutes(Math.floor(totalSeconds / 60));
            setSeconds(totalSeconds % 60);
        }
    };

    const handleTypeChange = (type: SessionType) => {
        setSessionType(type);
        setIsActive(false);
        setSeconds(0);
        setStartedAt(null);
        if (type === 'pomodoro') setMinutes(preferences?.pomo_duration || 25);
        else if (type === 'deep_work') setMinutes(preferences?.deep_work_duration || 50);
        else if (type === 'break') setMinutes(preferences?.short_break_duration || 5);
        else {
            const totalSeconds = customHours * 3600 + customMinutes * 60 + customSeconds;
            setMinutes(Math.floor(totalSeconds / 60));
            setSeconds(totalSeconds % 60);
        }
    };

    const handleCustomTimeSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsEditingCustom(false);
        if (sessionType === 'custom') {
            const totalSeconds = customHours * 3600 + customMinutes * 60 + customSeconds;
            setMinutes(Math.floor(totalSeconds / 60));
            setSeconds(totalSeconds % 60);
            setIsActive(false);
        }
    };

    const progress = currentTotalSeconds > 0 ? ((currentTotalSeconds - remainingSeconds) / currentTotalSeconds) * 100 : 100;
    const radius = 100;
    const circumference = 2 * Math.PI * radius;

    const getCustomTimeDisplay = () => {
        const parts = [];
        if (customHours > 0) parts.push(`${customHours}h`);
        if (customMinutes > 0) parts.push(`${customMinutes}m`);
        if (customSeconds > 0) parts.push(`${customSeconds}s`);
        return parts.length > 0 ? parts.join(' ') : '0m';
    };

    const SESSION_CONFIG = {
        pomodoro: { icon: Timer, label: 'Pomo', color: 'from-rose-500 to-orange-500', bgGlow: 'rose' },
        deep_work: { icon: Zap, label: 'Deep', color: 'from-violet-500 to-purple-500', bgGlow: 'violet' },
        break: { icon: Coffee, label: 'Break', color: 'from-emerald-500 to-green-500', bgGlow: 'emerald' },
        custom: { icon: Clock, label: 'Custom', color: 'from-cyan-500 to-blue-500', bgGlow: 'cyan' },
    };

    const currentConfig = SESSION_CONFIG[sessionType];

    // Ambient Mode - Full screen minimal UI
    if (isAmbientMode && isActive) {
        return (
            <div
                className="fixed inset-0 z-50 flex flex-col items-center justify-center cursor-pointer"
                onClick={() => setIsAmbientMode(false)}
            >
                {/* Dynamic gradient background */}
                <div className={cn(
                    "absolute inset-0 transition-all duration-1000",
                    sessionType === 'pomodoro' && "bg-gradient-to-br from-rose-950 via-neutral-950 to-orange-950",
                    sessionType === 'deep_work' && "bg-gradient-to-br from-violet-950 via-neutral-950 to-purple-950",
                    sessionType === 'break' && "bg-gradient-to-br from-emerald-950 via-neutral-950 to-green-950",
                    sessionType === 'custom' && "bg-gradient-to-br from-cyan-950 via-neutral-950 to-blue-950"
                )} />

                {/* Floating particles */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    {ambientParticles.map((particle, i) => (
                        <div
                            key={i}
                            className={cn(
                                "absolute w-1 h-1 rounded-full opacity-30 animate-particle-float",
                                sessionType === 'pomodoro' && "bg-rose-400",
                                sessionType === 'deep_work' && "bg-violet-400",
                                sessionType === 'break' && "bg-emerald-400",
                                sessionType === 'custom' && "bg-cyan-400"
                            )}
                            style={{
                                left: `${particle.left}%`,
                                top: `${particle.top}%`,
                                animationDuration: `${10 + particle.duration}s`,
                                animationDelay: `${particle.delay}s`
                            }}
                        />
                    ))}
                </div>

                {/* Breathing glow ring */}
                <div className={cn(
                    "absolute w-[400px] h-[400px] rounded-full blur-[100px] opacity-20",
                    "animate-breathe",
                    sessionType === 'pomodoro' && "bg-rose-500",
                    sessionType === 'deep_work' && "bg-violet-500",
                    sessionType === 'break' && "bg-emerald-500",
                    sessionType === 'custom' && "bg-cyan-500"
                )} />

                {/* Timer display */}
                <div className="relative z-10 text-center">
                    <div className={cn(
                        "text-[120px] md:text-[180px] font-black tracking-tight tabular-nums leading-none",
                        "bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent",
                        "animate-pulse-subtle"
                    )}>
                        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                    </div>
                    <div className="mt-4 flex items-center justify-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-sm font-bold uppercase tracking-[0.3em] text-white/50">
                            Focusing
                        </span>
                    </div>
                </div>

                {/* Minimal controls */}
                <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-4 z-10">
                    <button
                        onClick={(e) => { e.stopPropagation(); toggleTimer(); }}
                        className="p-4 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition-all"
                        title="Pause timer"
                    >
                        <Pause className="w-6 h-6" />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); setIsAmbientMode(false); }}
                        className="p-4 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition-all"
                        title="Exit ambient mode"
                    >
                        <Minimize2 className="w-6 h-6" />
                    </button>
                </div>

                {/* Click hint */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-white/30 font-medium">
                    Click anywhere to exit ambient mode
                </div>

                {/* CSS for animations */}
                <style jsx>{`
                    @keyframes particle-float {
                        0%, 100% { transform: translateY(0px) translateX(0px); }
                        25% { transform: translateY(-20px) translateX(10px); }
                        50% { transform: translateY(-10px) translateX(-10px); }
                        75% { transform: translateY(-30px) translateX(5px); }
                    }
                    @keyframes breathe {
                        0%, 100% { transform: scale(1); opacity: 0.2; }
                        50% { transform: scale(1.1); opacity: 0.3; }
                    }
                    @keyframes pulse-subtle {
                        0%, 100% { opacity: 1; }
                        50% { opacity: 0.9; }
                    }
                    .animate-breathe {
                        animation: breathe 4s ease-in-out infinite;
                    }
                    .animate-pulse-subtle {
                        animation: pulse-subtle 2s ease-in-out infinite;
                    }
                    .animate-particle-float {
                        animation: particle-float 10s ease-in-out infinite;
                    }
                `}</style>
            </div>
        );
    }

    return (
        <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-white/80 to-white/40 dark:from-neutral-800/80 dark:to-neutral-900/40 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-2xl shadow-neutral-200/50 dark:shadow-black/30 p-8 flex flex-col items-center">
            {/* Dynamic Background Glow with breathing effect */}
            <div
                className={cn(
                    "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 blur-[100px] rounded-full -z-10 transition-all duration-1000",
                    isActive ? "opacity-40 animate-breathe-subtle" : "opacity-20",
                    `bg-gradient-to-br ${currentConfig.color}`
                )}
            />

            {/* Floating particles when active */}
            {isActive && (
                <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-[32px]">
                    {timerParticles.map((particle, i) => (
                        <div
                            key={i}
                            className={cn(
                                "absolute w-1.5 h-1.5 rounded-full opacity-20 animate-particle-float-small",
                                sessionType === 'pomodoro' && "bg-rose-400",
                                sessionType === 'deep_work' && "bg-violet-400",
                                sessionType === 'break' && "bg-emerald-400",
                                sessionType === 'custom' && "bg-cyan-400"
                            )}
                            style={{
                                left: `${particle.left}%`,
                                top: `${particle.top}%`,
                                animationDuration: `${particle.duration}s`,
                                animationDelay: `${particle.delay}s`
                            }}
                        />
                    ))}
                </div>
            )}

            {/* Header */}
            <div className="text-center mb-6">
                <h2 className="text-sm font-black uppercase tracking-[0.3em] text-neutral-400 dark:text-neutral-500 mb-1">
                    Focus Mode
                </h2>
                <p className="text-[10px] font-bold text-neutral-300 dark:text-neutral-600 tracking-widest">
                    {sessionType === 'pomodoro' ? '25 MIN SPRINT' : sessionType === 'deep_work' ? '50 MIN DEEP DIVE' : sessionType === 'break' ? 'RECOVERY TIME' : 'CUSTOM SESSION'}
                </p>
            </div>

            {/* Timer Display with breathing ring */}
            <div className="relative mb-8">
                {/* Outer breathing glow when active */}
                {isActive && (
                    <div
                        className={cn(
                            "absolute inset-[-20px] rounded-full animate-breathe-ring",
                            sessionType === 'pomodoro' && "bg-rose-500/10",
                            sessionType === 'deep_work' && "bg-violet-500/10",
                            sessionType === 'break' && "bg-emerald-500/10",
                            sessionType === 'custom' && "bg-cyan-500/10"
                        )}
                    />
                )}

                <svg className="w-56 h-56 transform -rotate-90 relative z-10">
                    <defs>
                        <linearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor={sessionType === 'pomodoro' ? '#f43f5e' : sessionType === 'deep_work' ? '#8b5cf6' : sessionType === 'break' ? '#10b981' : '#06b6d4'} />
                            <stop offset="100%" stopColor={sessionType === 'pomodoro' ? '#f97316' : sessionType === 'deep_work' ? '#a855f7' : sessionType === 'break' ? '#22c55e' : '#3b82f6'} />
                        </linearGradient>
                        {/* Glow filter */}
                        <filter id="glow">
                            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                            <feMerge>
                                <feMergeNode in="coloredBlur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                    </defs>
                    <circle
                        cx="112"
                        cy="112"
                        r="100"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="transparent"
                        className="text-neutral-100 dark:text-neutral-800"
                    />
                    <circle
                        cx="112"
                        cy="112"
                        r="100"
                        stroke="url(#timerGradient)"
                        strokeWidth="8"
                        fill="transparent"
                        className="transition-all duration-1000 ease-linear"
                        strokeDasharray={circumference}
                        strokeDashoffset={circumference - (progress / 100) * circumference}
                        strokeLinecap="round"
                        filter={isActive ? "url(#glow)" : ""}
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
                    <span className={cn(
                        "text-6xl font-black text-neutral-900 dark:text-white tracking-tight tabular-nums transition-all",
                        isActive && "animate-pulse-subtle"
                    )}>
                        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                    </span>
                    <span className={cn(
                        "text-[10px] font-black uppercase tracking-[0.3em] mt-2 transition-colors flex items-center gap-1.5",
                        isActive ? "text-green-500" : "text-neutral-400"
                    )}>
                        <span className={cn(
                            "w-1.5 h-1.5 rounded-full",
                            isActive ? "bg-green-500 animate-pulse" : "bg-neutral-400"
                        )} />
                        {isActive ? 'Focusing' : 'Ready'}
                    </span>
                </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-5 mb-8">
                <button
                    onClick={resetTimer}
                    className="h-12 w-12 rounded-2xl flex items-center justify-center text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-white transition-all active:scale-95 hover:scale-105"
                    title="Reset timer"
                >
                    <RotateCcw className="h-5 w-5" />
                </button>

                <button
                    onClick={toggleTimer}
                    className={cn(
                        "h-20 w-20 rounded-[28px] flex items-center justify-center transition-all shadow-xl active:scale-95 hover:scale-105",
                        isActive
                            ? "bg-white dark:bg-neutral-700 border-2 border-neutral-200 dark:border-neutral-600 text-neutral-900 dark:text-white hover:bg-neutral-50 dark:hover:bg-neutral-600 shadow-neutral-200 dark:shadow-black/20"
                            : `bg-gradient-to-br ${currentConfig.color} text-white hover:shadow-2xl`
                    )}
                    title={isActive ? "Pause timer" : "Start timer"}
                >
                    {isActive ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8 ml-1" />}
                </button>

                <button
                    onClick={() => setSoundEnabled(!soundEnabled)}
                    className={cn(
                        "h-12 w-12 rounded-2xl flex items-center justify-center transition-all active:scale-95 hover:scale-105",
                        soundEnabled
                            ? "text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-white"
                            : "text-red-400 bg-red-50 dark:bg-red-900/20"
                    )}
                    title={soundEnabled ? "Sound on - click to mute" : "Sound off - click to unmute"}
                >
                    {soundEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
                </button>
            </div>

            {/* Ambient Mode Toggle (when timer is running) */}
{isActive && showAmbientMode !== false && (
                <button
                    onClick={() => setIsAmbientMode(true)}
                    className="mb-6 flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-all text-sm font-bold"
                    title="Enter full-screen ambient mode"
                >
                    <Maximize2 className="w-4 h-4" />
                    Enter Ambient Mode
                </button>
            )}

            {/* Session Types */}
            <div className="flex flex-col items-center gap-4 w-full">
                <div className="flex bg-neutral-100/50 dark:bg-neutral-800/50 p-1.5 rounded-2xl w-full max-w-[340px] backdrop-blur-sm">
                    {(['pomodoro', 'deep_work', 'break', 'custom'] as const).map((type) => {
                        const config = SESSION_CONFIG[type];
                        const Icon = config.icon;
                        const isActiveType = sessionType === type;
                        return (
                            <button
                                key={type}
                                onClick={() => handleTypeChange(type)}
                                title={`Switch to ${config.label} mode`}
                                className={cn(
                                    "flex-1 flex items-center justify-center gap-1.5 px-1 py-3 rounded-xl text-[10px] font-bold uppercase tracking-tight transition-all",
                                    isActiveType
                                        ? "bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-lg shadow-neutral-100 dark:shadow-black/20 scale-105"
                                        : "text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:scale-102"
                                )}
                            >
                                <Icon className={cn("h-4 w-4", isActiveType && "animate-bounce-subtle")} />
                                {config.label}
                            </button>
                        );
                    })}
                </div>

                {sessionType === 'custom' && (
                    <div className="animate-fade-in">
                        {isEditingCustom ? (
                            <form onSubmit={handleCustomTimeSubmit} className="flex flex-col gap-3 p-4 bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-100 dark:border-neutral-700 shadow-lg">
                                <div className="flex items-center gap-3">
                                    {[
                                        { id: 'custom-hours', label: 'Hours', value: customHours, set: setCustomHours, max: 23 },
                                        { id: 'custom-minutes', label: 'Min', value: customMinutes, set: setCustomMinutes, max: 59 },
                                        { id: 'custom-seconds', label: 'Sec', value: customSeconds, set: setCustomSeconds, max: 59 },
                                    ].map((item) => (
                                        <div key={item.id} className="flex flex-col items-center">
                                            <label htmlFor={item.id} className="text-[9px] font-black uppercase text-neutral-400 tracking-wider mb-1">{item.label}</label>
                                            <input
                                                id={item.id}
                                                type="number"
                                                min="0"
                                                max={item.max}
                                                title={item.label}
                                                placeholder="0"
                                                value={item.value}
                                                onChange={(e) => item.set(Math.max(0, Math.min(item.max, parseInt(e.target.value) || 0)))}
                                                className="w-16 px-2 py-3 bg-neutral-50 dark:bg-neutral-700 rounded-xl border border-neutral-100 dark:border-neutral-600 text-center text-lg font-black text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-900 dark:focus:border-white transition-colors"
                                            />
                                        </div>
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    <button type="submit" className="flex-1 py-3 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-xl font-bold text-sm hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors">
                                        Confirm
                                    </button>
                                    <button type="button" onClick={() => setIsEditingCustom(false)} className="flex-1 py-3 text-neutral-500 dark:text-neutral-400 font-bold text-sm hover:text-neutral-900 dark:hover:text-white transition-colors">
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <button
                                onClick={() => setIsEditingCustom(true)}
                                className="flex items-center gap-2 text-sm font-bold text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors px-4 py-2 bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-100 dark:border-neutral-700 shadow-sm hover:shadow-md dark:shadow-black/20 hover:scale-105"
                                title="Edit custom timer duration"
                            >
                                <Edit2 className="h-4 w-4" />
                                {getCustomTimeDisplay()}
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* CSS for animations */}
            <style jsx>{`
                @keyframes particle-float-small {
                    0%, 100% { transform: translateY(0px) translateX(0px) scale(1); opacity: 0.2; }
                    25% { transform: translateY(-15px) translateX(8px) scale(1.2); opacity: 0.4; }
                    50% { transform: translateY(-8px) translateX(-8px) scale(0.8); opacity: 0.3; }
                    75% { transform: translateY(-20px) translateX(4px) scale(1.1); opacity: 0.35; }
                }
                @keyframes breathe-subtle {
                    0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.4; }
                    50% { transform: translate(-50%, -50%) scale(1.05); opacity: 0.5; }
                }
                @keyframes breathe-ring {
                    0%, 100% { transform: scale(1); opacity: 0.5; }
                    50% { transform: scale(1.08); opacity: 0.8; }
                }
                @keyframes pulse-subtle {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.85; }
                }
                @keyframes bounce-subtle {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-2px); }
                }
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(8px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-breathe-subtle {
                    animation: breathe-subtle 4s ease-in-out infinite;
                }
                .animate-breathe-ring {
                    animation: breathe-ring 3s ease-in-out infinite;
                }
                .animate-pulse-subtle {
                    animation: pulse-subtle 2s ease-in-out infinite;
                }
                .animate-bounce-subtle {
                    animation: bounce-subtle 1s ease-in-out infinite;
                }
                .animate-fade-in {
                    animation: fade-in 0.3s ease-out;
                }
                .animate-particle-float-small {
                    animation: particle-float-small 8s ease-in-out infinite;
                }
            `}</style>
        </div>
    );
}
