import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, CheckCircle, XCircle, Plus } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Listing, Category } from "@shared/schema";
import { useState } from "react";

export default function ModerationPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryType, setNewCategoryType] = useState<string>("");

  // Редирект если не модератор
  if (!user?.isModerator) {
    setLocation("/");
    return null;
  }

  const { data: listings, isLoading: listingsLoading } = useQuery<Listing[]>({
    queryKey: ["/api/listings"],
  });

  const { data: categories, isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const moderateMutation = useMutation({
    mutationFn: async ({ id, action }: { id: number; action: "approve" | "reject" }) => {
      const res = await apiRequest("POST", `/api/listings/${id}/moderate`, { action });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/listings"] });
      toast({
        title: "Успешно",
        description: "Статус объявления обновлен",
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

  const createCategoryMutation = useMutation({
    mutationFn: async (data: { name: string; type: string }) => {
      const res = await apiRequest("POST", "/api/categories", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      setNewCategoryName("");
      setNewCategoryType("");
      toast({
        title: "Успешно",
        description: "Категория создана",
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

  if (listingsLoading || categoriesLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const pendingListings = listings?.filter((l) => l.status === "pending") || [];

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Панель модерации</h1>
        <p className="text-muted-foreground">
          Управление объявлениями и категориями
        </p>
      </div>

      <Tabs defaultValue="listings" className="space-y-6">
        <TabsList>
          <TabsTrigger value="listings">Объявления</TabsTrigger>
          <TabsTrigger value="categories">Категории</TabsTrigger>
        </TabsList>

        <TabsContent value="listings">
          <div className="space-y-4">
            {pendingListings.length === 0 ? (
              <Card>
                <CardContent className="p-6">
                  <p className="text-center text-muted-foreground">
                    Нет объявлений для проверки
                  </p>
                </CardContent>
              </Card>
            ) : (
              pendingListings.map((listing) => (
                <Card key={listing.id}>
                  <CardHeader>
                    <CardTitle>{listing.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      {listing.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">
                          {Number(listing.price).toFixed(2)} ₽
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Категория: {listing.category}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() =>
                            moderateMutation.mutate({
                              id: listing.id,
                              action: "approve",
                            })
                          }
                          disabled={moderateMutation.isPending}
                        >
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() =>
                            moderateMutation.mutate({
                              id: listing.id,
                              action: "reject",
                            })
                          }
                          disabled={moderateMutation.isPending}
                        >
                          <XCircle className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="categories">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Добавить категорию</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <Input
                    placeholder="Название категории"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                  />
                  <Select
                    value={newCategoryType}
                    onValueChange={setNewCategoryType}
                  >
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Тип категории" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="games">Игровые аккаунты</SelectItem>
                      <SelectItem value="items">Игровые предметы</SelectItem>
                      <SelectItem value="currency">Игровая валюта</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={() =>
                      createCategoryMutation.mutate({
                        name: newCategoryName,
                        type: newCategoryType,
                      })
                    }
                    disabled={
                      createCategoryMutation.isPending ||
                      !newCategoryName ||
                      !newCategoryType
                    }
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Добавить
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {categories?.map((category) => (
                <Card key={category.id}>
                  <CardContent className="p-6">
                    <h3 className="font-medium mb-2">{category.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      Тип: {category.type}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}