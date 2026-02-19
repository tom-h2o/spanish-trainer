import { useState, useEffect } from "react";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import type { Session } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "./lib/supabase";

import { useGameState } from "./hooks/useGameState";
import { GameCard } from "./components/GameCard";
import { GameControls } from "./components/GameControls";
import { GameInput } from "./components/GameInput";
import { Button } from "./components/ui/button";

import { ProgressDashboard } from "./components/ProgressDashboard";
import { PlayCircle, BarChart2 } from "lucide-react";

function Game({ session }: { session: Session }) {
  const [activeView, setActiveView] = useState<'play' | 'dashboard'>('play');

  const {
    vocabList,
    state,
    filters,
    checkAnswer,
    nextCard,
    handleGiveUp,
    handleSkip,
    toggleLevelFilter,
    togglePartFilter,
    toggleReverseMode
  } = useGameState(session);

  if (state.isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        <p className="text-slate-500 font-medium animate-pulse">Syncing flashcards...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center gap-8">
      {/* HEADER */}
      <header className="text-center space-y-2 mb-4 relative w-full">
        <Button
          variant="outline"
          size="sm"
          className="absolute right-0 top-0"
          onClick={() => supabase.auth.signOut()}
        >
          Sign Out
        </Button>
        <div className="inline-block bg-white dark:bg-slate-900 px-4 py-1 rounded-full shadow-sm border text-xs font-bold uppercase tracking-widest text-primary mb-2">
          Vocabulary Trainer
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100">
          🇪🇸 Spanish Flashcards
        </h1>
        <p className="text-muted-foreground">Master your daily vocabulary with spaced repetition.</p>

        {/* VIEW TOGGLE TABS */}
        <div className="flex justify-center gap-2 mt-6">
          <Button
            variant={activeView === 'play' ? 'default' : 'outline'}
            onClick={() => setActiveView('play')}
            className="rounded-full px-6"
          >
            <PlayCircle className="w-4 h-4 mr-2" />
            Practice
          </Button>
          <Button
            variant={activeView === 'dashboard' ? 'default' : 'outline'}
            onClick={() => setActiveView('dashboard')}
            className="rounded-full px-6"
          >
            <BarChart2 className="w-4 h-4 mr-2" />
            Progress
          </Button>
        </div>
      </header>

      {activeView === 'play' ? (
        <>
          <GameControls
            filters={filters}
            onToggleLevel={toggleLevelFilter}
            onTogglePart={togglePartFilter}
            isReverseMode={state.isReverseMode}
            onToggleReverseMode={toggleReverseMode}
            stats={state.stats}
          />

          <main className="w-full flex flex-col items-center gap-8 min-h-[500px]">
            {/* MAIN GAME AREA */}
            <div className="w-full flex justify-center">
              <GameCard
                card={state.currentCard}
                isReviewing={state.isReviewing}
                lastResult={state.lastResult}
                globalVocab={vocabList}
                isReverseMode={state.isReverseMode}
              />
            </div>

            {/* CONTROLS */}
            <div className="w-full max-w-[500px]">
              <GameInput
                isReviewing={state.isReviewing}
                onCheck={checkAnswer}
                onNext={nextCard}
                onGiveUp={handleGiveUp}
                onSkip={handleSkip}
                feedbackMsg={state.feedbackMsg}
                feedbackType={state.feedbackType}
              />
            </div>
          </main>
        </>
      ) : (
        <main className="w-full flex justify-center min-h-[500px]">
          <ProgressDashboard vocabList={vocabList} />
        </main>
      )}
    </div>
  );
}

function App() {
  const [session, setSession] = useState<Session | null>(null);

  if (!isSupabaseConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f4f7f6] dark:bg-slate-950 p-4 text-center">
        <div className="w-full max-w-md bg-white dark:bg-slate-900 p-8 rounded-xl shadow-lg border">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Configuration Error</h1>
          <p className="text-slate-600 dark:text-slate-300">
            Supabase environment variables are missing! Please add <strong>VITE_SUPABASE_URL</strong> and <strong>VITE_SUPABASE_ANON_KEY</strong> to your Vercel project environment variables, then redeploy.
          </p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (!session) {
    return (
      <div className="min-h-screen bg-[#f4f7f6] dark:bg-slate-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white dark:bg-slate-900 p-8 rounded-xl shadow-lg border">
          <h1 className="text-2xl font-bold text-center mb-6 text-slate-800 dark:text-slate-100">Sign In to Play</h1>
          <Auth
            supabaseClient={supabase}
            appearance={{ theme: ThemeSupa }}
            providers={[]}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#f4f7f6] dark:bg-slate-950 flex flex-col items-center py-10 px-4 font-sans text-slate-900 selection:bg-blue-100">
      <Game session={session} />
    </div>
  );
}

export default App;
