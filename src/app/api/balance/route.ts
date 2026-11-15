import { auth } from "@/auth";
import { getBalance } from "@/lib/ledger";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const balance = await getBalance(session.user.id);
  return NextResponse.json({ balance });
}
