// app/api/systems/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { z } from "zod";

const Body = z.object({
  orgId: z.string().uuid(),
  name: z.string().min(2),
  riskLevel: z.string().optional(),
  description: z.string().optional(),
  owner: z.string().optional(),
});

async function isMember(supabase: any, userId: string, orgId: string) {
  const { data, error } = await supabase
    .from("members")
    .select("role")
    .eq("user_id", userId)
    .eq("org_id", orgId)
    .maybeSingle();
  if (error) throw error;
  return !!data;
}

export async function POST(req: NextRequest) {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (key) => cookieStore.get(key)?.value } }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const json = await req.json();
  const parse = Body.safeParse(json);
  if (!parse.success) return NextResponse.json({ error: parse.error.flatten() }, { status: 400 });

  const member = await isMember(supabase, user.id, parse.data.orgId);
  if (!member) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { data: system, error: sysErr } = await supabase
    .from("systems")
    .insert({
      org_id: parse.data.orgId,
      name: parse.data.name,
      risk_level: parse.data.riskLevel ?? null,
      description: parse.data.description ?? null,
      owner: parse.data.owner ?? null,
    })
    .select("*")
    .single();

  if (sysErr) return NextResponse.json({ error: sysErr.message }, { status: 500 });
  return NextResponse.json({ system });
}
