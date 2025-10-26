-- Allow anonymous order creation
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;
CREATE POLICY "Anyone can create orders"
ON public.orders
FOR INSERT
TO public, anon
WITH CHECK (true);

-- Allow anonymous order items creation
DROP POLICY IF EXISTS "Anyone can create order items" ON public.order_items;
CREATE POLICY "Anyone can create order items"
ON public.order_items
FOR INSERT
TO public, anon
WITH CHECK (true);

-- Create a trigger to automatically update product stock when order items are created
CREATE OR REPLACE FUNCTION update_product_stock_on_order()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE products
  SET stock_quantity = stock_quantity - NEW.quantity
  WHERE id = NEW.product_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_stock_after_order_item
AFTER INSERT ON order_items
FOR EACH ROW
EXECUTE FUNCTION update_product_stock_on_order();