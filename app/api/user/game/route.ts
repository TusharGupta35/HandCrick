import { NextResponse } from "next/server";
import { prisma } from "../../../lib/db";

export async function POST(request: Request) {
  const body = await request.json();
  const { username, result, runs } = body as { username: string; result: string; runs: number };
  if (!username) return NextResponse.json({ success: false }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) return NextResponse.json({ success: false }, { status: 404 });

  const data: any = {
    games: { increment: 1 },
    totalRuns: { increment: runs },
  };

  if (result === "win") data.wins = { increment: 1 };
  if (result === "loss") data.losses = { increment: 1 };
  if (runs > user.bestScore) data.bestScore = runs;

  const updated = await prisma.user.update({ where: { username }, data });

  await prisma.game.create({ data: { userId: user.id, result, runs } });

  return NextResponse.json({ success: true });
}
