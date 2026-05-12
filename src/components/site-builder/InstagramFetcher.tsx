import React, { useRef, useState } from 'react';
import {
  Search, Instagram, CheckCircle2, Loader2, X,
  ImageIcon, AlertCircle, Plus, Upload, Link as LinkIcon,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export interface InstagramPost {
  url: string;
  thumbnail: string;
  caption: string;
  selected: boolean;
  postUrl?: string;
}

interface Props {
  posts: InstagramPost[];
  handle: string;
  onHandleChange: (handle: string) => void;
  onPostsChange: (posts: InstagramPost[]) => void;
}

async function fetchViaEdgeFunction(
  username: string,
  onStatus: (s: string) => void,
): Promise<InstagramPost[]> {
  onStatus('Buscando posts (cache + scraper)...');
  const { data, error } = await supabase.functions.invoke('get-instagram-photos', {
    body: { username },
  });

  if (error) throw new Error(error.message || 'Falha ao invocar edge function');
  if (data?.error) throw new Error(data.error);
  const photos: any[] = data?.photos ?? [];
  if (photos.length === 0) throw new Error('Perfil não encontrado ou sem posts públicos.');

  onStatus(data?.cached ? 'Carregado do cache.' : 'Processando posts...');

  return photos.slice(0, 9).map((p: any) => ({
    url: p.url || p.thumbnail || '',
    thumbnail: p.thumbnail || p.url || '',
    caption: (p.caption || '').slice(0, 80),
    selected: true,
    postUrl: p.postUrl || '',
  }));
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target?.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

type AddTab = 'upload' | 'url' | 'instagram';

export function InstagramFetcher({ posts, handle, onHandleChange, onPostsChange }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [addTab, setAddTab] = useState<AddTab>('upload');
  const [loading, setLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [manualUrl, setManualUrl] = useState('');

  /* ── Upload de arquivos ────────────────────────────── */
  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploadLoading(true);
    const newPosts: InstagramPost[] = [];
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue;
      try {
        const dataUrl = await readFileAsDataUrl(file);
        newPosts.push({ url: dataUrl, thumbnail: dataUrl, caption: file.name.replace(/\.[^.]+$/, ''), selected: true });
      } catch { /* skip */ }
    }
    onPostsChange([...posts, ...newPosts]);
    setUploadLoading(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  /* ── URL manual ────────────────────────────────────── */
  const addManualPhoto = () => {
    const url = manualUrl.trim();
    if (!url) return;
    onPostsChange([...posts, { url, thumbnail: url, caption: '', selected: true }]);
    setManualUrl('');
  };

  /* ── Apify/Instagram ───────────────────────────────── */
  const handleSearch = async () => {
    if (!handle.trim()) return;
    const username = handle.replace('@', '').replace(/.*instagram\.com\//, '').replace(/\/$/, '');
    setLoading(true);
    setError('');
    setStatus('');
    try {
      const fetched = await fetchViaEdgeFunction(username, setStatus);
      onPostsChange([...posts, ...fetched]);
      setStatus('');
    } catch (e: any) {
      setError(e.message || 'Erro desconhecido');
      setStatus('');
    } finally {
      setLoading(false);
    }
  };

  const togglePost = (i: number) => {
    const updated = [...posts];
    updated[i] = { ...updated[i], selected: !updated[i].selected };
    onPostsChange(updated);
  };

  const removePost = (i: number) => onPostsChange(posts.filter((_, idx) => idx !== i));
  const selectedCount = posts.filter(p => p.selected).length;

  const TAB_BUTTONS: { id: AddTab; icon: React.ElementType; label: string }[] = [
    { id: 'upload',    icon: Upload,    label: 'Arquivo' },
    { id: 'url',       icon: LinkIcon,  label: 'URL' },
    { id: 'instagram', icon: Instagram, label: 'Instagram' },
  ];

  return (
    <div className="space-y-3">

      {/* Tabs de método */}
      <div className="flex bg-wa-bg-subtle rounded-xl p-1 border border-wa-border gap-1">
        {TAB_BUTTONS.map(tab => (
          <button
            key={tab.id}
            onClick={() => { setAddTab(tab.id); setError(''); }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all ${
              addTab === tab.id
                ? 'bg-white dark:bg-wa-surface shadow-sm text-wa-text-main border border-wa-border'
                : 'text-wa-text-muted hover:text-wa-text-main'
            }`}
          >
            <tab.icon className="h-3.5 w-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Aba: Upload de arquivo ── */}
      {addTab === 'upload' && (
        <div
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
          onClick={() => fileRef.current?.click()}
          className="cursor-pointer group"
        >
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={e => handleFiles(e.target.files)}
          />
          <div className="w-full h-28 rounded-xl border-2 border-dashed border-wa-border bg-wa-bg-subtle flex flex-col items-center justify-center gap-2 group-hover:border-primary/50 group-hover:bg-primary/5 transition-colors">
            {uploadLoading ? (
              <Loader2 className="h-6 w-6 text-primary animate-spin" />
            ) : (
              <>
                <Upload className="h-6 w-6 text-wa-text-muted" />
                <span className="text-sm text-wa-text-muted">Arraste fotos ou clique para selecionar</span>
                <span className="text-xs text-wa-text-muted opacity-60">PNG, JPG, WebP — múltiplos arquivos</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Aba: URL manual ── */}
      {addTab === 'url' && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              value={manualUrl}
              onChange={e => setManualUrl(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addManualPhoto()}
              placeholder="https://... (URL direta de imagem)"
              className="flex-1 text-sm px-3 py-2.5 rounded-lg bg-wa-bg-subtle border border-wa-border focus:outline-none focus:ring-2 focus:ring-primary/30 text-wa-text-main"
            />
            <button
              onClick={addManualPhoto}
              disabled={!manualUrl.trim()}
              className="px-4 py-2.5 rounded-lg bg-primary text-white text-sm font-medium disabled:opacity-40 flex items-center gap-1.5"
            >
              <Plus className="h-4 w-4" /> Adicionar
            </button>
          </div>
          <p className="text-[11px] text-wa-text-muted">
            Cole o link direto de qualquer imagem pública (Dropbox, Drive com permissão, CDN, etc).
          </p>
        </div>
      )}

      {/* ── Aba: Instagram ── */}
      {addTab === 'instagram' && (
        <div className="space-y-3">
          <>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-wa-text-muted" />
                  <input
                    value={handle}
                    onChange={e => { onHandleChange(e.target.value); setError(''); }}
                    onKeyDown={e => e.key === 'Enter' && !loading && handleSearch()}
                    placeholder="@perfil ou link do Instagram"
                    disabled={loading}
                    className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg bg-wa-bg-subtle border border-wa-border focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-60"
                  />
                </div>
                <button
                  onClick={handleSearch}
                  disabled={loading || !handle.trim()}
                  className="px-4 py-2.5 rounded-lg bg-primary text-white text-sm font-medium disabled:opacity-40 flex items-center gap-1.5"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  {loading ? 'Buscando...' : 'Buscar'}
                </button>
              </div>
              {loading && status && (
                <div className="flex items-center gap-2 text-xs text-wa-text-muted p-2 bg-wa-bg-subtle rounded-lg border border-wa-border">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-primary flex-shrink-0" />
                  <span>{status} — pode levar até 90s</span>
                </div>
              )}
              {error && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <div>
                    <span>{error}</span>
                    <button onClick={() => { setError(''); onHandleChange(''); }} className="block text-xs underline mt-1 text-red-500">Limpar e tentar outro @</button>
                  </div>
                </div>
              )}
            </>
        </div>
      )}

      {/* Grade de posts */}
      {posts.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-wa-text-muted">
              {posts.length} {posts.length === 1 ? 'foto' : 'fotos'} · {selectedCount} para galeria
            </span>
            <div className="flex gap-2">
              <button onClick={() => onPostsChange(posts.map(p => ({ ...p, selected: true })))} className="text-xs text-primary hover:underline">Todas</button>
              <span className="text-wa-border">|</span>
              <button onClick={() => onPostsChange(posts.map(p => ({ ...p, selected: false })))} className="text-xs text-wa-text-muted hover:underline">Nenhuma</button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            {posts.map((post, i) => (
              <div
                key={i}
                className={`relative group aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${post.selected ? 'border-primary' : 'border-transparent opacity-50'}`}
                onClick={() => togglePost(i)}
              >
                {post.thumbnail ? (
                  <img src={post.thumbnail} alt={post.caption} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-wa-bg-subtle flex items-center justify-center">
                    <ImageIcon className="h-6 w-6 text-wa-text-muted" />
                  </div>
                )}
                {post.selected && (
                  <div className="absolute top-1 right-1 bg-primary text-white rounded-full p-0.5">
                    <CheckCircle2 className="h-3 w-3" />
                  </div>
                )}
                <button
                  onClick={e => { e.stopPropagation(); removePost(i); }}
                  className="absolute top-1 left-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
              </div>
            ))}
          </div>
          <p className="text-[11px] text-wa-text-muted">Fotos selecionadas aparecerão na galeria do site gerado.</p>
        </div>
      )}

      {/* Dica quando vazio */}
      {posts.length === 0 && addTab !== 'instagram' && (
        <p className="text-[11px] text-wa-text-muted">Esta etapa é opcional. Sem fotos, o site é gerado sem seção de galeria.</p>
      )}
    </div>
  );
}
