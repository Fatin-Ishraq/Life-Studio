'use client';

import { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Edit2, Timer, Zap, Clock, Coffee } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth/AuthContext';
import { createSession } from '@/lib/supabase/sessionService';
import { getUserPreferences } from '@/lib/supabase/settingsService';
import type { UserPreferences } from '@/types/database';

type SessionType = 'pomodoro' | 'deep_work' | 'custom' | 'break';

interface FocusTimerProps {
    initialMinutes?: number;
    onComplete?: () => void;
}

export function FocusTimer({ initialMinutes = 25, onComplete }: FocusTimerProps) {
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

    const { supabaseUser } = useAuth();

    const audioRef = useRef<HTMLAudioElement | null>(null);

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
                    // Initial set if not custom
                    if (sessionType === 'pomodoro') setMinutes(prefs.pomo_duration);
                    if (sessionType === 'deep_work') setMinutes(prefs.deep_work_duration);
                    if (sessionType === 'break') setMinutes(prefs.short_break_duration);
                })
                .catch(err => console.error('Error loading preferences:', err));
        }
    }, [supabaseUser]);

    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (isActive) {
            interval = setInterval(() => {
                if (seconds === 0) {
                    if (minutes === 0) {
                        clearInterval(interval);
                        setIsActive(false);

                        // Log session to database (only for work sessions)
                        if (supabaseUser && startedAt && sessionType !== 'break') {
                            createSession(
                                supabaseUser.id,
                                sessionType,
                                Math.round(currentTotalSeconds / 60),
                                startedAt
                            ).catch((err: any) => console.error('Failed to log focus session:', err));
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
            // Starting or resuming? If startedAt is null, it's a fresh start
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
        pomodoro: { icon: Timer, label: 'Pomo', color: 'from-rose-500 to-orange-500' },
        deep_work: { icon: Zap, label: 'Deep', color: 'from-violet-500 to-purple-500' },
        break: { icon: Coffee, label: 'Break', color: 'from-emerald-500 to-green-500' },
        custom: { icon: Clock, label: 'Custom', color: 'from-cyan-500 to-blue-500' },
    };

    const currentConfig = SESSION_CONFIG[sessionType];

    return (
        <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-white/80 to-white/40 dark:from-neutral-800/80 dark:to-neutral-900/40 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-2xl shadow-neutral-200/50 dark:shadow-black/30 p-8 flex flex-col items-center">
            {/* Dynamic Background Glow */}
            <div
                className={cn(
                    "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 blur-[100px] rounded-full -z-10 transition-all duration-1000",
                    isActive ? "opacity-40" : "opacity-20",
                    `bg-gradient-to-br ${currentConfig.color}`
                )}
            />

            {/* Header */}
            <div className="text-center mb-6">
                <h2 className="text-sm font-black uppercase tracking-[0.3em] text-neutral-400 dark:text-neutral-500 mb-1">
                    Focus Mode
                </h2>
                <p className="text-[10px] font-bold text-neutral-300 dark:text-neutral-600 tracking-widest">
                    {sessionType === 'pomodoro' ? '25 MIN SPRINT' : sessionType === 'deep_work' ? '50 MIN DEEP DIVE' : 'CUSTOM SESSION'}
                </p>
            </div>

            {/* Timer Display */}
            <div className="relative mb-8">
                <svg className="w-56 h-56 transform -rotate-90">
                    <defs>
                        <linearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor={sessionType === 'pomodoro' ? '#f43f5e' : sessionType === 'deep_work' ? '#8b5cf6' : '#06b6d4'} />
                            <stop offset="100%" stopColor={sessionType === 'pomodoro' ? '#f97316' : sessionType === 'deep_work' ? '#a855f7' : '#3b82f6'} />
                        </linearGradient>
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
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={cn(
                        "text-6xl font-black text-neutral-900 dark:text-white tracking-tight tabular-nums",
                        isActive && "animate-pulse"
                    )}>
                        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                    </span>
                    <span className={cn(
                        "text-[10px] font-black uppercase tracking-[0.3em] mt-2 transition-colors",
                        isActive ? "text-green-500" : "text-neutral-400"
                    )}>
                        {isActive ? '● Focusing' : '○ Ready'}
                    </span>
                </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-5 mb-8">
                <button
                    onClick={resetTimer}
                    className="h-12 w-12 rounded-2xl flex items-center justify-center text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-white transition-all active:scale-95"
                    title="Reset"
                >
                    <RotateCcw className="h-5 w-5" />
                </button>

                <button
                    onClick={toggleTimer}
                    className={cn(
                        "h-20 w-20 rounded-[28px] flex items-center justify-center transition-all shadow-xl active:scale-95",
                        isActive
                            ? "bg-white dark:bg-neutral-700 border-2 border-neutral-200 dark:border-neutral-600 text-neutral-900 dark:text-white hover:bg-neutral-50 dark:hover:bg-neutral-600 shadow-neutral-200 dark:shadow-black/20"
                            : `bg-gradient-to-br ${currentConfig.color} text-white hover:shadow-2xl`
                    )}
                >
                    {isActive ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8 ml-1" />}
                </button>

                <button
                    onClick={() => setSoundEnabled(!soundEnabled)}
                    className={cn(
                        "h-12 w-12 rounded-2xl flex items-center justify-center transition-all active:scale-95",
                        soundEnabled
                            ? "text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-white"
                            : "text-red-400 bg-red-50 dark:bg-red-900/20"
                    )}
                    title={soundEnabled ? "Sound on" : "Sound off"}
                >
                    {soundEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
                </button>
            </div>

            {/* Session Types */}
            <div className="flex flex-col items-center gap-4 w-full">
                <div className="flex bg-neutral-100/50 dark:bg-neutral-800/50 p-1.5 rounded-2xl w-full max-w-[340px] backdrop-blur-sm">
                    {(['pomodoro', 'deep_work', 'break', 'custom'] as const).map((type) => {
                        const config = SESSION_CONFIG[type];
                        const Icon = config.icon;
                        const isActive = sessionType === type;
                        return (
                            <button
                                key={type}
                                onClick={() => handleTypeChange(type)}
                                className={cn(
                                    "flex-1 flex items-center justify-center gap-1.5 px-1 py-3 rounded-xl text-[10px] font-bold uppercase tracking-tight transition-all",
                                    isActive
                                        ? "bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-lg shadow-neutral-100 dark:shadow-black/20"
                                        : "text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
                                )}
                            >
                                <Icon className="h-4 w-4" />
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
                                className="flex items-center gap-2 text-sm font-bold text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors px-4 py-2 bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-100 dark:border-neutral-700 shadow-sm hover:shadow-md dark:shadow-black/20"
                            >
                                <Edit2 className="h-4 w-4" />
                                {getCustomTimeDisplay()}
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
