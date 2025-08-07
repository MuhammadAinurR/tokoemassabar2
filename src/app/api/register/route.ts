import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { sign } from "jsonwebtoken";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (typeof username !== "string" || typeof password !== "string") {
      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({ where: { username } });

    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 409 }
      );
    }

    const hashedPassword = await hash(password, 12);

    const newUser = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
      },
    });

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error("JWT_SECRET is not defined");
    }

    const token = sign(
      { userId: newUser.id, username: newUser.username },
      jwtSecret,
      { expiresIn: "1d" }
    );

    return NextResponse.json({
      token,
      user: { id: newUser.id, username: newUser.username },
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
