-- Allow admins to delete orders
CREATE POLICY "Admins can delete orders"
  ON orders
  FOR DELETE
  USING (is_admin());

-- Allow admins to delete order items
CREATE POLICY "Admins can delete order items"
  ON order_items
  FOR DELETE
  USING (is_admin());