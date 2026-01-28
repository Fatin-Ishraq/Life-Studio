import { supabase } from './client';
import type { Capture } from '@/types/database';

export type CaptureType = 'task' | 'project' | 'note' | 'reading' | null;

/**
 * Create a new capture in the inbox
 */
export async function createCapture(
    userId: string,
    content: string,
    captureType: CaptureType = null
): Promise<Capture> {
    const { data, error } = await supabase
        .from('captures')
        .insert({
            user_id: userId,
            content,
            capture_type: captureType,
            processed: false,
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating capture:', error);
        throw error;
    }

    return data;
}

/**
 * Get all unprocessed captures for a user
 */
export async function getUnprocessedCaptures(userId: string): Promise<Capture[]> {
    const { data, error } = await supabase
        .from('captures')
        .select('*')
        .eq('user_id', userId)
        .eq('processed', false)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching captures:', error);
        throw error;
    }

    return data || [];
}

/**
 * Mark a capture as processed
 */
export async function markAsProcessed(captureId: string): Promise<void> {
    const { error } = await supabase
        .from('captures')
        .update({ processed: true })
        .eq('id', captureId);

    if (error) {
        console.error('Error marking capture as processed:', error);
        throw error;
    }
}

/**
 * Delete a capture from the inbox
 */
export async function deleteCapture(captureId: string): Promise<void> {
    const { error } = await supabase
        .from('captures')
        .delete()
        .eq('id', captureId);

    if (error) {
        console.error('Error deleting capture:', error);
        throw error;
    }
}

/**
 * Parse capture content to detect type from prefix
 * Returns both the detected type and cleaned content
 */
export function parseCapture(content: string): {
    type: CaptureType;
    cleanContent: string;
} {
    const trimmed = content.trim();

    // Task patterns: [] or task:
    if (trimmed.startsWith('[]') || trimmed.toLowerCase().startsWith('task:')) {
        const cleanContent = trimmed
            .replace(/^\[\]\s*/, '')
            .replace(/^task:\s*/i, '');
        return { type: 'task', cleanContent };
    }

    // Note patterns: # or note:
    if (trimmed.startsWith('#') || trimmed.toLowerCase().startsWith('note:')) {
        const cleanContent = trimmed
            .replace(/^#\s*/, '')
            .replace(/^note:\s*/i, '');
        return { type: 'note', cleanContent };
    }

    // Reading patterns: * or read: or reading:
    if (
        trimmed.startsWith('* ') ||
        trimmed.toLowerCase().startsWith('read:') ||
        trimmed.toLowerCase().startsWith('reading:')
    ) {
        const cleanContent = trimmed
            .replace(/^\*\s+/, '')
            .replace(/^read:\s*/i, '')
            .replace(/^reading:\s*/i, '');
        return { type: 'reading', cleanContent };
    }

    // Project patterns: project:
    if (trimmed.toLowerCase().startsWith('project:')) {
        const cleanContent = trimmed.replace(/^project:\s*/i, '');
        return { type: 'project', cleanContent };
    }

    // No pattern detected - return as-is
    return { type: null, cleanContent: trimmed };
}

/**
 * Helper to get a human-readable time ago string
 */
export function getTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hr ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
    return date.toLocaleDateString();
}
