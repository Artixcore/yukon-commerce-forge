import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function validateLandingOrderData(orderData: any) {
  // Validate required fields exist and are strings
  const requiredFields = ['customer_name', 'customer_phone', 'shipping_address', 'city', 'landing_page_id'];
  for (const field of requiredFields) {
    if (!orderData[field] || typeof orderData[field] !== 'string' || !orderData[field].trim()) {
      throw new Error(`Invalid or missing field: ${field}`);
    }
  }
  
  // Validate string lengths
  if (orderData.customer_name.length > 100) {
    throw new Error('Customer name is too long (max 100 characters)');
  }
  
  if (orderData.shipping_address.length > 500) {
    throw new Error('Shipping address is too long (max 500 characters)');
  }
  
  if (orderData.city.length > 100) {
    throw new Error('City name is too long (max 100 characters)');
  }
  
  if (orderData.message && orderData.message.length > 1000) {
    throw new Error('Message is too long (max 1000 characters)');
  }
  
  // Validate phone format (Bangladesh format)
  const phoneRegex = /^(\+8801|01)[3-9]\d{8}$/;
  if (!phoneRegex.test(orderData.customer_phone)) {
    throw new Error('Invalid phone number format');
  }
  
  // Validate delivery location
  if (!['inside_dhaka', 'outside_dhaka'].includes(orderData.delivery_location)) {
    throw new Error('Invalid delivery location');
  }
  
  // Validate items array
  if (!Array.isArray(orderData.items) || orderData.items.length === 0) {
    throw new Error('Order must contain at least one item');
  }
  
  if (orderData.items.length > 50) {
    throw new Error('Too many items in order (max 50)');
  }
  
  // Validate each item
  for (const item of orderData.items) {
    if (!item.product_name || typeof item.quantity !== 'number' || typeof item.price !== 'number') {
      throw new Error('Invalid item data');
    }
    
    if (item.quantity < 1 || item.quantity > 999) {
      throw new Error('Invalid item quantity (must be between 1 and 999)');
    }
    
    if (item.price < 0 || item.price > 9999999) {
      throw new Error('Invalid item price');
    }
    
    if (item.product_name.length > 200) {
      throw new Error('Product name is too long');
    }
  }
  
  // Validate numeric fields
  if (typeof orderData.total_amount !== 'number' || orderData.total_amount <= 0 || orderData.total_amount > 99999999) {
    throw new Error('Invalid total amount');
  }
  
  if (typeof orderData.delivery_charge !== 'number' || orderData.delivery_charge < 0 || orderData.delivery_charge > 9999) {
    throw new Error('Invalid delivery charge');
  }
  
  return true;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client with service role (bypasses RLS)
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const orderData = await req.json()

    console.log('Received landing page order data:', orderData)

    // Validate input data
    validateLandingOrderData(orderData)

    // Generate unique order number
    const orderNumber = `LP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    console.log('Creating landing page order with number:', orderNumber)

    // Create landing page order using service role (bypasses RLS)
    const { data: order, error: orderError } = await supabaseClient
      .from('landing_page_orders')
      .insert({
        order_number: orderNumber,
        landing_page_id: orderData.landing_page_id,
        customer_name: orderData.customer_name,
        customer_phone: orderData.customer_phone,
        city: orderData.city,
        delivery_location: orderData.delivery_location,
        shipping_address: orderData.shipping_address,
        message: orderData.message || null,
        total_amount: orderData.total_amount,
        delivery_charge: orderData.delivery_charge,
        items: orderData.items, // Store items as JSON
        status: 'pending',
      })
      .select()
      .single()

    if (orderError) {
      console.error('Landing page order creation error:', orderError)
      throw orderError
    }

    console.log('Landing page order created successfully:', order.id)

    // Send Purchase event to Meta Conversion API if configured
    if (orderData.fb_pixel_id && orderData.fb_access_token) {
      try {
        const metaEventData = {
          event_name: "Purchase",
          user_data: {
            ph: orderData.customer_phone,
            ct: orderData.city,
            country: "bd"
          },
          custom_data: {
            value: orderData.total_amount,
            currency: "BDT",
            content_ids: orderData.items.map((item: any) => item.product_id || item.product_name),
            content_type: "product",
            num_items: orderData.items.reduce((sum: number, item: any) => sum + item.quantity, 0)
          }
        };

        // Call meta-conversion edge function with landing page specific credentials
        const metaResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/meta-conversion`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': Deno.env.get('SUPABASE_ANON_KEY') ?? '',
          },
          body: JSON.stringify({
            ...metaEventData,
            pixel_id: orderData.fb_pixel_id,
            access_token: orderData.fb_access_token,
            test_event_code: orderData.fb_test_event_code || null,
          })
        });
        
        const metaResult = await metaResponse.json();
        console.log('Purchase event sent to Meta:', metaResult);
      } catch (metaError) {
        // Don't fail order if Meta tracking fails
        console.error('Failed to send Meta event:', metaError);
      }
    }

    return new Response(
      JSON.stringify({ success: true, order }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('Edge function error:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'An error occurred while processing your order' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
