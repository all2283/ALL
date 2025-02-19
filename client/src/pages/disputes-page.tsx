import { useQuery, useMutation } from "@tanstack/react-query";
import { Dispute } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, AlertTriangle } from "lucide-react";
import { useState } from "react";

export default function DisputesPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [resolution, setResolution] = useState("");

  const { data: disputes, isLoading } = useQuery<(Dispute & {
    transaction: {
      listing: { title: string };
      amount: string;
    };
    initiator: { username: string };
  })[]>({
    queryKey: ["/api/disputes"],
  });

  const resolveDisputeMutation = useMutation({
    mutationFn: async ({ id, status, resolution }: { id: number; status: string; resolution: string; }) => {
      const res = await apiRequest("POST", `/api/disputes/${id}`, {
        status,
        resolution,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/disputes"] });
      toast({
        title: "Успешно",
        description: "Спор разрешен",
      });
      setResolution("");
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
        <h1 className="text-3xl font-bold">Споры</h1>
        <p className="text-muted-foreground">
          {user?.isModerator
            ? "Управление спорами между пользователями"
            : "Ваши текущие споры"}
        </p>
      </div>

      <div className="space-y-6">
        {disputes?.map((dispute) => (
          <Card key={dispute.id}>
            <CardHeader>
              <CardTitle>
                Спор по сделке: {dispute.transaction.listing.title}
              </CardTitle>
              <CardDescription>
                Инициатор: {dispute.initiator.username} • Сумма:{" "}
                {Number(dispute.transaction.amount).toFixed(2)} ₽
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Причина спора:</h4>
                  <p className="text-muted-foreground">{dispute.reason}</p>
                </div>

                {dispute.resolution && (
                  <div>
                    <h4 className="font-medium mb-2">Решение:</h4>
                    <p className="text-muted-foreground">{dispute.resolution}</p>
                  </div>
                )}

                {user?.isModerator && dispute.status === "pending" && (
                  <div className="space-y-4">
                    <Textarea
                      placeholder="Введите решение..."
                      value={resolution}
                      onChange={(e) => setResolution(e.target.value)}
                    />
                    <div className="space-x-2">
                      <Button
                        variant="outline"
                        onClick={() =>
                          resolveDisputeMutation.mutate({
                            id: dispute.id,
                            status: "resolved",
                            resolution,
                          })
                        }
                        disabled={!resolution || resolveDisputeMutation.isPending}
                      >
                        Удовлетворить
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() =>
                          resolveDisputeMutation.mutate({
                            id: dispute.id,
                            status: "closed",
                            resolution,
                          })
                        }
                        disabled={!resolution || resolveDisputeMutation.isPending}
                      >
                        Отклонить
                      </Button>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Статус: {dispute.status}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {disputes?.length === 0 && (
          <Card>
            <CardContent className="p-6">
              <p className="text-center text-muted-foreground">
                {user?.isModerator
                  ? "Нет активных споров"
                  : "У вас нет активных споров"}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
