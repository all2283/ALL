import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Listing, Transaction, Review, ModerationRequest } from "@shared/schema";

export default function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: listings, isLoading: listingsLoading } = useQuery<Listing[]>({
    queryKey: ["/api/listings"],
  });

  const { data: transactions, isLoading: transactionsLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
  });

  const { data: reviews, isLoading: reviewsLoading } = useQuery<Review[]>({
    queryKey: ["/api/reviews"],
  });

  const { data: moderationRequests, isLoading: moderationRequestsLoading } = useQuery<ModerationRequest[]>({
    queryKey: ["/api/moderation-requests"],
    enabled: user?.isModerator,
  });

  const createModerationRequestMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/moderation-requests");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/moderation-requests"] });
      toast({
        title: "Заявка отправлена",
        description: "Ваша заявка на роль модератора отправлена на рассмотрение",
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

  if (listingsLoading || transactionsLoading || reviewsLoading || moderationRequestsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const userListings = listings?.filter((l) => l.sellerId === user?.id) || [];
  const userTransactions = transactions?.filter(
    (t) => t.buyerId === user?.id || t.sellerId === user?.id
  ) || [];
  const userReviews = reviews?.filter(
    (r) => r.toUserId === user?.id
  ) || [];

  const pendingModerationRequest = moderationRequests?.find(
    (r) => r.userId === user?.id && r.status === "pending"
  );

  return (
    <div className="container py-8">
      <div className="flex items-center gap-6 mb-8">
        <Avatar className="h-24 w-24">
          <AvatarImage src={user?.avatar} alt={user?.username} />
          <AvatarFallback>{user?.username?.[0]}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">{user?.username}</h1>
              <p className="text-muted-foreground">
                Баланс: {Number(user?.balance).toFixed(2)} ₽
              </p>
            </div>
            {!user?.isModerator && (
              <Button
                onClick={() => createModerationRequestMutation.mutate()}
                disabled={
                  createModerationRequestMutation.isPending || 
                  pendingModerationRequest !== undefined
                }
              >
                {pendingModerationRequest
                  ? "Заявка на рассмотрении"
                  : "Стать модератором"}
              </Button>
            )}
          </div>
        </div>
      </div>

      <Tabs defaultValue="listings" className="space-y-4">
        <TabsList>
          <TabsTrigger value="listings">Мои товары</TabsTrigger>
          <TabsTrigger value="transactions">История сделок</TabsTrigger>
          <TabsTrigger value="reviews">Отзывы</TabsTrigger>
        </TabsList>

        <TabsContent value="listings">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {userListings.map((listing) => (
              <Card key={listing.id}>
                <CardHeader>
                  <CardTitle>{listing.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-2">
                    {listing.description}
                  </p>
                  <div className="flex justify-between items-center">
                    <span className="font-bold">
                      {Number(listing.price).toFixed(2)} ₽
                    </span>
                    <span className="text-sm px-2 py-1 bg-secondary rounded-full">
                      {listing.status === 'pending' ? 'На модерации' :
                       listing.status === 'active' ? 'Активно' :
                       listing.status === 'sold' ? 'Продано' : 'Отклонено'}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="transactions">
          <div className="space-y-4">
            {userTransactions.map((transaction) => (
              <Card key={transaction.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">
                        {transaction.buyerId === user?.id ? "Покупка" : "Продажа"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {Number(transaction.amount).toFixed(2)} ₽
                      </p>
                    </div>
                    <span className="text-sm px-2 py-1 bg-secondary rounded-full">
                      {transaction.status === 'completed' ? 'Завершено' :
                       transaction.status === 'cancelled' ? 'Отменено' : 'Спор'}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="reviews">
          <div className="space-y-4">
            {userReviews.map((review) => (
              <Card key={review.id}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Оценка: {review.rating}/5</span>
                      </div>
                      {review.comment && (
                        <p className="text-sm text-muted-foreground mt-2">
                          {review.comment}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}