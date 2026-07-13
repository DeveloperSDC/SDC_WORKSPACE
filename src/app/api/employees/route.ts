import { NextResponse } from "next/server";
import { db } from "@/lib/db/prisma";

export async function GET() {
  try {
    const employees = await db.employee.findMany({
      include: {
        user: true,
        department: true,
        designation: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(employees);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Failed to fetch employees" },
      { status: 500 }
    );
  }
}