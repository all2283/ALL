import { useQuery, useMutation } from "@tanstack/react-query";
import { Listing } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Heart } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";

export default function FavoritesPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  const { data: favorites, isLoading } = useQuery<Listing[]>({
    queryKey: ["/api/favorites"],
  });

  const removeFavoriteMutation = useMutation({
    mutationFn: async (listingId: number) => {
      await apiRequest("DELETE", `/api/favorites/${listingId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/favorites"] });
      toast({
        title: "Успешно",
        description: "Объявление удалено из избранного",
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
        <h1 className="text-3xl font-bold">Избранное</h1>
        <p className="text-muted-foreground">
          Сохраненные объявления
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {favorites?.map((listing) => (
          <Card key={listing.id}>
            <CardHeader>
              <CardTitle>{listing.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                {listing.description}
              </p>
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold">
                  {Number(listing.price).toFixed(2)} ₽
                </span>
                <div className="space-x-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => removeFavoriteMutation.mutate(listing.id)}
                  >
                    <Heart className="h-4 w-4 fill-current" />
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setLocation(`/listings/${listing.id}`)}
                  >
                    Подробнее
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {favorites?.length === 0 && (
          <Card className="md:col-span-2 lg:col-span-3">
            <CardContent className="p-6">
              <p className="text-center text-muted-foreground">
                У вас пока нет избранных объявлений
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
