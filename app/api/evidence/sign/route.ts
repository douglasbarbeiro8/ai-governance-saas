// app/api/evidence/sign/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { z } from "zod";

const Body = z.object({
  assessmentId: z.string().uuid(),
  questionId: z.number().int().positive(),
  filename: z.string().min(1),
  mime: z.string().min(3),
});

const BUCKET = "evidence";

async function getAssessmentOrg(supabase: any, assessmentId: string) {
  const { data, error } = await supabase
    .from("assessments")
    .select("org_id")
    .eq("id", assessmentId)
    .single();
  if (error) throw error;
  return data.org_id as string;
}

async function isMemberOfOrg(supabase: any, userId: string, orgId: string) {
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

  // Client com sessão do usuário (via cookie + Authorization)
  const client = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: { get: (key) => cookieStore.get(key)?.value },
      global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
    }
  );

  const {
    data: { user },
    error: userErr,
  } = await client.auth.getUser();
  if (userErr || !user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const json = await req.json();
  const parse = Body.safeParse(json);
  if (!parse.success) return NextResponse.json({ error: parse.error.flatten() }, { status: 400 });

  const orgId = await getAssessmentOrg(client, parse.data.assessmentId);
  const ok = await isMemberOfOrg(client, user.id, orgId);
  if (!ok) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  // Service Role para assinar upload e gravar trilha de evidência (somente no servidor)
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  const ts = Date.now();
  const rand = Math.random().toString(36).slice(2, 10);
  const safeName = parse.data.filename.replace(/[^a-zA-Z0-9_.-]/g, "_");
  const path = `org_${orgId}/ass_${parse.data.assessmentId}/q_${parse.data.questionId}/${ts}-${rand}-${safeName}`;

  const { data: signed, error: signErr } = await admin.storage
    .from(BUCKET)
    .createSignedUploadUrl(path);
  if (signErr) return NextResponse.json({ error: signErr.message }, { status: 500 });

  await admin.from("evidence").insert({
    org_id: orgId,
    assessment_id: parse.data.assessmentId,
    question_id: parse.data.questionId,
    storage_path: path,
    uploaded_by: user.id,
  });

  return NextResponse.json({
    uploadUrl: signed.signedUrl,
    token: signed.token,
    storagePath: path,
  });
}
