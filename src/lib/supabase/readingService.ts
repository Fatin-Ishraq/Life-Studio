
import { supabase } from './client';
import type { ReadingItem } from '@/types/database';

export async function getReadingItems(userId: string) {
    const { data, error } = await supabase
        .from('reading_items')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

    if (error) {
        console.error('Error fetching reading items:', error);
        return [];
    }

    return data as ReadingItem[];
}

export async function getActiveReadingItems(userId: string) {
    const { data, error } = await supabase
        .from('reading_items')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'reading')
        .order('updated_at', { ascending: false });

    if (error) {
        console.error('Error fetching active reading items:', error);
        return [];
    }

    return data as ReadingItem[];
}

export async function updateReadingProgress(
    itemId: string,
    progress: number,
    total?: number
) {
    const updates: any = {
        progress_pages: progress,
        updated_at: new Date().toISOString()
    };

    if (total) updates.total_pages = total;

    // Auto-complete if progress matches total
    if (total && progress >= total) {
        updates.status = 'completed';
        updates.completed_at = new Date().toISOString();
    }

    const { data, error } = await supabase
        .from('reading_items')
        .update(updates)
        .eq('id', itemId)
        .select()
        .single();

    if (error) {
        console.error('Error updating reading progress:', error);
        throw error;
    }

    return data as ReadingItem;
}

export async function addReadingItem(item: Omit<ReadingItem, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
        .from('reading_items')
        .insert({
            ...item,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        })
        .select()
        .single();

    if (error) {
        console.error('Error adding reading item:', error);
        throw error;
    }

    return data as ReadingItem;
}

export async function updateReadingItem(id: string, updates: Partial<ReadingItem>) {
    const { data, error } = await supabase
        .from('reading_items')
        .update({
            ...updates,
            updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error updating reading item:', error);
        throw error;
    }

    return data as ReadingItem;
}

export async function deleteReadingItem(id: string) {
    const { error } = await supabase
        .from('reading_items')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting reading item:', error);
        throw error;
    }
}

export async function getReadingStats(userId: string) {
    const { data, error } = await supabase
        .from('reading_items')
        .select('status, progress_pages, total_pages, completed_at, item_type')
        .eq('user_id', userId);

    if (error) return null;

    const completed = data.filter(i => i.status === 'completed');
    const reading = data.filter(i => i.status === 'reading');
    const toRead = data.filter(i => i.status === 'to_read');

    // Calculate pages read
    const totalPagesRead = data.reduce((acc, curr) => acc + (curr.progress_pages || 0), 0);

    // Calculate streak (mock for now, would need a separate activity log)
    const currentStreak = 0;

    return {
        totalBooks: completed.filter(i => i.item_type === 'book').length,
        totalArticles: completed.filter(i => i.item_type === 'article').length,
        currentlyReading: reading.length,
        toRead: toRead.length,
        totalPagesRead,
        streak: currentStreak
    };
}
