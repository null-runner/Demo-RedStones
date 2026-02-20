import { NextResponse } from "next/server";
import { z } from "zod/v3";

import { usersService } from "@/app/(dashboard)/settings/_lib/users.service";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const users = await usersService.getAllUsers();
  return NextResponse.json(users, { status: 200 });
}

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(["admin", "member"]),
});

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = inviteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dati non validi", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const { email, role } = parsed.data;

  try {
    const newUser = await usersService.inviteUser(email, role);
    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Email già registrata nel sistema") {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    return NextResponse.json({ error: "Errore interno" }, { status: 500 });
  }
}
