import { useQuery, useMutation } from "@tanstack/react-query";
import { User } from "@shared/schema";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, UserX } from "lucide-react";

export default function BlacklistPage() {
  const { toast } = useToast();

  const { data: blacklist, isLoading } = useQuery<(User & { blockedAt: string })[]>({
    queryKey: ["/api/blacklist"],
  });

  const unblockUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      await apiRequest("DELETE", `/api/blacklist/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/blacklist"] });
      toast({
        title: "Успешно",
        description: "Пользователь разблокирован",
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
        <h1 className="text-3xl font-bold">Черный список</h1>
        <p className="text-muted-foreground">
          Заблокированные пользователи
        </p>
      </div>

      <div className="space-y-4">
        {blacklist?.map((user) => (
          <Card key={user.id}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Avatar>
                    <AvatarImage src={user.avatar || undefined} />
                    <AvatarFallback>{user.username[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-medium">{user.username}</h3>
                    <p className="text-sm text-muted-foreground">
                      Заблокирован: {new Date(user.blockedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={() => unblockUserMutation.mutate(user.id)}
                  disabled={unblockUserMutation.isPending}
                >
                  Разблокировать
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {blacklist?.length === 0 && (
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col items-center gap-2 text-center">
                <UserX className="h-8 w-8 text-muted-foreground" />
                <p className="text-muted-foreground">
                  Ваш черный список пуст
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
