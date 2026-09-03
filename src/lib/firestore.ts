import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  updateDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  serverTimestamp,
  getDocs
} from 'firebase/firestore';
import { db } from './firebase';
import { JournalEntry } from '../types';

/**
 * Strict Undefined-Stripping Utility
 * Prevents Firestore driver exceptions by recursively removing undefined keys
 */
export function sanitizePayload<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return null as unknown as T;
  }
  if (Array.isArray(obj)) {
    return obj
      .filter(item => item !== undefined)
      .map(item => sanitizePayload(item)) as unknown as T;
  }
  if (typeof obj === 'object' && !(obj instanceof Date)) {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = sanitizePayload(value);
      }
    }
    return cleaned as T;
  }
  return obj;
}

/**
 * Get reference to a user's isolated journal entries collection
 */
export function getUserEntriesRef(userId: string) {
  if (!userId) {
    throw new Error('User ID is required for accessing entries.');
  }
  return collection(db, 'users', userId, 'entries');
}

/**
 * Subscribe to real-time updates for a user's journal entries
 */
export function subscribeToUserEntries(
  userId: string,
  onUpdate: (entries: JournalEntry[]) => void,
  onError: (err: Error) => void
) {
  if (!userId) {
    onUpdate([]);
    return () => {};
  }

  try {
    const entriesRef = getUserEntriesRef(userId);
    const q = query(entriesRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const entries: JournalEntry[] = [];
        snapshot.forEach((docSnapshot) => {
          const data = docSnapshot.data();
          entries.push({
            id: docSnapshot.id,
            userId: data.userId || userId,
            title: data.title || 'Untitled Reflection',
            content: data.content || '',
            mood: data.mood,
            tags: data.tags || [],
            messages: data.messages || [],
            summary: data.summary,
            actionItems: data.actionItems || [],
            isPinned: !!data.isPinned,
            createdAt: data.createdAt || new Date().toISOString(),
            updatedAt: data.updatedAt || new Date().toISOString(),
          });
        });
        onUpdate(entries);
      },
      (error) => {
        console.error('Firestore subscription error:', error);
        onError(error);
      }
    );

    return unsubscribe;
  } catch (error: any) {
    console.error('Failed to setup entries subscription:', error);
    onError(error);
    return () => {};
  }
}

/**
 * Create or save a full journal entry
 */
export async function saveJournalEntry(userId: string, entry: Partial<JournalEntry> & { id: string }): Promise<JournalEntry> {
  if (!userId) throw new Error('User ID is required to save entry.');
  if (!entry.id) throw new Error('Entry ID is required.');

  const now = new Date().toISOString();
  const entryPayload: JournalEntry = {
    id: entry.id,
    userId,
    title: entry.title?.trim() || 'Untitled Reflection',
    content: entry.content || '',
    mood: entry.mood,
    tags: entry.tags || [],
    messages: entry.messages || [],
    summary: entry.summary,
    actionItems: entry.actionItems || [],
    isPinned: entry.isPinned ?? false,
    createdAt: entry.createdAt || now,
    updatedAt: now,
  };

  const cleanPayload = sanitizePayload(entryPayload);
  const docRef = doc(db, 'users', userId, 'entries', entry.id);
  
  await setDoc(docRef, {
    ...cleanPayload,
    serverUpdatedAt: serverTimestamp()
  }, { merge: true });

  return entryPayload;
}

/**
 * Update specific fields of an entry
 */
export async function updateJournalEntry(
  userId: string,
  entryId: string,
  updates: Partial<JournalEntry>
): Promise<void> {
  if (!userId || !entryId) throw new Error('User ID and Entry ID are required.');
  
  const docRef = doc(db, 'users', userId, 'entries', entryId);
  const cleanUpdates = sanitizePayload({
    ...updates,
    updatedAt: new Date().toISOString(),
    serverUpdatedAt: serverTimestamp()
  });

  await updateDoc(docRef, cleanUpdates);
}

/**
 * Delete a journal entry
 */
export async function deleteJournalEntry(userId: string, entryId: string): Promise<void> {
  if (!userId || !entryId) throw new Error('User ID and Entry ID are required.');
  const docRef = doc(db, 'users', userId, 'entries', entryId);
  await deleteDoc(docRef);
}
