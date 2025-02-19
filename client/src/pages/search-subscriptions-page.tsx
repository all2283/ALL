import { useQuery, useMutation } from "@tanstack/react-query";
import { SearchSubscription } from "@shared/schema";
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
import { Switch } from "@/components/ui/switch";
import { Loader2, Bell, Search } from "lucide-react";

export default function SearchSubscriptionsPage() {
  const { toast } = useToast();

  const { data: subscriptions, isLoading } = useQuery<SearchSubscription[]>({
    queryKey: ["/api/search-subscriptions"],
  });

  const toggleSubscriptionMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("POST", `/api/search-subscriptions/${id}/toggle`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/search-subscriptions"] });
      toast({
        title: "Успешно",
        description: "Статус подписки обновлен",
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
        <h1 className="text-3xl font-bold">Подписки на поиск</h1>
        <p className="text-muted-foreground">
          Управление уведомлениями о новых объявлениях
        </p>
      </div>

      <div className="space-y-4">
        {subscriptions?.map((subscription) => (
          <Card key={subscription.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  {subscription.category || "Все категории"}
                </CardTitle>
                <Switch
                  checked={subscription.isActive}
                  onCheckedChange={() =>
                    toggleSubscriptionMutation.mutate(subscription.id)
                  }
                  disabled={toggleSubscriptionMutation.isPending}
                />
              </div>
              <CardDescription>
                {subscription.keywords
                  ? `Поиск: ${subscription.keywords}`
                  : "Без ключевых слов"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(subscription.minPrice || subscription.maxPrice) && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Search className="h-4 w-4" />
                    <span>
                      Цена:{" "}
                      {subscription.minPrice
                        ? `от ${Number(subscription.minPrice).toFixed(2)} ₽`
                        : ""}
                      {subscription.minPrice && subscription.maxPrice ? " - " : ""}
                      {subscription.maxPrice
                        ? `до ${Number(subscription.maxPrice).toFixed(2)} ₽`
                        : ""}
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Bell className="h-4 w-4" />
                  <span>
                    {subscription.isActive
                      ? "Уведомления включены"
                      : "Уведомления отключены"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {subscriptions?.length === 0 && (
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col items-center gap-2 text-center">
                <Bell className="h-8 w-8 text-muted-foreground" />
                <p className="text-muted-foreground">
                  У вас пока нет подписок на поиск
                </p>
                <p className="text-sm text-muted-foreground">
                  Создайте подписку на странице поиска, чтобы получать уведомления
                  о новых объявлениях
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
