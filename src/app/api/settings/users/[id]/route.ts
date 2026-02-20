import { NextResponse } from "next/server";

import { usersService } from "@/app/(dashboard)/settings/_lib/users.service";
import { getCurrentUser } from "@/lib/auth";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ error: "ID non valido" }, { status: 400 });
  }

  try {
    await usersService.deleteUser(id, user.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "SELF_DELETE") {
        return NextResponse.json({ error: "Non puoi rimuovere il tuo account" }, { status: 403 });
      }
      if (error.message === "LAST_ADMIN") {
        return NextResponse.json(
          { error: "Deve rimanere almeno un Admin nel sistema" },
          { status: 400 },
        );
      }
    }
    return NextResponse.json({ error: "Errore interno" }, { status: 500 });
  }
}
