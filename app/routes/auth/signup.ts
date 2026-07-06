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
  if (!normalized) {
    return NextResponse.json({ success: false, message: "Invalid username." }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { username: normalized } });
  if (existing) {
    return NextResponse.json({ success: false, message: "Username already exists." }, { status: 409 });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: {
      username: normalized,
      password: hashedPassword,
    },
  });

  return NextResponse.json({ success: true, message: "Account created successfully." });
}
