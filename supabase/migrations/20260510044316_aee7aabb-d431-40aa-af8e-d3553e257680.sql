
CREATE TYPE public.severity_level AS ENUM ('critical', 'high', 'medium', 'low');

CREATE TABLE public.findings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  severity public.severity_level NOT NULL DEFAULT 'low',
  pattern_type TEXT NOT NULL,
  matched_value TEXT NOT NULL,
  risk_score INTEGER NOT NULL DEFAULT 0,
  source TEXT,
  domain TEXT,
  context TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_findings_created_at ON public.findings (created_at DESC);
CREATE INDEX idx_findings_severity ON public.findings (severity);
CREATE INDEX idx_findings_domain ON public.findings (domain);

ALTER TABLE public.findings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Findings are viewable by everyone"
  ON public.findings FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert findings"
  ON public.findings FOR INSERT
  TO authenticated
  WITH CHECK (true);
