-- Add status and tags columns to designs table
ALTER TABLE public.designs 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'available' CHECK (status IN ('available', 'sold')),
ADD COLUMN IF NOT EXISTS tags text[];

-- Add index for status lookups
CREATE INDEX IF NOT EXISTS idx_designs_status ON public.designs(status);
CREATE INDEX IF NOT EXISTS idx_designs_tags ON public.designs USING GIN(tags);

-- Add legal_doc_url to transactions table
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS legal_doc_url text;

-- Update designs RLS policy to show all available designs
DROP POLICY IF EXISTS "Anyone can view designs" ON public.designs;
CREATE POLICY "Anyone can view available designs" 
ON public.designs 
FOR SELECT 
USING (true);

-- Add policy for designers to view their own sold designs
CREATE POLICY "Designers can view own designs" 
ON public.designs 
FOR SELECT 
USING (auth.uid() = designer_id);

-- Update transactions policies to allow viewing legal docs
DROP POLICY IF EXISTS "Buyers can view own purchases" ON public.transactions;
CREATE POLICY "Buyers can view own purchases" 
ON public.transactions 
FOR SELECT 
USING (auth.uid() = buyer_id);

DROP POLICY IF EXISTS "Designers can view own sales" ON public.transactions;
CREATE POLICY "Designers can view own sales" 
ON public.transactions 
FOR SELECT 
USING (auth.uid() = designer_id);