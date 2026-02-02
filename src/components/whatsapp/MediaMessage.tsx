import { useState } from 'react';
import { FileText, Image as ImageIcon, Video, Mic, Download, MapPin, User, ImageOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AudioPlayer } from './AudioPlayer';

interface MediaMessageProps {
  message: any;
  messageType: string;
  fromMe?: boolean;
}

// Helper function to fix .enc file extensions
const handleDownload = (fileUrl: string, fileName: string, mimeType?: string) => {
  const link = document.createElement('a');
  link.href = fileUrl;
  
  let finalName = fileName || 'download';
  
  // If file ends in .enc or has no extension, fix based on MIME type
  if (finalName.endsWith('.enc') || !finalName.includes('.')) {
    const baseName = finalName.replace('.enc', '');
    
    if (mimeType?.includes('video/mp4')) finalName = baseName + '.mp4';
    else if (mimeType?.includes('video/webm')) finalName = baseName + '.webm';
    else if (mimeType?.includes('video/quicktime')) finalName = baseName + '.mov';
    else if (mimeType?.includes('pdf')) finalName = baseName + '.pdf';
    else if (mimeType?.includes('image/jpeg')) finalName = baseName + '.jpg';
    else if (mimeType?.includes('image/png')) finalName = baseName + '.png';
    else if (mimeType?.includes('image/webp')) finalName = baseName + '.webp';
    else if (mimeType?.includes('image/gif')) finalName = baseName + '.gif';
    else if (mimeType?.includes('spreadsheet') || mimeType?.includes('excel')) finalName = baseName + '.xlsx';
    else if (mimeType?.includes('document') || mimeType?.includes('word')) finalName = baseName + '.docx';
    else if (mimeType?.includes('audio/mpeg') || mimeType?.includes('audio/mp3')) finalName = baseName + '.mp3';
    else if (mimeType?.includes('audio/ogg')) finalName = baseName + '.ogg';
    else if (mimeType?.includes('audio/wav')) finalName = baseName + '.wav';
  }
  
  link.setAttribute('download', finalName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const MediaMessage = ({ message, messageType, fromMe = false }: MediaMessageProps) => {
  const [imageError, setImageError] = useState(false);
  
  // Extract media data based on message type - Evolution API format
  const getMediaData = () => {
    const msgData = message?.[messageType];
    if (!msgData) return { url: null, mimeType: null, base64: null };
    
    // Evolution API can return URL or base64
    const url = msgData.url || null;
    const mimeType = msgData.mimetype || msgData.mimeType || null;
    const base64 = msgData.base64 || null;
    
    return { url, mimeType, base64 };
  };

  // Get displayable URL - either direct URL or base64 data URI
  const getDisplayUrl = () => {
    const { url, mimeType, base64 } = getMediaData();
    
    // If we have base64, convert to data URI
    if (base64) {
      const mime = mimeType || 'application/octet-stream';
      // Check if base64 already includes data URI prefix
      if (base64.startsWith('data:')) {
        return base64;
      }
      return `data:${mime};base64,${base64}`;
    }
    
    return url;
  };

  const { mimeType } = getMediaData();
  const mediaUrl = getDisplayUrl();
  const caption = message?.imageMessage?.caption || 
                  message?.videoMessage?.caption || 
                  message?.documentMessage?.fileName ||
                  '';

  switch (messageType) {
    case 'imageMessage':
      return (
        <div className="space-y-2">
          {mediaUrl && !imageError ? (
            <img 
              src={mediaUrl} 
              alt="Imagem" 
              className="max-w-[280px] rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => window.open(mediaUrl, '_blank')}
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="flex items-center gap-2 p-3 bg-wa-surface rounded-lg">
              <ImageOff className="h-5 w-5 text-wa-text-muted" />
              <span className="text-sm text-wa-text-main">📷 Imagem indisponível</span>
            </div>
          )}
          {caption && <p className="text-sm">{caption}</p>}
        </div>
      );

    case 'videoMessage':
      return (
        <div className="space-y-2">
          {mediaUrl ? (
            <div className="relative">
              <video 
                src={mediaUrl} 
                controls 
                className="max-w-[280px] rounded-lg"
                preload="metadata"
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 h-7 w-7 bg-black/50 hover:bg-black/70 text-white"
                onClick={() => handleDownload(mediaUrl, caption || 'video', mimeType)}
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2 p-3 bg-wa-surface rounded-lg">
              <Video className="h-5 w-5 text-wa-text-muted" />
              <span className="text-sm text-wa-text-main">🎥 Vídeo</span>
            </div>
          )}
          {caption && <p className="text-sm">{caption}</p>}
        </div>
      );

    case 'audioMessage': {
      const audioBase64 = message?.audioMessage?.base64;
      const audioMimeType = message?.audioMessage?.mimetype || mimeType;
      return mediaUrl || audioBase64 ? (
        <AudioPlayer 
          url={mediaUrl || ''} 
          fromMe={fromMe} 
          mimeType={audioMimeType} 
          base64={audioBase64}
        />
      ) : (
        <div className="flex items-center gap-2 p-3 bg-wa-primary rounded-lg min-w-[180px]">
          <Mic className="h-5 w-5 text-wa-primary-foreground" />
          <span className="text-sm text-wa-primary-foreground">🎵 Áudio</span>
        </div>
      );
    }

    case 'documentMessage': {
      const fileName = message?.documentMessage?.fileName || 'Documento';
      const docMimeType = message?.documentMessage?.mimetype || mimeType;
      const docBase64 = message?.documentMessage?.base64;
      const docUrl = docBase64 
        ? `data:${docMimeType || 'application/octet-stream'};base64,${docBase64}`
        : mediaUrl;
      return (
        <div className="flex items-center gap-3 p-3 bg-wa-surface rounded-lg min-w-[200px]">
          <div className="h-10 w-10 rounded-lg bg-wa-primary/10 flex items-center justify-center">
            <FileText className="h-5 w-5 text-wa-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-wa-text-main truncate">{fileName}</p>
            <p className="text-xs text-wa-text-muted">Documento</p>
          </div>
          {(docUrl || mediaUrl) && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-wa-text-muted hover:text-wa-text-main"
              onClick={() => handleDownload(docUrl || mediaUrl!, fileName, docMimeType)}
            >
              <Download className="h-4 w-4" />
            </Button>
          )}
        </div>
      );
    }

    case 'stickerMessage':
      return mediaUrl ? (
        <img 
          src={mediaUrl} 
          alt="Sticker" 
          className="w-28 h-28 object-contain"
        />
      ) : (
        <div className="flex items-center justify-center w-24 h-24 bg-wa-surface rounded-lg">
          <span className="text-3xl">🎨</span>
        </div>
      );

    case 'contactMessage': {
      const displayName = message?.contactMessage?.displayName || 'Contato';
      return (
        <div className="flex items-center gap-3 p-3 bg-wa-surface rounded-lg min-w-[180px]">
          <div className="h-12 w-12 rounded-full bg-wa-info/20 flex items-center justify-center">
            <User className="h-6 w-6 text-wa-info" />
          </div>
          <div>
            <p className="text-sm font-medium text-wa-text-main">{displayName}</p>
            <p className="text-xs text-wa-text-muted">Contato compartilhado</p>
          </div>
        </div>
      );
    }

    case 'locationMessage': {
      const lat = message?.locationMessage?.degreesLatitude;
      const lng = message?.locationMessage?.degreesLongitude;
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-3 p-3 bg-wa-surface rounded-lg">
            <div className="h-10 w-10 rounded-lg bg-wa-danger/10 flex items-center justify-center">
              <MapPin className="h-5 w-5 text-wa-danger" />
            </div>
            <div>
              <p className="text-sm font-medium text-wa-text-main">Localização</p>
              {lat && lng && (
                <a 
                  href={`https://www.google.com/maps?q=${lat},${lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-wa-info hover:underline"
                >
                  Abrir no Google Maps
                </a>
              )}
            </div>
          </div>
        </div>
      );
    }

    default:
      return (
        <div className="flex items-center gap-2 p-3 bg-wa-surface rounded-lg">
          <FileText className="h-5 w-5 text-wa-text-muted" />
          <span className="text-sm text-wa-text-main">[Mídia não suportada]</span>
        </div>
      );
  }
};
