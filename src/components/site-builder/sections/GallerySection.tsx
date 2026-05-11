import React from 'react';
import { Instagram, ExternalLink } from 'lucide-react';

interface GalleryPost {
  url: string;
  thumbnail: string;
  caption: string;
  postUrl?: string;
}

interface Props {
  data: Record<string, any>;
  colors: { primary: string; secondary: string };
  theme: 'light' | 'dark';
  fonts: { heading: string; body: string };
  editMode?: boolean;
  onSlotChange?: (key: string, value: any) => void;
}

export function GallerySection({ data, colors, theme, fonts }: Props) {
  const posts: GalleryPost[] = (data.posts || []).filter((p: GalleryPost) => p.url || p.thumbnail);
  if (posts.length === 0) return null;

  const isDark = theme === 'dark';
  const handle = (data.handle || '').replace('@', '');

  const cols =
    posts.length >= 6 ? 'grid-cols-2 md:grid-cols-3' :
    posts.length === 4 ? 'grid-cols-2' :
    'grid-cols-3';

  return (
    <section className={`py-20 px-6 ${isDark ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-10">
          <h2 className="text-3xl font-bold" style={{ fontFamily: fonts.heading }}>
            {data.titulo || 'Nossa Galeria'}
          </h2>
          {handle && (
            <a
              href={`https://instagram.com/${handle}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm font-medium hover:underline"
              style={{ color: colors.primary }}
            >
              <Instagram className="h-4 w-4" />
              @{handle}
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>

        <div className={`grid gap-3 ${cols}`}>
          {posts.slice(0, 9).map((post, i) => (
            <a
              key={i}
              href={post.postUrl || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative aspect-square rounded-xl overflow-hidden block bg-gray-100"
            >
              <img
                src={post.thumbnail || post.url}
                alt={post.caption || `Foto ${i + 1}`}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              {post.caption && (
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-end">
                  <p className="text-white text-xs p-3 translate-y-full group-hover:translate-y-0 transition-transform line-clamp-2">
                    {post.caption}
                  </p>
                </div>
              )}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
