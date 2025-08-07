import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getToday } from "@/lib/getToday";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const service = await prisma.groceryService.update({
      where: { id: params.id },
      data: {
        isDone: true,
        doneAt: getToday(),
      },
    });
    return NextResponse.json(service);
  } catch (error) {
    return NextResponse.json({ error: "Error updating service" }, { status: 500 });
  }
}
