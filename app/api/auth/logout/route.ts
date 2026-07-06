import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ success: true, message: "Logged out." });
  (await cookies()).set("hand-cricket-user", "", { path: "/", maxAge: 0 });
  return response;
}
