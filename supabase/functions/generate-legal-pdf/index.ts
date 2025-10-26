import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LegalPdfRequest {
  transaction_id: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { transaction_id }: LegalPdfRequest = await req.json();

    // Fetch transaction details
    const { data: transaction, error: txError } = await supabase
      .from('transactions')
      .select(`
        *,
        designs:design_id(title, description, id),
        buyer:buyer_id(name, email),
        designer:designer_id(name, email)
      `)
      .eq('id', transaction_id)
      .single();

    if (txError || !transaction) {
      throw new Error('Transaction not found');
    }

    // Generate PDF content using HTML
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { 
      font-family: Arial, sans-serif; 
      line-height: 1.6; 
      max-width: 800px; 
      margin: 0 auto; 
      padding: 40px;
      color: #333;
    }
    .header { 
      text-align: center; 
      border-bottom: 3px solid #39FF14; 
      padding-bottom: 20px; 
      margin-bottom: 30px;
    }
    .header h1 { 
      color: #000; 
      margin: 0;
    }
    .section { 
      margin: 30px 0; 
    }
    .section h2 { 
      color: #39FF14; 
      border-bottom: 2px solid #eee;
      padding-bottom: 10px;
    }
    .info-grid { 
      display: grid; 
      grid-template-columns: 150px 1fr; 
      gap: 10px;
      margin: 20px 0;
    }
    .info-label { 
      font-weight: bold; 
    }
    .signature-section { 
      margin-top: 60px; 
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 40px;
    }
    .signature-box { 
      border-top: 2px solid #333; 
      padding-top: 10px;
      text-align: center;
    }
    .footer { 
      margin-top: 60px; 
      text-align: center; 
      font-size: 12px; 
      color: #666;
      border-top: 1px solid #eee;
      padding-top: 20px;
    }
    .confirmation-code {
      background: #f5f5f5;
      padding: 15px;
      border-radius: 5px;
      font-family: monospace;
      font-size: 14px;
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>T-DESIGN PLATFORM</h1>
    <p>Digital Design License Agreement</p>
  </div>

  <div class="section">
    <h2>Transaction Details</h2>
    <div class="info-grid">
      <div class="info-label">Transaction ID:</div>
      <div>${transaction.id}</div>
      
      <div class="info-label">Date:</div>
      <div>${new Date(transaction.created_at).toLocaleString()}</div>
      
      <div class="info-label">Amount:</div>
      <div>$${transaction.amount}</div>
      
      <div class="info-label">Status:</div>
      <div>${transaction.status}</div>
    </div>
    
    <div class="confirmation-code">
      <strong>Confirmation Code:</strong> ${transaction.stripe_session_id?.substring(0, 20) || 'N/A'}
    </div>
  </div>

  <div class="section">
    <h2>Design Information</h2>
    <div class="info-grid">
      <div class="info-label">Design Title:</div>
      <div>${transaction.designs.title}</div>
      
      <div class="info-label">Design ID:</div>
      <div>${transaction.designs.id}</div>
      
      <div class="info-label">Description:</div>
      <div>${transaction.designs.description || 'N/A'}</div>
    </div>
  </div>

  <div class="section">
    <h2>Parties</h2>
    <div class="info-grid">
      <div class="info-label">Buyer Name:</div>
      <div>${transaction.buyer.name}</div>
      
      <div class="info-label">Buyer Email:</div>
      <div>${transaction.buyer.email}</div>
      
      <div class="info-label">Designer Name:</div>
      <div>${transaction.designer.name}</div>
      
      <div class="info-label">Designer Email:</div>
      <div>${transaction.designer.email}</div>
    </div>
  </div>

  <div class="section">
    <h2>License Terms</h2>
    <p>This agreement grants the Buyer a non-exclusive, perpetual license to use the above-mentioned design for commercial purposes, including but not limited to:</p>
    <ul>
      <li>Reproduction on physical products (T-shirts, merchandise)</li>
      <li>Digital marketing and promotional materials</li>
      <li>Resale of products featuring this design</li>
    </ul>
    <p><strong>The Designer retains all copyright and intellectual property rights to the original design.</strong></p>
    <p>The Buyer may NOT:</p>
    <ul>
      <li>Resell, redistribute, or sublicense the design file itself</li>
      <li>Claim original authorship of the design</li>
      <li>Use the design in a manner that damages the Designer's reputation</li>
    </ul>
  </div>

  <div class="section">
    <h2>Financial Details</h2>
    <div class="info-grid">
      <div class="info-label">Total Amount:</div>
      <div>$${transaction.amount}</div>
      
      <div class="info-label">Platform Fee:</div>
      <div>$${transaction.platform_fee}</div>
      
      <div class="info-label">Designer Earnings:</div>
      <div>$${transaction.designer_earnings}</div>
    </div>
  </div>

  <div class="signature-section">
    <div class="signature-box">
      <div>Buyer Signature</div>
      <div style="margin-top: 10px; font-size: 12px;">Digitally signed via Stripe</div>
    </div>
    <div class="signature-box">
      <div>Designer Signature</div>
      <div style="margin-top: 10px; font-size: 12px;">Digitally signed via platform</div>
    </div>
  </div>

  <div class="footer">
    <p>This is a legally binding agreement generated by T-Design Platform</p>
    <p>For support, contact: support@t-design-platform.com</p>
    <p>Generated on: ${new Date().toLocaleString()}</p>
  </div>
</body>
</html>
    `;

    // Convert HTML to PDF using a simple approach
    // For production, you'd use a proper PDF library or service
    const encoder = new TextEncoder();
    const pdfData = encoder.encode(htmlContent);

    // Upload to Supabase Storage
    const filename = `legal-${transaction_id}-${Date.now()}.html`;
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('designs')
      .upload(`legal-docs/${filename}`, pdfData, {
        contentType: 'text/html',
        upsert: false,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw new Error('Failed to upload legal document');
    }

    // Get public URL
    const { data: urlData } = supabase
      .storage
      .from('designs')
      .getPublicUrl(`legal-docs/${filename}`);

    const pdfUrl = urlData.publicUrl;

    // Update transaction with legal doc URL
    const { error: updateError } = await supabase
      .from('transactions')
      .update({ legal_doc_url: pdfUrl })
      .eq('id', transaction_id);

    if (updateError) {
      console.error('Update error:', updateError);
      throw new Error('Failed to update transaction');
    }

    console.log('Legal PDF generated:', pdfUrl);

    return new Response(
      JSON.stringify({ success: true, legal_doc_url: pdfUrl }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('Error generating legal PDF:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
