'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { getUserPreferences, updateUserPreferences } from '@/lib/supabase/settingsService';
import type { UserPreferences } from '@/types/database';
import {
    Settings,
    User,
    Clock,
    Sun,
    Moon,
    Monitor,
    Bell,
    Archive,
    LogOut,
    Calendar,
    Palette,
    Database,
    Info,
    ExternalLink,
    Timer,
    Coffee,
    Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';

const APP_VERSION = '1.0.0';
const BUILD_DATE = '2026-01-30';

type Theme = 'light' | 'dark' | 'system';

export default function SettingsPage() {
    const router = useRouter();
    const { supabaseUser, signOut } = useAuth();
    const [prefs, setPrefs] = useState<UserPreferences | null>(null);
    const [loading, setLoading] = useState(true);
    // const [saving, setSaving] = useState(false); // Unused
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [theme, setTheme] = useState<Theme>('system');
    const [showClearConfirm, setShowClearConfirm] = useState(false);

    useEffect(() => {
        if (supabaseUser) {
            getUserPreferences(supabaseUser.id)
                .then(setPrefs)
                .finally(() => setLoading(false));
        }

        // Get current theme
        const savedTheme = localStorage.getItem('theme') as Theme | null;
        if (savedTheme) setTheme(savedTheme);
    }, [supabaseUser]);

    const handleUpdate = async (updates: Partial<UserPreferences>) => {
        if (!supabaseUser || !prefs) return;

        try {
            setSaving(true);
            const updated = await updateUserPreferences(supabaseUser.id, updates);
            setPrefs(updated);
            showMessage('Settings saved', 'success');
        } catch (error) {
            console.error('Error updating settings:', error);
            showMessage('Failed to save settings', 'error');
        } finally {
            setSaving(false);
        }
    };

    const showMessage = (text: string, type: 'success' | 'error') => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 3000);
    };

    const handleThemeChange = (newTheme: Theme) => {
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);

        if (newTheme === 'dark') {
            document.documentElement.classList.add('dark');
        } else if (newTheme === 'light') {
            document.documentElement.classList.remove('dark');
        } else {
            // System preference
            if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        }
        showMessage('Theme updated', 'success');
    };

    const handleSignOut = async () => {
        try {
            await signOut();
            router.push('/');
        } catch (error) {
            console.error('Error signing out:', error);
            showMessage('Failed to sign out', 'error');
        }
    };

    const userInitials = (supabaseUser as any)?.user_metadata?.full_name
        ?.split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2) || 'U';

    const userPhoto = (supabaseUser as any)?.user_metadata?.avatar_url;
    const userName = (supabaseUser as any)?.user_metadata?.full_name || 'User';
    const userEmail = supabaseUser?.email || '';

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="relative">
                    <div className="w-16 h-16 rounded-full border-4 border-neutral-200 dark:border-neutral-800" />
                    <div className="absolute inset-0 w-16 h-16 rounded-full border-4 border-transparent border-t-violet-500 animate-spin" />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen">
            {/* Hero Header - Full Width */}
            <div className="p-4 md:p-8 pb-0">
                <div className="relative overflow-hidden rounded-[40px] bg-gradient-to-br from-slate-500/10 via-neutral-500/5 to-transparent backdrop-blur-2xl border border-white/20 dark:border-white/10 shadow-2xl">
                    {/* Background decorations - enhanced */}
                    <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-to-br from-indigo-500/30 to-blue-600/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/4" />
                    <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-gradient-to-tr from-slate-500/20 to-gray-500/10 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/4" />
                    <div className="absolute top-1/2 left-1/2 w-[200px] h-[200px] bg-gradient-to-br from-violet-500/10 to-purple-500/5 rounded-full blur-[60px] -translate-x-1/2 -translate-y-1/2" />

                    <div className="relative z-10 p-8 md:p-10">
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-white/20 dark:bg-white/10 backdrop-blur-sm">
                                    <Settings className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-600/70 dark:text-indigo-400/70">System Configuration</span>
                            </div>
                            <h1 className="text-4xl md:text-5xl font-black text-neutral-900 dark:text-white tracking-tight">
                                Settings
                            </h1>
                            <p className="text-lg text-neutral-600 dark:text-neutral-400 font-medium max-w-md">
                                Configure your workspace and preferences.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content - Contained Width */}
            <div className="p-4 md:p-8 pt-6 space-y-6 max-w-4xl mx-auto pb-20">
                {/* Account Section */}
                <Section icon={User} title="Account" color="bg-blue-500/10 text-blue-500">
                    <div className="flex items-center gap-5">
                        {userPhoto ? (
                            <img
                                src={userPhoto}
                                alt={userName}
                                className="w-16 h-16 rounded-2xl object-cover ring-4 ring-white dark:ring-neutral-800 shadow-lg"
                            />
                        ) : (
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-xl font-black shadow-lg">
                                {userInitials}
                            </div>
                        )}
                        <div className="flex-1">
                            <h3 className="text-lg font-black text-neutral-900 dark:text-white">{userName}</h3>
                            <p className="text-sm text-neutral-500">{userEmail}</p>
                        </div>
                        <button
                            onClick={handleSignOut}
                            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 font-bold text-sm hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                        >
                            <LogOut className="w-4 h-4" />
                            Sign Out
                        </button>
                    </div>
                </Section>

                {/* Focus Timer Section */}
                <Section icon={Timer} title="Focus Timer" color="bg-orange-500/10 text-orange-500">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <SliderSetting
                            icon={Zap}
                            label="Pomodoro Duration"
                            value={prefs?.pomo_duration || 25}
                            min={15}
                            max={60}
                            unit="min"
                            onChange={(v) => handleUpdate({ pomo_duration: v })}
                        />
                        <SliderSetting
                            icon={Coffee}
                            label="Short Break"
                            value={prefs?.short_break_duration || 5}
                            min={3}
                            max={15}
                            unit="min"
                            onChange={(v) => handleUpdate({ short_break_duration: v })}
                        />
                        <SliderSetting
                            icon={Coffee}
                            label="Long Break"
                            value={prefs?.long_break_duration || 15}
                            min={10}
                            max={30}
                            unit="min"
                            onChange={(v) => handleUpdate({ long_break_duration: v })}
                        />
                        <SliderSetting
                            icon={Clock}
                            label="Deep Work"
                            value={prefs?.deep_work_duration || 50}
                            min={30}
                            max={120}
                            unit="min"
                            onChange={(v) => handleUpdate({ deep_work_duration: v })}
                        />
                    </div>
                </Section>

                {/* Day Schedule Section */}
                <Section icon={Calendar} title="Day Schedule" color="bg-emerald-500/10 text-emerald-500">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 px-1">Day Start Time</label>
                            <input
                                type="time"
                                value={prefs?.day_start_time || '06:00'}
                                onChange={(e) => handleUpdate({ day_start_time: e.target.value })}
                                className="w-full px-5 py-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 px-1">Day End Time</label>
                            <input
                                type="time"
                                value={prefs?.day_end_time || '23:00'}
                                onChange={(e) => handleUpdate({ day_end_time: e.target.value })}
                                className="w-full px-5 py-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                            />
                        </div>
                    </div>
                </Section>

                {/* Appearance Section */}
                <Section icon={Palette} title="Appearance" color="bg-violet-500/10 text-violet-500">
                    <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 px-1">Theme</label>
                        <div className="grid grid-cols-3 gap-3">
                            <ThemeButton
                                icon={Sun}
                                label="Light"
                                active={theme === 'light'}
                                onClick={() => handleThemeChange('light')}
                            />
                            <ThemeButton
                                icon={Moon}
                                label="Dark"
                                active={theme === 'dark'}
                                onClick={() => handleThemeChange('dark')}
                            />
                            <ThemeButton
                                icon={Monitor}
                                label="System"
                                active={theme === 'system'}
                                onClick={() => handleThemeChange('system')}
                            />
                        </div>
                    </div>
                </Section>

                {/* Notifications Section */}
                <Section icon={Bell} title="Notifications" color="bg-amber-500/10 text-amber-500">
                    <div className="space-y-2">
                        <ToggleSetting
                            icon={Bell}
                            label="Timer Sound"
                            description="Play sound when focus session ends"
                            value={prefs?.timer_sound ?? true}
                            onChange={(v) => handleUpdate({ timer_sound: v })}
                        />
                    </div>
                </Section>

                {/* Data & Privacy Section */}
                <Section icon={Database} title="Data & Privacy" color="bg-rose-500/10 text-rose-500">
                    <div className="space-y-4">
                        <ToggleSetting
                            icon={Archive}
                            label="Auto-Archive Captures"
                            description="Mark captures as processed after conversion"
                            value={prefs?.auto_archive_captures ?? true}
                            onChange={(v) => handleUpdate({ auto_archive_captures: v })}
                        />

                        <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800">
                            {!showClearConfirm ? (
                                <button
                                    onClick={() => setShowClearConfirm(true)}
                                    className="text-sm text-red-500 font-bold hover:text-red-600 transition-colors"
                                >
                                    Clear All Local Data
                                </button>
                            ) : (
                                <div className="flex items-center gap-4">
                                    <span className="text-sm text-red-500 font-bold">Are you sure?</span>
                                    <button
                                        onClick={() => {
                                            localStorage.clear();
                                            showMessage('Local data cleared', 'success');
                                            setShowClearConfirm(false);
                                        }}
                                        className="px-4 py-2 bg-red-500 text-white rounded-xl text-sm font-bold hover:bg-red-600 transition-colors"
                                    >
                                        Yes, Clear
                                    </button>
                                    <button
                                        onClick={() => setShowClearConfirm(false)}
                                        className="text-sm text-neutral-500 font-bold hover:text-neutral-700 dark:hover:text-neutral-300"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </Section>

                {/* About Section */}
                <Section icon={Info} title="About" color="bg-neutral-500/10 text-neutral-500">
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-black text-neutral-900 dark:text-white">Life Cockpit</h3>
                                <p className="text-sm text-neutral-500">Your personal productivity command center</p>
                            </div>
                            <div className="text-right">
                                <div className="text-2xl font-black text-neutral-900 dark:text-white">v{APP_VERSION}</div>
                                <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Build {BUILD_DATE}</div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <AboutLink label="Documentation" href="#" />
                            <AboutLink label="Support" href="#" />
                            <AboutLink label="Privacy Policy" href="#" />
                            <AboutLink label="Terms of Service" href="#" />
                        </div>

                        <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800 text-center">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">
                                © 2025 Life Cockpit. All rights reserved.
                            </p>
                        </div>
                    </div>
                </Section>
            </div>
        </div>
    );
}

// Section Component
function Section({ icon: Icon, title, color, children }: {
    icon: React.ElementType;
    title: string;
    color: string;
    children: React.ReactNode;
}) {
    return (
        <section className="bg-white dark:bg-neutral-900 rounded-[32px] border border-neutral-200 dark:border-neutral-800 p-6 md:p-8 shadow-xl">
            <div className="flex items-center gap-3 mb-6">
                <div className={cn("p-2.5 rounded-xl", color)}>
                    <Icon className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-black text-neutral-900 dark:text-white">{title}</h2>
            </div>
            {children}
        </section>
    );
}

// Slider Setting Component
function SliderSetting({ icon: Icon, label, value, min, max, unit, onChange }: {
    icon: React.ElementType;
    label: string;
    value: number;
    min: number;
    max: number;
    unit: string;
    onChange: (value: number) => void;
}) {
    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-neutral-400" />
                    <span className="text-sm font-bold text-neutral-700 dark:text-neutral-300">{label}</span>
                </div>
                <span className="text-lg font-black text-neutral-900 dark:text-white">{value}<span className="text-xs text-neutral-400 ml-1">{unit}</span></span>
            </div>
            <input
                type="range"
                min={min}
                max={max}
                value={value}
                onChange={(e) => onChange(parseInt(e.target.value))}
                className="w-full h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full appearance-none cursor-pointer accent-violet-500"
            />
            <div className="flex justify-between text-[10px] font-bold text-neutral-400">
                <span>{min}{unit}</span>
                <span>{max}{unit}</span>
            </div>
        </div>
    );
}

// Toggle Setting Component
function ToggleSetting({ icon: Icon, label, description, value, onChange }: {
    icon: React.ElementType;
    label: string;
    description: string;
    value: boolean;
    onChange: (value: boolean) => void;
}) {
    return (
        <div className="flex items-center justify-between p-4 rounded-2xl hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
            <div className="flex items-center gap-4">
                <div className="p-2 bg-neutral-100 dark:bg-neutral-800 rounded-xl">
                    <Icon className="w-4 h-4 text-neutral-500" />
                </div>
                <div>
                    <p className="text-sm font-bold text-neutral-900 dark:text-white">{label}</p>
                    <p className="text-[10px] text-neutral-500">{description}</p>
                </div>
            </div>
            <button
                onClick={() => onChange(!value)}
                className={cn(
                    "w-12 h-6 rounded-full transition-all relative",
                    value ? "bg-emerald-500" : "bg-neutral-200 dark:bg-neutral-700"
                )}
            >
                <div className={cn(
                    "w-4 h-4 bg-white rounded-full absolute top-1 transition-all shadow-sm",
                    value ? "left-7" : "left-1"
                )} />
            </button>
        </div>
    );
}

// Theme Button Component
function ThemeButton({ icon: Icon, label, active, onClick }: {
    icon: React.ElementType;
    label: string;
    active: boolean;
    onClick: () => void;
}) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all",
                active
                    ? "border-violet-500 bg-violet-50 dark:bg-violet-900/20"
                    : "border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600"
            )}
        >
            <Icon className={cn("w-6 h-6", active ? "text-violet-500" : "text-neutral-400")} />
            <span className={cn("text-sm font-bold", active ? "text-violet-600 dark:text-violet-400" : "text-neutral-500")}>{label}</span>
        </button>
    );
}

// About Link Component
function AboutLink({ label, href }: { label: string; href: string }) {
    return (
        <a
            href={href}
            className="flex items-center justify-center gap-2 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800 text-sm font-bold text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
        >
            {label}
            <ExternalLink className="w-3 h-3" />
        </a>
    );
}
