import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;

  if (!username) {
    return NextResponse.json({ games: 0, wins: 0, losses: 0, bestScore: 0 }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) return NextResponse.json({ games: 0, wins: 0, losses: 0, bestScore: 0 });

  return NextResponse.json({ games: user.games, wins: user.wins, losses: user.losses, bestScore: user.bestScore });
}
