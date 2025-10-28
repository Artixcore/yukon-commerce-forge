import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Shop from "./pages/Shop";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import OrderConfirmation from "./pages/OrderConfirmation";
import Admin from "./pages/Admin";
import Dashboard from "./pages/admin/Dashboard";
import Products from "./pages/admin/Products";
import Categories from "./pages/admin/Categories";
import Orders from "./pages/admin/Orders";
import Banners from "./pages/admin/Banners";
import Gallery from "./pages/admin/Gallery";
import AdminReviews from "./pages/admin/Reviews";
import Login from "./pages/admin/Login";
import NotFound from "./pages/NotFound";
import SearchResults from "./pages/SearchResults";
import BestSelling from "./pages/BestSelling";
import CategoriesPage from "./pages/Categories";
import FlashSelling from "./pages/FlashSelling";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Track from "./pages/Track";
import Reviews from "./pages/Reviews";
import Returns from "./pages/Returns";
import Shipping from "./pages/Shipping";
import UnderConstruction from "./pages/UnderConstruction";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="*" element={<UnderConstruction />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
