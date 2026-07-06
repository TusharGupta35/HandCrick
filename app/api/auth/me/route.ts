import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "../../../lib/db";

export async function GET() {
  const cookie = (await cookies()).get("hand-cricket-user");
  const username = cookie?.value;
  if (!username) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) return NextResponse.json({ authenticated: false }, { status: 401 });

  return NextResponse.json({ authenticated: true, user: { username: user.username } });
}
