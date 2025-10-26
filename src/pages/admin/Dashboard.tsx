import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, ShoppingBag, Banknote, TrendingUp } from "lucide-react";

const Dashboard = () => {
  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [productsRes, ordersRes, revenueRes] = await Promise.all([
        supabase.from("products").select("*", { count: "exact", head: true }),
        supabase.from("orders").select("*", { count: "exact", head: true }),
        supabase.from("orders").select("total_amount"),
      ]);

      const totalRevenue = revenueRes.data?.reduce(
        (sum, order) => sum + Number(order.total_amount),
        0
      ) || 0;

      return {
        products: productsRes.count || 0,
        orders: ordersRes.count || 0,
        revenue: totalRevenue,
      };
    },
  });

  const statCards = [
    {
      title: "Total Products",
      value: stats?.products || 0,
      icon: Package,
      description: "Active products in catalog",
    },
    {
      title: "Total Orders",
      value: stats?.orders || 0,
      icon: ShoppingBag,
      description: "All time orders",
    },
    {
      title: "Total Revenue",
      value: `৳${(stats?.revenue || 0).toFixed(2)}`,
      icon: Banknote,
      description: "Total sales revenue",
    },
    {
      title: "Growth",
      value: "+12%",
      icon: TrendingUp,
      description: "Compared to last month",
    },
  ];

  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold mb-8">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold mb-1">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            View and manage your products, categories, and orders from the sidebar.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
