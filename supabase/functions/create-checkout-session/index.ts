import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get authenticated user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError || !user) {
      console.error('Authentication error:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user has buyer role
    const { data: roles } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    const hasBuyerRole = roles?.some(r => r.role === 'buyer');
    if (!hasBuyerRole) {
      console.error('User does not have buyer role');
      return new Response(
        JSON.stringify({ error: 'Only buyers can purchase designs' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { design_id } = await req.json();

    if (!design_id) {
      return new Response(
        JSON.stringify({ error: 'Design ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch design details
    const { data: design, error: designError } = await supabaseClient
      .from('designs')
      .select('id, title, price, designer_id, status')
      .eq('id', design_id)
      .single();

    if (designError || !design) {
      console.error('Design not found:', designError);
      return new Response(
        JSON.stringify({ error: 'Design not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if design is already sold
    if (design.status === 'sold') {
      console.error('Design already sold');
      return new Response(
        JSON.stringify({ error: 'This design has already been purchased' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prevent designer from buying own design
    if (design.designer_id === user.id) {
      console.error('Designer cannot buy own design');
      return new Response(
        JSON.stringify({ error: 'You cannot purchase your own design' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate fees (10% platform fee)
    const platformFeePercent = 0.10;
    const platformFee = Number(design.price) * platformFeePercent;
    const designerEarnings = Number(design.price) - platformFee;

    // Create Stripe checkout session
    const stripeResponse = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('STRIPE_API_KEY')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        'mode': 'payment',
        'success_url': `${req.headers.get('origin')}/success?session_id={CHECKOUT_SESSION_ID}`,
        'cancel_url': `${req.headers.get('origin')}/`,
        'line_items[0][price_data][currency]': 'usd',
        'line_items[0][price_data][product_data][name]': design.title,
        'line_items[0][price_data][unit_amount]': Math.round(Number(design.price) * 100).toString(),
        'line_items[0][quantity]': '1',
        'metadata[design_id]': design.id,
        'metadata[designer_id]': design.designer_id,
        'metadata[buyer_id]': user.id,
        'metadata[platform_fee]': platformFee.toString(),
        'metadata[designer_earnings]': designerEarnings.toString(),
      }),
    });

    if (!stripeResponse.ok) {
      const error = await stripeResponse.text();
      console.error('Stripe error:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to create checkout session' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const session = await stripeResponse.json();
    console.log('Checkout session created:', session.id);

    return new Response(
      JSON.stringify({ url: session.url, sessionId: session.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in create-checkout-session:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});