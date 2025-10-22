import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { z } from "zod";
const Body = z.object({ orgId: z.string().uuid(), systemId: z.string().uuid(), framework: z.string().default("NIST AI RMF 1.0") });
async function isMember(supabase: any, userId: string, orgId: string) {
  const { data, error } = await supabase.from("members").select("role").eq("user_id", userId).eq("org_id", orgId).maybeSingle();
  if (error) throw error; return !!data;
}
export async function POST(req: NextRequest) {
  const cookieStore = cookies();
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { cookies: { get: (key) => cookieStore.get(key)?.value } });
  const { data: { user }, error: userErr } = await supabase.auth.getUser();
  if (userErr || !user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const json = await req.json();
  const parse = Body.safeParse(json);
  if (!parse.success) return NextResponse.json({ error: parse.error.flatten() }, { status: 400 });
  const member = await isMember(supabase, user.id, parse.data.orgId);
  if (!member) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const { data: ass, error: assErr } = await supabase.from("assessments").insert({ org_id: parse.data.orgId, system_id: parse.data.systemId, framework: parse.data.framework, status: "draft", created_by: user.id }).select("*").single();
  if (assErr) return NextResponse.json({ error: assErr.message }, { status: 500 });
  return NextResponse.json({ assessment: ass });
}
