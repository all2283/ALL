import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import type { Listing } from "@shared/schema";

export default function ModerationPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Редирект если не модератор
  if (!user?.isModerator) {
    setLocation("/");
    return null;
  }

  const { data: listings, isLoading } = useQuery<Listing[]>({
    queryKey: ["/api/listings"],
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

  if (isLoading) {
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
        <h1 className="text-3xl font-bold">Модерация объявлений</h1>
        <p className="text-muted-foreground">
          Проверка и одобрение новых объявлений
        </p>
      </div>

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
    </div>
  );
}