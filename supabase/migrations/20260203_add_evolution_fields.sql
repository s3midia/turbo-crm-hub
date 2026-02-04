-- Add fields for Evolution API integration and chat state tracking
ALTER TABLE public.whatsapp_conversations 
ADD COLUMN IF NOT EXISTS remote_jid TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS is_open BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS instance_name TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_conversations_remote_jid 
ON public.whatsapp_conversations(remote_jid);

CREATE INDEX IF NOT EXISTS idx_conversations_is_open 
ON public.whatsapp_conversations(is_open);

-- Update existing rows to have is_open = false
UPDATE public.whatsapp_conversations 
SET is_open = false 
WHERE is_open IS NULL;
