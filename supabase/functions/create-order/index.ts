import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function validateOrderData(orderData: any) {
  // Validate required fields exist and are strings
  const requiredFields = ['customer_name', 'customer_phone', 'shipping_address', 'city'];
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
  
  if (orderData.customer_email && orderData.customer_email.length > 255) {
    throw new Error('Email is too long (max 255 characters)');
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
    if (!item.product_id || !item.product_name || typeof item.quantity !== 'number' || typeof item.price !== 'number') {
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

    console.log('Received order data:', orderData)

    // Validate input data
    validateOrderData(orderData)

    // Generate unique order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    console.log('Creating order with number:', orderNumber)

    // Create order using service role (bypasses RLS)
    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .insert({
        order_number: orderNumber,
        customer_name: orderData.customer_name,
        customer_phone: orderData.customer_phone,
        customer_email: orderData.customer_email || null,
        city: orderData.city,
        delivery_location: orderData.delivery_location,
        shipping_address: orderData.shipping_address,
        message: orderData.message || null,
        total_amount: orderData.total_amount,
        delivery_charge: orderData.delivery_charge,
        status: 'pending',
      })
      .select()
      .single()

    if (orderError) {
      console.error('Order creation error:', orderError)
      throw orderError
    }

    console.log('Order created successfully:', order.id)

    // Create order items
    const orderItems = orderData.items.map((item: any) => ({
      order_id: order.id,
      product_id: item.product_id,
      product_name: item.product_name,
      quantity: item.quantity,
      price: item.price,
    }))

    console.log('Creating order items:', orderItems.length)

    const { error: itemsError } = await supabaseClient
      .from('order_items')
      .insert(orderItems)

    if (itemsError) {
      console.error('Order items creation error:', itemsError)
      throw itemsError
    }

    console.log('Order items created successfully')

    // Stock update is handled by database trigger

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
