import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
// ...

export async function POST(req: NextRequest) {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: { get: (key) => cookieStore.get(key)?.value },
      // <<< linha nova: repassa o Authorization do cliente
      global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
    }
  );

  // ... resto igual
}
