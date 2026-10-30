import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// A tiny health check. A scheduled visit keeps the free Supabase project awake.
export async function GET() {
  const supabase = await createClient();
  const { error } = await supabase.rpc("ping");
  return NextResponse.json({ ok: !error }, { status: error ? 503 : 200 });
}