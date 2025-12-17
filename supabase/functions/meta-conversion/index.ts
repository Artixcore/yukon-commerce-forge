import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Hash data using SHA256
async function hashData(data: string): Promise<string> {
  if (!data) return '';
  const normalized = data.toLowerCase().trim();
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(normalized);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Load Meta credentials from database
    const { data: metaSettings, error: settingsError } = await supabase
      .from('meta_settings')
      .select('pixel_id, access_token, test_event_code, is_active')
      .single();

    if (settingsError || !metaSettings) {
      console.warn('Meta settings not configured:', settingsError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Meta Conversion API not configured' 
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!metaSettings.is_active) {
      console.log('Meta tracking is disabled');
      return new Response(
        JSON.stringify({ success: true, message: 'Tracking disabled' }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const pixelId = metaSettings.pixel_id;
    const accessToken = metaSettings.access_token;
    const testEventCode = metaSettings.test_event_code;

    const eventData = await req.json();
    const { 
      event_name, 
      user_data = {}, 
      custom_data = {},
      event_source_url = '',
      action_source = 'website'
    } = eventData;

    // Enhanced debug logging
    console.log('=== Meta Conversion API Request ===');
    console.log('Event Name:', event_name);
    console.log('Custom Data:', JSON.stringify(custom_data));
    console.log('User Data Keys:', Object.keys(user_data));
    console.log('Event Source URL:', event_source_url);

    // Hash user data for privacy
    const hashedUserData: any = {
      client_user_agent: user_data.client_user_agent || req.headers.get('user-agent'),
      client_ip_address: req.headers.get('x-forwarded-for')?.split(',')[0] || 
                        req.headers.get('x-real-ip') || 
                        'unknown',
    };

    // Hash PII if provided
    if (user_data.ph) {
      hashedUserData.ph = await hashData(user_data.ph);
    }
    if (user_data.em) {
      hashedUserData.em = await hashData(user_data.em);
    }
    if (user_data.fn) {
      hashedUserData.fn = await hashData(user_data.fn);
    }
    if (user_data.ln) {
      hashedUserData.ln = await hashData(user_data.ln);
    }
    if (user_data.ct) {
      hashedUserData.ct = await hashData(user_data.ct);
    }
    if (user_data.country) {
      hashedUserData.country = await hashData(user_data.country);
    }

    // Prepare the payload for Meta
    const payload = {
      data: [
        {
          event_name,
          event_time: Math.floor(Date.now() / 1000),
          action_source,
          event_source_url: event_source_url || `${supabaseUrl}`,
          user_data: hashedUserData,
          custom_data: {
            currency: custom_data.currency || 'BDT',
            value: custom_data.value || 0,
            content_ids: custom_data.content_ids || [],
            content_type: custom_data.content_type || 'product',
            content_name: custom_data.content_name || '',
            num_items: custom_data.num_items || 1,
          },
        },
      ],
    };

    // Add test event code if available
    if (testEventCode) {
      (payload as any).test_event_code = testEventCode;
    }

    console.log(`Sending ${event_name} event to Meta Conversion API for Pixel ${pixelId}`);

    // Send to Meta Conversion API
    const metaResponse = await fetch(
      `https://graph.facebook.com/v18.0/${pixelId}/events`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...payload,
          access_token: accessToken,
        }),
      }
    );

    const metaResult = await metaResponse.json();

    if (!metaResponse.ok) {
      console.error('Meta API Error:', metaResult);
      throw new Error(`Meta API error: ${JSON.stringify(metaResult)}`);
    }

    console.log('Meta API Response:', metaResult);

    return new Response(
      JSON.stringify({ 
        success: true, 
        meta_response: metaResult,
        event_name,
        pixel_id: pixelId 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in meta-conversion function:', error);
    return new Response(
      JSON.stringify({ 
        error: (error as Error).message || 'Unknown error',
        success: false 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
