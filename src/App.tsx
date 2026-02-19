import { useState, useEffect } from "react";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./lib/supabase";

import { useGameState } from "./hooks/useGameState";
import { GameCard } from "./components/GameCard";
import { GameControls } from "./components/GameControls";
import { GameInput } from "./components/GameInput";
import { Button } from "./components/ui/button";

function Game({ session }: { session: Session }) {
  const {
    state,
    filters,
    checkAnswer,
    handleGiveUp,
    handleSkip,
    nextCard,
    toggleLevelFilter,
    togglePartFilter
  } = useGameState(session);

  return (
    <div className="w-full max-w-4xl flex flex-col items-center gap-8">
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
      </header>

      <GameControls
        filters={filters}
        onToggleLevel={toggleLevelFilter}
        onTogglePart={togglePartFilter}
        stats={state.stats}
      />

      <main className="w-full flex flex-col items-center gap-8 min-h-[500px]">
        <GameCard
          card={state.currentCard}
          isReviewing={state.isReviewing}
          lastResult={state.lastResult}
        />

        <GameInput
          onCheck={checkAnswer}
          onGiveUp={handleGiveUp}
          onNext={nextCard}
          onSkip={handleSkip}
          isReviewing={state.isReviewing}
          feedbackMsg={state.feedbackMsg}
          feedbackType={state.feedbackType}
        />
      </main>
    </div>
  );
}

function App() {
  const [session, setSession] = useState<Session | null>(null);

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
      <div className="min-h-screen flex items-center justify-center bg-[#f4f7f6] dark:bg-slate-950 p-4">
        <div className="w-full max-w-md bg-white dark:bg-slate-900 p-8 rounded-xl shadow-lg border">
          <h1 className="text-3xl font-bold text-center mb-6">🇪🇸 Sign In to Play</h1>
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
