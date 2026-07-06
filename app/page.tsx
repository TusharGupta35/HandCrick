"use client";

import { useState } from "react";

const choices = [1, 2, 3, 4, 5, 6] as const;

type Choice = (typeof choices)[number];
type GamePhase = "intro" | "toss" | "chooseSide" | "playing" | "result";
type GameMode = "batting" | "bowling";
type TossPick = "heads" | "tails";

type TossOutcome = {
  userWon: boolean;
  computerChoice: TossPick;
  winnerDecision: GameMode | null;
};

type ResultType = "win" | "loss" | "tie" | null;

const getRandomChoice = () => choices[Math.floor(Math.random() * choices.length)];
const getRandomTossPick = (): TossPick => (Math.random() < 0.5 ? "heads" : "tails");
const getRandomMode = (): GameMode => (Math.random() < 0.5 ? "batting" : "bowling");

export default function Home() {
  const [phase, setPhase] = useState<GamePhase>("intro");
  const [tossPick, setTossPick] = useState<TossPick | null>(null);
  const [tossResult, setTossResult] = useState<TossPick | null>(null);
  const [tossWinner, setTossWinner] = useState<"user" | "computer" | null>(null);
  const [decision, setDecision] = useState<GameMode | null>(null);
  const [currentMode, setCurrentMode] = useState<GameMode>("batting");
  const [innings, setInnings] = useState<1 | 2>(1);
  const [balls, setBalls] = useState(0);
  const [userScore, setUserScore] = useState(0);
  const [computerScore, setComputerScore] = useState(0);
  const [firstInningsScore, setFirstInningsScore] = useState<number | null>(null);
  const [target, setTarget] = useState<number | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [result, setResult] = useState("");
  const [resultType, setResultType] = useState<ResultType>(null);
  const [statusMessage, setStatusMessage] = useState("");

  const resetGame = () => {
    setPhase("intro");
    setTossPick(null);
    setTossResult(null);
    setTossWinner(null);
    setDecision(null);
    setCurrentMode("batting");
    setInnings(1);
    setBalls(0);
    setUserScore(0);
    setComputerScore(0);
    setFirstInningsScore(null);
    setTarget(null);
    setHistory([]);
    setResult("");
    setResultType(null);
    setStatusMessage("");
  };

  const addHistory = (entry: string) => setHistory((prev) => [entry, ...prev]);

  const startToss = () => {
    resetGame();
    setPhase("toss");
  };

  const resolveCurrentMode = (winner: "user" | "computer", winnerChoice: GameMode): GameMode => {
    return winner === "user" ? winnerChoice : winnerChoice === "batting" ? "bowling" : "batting";
  };

  const startFirstInnings = (winner: "user" | "computer", winnerDecision: GameMode) => {
    const initialMode = resolveCurrentMode(winner, winnerDecision);
    setCurrentMode(initialMode);
    setInnings(1);
    setBalls(0);
    setUserScore(0);
    setComputerScore(0);
    setFirstInningsScore(null);
    setTarget(null);
    setHistory([]);
    setResult("");
    setPhase("playing");
    setStatusMessage(
      initialMode === "batting"
        ? "You bat first. Score as many runs as possible."
        : "You bowl first. Try to dismiss the computer."
    );
  };

  const startSecondInnings = (score: number) => {
    const nextMode = currentMode === "batting" ? "bowling" : "batting";
    const chaseTarget = score + 1;
    setTarget(chaseTarget);
    setFirstInningsScore(score);
    setBalls(0);
    setUserScore(0);
    setComputerScore(0);
    setHistory([]);
    setPhase("playing");
    setInnings(2);
    setCurrentMode(nextMode);
    setResult("");
    setStatusMessage(
      nextMode === "batting"
        ? `Second innings: chase ${chaseTarget} runs.`
        : `Second innings: defend ${chaseTarget} runs.`
    );
  };

  const declareResult = (message: string, type: ResultType) => {
    setResult(message);
    setResultType(type);
    setPhase("result");
  };

  const finishFirstInnings = () => {
    const score = currentMode === "batting" ? userScore : computerScore;
    addHistory(`First innings complete with ${score} runs.`);
    startSecondInnings(score);
  };

  const finishSecondInnings = () => {
    if (target === null) {
      return;
    }

    if (currentMode === "batting") {
      if (userScore > target - 1) {
        declareResult(`You won by chasing ${target} runs!`, "win");
      } else if (userScore === target - 1) {
        declareResult("Match tied.", "tie");
      } else {
        declareResult(`You lost. You scored ${userScore} and missed the target.`, "loss");
      }
    } else {
      if (computerScore > target - 1) {
        declareResult(`Computer won by chasing ${target} runs.`, "loss");
      } else if (computerScore === target - 1) {
        declareResult("Match tied.", "tie");
      } else {
        declareResult(`You won! Computer scored ${computerScore} and could not reach ${target}.`, "win");
      }
    }
  };

  const playBall = (choice: Choice) => {
    const computerChoice = getRandomChoice();
    const nextBalls = balls + 1;
    const isOut = choice === computerChoice;
    const baseEntry = `You chose ${choice}, computer chose ${computerChoice}.`;

    if (currentMode === "batting") {
      if (isOut) {
        addHistory(`${baseEntry} Out!`);
        if (innings === 1) {
          startSecondInnings(userScore);
          return;
        }
        if (target !== null) {
          if (userScore >= target) {
            declareResult(`You won by chasing ${target} runs before the wicket.`, "win");
          } else {
            declareResult(`You lost. Scored ${userScore} and were out.`, "loss");
          }
          return;
        }
      }

      const nextScore = userScore + choice;
      setUserScore(nextScore);
      setBalls(nextBalls);
      addHistory(`${baseEntry} +${choice} run${choice === 1 ? "" : "s"}`);

      if (target !== null && nextScore >= target) {
        declareResult(`You won by chasing ${target} runs!`, "win");
        return;
      }

      if (nextBalls >= 6) {
        if (innings === 1) {
          finishFirstInnings();
        } else {
          finishSecondInnings();
        }
      }
      return;
    }

    if (currentMode === "bowling") {
      if (isOut) {
        addHistory(`${baseEntry} Out!`);
        if (innings === 1) {
          startSecondInnings(computerScore);
          return;
        }
        if (target !== null) {
          if (computerScore >= target) {
            declareResult(`Computer won by chasing ${target} runs before the wicket.`, "loss");
          } else {
            declareResult(`You won! Computer was out for ${computerScore}.`, "win");
          }
          return;
        }
      }

      const nextScore = computerScore + computerChoice;
      setComputerScore(nextScore);
      setBalls(nextBalls);
      addHistory(`${baseEntry} +${computerChoice} run${computerChoice === 1 ? "" : "s"}`);

      if (target !== null && nextScore >= target) {
        declareResult(`Computer won by chasing ${target} runs!`, "loss");
        return;
      }

      if (nextBalls >= 6) {
        if (innings === 1) {
          finishFirstInnings();
        } else {
          finishSecondInnings();
        }
      }
    }
  };

  const handleTossChoice = (pick: TossPick) => {
    const resultPick = getRandomTossPick();
    const userWon = pick === resultPick;
    setTossPick(pick);
    setTossResult(resultPick);
    setTossWinner(userWon ? "user" : "computer");
    if (userWon) {
      setPhase("chooseSide");
      setStatusMessage(`You won the toss! You can choose to bat or bowl.`);
    } else {
      const computerChoice = getRandomMode();
      setDecision(computerChoice);
      setStatusMessage(`Computer won the toss and chose to ${computerChoice}.`);
      startFirstInnings("computer", computerChoice);
    }
  };

  const handleSideChoice = (choice: GameMode) => {
    setDecision(choice);
    setStatusMessage(`You chose to ${choice} first.`);
    startFirstInnings("user", choice);
  };

  const headerText =
    phase === "intro"
      ? "Hand Cricket"
      : phase === "toss"
      ? "Toss time"
      : phase === "chooseSide"
      ? "Choose bat or bowl"
      : currentMode === "batting"
      ? `You are batting${innings === 2 ? " in second innings" : ""}`
      : `You are bowling${innings === 2 ? " in second innings" : ""}`;

  const scoreText = phase === "playing"
    ? currentMode === "batting"
      ? `Your score: ${userScore} in ${balls} ball${balls === 1 ? "" : "s"}`
      : `Computer score: ${computerScore} in ${balls} ball${balls === 1 ? "" : "s"}`
    : statusMessage || "Choose a mode and start the game.";

  const targetText = target !== null ? `Target: ${target}` : "";

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 px-6 py-10">
      <div className="mx-auto flex max-w-5xl flex-col gap-8 rounded-3xl border border-slate-800 bg-slate-900/90 p-8 shadow-2xl shadow-slate-950/40">
        <section className="space-y-4">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-cyan-300/80">Hand Cricket</p>
            <h1 className="mt-2 text-4xl font-semibold text-white sm:text-5xl">Play against the computer</h1>
          </div>

          <p className="max-w-3xl text-slate-300">
            Toss decides who chooses to bat or bowl first. After the first innings, the other side chases the target.
          </p>
          <p className="max-w-3xl text-slate-300">This version covers React state, conditional rendering, and a two-innings game flow.</p>
        </section>

        {phase === "intro" ? (
          <section className="grid gap-4 sm:grid-cols-2">
            <button
              type="button"
              className="rounded-3xl bg-cyan-500 px-6 py-5 text-left text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:bg-cyan-400"
              onClick={startToss}
            >
              <h2 className="text-xl font-semibold">Start Match</h2>
              <p className="mt-2 text-slate-800/90">Begin a new hand cricket match with a toss.</p>
            </button>

            <div className="rounded-3xl border border-slate-700 bg-slate-950 px-6 py-5 text-left text-slate-100 shadow-lg shadow-slate-950/30">
              <h2 className="text-xl font-semibold">Rules</h2>
              <ul className="mt-3 space-y-2 text-slate-400">
                <li>1. Toss decides the choice to bat or bowl first.</li>
                <li>2. Six balls per innings.</li>
                <li>3. Matching numbers mean the batter is out.</li>
                <li>4. Second innings chase decides the winner.</li>
              </ul>
            </div>
          </section>
        ) : phase === "toss" ? (
          <section className="grid gap-4 sm:grid-cols-2">
            <button
              type="button"
              className="rounded-3xl bg-cyan-500 px-6 py-5 text-left text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:bg-cyan-400"
              onClick={() => handleTossChoice("heads")}
            >
              <h2 className="text-xl font-semibold">Pick Heads</h2>
              <p className="mt-2 text-slate-800/90">Choose heads for the toss result.</p>
            </button>
            <button
              type="button"
              className="rounded-3xl border border-slate-700 bg-slate-950 px-6 py-5 text-left text-slate-100 shadow-lg shadow-slate-950/30 transition hover:border-cyan-500 hover:text-cyan-200"
              onClick={() => handleTossChoice("tails")}
            >
              <h2 className="text-xl font-semibold">Pick Tails</h2>
              <p className="mt-2 text-slate-400/90">Choose tails for the toss result.</p>
            </button>
          </section>
        ) : phase === "chooseSide" ? (
          <section className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl border border-slate-700 bg-slate-950 px-6 py-5 text-left text-slate-100 shadow-lg shadow-slate-950/30">
              <p className="text-sm uppercase tracking-[0.35em] text-slate-400">Toss result</p>
              <p className="mt-3 text-lg text-white">You picked {tossPick}.</p>
              <p className="mt-1 text-lg text-white">The toss landed {tossResult}.</p>
              <p className="mt-3 text-slate-300">You won the toss — choose whether to bat or bowl first.</p>
            </div>

            <div className="grid gap-4">
              <button
                type="button"
                className="rounded-3xl bg-cyan-500 px-6 py-5 text-left text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:bg-cyan-400"
                onClick={() => handleSideChoice("batting")}
              >
                <h2 className="text-xl font-semibold">Bat First</h2>
                <p className="mt-2 text-slate-800/90">Choose to bat and set a target in the first innings.</p>
              </button>
              <button
                type="button"
                className="rounded-3xl border border-slate-700 bg-slate-950 px-6 py-5 text-left text-slate-100 shadow-lg shadow-slate-950/30 transition hover:border-cyan-500 hover:text-cyan-200"
                onClick={() => handleSideChoice("bowling")}
              >
                <h2 className="text-xl font-semibold">Bowl First</h2>
                <p className="mt-2 text-slate-400">Choose to bowl and defend the first innings total.</p>
              </button>
            </div>
          </section>
        ) : (
          <section className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
            <div className="space-y-6 rounded-3xl border border-slate-800 bg-slate-950/80 p-6">
              <div>
                <p className="text-sm uppercase tracking-[0.35em] text-cyan-300/80">{headerText}</p>
                <h2 className="mt-3 text-3xl font-semibold text-white">{scoreText}</h2>
                {targetText ? <p className="mt-2 text-slate-400">{targetText}</p> : null}
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {choices.map((choice) => (
                  <button
                    key={choice}
                    type="button"
                    disabled={phase !== "playing"}
                    onClick={() => playBall(choice)}
                    className="rounded-3xl border border-slate-700 bg-slate-900 px-5 py-4 text-lg font-semibold text-white transition hover:border-cyan-400 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {choice}
                  </button>
                ))}
              </div>

                      {phase === "result" ? (
                <div className={`rounded-3xl border p-5 transition duration-500 ${
                  resultType === "win"
                    ? "border-emerald-500/40 bg-emerald-500/15"
                    : resultType === "loss"
                    ? "border-rose-500/40 bg-rose-500/15"
                    : "border-slate-700 bg-slate-900/90"
                }`}> 
                  <div className="relative overflow-hidden rounded-3xl">
                    <div className={`absolute inset-0 ${resultType === "win" ? "animate-confetti" : "animate-pulse-slow"}`} />
                    <div className="relative space-y-4 p-5">
                      <p className="text-sm uppercase tracking-[0.35em] text-slate-300">Match End</p>
                      <h3 className={`text-3xl font-semibold ${
                        resultType === "win" ? "text-emerald-100" : resultType === "loss" ? "text-rose-100" : "text-slate-100"
                      }`}>{resultType === "win" ? "You Won!" : resultType === "loss" ? "You Lost" : "Match Tied"}</h3>
                      <p className="text-lg text-slate-100/90">{result}</p>
                      <button
                        type="button"
                        onClick={resetGame}
                        className="inline-flex rounded-full bg-slate-950/95 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                      >
                        Play again
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-4 text-slate-300">
                  <p>{statusMessage || "Select a number to play the ball."}</p>
                </div>
              )}
            </div>

            <aside className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6">
              <div className="flex items-center justify-between">
                <p className="text-sm uppercase tracking-[0.35em] text-slate-400">Ball history</p>
                <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">{history.length}</span>
              </div>
              <div className="mt-5 space-y-3 max-h-80 overflow-y-auto pr-2 text-slate-300">
                {history.length === 0 ? (
                  <p className="text-sm text-slate-500">Your recent plays will appear here.</p>
                ) : (
                  history.map((item, index) => (
                    <div key={`${item}-${index}`} className="rounded-3xl border border-slate-800 bg-slate-900/70 p-3 text-sm">
                      {item}
                    </div>
                  ))
                )}
              </div>
            </aside>
          </section>
        )}
      </div>
    </main>
  );
}

