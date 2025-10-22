// app/api/orgs/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { z } from "zod";

const Body = z.object({
  name: z.string().min(2),
  sector: z.string().optional(),
  country: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: { get: (key) => cookieStore.get(key)?.value },
      // recebe o token do cliente (Bearer ...)
      global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
    }
  );

  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();
  if (userErr || !user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const json = await req.json();
  const parse = Body.safeParse(json);
  if (!parse.success) return NextResponse.json({ error: parse.error.flatten() }, { status: 400 });

  const { data: org, error: orgErr } = await supabase
    .from("organizations")
    .insert({
      name: parse.data.name,
      sector: parse.data.sector ?? null,
      country: parse.data.country ?? null,
      created_by: user.id,
    })
    .select("*")
    .single();

  if (orgErr) return NextResponse.json({ error: orgErr.message }, { status: 500 });

  // adiciona quem criou como owner
  await supabase.from("members").insert({ user_id: user.id, org_id: org.id, role: "owner" });

  return NextResponse.json({ org });
}
