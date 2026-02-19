import { useGameState } from "./hooks/useGameState";
import { GameCard } from "./components/GameCard";
import { GameControls } from "./components/GameControls";
import { GameInput } from "./components/GameInput";

function App() {
  const {
    state,
    filters,
    checkAnswer,
    handleGiveUp,
    handleSkip,
    nextCard,
    toggleLevelFilter,
    togglePartFilter
  } = useGameState();

  return (
    <div className="min-h-screen w-full bg-[#f4f7f6] dark:bg-slate-950 flex flex-col items-center py-10 px-4 font-sans text-slate-900 selection:bg-blue-100">
      <div className="w-full max-w-4xl flex flex-col items-center gap-8">

        <header className="text-center space-y-2 mb-4">
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
            onSkip={handleSkip} /* Skip shows the correct answer but doesn't lower the level */
            isReviewing={state.isReviewing}
            feedbackMsg={state.feedbackMsg}
            feedbackType={state.feedbackType}
          />
        </main>
      </div>
    </div>
  );
}

export default App;
