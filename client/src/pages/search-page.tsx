import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Listing, Category } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Slider,
  SliderTrack,
  SliderRange,
  SliderThumb,
} from "@/components/ui/slider";
import { useLocation } from "wouter";
import { Loader2, Search, Save, Bell } from "lucide-react";

export default function SearchPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [priceRange, setPriceRange] = useState([0, 100000]);
  const [sortBy, setSortBy] = useState<"price" | "date" | "rating">("date");

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: listings, isLoading } = useQuery<Listing[]>({
    queryKey: ["/api/listings", selectedCategory, sortBy, searchTerm, priceRange],
    queryFn: async () => {
      const params = new URLSearchParams({
        category: selectedCategory,
        sortBy,
        search: searchTerm,
        minPrice: priceRange[0].toString(),
        maxPrice: priceRange[1].toString(),
      });
      const res = await apiRequest("GET", `/api/listings?${params}`);
      return res.json();
    },
  });

  const saveSearchMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/search-subscriptions", {
        category: selectedCategory,
        minPrice: priceRange[0],
        maxPrice: priceRange[1],
        keywords: searchTerm,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Успешно",
        description: "Поисковый запрос сохранен",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Поиск</h1>
        <p className="text-muted-foreground">
          Найдите нужные вам товары
        </p>
      </div>

      <Card className="mb-8">
        <CardContent className="p-6 space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Поиск..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Категория" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Все категории</SelectItem>
                {categories?.map((category) => (
                  <SelectItem key={category.id} value={category.name}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Цена: {priceRange[0]}₽ - {priceRange[1]}₽
            </label>
            <Slider
              min={0}
              max={100000}
              step={1000}
              value={priceRange}
              onValueChange={setPriceRange}
            />
          </div>

          <div className="flex items-center justify-between">
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Сортировка" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">По дате</SelectItem>
                <SelectItem value="price">По цене</SelectItem>
                <SelectItem value="rating">По рейтингу</SelectItem>
              </SelectContent>
            </Select>

            <div className="space-x-2">
              <Button
                variant="outline"
                onClick={() => saveSearchMutation.mutate()}
                disabled={saveSearchMutation.isPending}
              >
                <Save className="h-4 w-4 mr-2" />
                Сохранить поиск
              </Button>
              <Button>
                <Search className="h-4 w-4 mr-2" />
                Найти
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {listings?.map((listing) => (
          <Card key={listing.id} className="cursor-pointer hover:bg-accent/50"
            onClick={() => setLocation(`/listings/${listing.id}`)}>
            <CardHeader>
              <CardTitle>{listing.title}</CardTitle>
              <CardDescription>{listing.category}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                {listing.description}
              </p>
              <div className="flex items-center justify-between">
                <span className="font-bold">
                  {Number(listing.price).toFixed(2)} ₽
                </span>
                <Button variant="outline" size="sm">
                  Подробнее
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {listings?.length === 0 && (
          <Card className="md:col-span-2 lg:col-span-3">
            <CardContent className="p-6">
              <p className="text-center text-muted-foreground">
                По вашему запросу ничего не найдено
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
