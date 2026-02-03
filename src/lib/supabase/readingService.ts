import { supabase } from './client';
import type { ReadingItem } from '@/types/database';

export interface ReadingStats {
    totalItems: number;
    readingNow: number;
    completed: number;
    toRead: number;
    totalPagesRead: number;
    currentStreak: number;
    weeklyPagesRead: number;
}

export interface ReadingSession {
    id: string;
    user_id: string;
    reading_item_id: string;
    duration_minutes: number;
    pages_read: number;
    notes: string | null;
    created_at: string;
}

export interface Highlight {
    id: string;
    user_id: string;
    reading_item_id: string;
    content: string;
    page_number: number | null;
    created_at: string;
}

/**
 * Get all reading items for a user
 */
export async function getReadingItems(userId: string): Promise<ReadingItem[]> {
    const { data, error } = await supabase
        .from('reading_items')
        .select('*')
        .eq('user_id', userId)
        .order('status', { ascending: true })
        .order('updated_at', { ascending: false });

    if (error) {
        console.error('Error fetching reading items:', error);
        throw error;
    }

    return data || [];
}

/**
 * Get reading items by status
 */
export async function getReadingItemsByStatus(
    userId: string,
    status: 'to_read' | 'reading' | 'completed'
): Promise<ReadingItem[]> {
    const { data, error } = await supabase
        .from('reading_items')
        .select('*')
        .eq('user_id', userId)
        .eq('status', status)
        .order('updated_at', { ascending: false });

    if (error) {
        console.error('Error fetching reading items by status:', error);
        throw error;
    }

    return data || [];
}

/**
 * Get currently reading item (most recently updated)
 */
export async function getCurrentlyReading(userId: string): Promise<ReadingItem | null> {
    const { data, error } = await supabase
        .from('reading_items')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'reading')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error fetching currently reading:', error);
        throw error;
    }

    return data || null;
}

/**
 * Add a new reading item
 */
export async function addReadingItem(item: Omit<ReadingItem, 'id' | 'created_at' | 'updated_at'>): Promise<ReadingItem> {
    const { data, error } = await supabase
        .from('reading_items')
        .insert({
            ...item,
            progress_pages: item.progress_pages || 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        })
        .select()
        .single();

    if (error) {
        console.error('Error adding reading item:', error);
        throw error;
    }

    return data;
}

/**
 * Update a reading item
 */
export async function updateReadingItem(
    itemId: string,
    updates: Partial<ReadingItem>
): Promise<ReadingItem> {
    const { data, error } = await supabase
        .from('reading_items')
        .update({
            ...updates,
            updated_at: new Date().toISOString()
        })
        .eq('id', itemId)
        .select()
        .single();

    if (error) {
        console.error('Error updating reading item:', error);
        throw error;
    }

    return data;
}

/**
 * Update reading progress
 */
export async function updateReadingProgress(
    itemId: string,
    newPage: number
): Promise<ReadingItem> {
    const { data: item } = await supabase
        .from('reading_items')
        .select('total_pages')
        .eq('id', itemId)
        .single();

    const totalPages = item?.total_pages || 100;
    const isCompleted = newPage >= totalPages;

    const { data, error } = await supabase
        .from('reading_items')
        .update({
            progress_pages: newPage,
            status: isCompleted ? 'completed' : 'reading',
            completed_at: isCompleted ? new Date().toISOString() : null,
            updated_at: new Date().toISOString()
        })
        .eq('id', itemId)
        .select()
        .single();

    if (error) {
        console.error('Error updating reading progress:', error);
        throw error;
    }

    return data;
}

/**
 * Delete a reading item
 */
export async function deleteReadingItem(itemId: string): Promise<void> {
    const { error } = await supabase
        .from('reading_items')
        .delete()
        .eq('id', itemId);

    if (error) {
        console.error('Error deleting reading item:', error);
        throw error;
    }
}

/**
 * Get reading statistics
 */
export async function getReadingStats(userId: string): Promise<ReadingStats> {
    const { data: items, error } = await supabase
        .from('reading_items')
        .select('*')
        .eq('user_id', userId);

    if (error) {
        console.error('Error fetching reading stats:', error);
        throw error;
    }

    const readingItems = items || [];
    const completed = readingItems.filter(i => i.status === 'completed');
    const reading = readingItems.filter(i => i.status === 'reading');
    const toRead = readingItems.filter(i => i.status === 'to_read');

    // Calculate total pages read
    const totalPagesRead = readingItems.reduce((acc, item) => {
        if (item.status === 'completed' && item.total_pages) {
            return acc + item.total_pages;
        }
        return acc + (item.progress_pages || 0);
    }, 0);

    // Calculate weekly pages (last 7 days of reading sessions) - handle missing table
    let weeklyPagesRead = 0;
    let currentStreak = 0;

    try {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);

        const { data: sessions } = await supabase
            .from('reading_sessions')
            .select('pages_read')
            .eq('user_id', userId)
            .gte('created_at', weekAgo.toISOString());

        weeklyPagesRead = (sessions || []).reduce((acc, s) => acc + (s.pages_read || 0), 0);

        // Calculate reading streak
        const { data: allSessions } = await supabase
            .from('reading_sessions')
            .select('created_at')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (allSessions && allSessions.length > 0) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            const uniqueDays = new Set();
            allSessions.forEach(session => {
                const date = new Date(session.created_at);
                date.setHours(0, 0, 0, 0);
                uniqueDays.add(date.getTime());
            });

            const sortedDays = Array.from(uniqueDays).sort((a, b) => (b as number) - (a as number));
            
            for (let i = 0; i < sortedDays.length; i++) {
                const day = sortedDays[i] as number;
                const expectedDay = today.getTime() - (i * 24 * 60 * 60 * 1000);
                
                if (day === expectedDay || (i === 0 && day >= today.getTime() - 24 * 60 * 60 * 1000)) {
                    currentStreak++;
                } else {
                    break;
                }
            }
        }
    } catch {
        // Table doesn't exist yet - use fallback values
        console.warn('reading_sessions table not available, using fallback stats');
    }

    return {
        totalItems: readingItems.length,
        readingNow: reading.length,
        completed: completed.length,
        toRead: toRead.length,
        totalPagesRead,
        currentStreak,
        weeklyPagesRead
    };
}

/**
 * Log a reading session
 */
export async function logReadingSession(
    userId: string,
    readingItemId: string,
    durationMinutes: number,
    pagesRead: number
): Promise<ReadingSession | null> {
    try {
        const { data, error } = await supabase
            .from('reading_sessions')
            .insert({
                user_id: userId,
                reading_item_id: readingItemId,
                duration_minutes: durationMinutes,
                pages_read: pagesRead,
                notes: null,
                created_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) {
            if (error.code === '42P01') {
                console.warn('reading_sessions table does not exist yet');
                // Still update reading progress
                const { data: item } = await supabase
                    .from('reading_items')
                    .select('progress_pages, total_pages')
                    .eq('id', readingItemId)
                    .single();

                if (item) {
                    const newProgress = Math.min(
                        (item.progress_pages || 0) + pagesRead,
                        item.total_pages || Infinity
                    );
                    await updateReadingProgress(readingItemId, newProgress);
                }
                return null;
            }
            console.error('Error logging reading session:', error);
            throw error;
        }

        // Update reading item progress
        const { data: item } = await supabase
            .from('reading_items')
            .select('progress_pages, total_pages')
            .eq('id', readingItemId)
            .single();

        if (item) {
            const newProgress = Math.min(
                (item.progress_pages || 0) + pagesRead,
                item.total_pages || Infinity
            );
            await updateReadingProgress(readingItemId, newProgress);
        }

        return data;
    } catch (err) {
        console.error('Error in logReadingSession:', err);
        throw err;
    }
}

/**
 * Add a highlight
 */
export async function addHighlight(
    userId: string,
    readingItemId: string,
    content: string,
    pageNumber: number | null
): Promise<Highlight | null> {
    try {
        const { data, error } = await supabase
            .from('highlights')
            .insert({
                user_id: userId,
                reading_item_id: readingItemId,
                content,
                page_number: pageNumber,
                created_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) {
            if (error.code === '42P01') {
                console.warn('highlights table does not exist yet');
                return null;
            }
            console.error('Error adding highlight:', error);
            throw error;
        }

        return data;
    } catch (err) {
        console.error('Error in addHighlight:', err);
        throw err;
    }
}

/**
 * Get highlights for a reading item
 */
export async function getHighlights(readingItemId: string): Promise<Highlight[]> {
    try {
        const { data, error } = await supabase
            .from('highlights')
            .select('*')
            .eq('reading_item_id', readingItemId)
            .order('created_at', { ascending: false });

        if (error) {
            if (error.code === '42P01') {
                console.warn('highlights table does not exist yet');
                return [];
            }
            console.error('Error fetching highlights:', error);
            throw error;
        }

        return data || [];
    } catch (err) {
        console.error('Error in getHighlights:', err);
        return [];
    }
}

/**
 * Get all highlights for a user
 */
export async function getAllHighlights(userId: string): Promise<(Highlight & { reading_item: { title: string } })[]> {
    try {
        const { data, error } = await supabase
            .from('highlights')
            .select(`
                *,
                reading_item:reading_items (title)
            `)
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) {
            // Table doesn't exist yet - return empty array
            if (error.code === '42P01') {
                console.warn('highlights table does not exist yet');
                return [];
            }
            console.error('Error fetching all highlights:', error);
            throw error;
        }

        return data || [];
    } catch (err) {
        console.error('Error in getAllHighlights:', err);
        return [];
    }
}

/**
 * Delete a highlight
 */
export async function deleteHighlight(highlightId: string): Promise<void> {
    try {
        const { error } = await supabase
            .from('highlights')
            .delete()
            .eq('id', highlightId);

        if (error) {
            if (error.code === '42P01') {
                console.warn('highlights table does not exist yet');
                return;
            }
            console.error('Error deleting highlight:', error);
            throw error;
        }
    } catch (err) {
        console.error('Error in deleteHighlight:', err);
        throw err;
    }
}

/**
 * Get reading trends (daily pages read for last N days)
 */
export async function getReadingTrends(userId: string, days: number = 14): Promise<{ date: string; pages: number; minutes: number }[]> {
    // Initialize empty trends
    const trends = new Map<string, { pages: number; minutes: number }>();
    
    for (let i = 0; i < days; i++) {
        const date = new Date();
        date.setDate(date.getDate() - (days - 1 - i));
        const dateStr = date.toISOString().split('T')[0];
        trends.set(dateStr, { pages: 0, minutes: 0 });
    }

    try {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const { data: sessions, error } = await supabase
            .from('reading_sessions')
            .select('created_at, pages_read, duration_minutes')
            .eq('user_id', userId)
            .gte('created_at', startDate.toISOString())
            .order('created_at', { ascending: true });

        if (error) {
            // Table doesn't exist yet - return empty trends
            if (error.code === '42P01') {
                console.warn('reading_sessions table does not exist yet');
                return Array.from(trends.entries()).map(([date, data]) => ({
                    date,
                    pages: data.pages,
                    minutes: data.minutes
                }));
            }
            console.error('Error fetching reading trends:', error);
            throw error;
        }

        // Group by day
        (sessions || []).forEach(session => {
            const dateStr = session.created_at.split('T')[0];
            const existing = trends.get(dateStr) || { pages: 0, minutes: 0 };
            trends.set(dateStr, {
                pages: existing.pages + (session.pages_read || 0),
                minutes: existing.minutes + (session.duration_minutes || 0)
            });
        });
    } catch (err) {
        console.warn('Error loading reading trends, returning empty data:', err);
    }

    return Array.from(trends.entries()).map(([date, data]) => ({
        date,
        pages: data.pages,
        minutes: data.minutes
    }));
}
