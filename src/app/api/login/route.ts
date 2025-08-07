import { NextRequest, NextResponse } from "next/server";
import { compare } from "bcryptjs";
import { sign } from "jsonwebtoken";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    // Validate input
    if (!username || !password) {
      return NextResponse.json({ error: "Username and password are required" }, { status: 400 });
    }

    // Find user by username
    const user = await prisma.user.findUnique({ where: { username } });

    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Compare passwords
    const isPasswordValid = await compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Generate JWT token
    const token = sign(
      { userId: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: "1d" } // Token expires in 1 day
    );

    // Create response with token and user data
    const response = NextResponse.json({
      token,
      user: { id: user.id, username: user.username, role: user.role },
    });

    // Set HTTP-only cookie with the token
    response.cookies.set({
      name: "token",
      value: token,
      domain: process.env.COOKIES_DOMAIN,
      // httpOnly: true,
      // secure: process.env.NODE_ENV === "production",
      // sameSite: "strict",
      maxAge: 86400, // 1 day in seconds
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
