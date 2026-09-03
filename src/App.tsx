/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  auth, 
  onAuthStateChanged, 
  signInWithGoogle, 
  logout, 
  User 
} from './lib/firebase';
import { 
  subscribeToUserEntries, 
  deleteJournalEntry, 
  updateJournalEntry 
} from './lib/firestore';
import { UserProfile, JournalEntry, AppTab } from './types';
import { LandingPage } from './components/LandingPage';
import { Navbar } from './components/Navbar';
import { JournalEditor } from './components/JournalEditor';
import { EntryHistory } from './components/EntryHistory';
import { EntryDetailModal } from './components/EntryDetailModal';
import { ThreatModelModal } from './components/ThreatModelModal';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { GuidedExerciseModal } from './components/GuidedExerciseModal';
import { ExportModal } from './components/ExportModal';
import { AlertCircle, CheckCircle, Sparkles } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [isSigningIn, setIsSigningIn] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<AppTab>('journal');

  // Journal entries state
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [activeEntry, setActiveEntry] = useState<JournalEntry | null>(null);
  const [modalEntry, setModalEntry] = useState<JournalEntry | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isThreatModalOpen, setIsThreatModalOpen] = useState<boolean>(false);
  const [isGuidedModalOpen, setIsGuidedModalOpen] = useState<boolean>(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);

  // Feedback notifications
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  // Auth State Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user: User | null) => {
      if (user) {
        setCurrentUser({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
        });
      } else {
        setCurrentUser(null);
        setEntries([]);
        setActiveEntry(null);
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Real-time Firestore entries subscription
  useEffect(() => {
    if (!currentUser) return;

    const unsubscribe = subscribeToUserEntries(
      currentUser.uid,
      (fetchedEntries) => {
        setEntries(fetchedEntries);
      },
      (err) => {
        console.error('Real-time sync error:', err);
        showNotification('error', `Sync error: ${err.message}`);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  // Auth Handlers
  const handleSignIn = async () => {
    setIsSigningIn(true);
    setAuthError(null);
    const { user, error } = await signInWithGoogle();
    if (error) {
      setAuthError(error);
      showNotification('error', error);
    }
    setIsSigningIn(false);
  };

  const handleSignOut = async () => {
    const { error } = await logout();
    if (error) {
      showNotification('error', error);
    } else {
      showNotification('success', 'Successfully signed out.');
    }
  };

  // Entry Handlers
  const handleEntrySaved = (saved: JournalEntry) => {
    setActiveEntry(saved);
    showNotification('success', 'Reflection successfully saved.');
  };

  const handleTogglePin = async (entry: JournalEntry) => {
    if (!currentUser) return;
    try {
      await updateJournalEntry(currentUser.uid, entry.id, { isPinned: !entry.isPinned });
      showNotification('success', entry.isPinned ? 'Reflection unpinned' : 'Reflection pinned to top');
    } catch (err: any) {
      showNotification('error', `Failed to update pin state: ${err.message}`);
    }
  };

  const handleDeleteEntry = async (entryId: string) => {
    if (!currentUser) return;
    try {
      await deleteJournalEntry(currentUser.uid, entryId);
      if (activeEntry?.id === entryId) {
        setActiveEntry(null);
      }
      showNotification('success', 'Entry permanently deleted.');
    } catch (err: any) {
      showNotification('error', `Failed to delete entry: ${err.message}`);
    }
  };

  const handleApplyExerciseToJournal = (data: {
    title: string;
    content: string;
    tags: string[];
    mood: JournalEntry['mood'];
  }) => {
    if (!currentUser) return;
    const newEntry: JournalEntry = {
      id: crypto.randomUUID(),
      userId: currentUser.uid,
      title: data.title,
      content: data.content,
      tags: data.tags,
      mood: data.mood,
      actionItems: [],
      messages: [],
      isPinned: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setActiveEntry(newEntry);
    setActiveTab('journal');
    setIsGuidedModalOpen(false);
    showNotification('success', 'Guided reflection loaded into your journal.');
  };

  // Loading Screen
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white animate-bounce shadow-lg shadow-indigo-500/25">
          <Sparkles className="w-5 h-5" />
        </div>
        <p className="text-xs font-semibold text-slate-400 tracking-wide uppercase">
          Loading your private journal...
        </p>
      </div>
    );
  }

  // Unauthenticated View: Landing Page
  if (!currentUser) {
    return (
      <>
        <LandingPage
          onSignIn={handleSignIn}
          isSigningIn={isSigningIn}
          error={authError}
          onOpenThreatModel={() => setIsThreatModalOpen(true)}
        />
        <ThreatModelModal
          isOpen={isThreatModalOpen}
          onClose={() => setIsThreatModalOpen(false)}
        />
      </>
    );
  }

  // Authenticated View: Private Dashboard
  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        user={currentUser}
        entryCount={entries.length}
        activeTab={activeTab}
        onChangeTab={(tab) => setActiveTab(tab)}
        onNewEntry={() => {
          setActiveEntry(null);
          setActiveTab('journal');
        }}
        onSignOut={handleSignOut}
        onOpenThreatModel={() => setIsThreatModalOpen(true)}
        onOpenGuidedExercises={() => setIsGuidedModalOpen(true)}
        onOpenExport={() => setIsExportModalOpen(true)}
      />

      {/* Floating Notification Toast */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div
            className={`px-4 py-3 rounded-xl shadow-xl border text-xs font-medium flex items-center gap-2.5 backdrop-blur-md ${
              notification.type === 'success'
                ? 'bg-emerald-950/90 text-emerald-200 border-emerald-700/80 shadow-emerald-950/50'
                : 'bg-rose-950/90 text-rose-200 border-rose-700/80 shadow-rose-950/50'
            }`}
          >
            {notification.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
        </div>
      )}

      {/* Main Workspace Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'journal' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-in fade-in duration-200">
            {/* Left / Main Column: Multi-Turn Journal Editor & AI Partner (7 cols on lg) */}
            <section className="lg:col-span-7 w-full">
              <JournalEditor
                userId={currentUser.uid}
                activeEntry={activeEntry}
                onEntrySaved={handleEntrySaved}
                onReset={() => setActiveEntry(null)}
                onOpenGuidedExercises={() => setIsGuidedModalOpen(true)}
              />
            </section>

            {/* Right Column: Reflection History & Search (5 cols on lg) */}
            <section className="lg:col-span-5 w-full">
              <EntryHistory
                entries={entries}
                selectedEntryId={activeEntry?.id || null}
                onSelectEntry={(entry) => {
                  setActiveEntry(entry);
                  setActiveTab('journal');
                }}
                onViewDetails={(entry) => {
                  setModalEntry(entry);
                  setIsModalOpen(true);
                }}
                onTogglePin={handleTogglePin}
                onDeleteEntry={handleDeleteEntry}
                onOpenExport={() => setIsExportModalOpen(true)}
              />
            </section>
          </div>
        ) : (
          <AnalyticsDashboard
            entries={entries}
            onOpenEntry={(entry) => {
              setActiveEntry(entry);
              setActiveTab('journal');
            }}
          />
        )}
      </main>

      {/* Modals */}
      <EntryDetailModal
        entry={modalEntry}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setModalEntry(null);
        }}
        onEditInWorkbench={(entry) => {
          setActiveEntry(entry);
          setActiveTab('journal');
        }}
      />

      <GuidedExerciseModal
        isOpen={isGuidedModalOpen}
        onClose={() => setIsGuidedModalOpen(false)}
        onInsertIntoJournal={handleApplyExerciseToJournal}
      />

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        entries={entries}
      />

      <ThreatModelModal
        isOpen={isThreatModalOpen}
        onClose={() => setIsThreatModalOpen(false)}
      />
    </div>
  );
}
