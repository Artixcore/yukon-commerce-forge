import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { OrderDetailDialog } from "@/components/admin/OrderDetailDialog";
import { useState } from "react";
import { Eye, Trash2 } from "lucide-react";
import Swal from "sweetalert2";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500",
  confirmed: "bg-blue-500",
  processing: "bg-purple-500",
  shipped: "bg-orange-500",
  delivered: "bg-green-500",
  cancelled: "bg-red-500",
};

const statusLabels: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

interface UnifiedOrder {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string | null;
  city: string;
  delivery_location: string;
  shipping_address: string;
  message: string | null;
  total_amount: number;
  delivery_charge: number;
  status: string;
  created_at: string;
  source: 'regular' | 'landing_page';
  landing_page_slug?: string;
  items?: any[];
  itemCount?: number;
}

const Orders = () => {
  const queryClient = useQueryClient();
  const [selectedOrder, setSelectedOrder] = useState<UnifiedOrder | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");

  // Fetch regular orders with order items count
  const { data: regularOrders, isLoading: loadingRegular } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(quantity)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Fetch landing page orders with landing page info
  const { data: landingPageOrders, isLoading: loadingLP } = useQuery({
    queryKey: ["admin-landing-page-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("landing_page_orders")
        .select("*, landing_pages(slug, title)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Delete order mutation
  const deleteMutation = useMutation({
    mutationFn: async (order: UnifiedOrder) => {
      if (order.source === 'regular') {
        // Delete order items first
        const { error: itemsError } = await supabase
          .from("order_items")
          .delete()
          .eq("order_id", order.id);
        if (itemsError) throw itemsError;

        // Then delete order
        const { error } = await supabase
          .from("orders")
          .delete()
          .eq("id", order.id);
        if (error) throw error;
      } else {
        // Landing page orders
        const { error } = await supabase
          .from("landing_page_orders")
          .delete()
          .eq("id", order.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      queryClient.invalidateQueries({ queryKey: ["admin-landing-page-orders"] });
      Swal.fire({
        icon: 'success',
        title: 'Deleted!',
        text: 'Order has been deleted successfully.',
        confirmButtonColor: '#000000',
      });
    },
    onError: (error: any) => {
      Swal.fire({
        icon: 'error',
        title: 'Delete Failed',
        text: error.message || 'Failed to delete order',
        confirmButtonColor: '#000000',
      });
    },
  });

  const handleDelete = async (order: UnifiedOrder) => {
    const result = await Swal.fire({
      title: 'Delete Order?',
      text: `Are you sure you want to delete order ${order.order_number}? This action cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
    });

    if (result.isConfirmed) {
      deleteMutation.mutate(order);
    }
  };

  // Calculate total items for an order
  const getTotalItems = (order: UnifiedOrder): number => {
    if (order.source === 'landing_page' && order.items) {
      return order.items.reduce((sum, item) => sum + (item.quantity || 1), 0);
    }
    return order.itemCount || 0;
  };

  // Combine and normalize orders
  const allOrders: UnifiedOrder[] = [
    ...(regularOrders?.map(order => {
      const itemCount = order.order_items?.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0) || 0;
      return {
        id: order.id,
        order_number: order.order_number,
        customer_name: order.customer_name,
        customer_phone: order.customer_phone,
        city: order.city,
        delivery_location: order.delivery_location,
        shipping_address: order.shipping_address,
        message: order.message,
        total_amount: order.total_amount,
        delivery_charge: order.delivery_charge,
        status: order.status,
        created_at: order.created_at,
        source: 'regular' as const,
        itemCount,
      };
    }) || []),
    ...(landingPageOrders?.map(order => ({
      id: order.id,
      order_number: order.order_number,
      customer_name: order.customer_name,
      customer_phone: order.customer_phone,
      city: order.city,
      delivery_location: order.delivery_location || 'inside_dhaka',
      shipping_address: order.shipping_address,
      message: order.message,
      total_amount: order.total_amount,
      delivery_charge: order.delivery_charge || 0,
      status: order.status || 'pending',
      created_at: order.created_at || new Date().toISOString(),
      source: 'landing_page' as const,
      landing_page_slug: (order.landing_pages as any)?.slug,
      items: order.items as any[],
    })) || []),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const handleViewDetails = (order: UnifiedOrder) => {
    setSelectedOrder(order);
    setDialogOpen(true);
  };

  const isLoading = loadingRegular || loadingLP;

  // Filter orders
  const filteredOrders = allOrders.filter((order) => {
    const matchesSearch =
      order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.customer_phone?.includes(searchQuery) ?? false) ||
      (order.landing_page_slug?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);

    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    const matchesLocation = locationFilter === "all" || order.delivery_location === locationFilter;
    const matchesSource = sourceFilter === "all" || order.source === sourceFilter;

    return matchesSearch && matchesStatus && matchesLocation && matchesSource;
  });

  return (
    <div className="p-4 md:p-8">
      <div className="flex justify-between items-center mb-4 md:mb-8">
        <h1 className="text-2xl md:text-4xl font-bold">Orders Management</h1>
        <div className="text-sm text-muted-foreground">
          Total Orders: {filteredOrders?.length || 0}
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <Input
          placeholder="Search by order #, name, phone, or LP slug..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="md:col-span-2"
        />
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="shipped">Shipped</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>

        <Select value={locationFilter} onValueChange={setLocationFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by location" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Locations</SelectItem>
            <SelectItem value="inside_dhaka">Inside Dhaka</SelectItem>
            <SelectItem value="outside_dhaka">Outside Dhaka</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sourceFilter} onValueChange={setSourceFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by source" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sources</SelectItem>
            <SelectItem value="regular">Regular Orders</SelectItem>
            <SelectItem value="landing_page">Landing Page Orders</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Orders Table */}
      {isLoading ? (
        <div className="text-center py-8">Loading orders...</div>
      ) : (
        <div className="border rounded-lg overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order #</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead className="hidden sm:table-cell">Phone</TableHead>
                <TableHead className="hidden md:table-cell">City</TableHead>
                <TableHead className="hidden lg:table-cell">Location</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden lg:table-cell">Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                    No orders found
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders?.map((order) => (
                  <TableRow key={`${order.source}-${order.id}`}>
                    <TableCell className="font-medium">{order.order_number}</TableCell>
                    <TableCell>
                      {order.source === 'landing_page' ? (
                        <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-300">
                          LP-{order.landing_page_slug}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
                          Website
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-medium">
                        {getTotalItems(order)}
                      </Badge>
                    </TableCell>
                    <TableCell>{order.customer_name}</TableCell>
                    <TableCell className="hidden sm:table-cell">{order.customer_phone}</TableCell>
                    <TableCell className="hidden md:table-cell">{order.city}</TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <span className="text-xs">
                        {order.delivery_location === "inside_dhaka" ? "Inside Dhaka" : "Outside Dhaka"}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium">৳{Number(order.total_amount).toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge className={statusColors[order.status]}>
                        {statusLabels[order.status] || order.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">{new Date(order.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs"
                          onClick={() => handleViewDetails(order)}
                        >
                          <Eye className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                          View
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDelete(order)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="w-3 h-3 md:w-4 md:h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <OrderDetailDialog
        order={selectedOrder}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
};

export default Orders;