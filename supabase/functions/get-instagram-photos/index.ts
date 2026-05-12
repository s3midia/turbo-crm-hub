import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const CACHE_TTL_HOURS = 24;
const MAX_POSTS = 9;

interface Photo {
  id: string;
  url: string;
  thumbnail: string;
  caption: string;
  postUrl?: string;
}

function normalizeUsername(input: string): string {
  return input
    .trim()
    .replace(/^@/, "")
    .replace(/.*instagram\.com\//i, "")
    .replace(/\/.*$/, "")
    .toLowerCase();
}

function extractFromSharedData(html: string): Photo[] | null {
  const m = html.match(/_sharedData\s*=\s*({.+?});<\/script>/);
  if (!m) return null;
  try {
    const data = JSON.parse(m[1]);
    const edges =
      data?.entry_data?.ProfilePage?.[0]?.graphql?.user
        ?.edge_owner_to_timeline_media?.edges ?? [];
    return edges.slice(0, MAX_POSTS).map((e: any) => ({
      id: String(e.node.id),
      url: e.node.display_url,
      thumbnail: e.node.thumbnail_src || e.node.display_url,
      caption: e.node.edge_media_to_caption?.edges?.[0]?.node?.text?.slice(0, 200) ?? "",
      postUrl: e.node.shortcode ? `https://instagram.com/p/${e.node.shortcode}` : undefined,
    }));
  } catch {
    return null;
  }
}

function extractFromAdditionalData(html: string): Photo[] | null {
  // Fallback: posts mais novos usam __additionalDataLoaded
  const m = html.match(/__additionalDataLoaded\(['"][^'"]+['"],\s*({.+?})\);/);
  if (!m) return null;
  try {
    const data = JSON.parse(m[1]);
    const edges =
      data?.graphql?.user?.edge_owner_to_timeline_media?.edges ??
      data?.user?.edge_owner_to_timeline_media?.edges ??
      [];
    return edges.slice(0, MAX_POSTS).map((e: any) => ({
      id: String(e.node.id),
      url: e.node.display_url,
      thumbnail: e.node.thumbnail_src || e.node.display_url,
      caption: e.node.edge_media_to_caption?.edges?.[0]?.node?.text?.slice(0, 200) ?? "",
      postUrl: e.node.shortcode ? `https://instagram.com/p/${e.node.shortcode}` : undefined,
    }));
  } catch {
    return null;
  }
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { username: rawUsername, force } = await req.json().catch(() => ({}));
    if (!rawUsername || typeof rawUsername !== "string") {
      return new Response(
        JSON.stringify({ error: "Parâmetro 'username' obrigatório." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const username = normalizeUsername(rawUsername);
    if (!username) {
      return new Response(
        JSON.stringify({ error: "Username inválido." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

    // 1) Cache lookup
    if (!force) {
      const { data: cached } = await supabase
        .from("instagram_cache")
        .select("posts, fetched_at")
        .eq("username", username)
        .maybeSingle();

      if (cached) {
        const ageMs = Date.now() - new Date(cached.fetched_at).getTime();
        if (ageMs < CACHE_TTL_HOURS * 3600_000) {
          return new Response(
            JSON.stringify({ photos: cached.posts, cached: true }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } },
          );
        }
      }
    }

    // 2) Scrape via ScraperAPI
    const apiKey = Deno.env.get("SCRAPER_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "SCRAPER_API_KEY não configurada no servidor." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const target = `https://www.instagram.com/${username}/`;
    const proxyUrl =
      `https://api.scraperapi.com/?api_key=${apiKey}` +
      `&url=${encodeURIComponent(target)}&render=true`;

    const res = await fetch(proxyUrl, { signal: AbortSignal.timeout(90_000) });
    if (!res.ok) {
      return new Response(
        JSON.stringify({ error: `ScraperAPI retornou ${res.status}` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const html = await res.text();

    const photos =
      extractFromSharedData(html) ?? extractFromAdditionalData(html);

    if (!photos || photos.length === 0) {
      return new Response(
        JSON.stringify({
          error: "Não foi possível extrair posts. Perfil pode ser privado, inexistente ou Instagram alterou o layout.",
        }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // 3) Cache upsert
    await supabase.from("instagram_cache").upsert({
      username,
      posts: photos,
      fetched_at: new Date().toISOString(),
    });

    return new Response(
      JSON.stringify({ photos, cached: false }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err?.message ?? "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
