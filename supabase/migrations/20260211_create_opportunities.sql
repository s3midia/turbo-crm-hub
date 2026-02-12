-- Create opportunities table for sales funnel
CREATE TABLE public.opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Basic information
  lead_identification TEXT NOT NULL,
  contact_phone TEXT,
  contact_name TEXT,
  contact_email TEXT,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high')),
  stage TEXT NOT NULL DEFAULT 'new_contact' CHECK (stage IN ('new_contact', 'in_contact', 'presentation', 'negotiation')),
  observation TEXT,
  
  -- Assignment
  responsible_id UUID REFERENCES auth.users(id),
  
  -- Value
  total_value DECIMAL(10, 2) DEFAULT 0,
  
  -- Products (JSON array)
  products JSONB DEFAULT '[]'::jsonb,
  
  -- Tasks (JSON array)
  tasks JSONB DEFAULT '[]'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create opportunity timeline table for comments/activities
CREATE TABLE public.opportunity_timeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID REFERENCES public.opportunities(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row-Level Security
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunity_timeline ENABLE ROW LEVEL SECURITY;

-- RLS Policies for opportunities
CREATE POLICY "Users can view own opportunities" ON public.opportunities
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own opportunities" ON public.opportunities
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own opportunities" ON public.opportunities
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own opportunities" ON public.opportunities
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for opportunity_timeline
CREATE POLICY "Users can view timeline of own opportunities" ON public.opportunity_timeline
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM public.opportunities WHERE id = opportunity_id
    )
  );

CREATE POLICY "Users can create timeline entries" ON public.opportunity_timeline
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_opportunities_user_id ON public.opportunities(user_id);
CREATE INDEX idx_opportunities_stage ON public.opportunities(stage);
CREATE INDEX idx_opportunities_responsible_id ON public.opportunities(responsible_id);
CREATE INDEX idx_timeline_opportunity_id ON public.opportunity_timeline(opportunity_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_opportunities_updated_at
BEFORE UPDATE ON public.opportunities
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for opportunities
ALTER PUBLICATION supabase_realtime ADD TABLE public.opportunities;
ALTER PUBLICATION supabase_realtime ADD TABLE public.opportunity_timeline;
