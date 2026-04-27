import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/session";
import { sendTestNotification } from "@/lib/notifications";

export async function POST() {
  await requireAdminSession();
  const result = await sendTestNotification();

  return NextResponse.json(result);
}
