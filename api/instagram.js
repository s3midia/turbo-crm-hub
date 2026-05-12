export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });

  const { username: rawUsername } = req.body || {};
  if (!rawUsername) return res.status(400).json({ error: "Parâmetro 'username' obrigatório." });

  const username = rawUsername
    .trim()
    .replace(/^@/, '')
    .replace(/.*instagram\.com\//i, '')
    .replace(/\/.*$/, '')
    .toLowerCase();

  if (!username) return res.status(400).json({ error: 'Username inválido.' });

  const apiKey = process.env.SCRAPER_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'SCRAPER_API_KEY não configurada no servidor.' });

  const target = `https://www.instagram.com/${username}/`;
  const proxyUrl =
    `https://api.scraperapi.com/?api_key=${apiKey}` +
    `&url=${encodeURIComponent(target)}&render=true`;

  try {
    const response = await fetch(proxyUrl, {
      signal: AbortSignal.timeout(90_000),
    });

    if (!response.ok) {
      return res.status(502).json({ error: `ScraperAPI retornou ${response.status}` });
    }

    const html = await response.text();

    const photos = extractPhotos(html);
    if (!photos || photos.length === 0) {
      return res.status(404).json({
        error: 'Não foi possível extrair posts. Perfil pode ser privado ou o Instagram alterou o layout.',
      });
    }

    return res.status(200).json({ photos });
  } catch (err) {
    return res.status(500).json({ error: err?.message ?? 'Erro desconhecido' });
  }
}

function extractPhotos(html) {
  // Tentativa 1: _sharedData
  const m1 = html.match(/_sharedData\s*=\s*({.+?});<\/script>/);
  if (m1) {
    try {
      const data = JSON.parse(m1[1]);
      const edges =
        data?.entry_data?.ProfilePage?.[0]?.graphql?.user
          ?.edge_owner_to_timeline_media?.edges ?? [];
      if (edges.length) return mapEdges(edges);
    } catch {}
  }

  // Tentativa 2: __additionalDataLoaded
  const m2 = html.match(/__additionalDataLoaded\(['"][^'"]+['"],\s*({.+?})\);/);
  if (m2) {
    try {
      const data = JSON.parse(m2[1]);
      const edges =
        data?.graphql?.user?.edge_owner_to_timeline_media?.edges ??
        data?.user?.edge_owner_to_timeline_media?.edges ?? [];
      if (edges.length) return mapEdges(edges);
    } catch {}
  }

  return null;
}

function mapEdges(edges) {
  return edges.slice(0, 9).map((e) => ({
    id: String(e.node.id),
    url: e.node.display_url,
    thumbnail: e.node.thumbnail_src || e.node.display_url,
    caption: e.node.edge_media_to_caption?.edges?.[0]?.node?.text?.slice(0, 200) ?? '',
    postUrl: e.node.shortcode ? `https://instagram.com/p/${e.node.shortcode}` : undefined,
  }));
}
