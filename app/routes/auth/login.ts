import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "../../lib/db";

export async function POST(request: Request) {
  const body = await request.json();
  const { username, password } = body as { username?: string; password?: string };

  if (!username || !password) {
    return NextResponse.json({ success: false, message: "Username and password are required." }, { status: 400 });
  }

  const normalized = username.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { username: normalized } });
  if (!user) {
    return NextResponse.json({ success: false, message: "User not found." }, { status: 404 });
  }

  const passwordMatches = await bcrypt.compare(password, user.password);
  if (!passwordMatches) {
    return NextResponse.json({ success: false, message: "Incorrect password." }, { status: 401 });
  }

  (await cookies()).set("hand-cricket-user", normalized, { path: "/", maxAge: 60 * 60 * 24 * 30 });

  return NextResponse.json({ success: true, message: "Login successful.", user: { username: user.username } });
}
