import {useState, useEffect, useRef} from "react";
import {useQuery} from "@tanstack/react-query";
import {useLocation, useSearchParams} from "react-router-dom";
import {supabase} from "@/integrations/supabase/client";
import {Input} from "@/components/ui/input";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {ProductCard} from "@/components/shop/ProductCard";
import {CategoriesSidebar} from "@/components/shop/CategoriesSidebar";
import {Search} from "lucide-react";
import {Header} from "@/components/layout/Header";
import {Footer} from "@/components/layout/Footer";
import {MobileBottomNav} from "@/components/layout/MobileBottomNav";
import {FloatingCart} from "@/components/layout/FloatingCart";
import {SEO} from "@/components/SEO";
import {Card} from "@/components/ui/card";
import {Checkbox} from "@/components/ui/checkbox";

const Shop = () => {
    const [searchParams] = useSearchParams();
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string>("all");
    const [priceRange, setPriceRange] = useState<string>("all");
    const location = useLocation();
    // Read category from URL query params and sync with state
    useEffect(() => {
        const categoryFromUrl = searchParams.get("category");
        if (categoryFromUrl) {
            setSelectedCategory(categoryFromUrl);
        } else {
            setSelectedCategory("all");
        }
    }, [searchParams]);

    const {data: categories} = useQuery({
        queryKey: ["categories"],
        queryFn: async () => {
            const {data, error} = await supabase
                .from("categories")
                .select("*")
                .order("name");
            if (error) throw error;
            return data;
        },
    });

    const {data: products, isLoading} = useQuery({
        queryKey: ["products", searchQuery, selectedCategory, priceRange],
        queryFn: async () => {
            let query = supabase
                .from("products")
                .select("*, categories(name)")
                .eq("is_active", true);

            if (searchQuery) {
                query = query.ilike("name", `%${searchQuery}%`);
            }

            if (selectedCategory !== "all") {
                query = query.eq("category_id", selectedCategory);
            }

            if (priceRange !== "all") {
                if (priceRange.includes("+")) {
                    const min = parseFloat(priceRange.replace("+", ""));
                    query = query.gte("price", min);
                } else {
                    const [min, max] = priceRange.split("-").map(p => parseFloat(p));
                    query = query.gte("price", min).lte("price", max);
                }
            }

            const {data, error} = await query.order("created_at", {ascending: false});
            if (error) throw error;
            return data;
        },
    });
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const filterRef = useRef(null);

    useEffect(() => {
        if (!isFilterOpen) return;

        const handleClickOutside = (e) => {
            if (filterRef.current && !filterRef.current.contains(e.target)) {
                setIsFilterOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isFilterOpen]);


    useEffect(() => {
        setIsFilterOpen(false);
    }, [location.key]);

    return (
        <div className="min-h-screen bg-background pb-16 md:pb-0">
            <SEO
                title="Shop All Products"
                description="Browse our complete collection of premium lifestyle products at Yukon Lifestyle"
                canonical="https://yukonlifestyle.com/shop"
            />
            <Header/>

            {/* Breadcrumb */}
            <div className="border-b bg-muted/30">
                <div className="container mx-auto px-4 py-3">
                    <p className="text-sm text-muted-foreground">Home / Shop</p>
                </div>
            </div>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-8">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Categories Sidebar - Desktop Only */}
                    <CategoriesSidebar/>

                    {/* Mobile Filter Button */}
                    <button
                        onClick={() => setIsFilterOpen(true)}
                        className="lg:hidden  items-start gap-2 rounded-none bg-primary px-4 py-2 text-white shadow-lg"
                    >
                        Filters
                    </button>

                    {/* Sidebar Filters - Mobile/Tablet */}
                    <aside
                        ref={filterRef}
                        className={`
    fixed top-0 left-0 z-50 h-full w-[85%] max-w-sm
    bg-background shadow-xl
    transform transition-transform duration-300 ease-in-out
    lg:hidden
    ${isFilterOpen ? "translate-x-0" : "-translate-x-full"}
  `}
                    >
                        <Card className="h-full overflow-y-auto p-6 rounded-none">
                            {/* Header */}
                            <div className="mb-4 flex items-center justify-between">
                                <h2 className="font-bold text-lg">Filters</h2>
                                <button
                                    onClick={() => setIsFilterOpen(false)}
                                    className="rounded-md p-2 hover:bg-muted"
                                >
                                    ✕
                                </button>
                            </div>

                            {/* SEARCH */}
                            <div className="mb-6">
                                <label className="text-sm font-medium mb-2 block">Search</label>
                                <div className="relative">
                                    <Search
                                        className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
                                    <Input
                                        placeholder="Search..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-9"
                                    />
                                </div>
                            </div>

                            {/* CATEGORIES */}
                            <div className="mb-6">
                                <label className="text-sm font-medium mb-3 block">Categories</label>
                                <div className="space-y-2">
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="all"
                                            checked={selectedCategory === "all"}
                                            onCheckedChange={() => {
                                                setSelectedCategory("all");
                                                const params = new URLSearchParams(searchParams);
                                                params.delete("category");
                                                window.history.replaceState({}, "", `/shop?${params.toString()}`);
                                            }}
                                        />
                                        <label htmlFor="all" className="text-sm cursor-pointer">
                                            All Categories
                                        </label>
                                    </div>

                                    {categories?.map((category) => (
                                        <div key={category.id} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={category.id}
                                                checked={selectedCategory === category.id}
                                                onCheckedChange={() => {
                                                    setSelectedCategory(category.id);
                                                    const params = new URLSearchParams(searchParams);
                                                    params.set("category", category.id);
                                                    window.history.replaceState({}, "", `/shop?${params.toString()}`);
                                                }}
                                            />
                                            <label htmlFor={category.id} className="text-sm cursor-pointer">
                                                {category.name}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* PRICE RANGE */}
                            <div>
                                <label className="text-sm font-medium mb-3 block">Price Range</label>
                                <Select value={priceRange} onValueChange={setPriceRange}>
                                    <SelectTrigger>
                                        <SelectValue/>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Prices</SelectItem>
                                        <SelectItem value="0-2000">Under ৳2000</SelectItem>
                                        <SelectItem value="2000-4000">৳2000 - ৳4000</SelectItem>
                                        <SelectItem value="4000-8000">৳4000 - ৳8000</SelectItem>
                                        <SelectItem value="8000+">Over ৳8000</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </Card>
                    </aside>


                    {/* Products Section */}
                    <div className="flex-1">
                        <div className="flex items-center justify-between mb-6">
                            <h1 className="text-3xl font-bold">Products</h1>
                            <p className="text-sm text-muted-foreground">
                                {products?.length || 0} products found
                            </p>
                        </div>

                        {/* Products Grid */}
                        {isLoading ? (
                            <div
                                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-3 md:gap-4 lg:gap-5 xl:gap-6">
                                {[...Array(8)].map((_, i) => (
                                    <div key={i} className="bg-card rounded-lg h-80 animate-pulse"/>
                                ))}
                            </div>
                        ) : products && products.length > 0 ? (
                            <div
                                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-3 md:gap-4 lg:gap-5 xl:gap-6">
                                {products.map((product) => (
                                    <ProductCard key={product.id} product={product}/>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <p className="text-muted-foreground">No products found</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            <Footer/>
            <MobileBottomNav/>
            <FloatingCart/>
        </div>
    );
};

export default Shop;
