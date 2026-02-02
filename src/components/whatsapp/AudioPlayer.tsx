import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, MoreVertical, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AudioPlayerProps {
  url: string;
  fromMe?: boolean;
  mimeType?: string;
  base64?: string;
}

export const AudioPlayer = ({ url, fromMe = false, mimeType, base64 }: AudioPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [error, setError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Get the audio source URL (handle base64 if provided)
  const getAudioSource = () => {
    if (base64) {
      const mime = mimeType || 'audio/ogg';
      if (base64.startsWith('data:')) return base64;
      return `data:${mime};base64,${base64}`;
    }
    return url;
  };

  const audioSource = getAudioSource();

  // Determine audio type for better compatibility
  const getAudioType = () => {
    if (mimeType) return mimeType;
    if (url.includes('.ogg') || url.includes('opus')) return 'audio/ogg; codecs=opus';
    if (url.includes('.mp3')) return 'audio/mpeg';
    if (url.includes('.wav')) return 'audio/wav';
    if (url.includes('.m4a')) return 'audio/mp4';
    return 'audio/ogg; codecs=opus'; // WhatsApp default
  };

  const togglePlay = async () => {
    if (audioRef.current && !error) {
      try {
        if (isPlaying) {
          audioRef.current.pause();
        } else {
          await audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
      } catch (err) {
        console.error('Error playing audio:', err);
        setError(true);
      }
    }
  };

  const handleLoadedMetadata = () => {
    setDuration(audioRef.current?.duration || 0);
    setIsLoading(false);
    setError(false);
  };

  const handleError = () => {
    console.error('Audio failed to load:', url);
    setError(true);
    setIsLoading(false);
  };

  const handleCanPlay = () => {
    setIsLoading(false);
    setError(false);
  };

  const formatTime = (time: number) => {
    if (!isFinite(time) || isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progress = duration ? (currentTime / duration) * 100 : 0;

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (audioRef.current && duration) {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const newTime = (clickX / rect.width) * duration;
      audioRef.current.currentTime = newTime;
    }
  };

  if (error) {
    return (
      <div className={cn(
        "flex items-center gap-3 min-w-[240px] p-2 rounded-xl",
        fromMe ? "bg-wa-primary" : "bg-wa-primary"
      )}>
        <div className="h-10 w-10 shrink-0 bg-wa-bg-main/50 rounded-full flex items-center justify-center">
          <AlertCircle className="h-5 w-5 text-wa-danger" />
        </div>
        <span className="text-xs text-wa-primary-foreground">Áudio indisponível</span>
      </div>
    );
  }

  return (
    <div className={cn(
      "flex items-center gap-3 min-w-[240px] p-2 rounded-xl",
      fromMe ? "bg-wa-primary" : "bg-wa-primary"
    )}>
      <audio
        ref={audioRef}
        preload="metadata"
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
        onEnded={() => setIsPlaying(false)}
        onError={handleError}
        onCanPlay={handleCanPlay}
      >
        <source src={audioSource} type={getAudioType()} />
        <source src={audioSource} type="audio/ogg; codecs=opus" />
        <source src={audioSource} type="audio/mpeg" />
        Your browser does not support the audio element.
      </audio>
      
      {/* Play/Pause button */}
      <Button
        variant="ghost"
        size="icon"
        className="h-10 w-10 shrink-0 bg-wa-bg-main hover:bg-wa-surface text-wa-text-main rounded-full"
        onClick={togglePlay}
        disabled={isLoading}
      >
        {isPlaying ? (
          <Pause className="h-5 w-5" />
        ) : (
          <Play className="h-5 w-5 ml-0.5" />
        )}
      </Button>

      {/* Progress and time */}
      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-xs text-wa-primary-foreground font-mono">
            {formatTime(currentTime)}
          </span>
          <span className="text-xs text-wa-primary-foreground/70">/</span>
          <span className="text-xs text-wa-primary-foreground/70 font-mono">
            {formatTime(duration)}
          </span>
        </div>
        {/* Progress bar - clickable */}
        <div 
          className="h-1.5 bg-wa-primary-foreground/30 rounded-full overflow-hidden cursor-pointer"
          onClick={handleProgressClick}
        >
          <div
            className="h-full bg-wa-bg-main transition-all rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Volume button */}
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0 text-wa-primary-foreground hover:bg-wa-primary-foreground/10"
      >
        <Volume2 className="h-4 w-4" />
      </Button>

      {/* More options */}
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0 text-wa-primary-foreground hover:bg-wa-primary-foreground/10"
      >
        <MoreVertical className="h-4 w-4" />
      </Button>
    </div>
  );
};
