"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
const API_URL = "/api/auth";

type UserRecord = {
  games: number;
  wins: number;
  losses: number;
  bestScore: number;
};

const choices = [1, 2, 3, 4, 5, 6] as const;

type Choice = (typeof choices)[number];
type GamePhase = "playing" | "result";
type GameMode = "batting" | "bowling";
type ResultType = "win" | "loss" | "tie" | null;

const getRandomChoice = () => choices[Math.floor(Math.random() * choices.length)];

export default function GamePage() {
  const router = useRouter();
  const [username, setUsername] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserRecord | null>(null);
  const [phase, setPhase] = useState<GamePhase>("playing");
  const [currentMode, setCurrentMode] = useState<GameMode>("batting");
  const [innings, setInnings] = useState<1 | 2>(1);
  const [balls, setBalls] = useState(0);
  const [userScore, setUserScore] = useState(0);
  const [computerScore, setComputerScore] = useState(0);
  const [userBattingScore, setUserBattingScore] = useState(0);
  const [target, setTarget] = useState<number | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [result, setResult] = useState("");
  const [resultType, setResultType] = useState<ResultType>(null);
  const [statusMessage, setStatusMessage] = useState("You are batting first. Choose your number.");

  useEffect(() => {
    let active = true;
    const check = async () => {
      const res = await fetch(`${API_URL}/me`);
      if (!active) return;
      if (!res.ok) {
        router.replace("/");
        return;
      }
      const body = await res.json();
      setUsername(body.user.username);
      // fetch profile stats from server
      const stats = await fetch(`/api/user/stats/${body.user.username}`);
      if (!active) return;
      if (stats.ok) {
        const s = await stats.json();
        setProfile(s);
      }
    };

    check();

    return () => {
      active = false;
    };
  }, [router]);

  const resetGame = () => {
    setPhase("playing");
    setCurrentMode("batting");
    setInnings(1);
    setBalls(0);
    setUserScore(0);
    setComputerScore(0);
    setUserBattingScore(0);
    setTarget(null);
    setHistory([]);
    setResult("");
    setResultType(null);
    setStatusMessage("You are batting first. Choose your number.");
  };

  const addHistory = (entry: string) => setHistory((prev) => [entry, ...prev]);

  const finishFirstInnings = () => {
    if (currentMode === "batting") {
      setUserBattingScore(userScore);
    }

    const firstScore = currentMode === "batting" ? userScore : computerScore;
    const chaseTarget = firstScore + 1;
    setTarget(chaseTarget);
    setInnings(2);
    setBalls(0);
    setUserScore(0);
    setComputerScore(0);
    setCurrentMode(currentMode === "batting" ? "bowling" : "batting");
    setHistory([]);
    setResult("");
    setResultType(null);
    setPhase("playing");
    setStatusMessage(
      currentMode === "batting"
        ? `Second innings: chase ${chaseTarget} runs.`
        : `Second innings: defend ${chaseTarget} runs.`
    );
  };

  const recordResult = (message: string, type: ResultType) => {
    const finalRuns = userBattingScore;
    if (username && type) {
      (async () => {
        await fetch(`/api/user/game`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, result: type, runs: finalRuns }),
        });
        const stats = await fetch(`/api/user/stats/${username}`);
        if (stats.ok) {
          const s = await stats.json();
          setProfile(s);
        }
      })();
    }
    setResult(message);
    setResultType(type);
    setPhase("result");
  };

  const playBall = (choice: Choice) => {
    if (phase !== "playing") return;

    const computerChoice = getRandomChoice();
    const nextBalls = balls + 1;
    const isOut = choice === computerChoice;
    const baseEntry = `You chose ${choice}, computer chose ${computerChoice}.`;

    if (currentMode === "batting") {
      if (isOut) {
        addHistory(`${baseEntry} Out!`);
        if (innings === 1) {
          setUserBattingScore(userScore);
          finishFirstInnings();
          return;
        }

        if (target !== null) {
          setUserBattingScore(userScore);
          if (userScore >= target) {
            recordResult(`You won by chasing ${target} runs before the wicket.`, "win");
          } else {
            recordResult(`You lost. Scored ${userScore} and were out.`, "loss");
          }
          return;
        }
      }

      const nextScore = userScore + choice;
      setUserScore(nextScore);
      setUserBattingScore(nextScore);
      setBalls(nextBalls);
      addHistory(`${baseEntry} +${choice} run${choice === 1 ? "" : "s"}`);

      if (target !== null && nextScore >= target) {
        recordResult(`You won by chasing ${target} runs!`, "win");
        return;
      }

      if (nextBalls >= 6) {
        if (innings === 1) {
          finishFirstInnings();
        } else {
          if (userScore >= (target ?? 0)) {
            recordResult(`You won by scoring ${userScore} runs.`, "win");
          } else if (userScore === (target ?? 0) - 1) {
            recordResult("Match tied.", "tie");
          } else {
            recordResult(`You lost. You scored ${userScore} and missed the target.`, "loss");
          }
        }
      }
      return;
    }

    if (currentMode === "bowling") {
      if (isOut) {
        addHistory(`${baseEntry} Out!`);
        if (innings === 1) {
          finishFirstInnings();
          return;
        }

        if (target !== null) {
          if (computerScore >= target) {
            recordResult(`Computer won by chasing ${target} runs before the wicket.`, "loss");
          } else {
            recordResult(`You won! Computer was out for ${computerScore}.`, "win");
          }
          return;
        }
      }

      const nextScore = computerScore + computerChoice;
      setComputerScore(nextScore);
      setBalls(nextBalls);
      addHistory(`${baseEntry} +${computerChoice} run${computerChoice === 1 ? "" : "s"}`);

      if (target !== null && nextScore >= target) {
        recordResult(`Computer won by chasing ${target} runs!`, "loss");
        return;
      }

      if (nextBalls >= 6) {
        if (innings === 1) {
          finishFirstInnings();
        } else {
          if (computerScore >= (target ?? 0)) {
            recordResult(`Computer won by scoring ${computerScore} runs.`, "loss");
          } else if (computerScore === (target ?? 0) - 1) {
            recordResult("Match tied.", "tie");
          } else {
            recordResult(`You won! Computer scored ${computerScore} and could not reach ${target}.`, "win");
          }
        }
      }
    }
  };

  const handleLogout = () => {
    (async () => {
      await fetch(`${API_URL}/logout`, { method: "POST" });
      router.push("/");
    })();
  };

  const scoreText = currentMode === "batting"
    ? `Your score: ${userScore} in ${balls} ball${balls === 1 ? "" : "s"}`
    : `Computer score: ${computerScore} in ${balls} ball${balls === 1 ? "" : "s"}`;

  const targetText = target !== null ? `Target: ${target}` : "";

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 px-6 py-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 text-slate-100 shadow-lg shadow-slate-950/40">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <p className="text-sm uppercase tracking-[0.35em] text-cyan-300/80">Player</p>
              <h1 className="text-4xl font-semibold text-white">{username}</h1>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => router.push("/")}
                className="rounded-full border border-slate-700 bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:border-cyan-400"
              >
                Home
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-full bg-rose-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-rose-400"
              >
                Logout
              </button>
            </div>
          </div>
          {profile ? (
            <div className="mt-6 grid gap-3 sm:grid-cols-4">
              <div className="rounded-3xl bg-slate-950/80 p-4 text-slate-300">
                <p className="text-sm uppercase tracking-[0.35em] text-slate-500">Games</p>
                <p className="mt-2 text-2xl font-semibold text-white">{profile.games}</p>
              </div>
              <div className="rounded-3xl bg-slate-950/80 p-4 text-slate-300">
                <p className="text-sm uppercase tracking-[0.35em] text-slate-500">Wins</p>
                <p className="mt-2 text-2xl font-semibold text-emerald-300">{profile.wins}</p>
              </div>
              <div className="rounded-3xl bg-slate-950/80 p-4 text-slate-300">
                <p className="text-sm uppercase tracking-[0.35em] text-slate-500">Losses</p>
                <p className="mt-2 text-2xl font-semibold text-rose-300">{profile.losses}</p>
              </div>
              <div className="rounded-3xl bg-slate-950/80 p-4 text-slate-300">
                <p className="text-sm uppercase tracking-[0.35em] text-slate-500">Best Score</p>
                <p className="mt-2 text-2xl font-semibold text-cyan-300">{profile.bestScore}</p>
              </div>
            </div>
          ) : null}
        </header>

        <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
          <section className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl shadow-slate-950/20">
            <div className="space-y-5">
              <div>
                <p className="text-sm uppercase tracking-[0.35em] text-cyan-300/80">{currentMode === "batting" ? "Batting" : "Bowling"}</p>
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
                    className="rounded-3xl border border-slate-700 bg-slate-950 px-5 py-4 text-lg font-semibold text-white transition hover:border-cyan-400 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
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
                  <p>{statusMessage}</p>
                </div>
              )}
            </div>
          </section>

          <aside className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6 shadow-xl shadow-slate-950/10">
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
        </div>
      </div>
    </main>
  );
}
