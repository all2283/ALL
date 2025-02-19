import { useQuery } from "@tanstack/react-query";
import { Achievement } from "@shared/schema";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Loader2, Trophy } from "lucide-react";

export default function AchievementsPage() {
  const { data: achievements, isLoading } = useQuery<(Achievement & {
    unlockedAt: string | null;
    progress: number;
  })[]>({
    queryKey: ["/api/achievements"],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const unlockedCount = achievements?.filter((a) => a.unlockedAt).length || 0;
  const totalCount = achievements?.length || 0;

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Достижения</h1>
        <p className="text-muted-foreground">
          Ваш прогресс: {unlockedCount} из {totalCount} достижений
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {achievements?.map((achievement) => (
          <Card
            key={achievement.id}
            className={achievement.unlockedAt ? "bg-accent/50" : undefined}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div
                  className="h-8 w-8 flex items-center justify-center rounded-full bg-primary text-primary-foreground"
                  dangerouslySetInnerHTML={{ __html: achievement.icon }}
                />
                {achievement.name}
              </CardTitle>
              <CardDescription>{achievement.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Progress value={achievement.progress} />
                <p className="text-sm text-muted-foreground">
                  {achievement.unlockedAt ? (
                    <>
                      Получено:{" "}
                      {new Date(achievement.unlockedAt).toLocaleDateString()}
                    </>
                  ) : (
                    `Прогресс: ${achievement.progress}%`
                  )}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}

        {achievements?.length === 0 && (
          <Card className="md:col-span-2 lg:col-span-3">
            <CardContent className="p-6">
              <div className="flex flex-col items-center gap-2 text-center">
                <Trophy className="h-8 w-8 text-muted-foreground" />
                <p className="text-muted-foreground">
                  Достижения пока недоступны
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
