import { useQuery } from "@tanstack/react-query";
import { Transaction } from "@shared/schema";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Loader2, CreditCard } from "lucide-react";
import { format } from "date-fns";

export default function TransactionsPage() {
  const [, setLocation] = useLocation();

  const { data: transactions, isLoading } = useQuery<(Transaction & {
    listing: { title: string };
    buyer: { username: string };
    seller: { username: string };
  })[]>({
    queryKey: ["/api/transactions"],
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
        <h1 className="text-3xl font-bold">История транзакций</h1>
        <p className="text-muted-foreground">
          Ваши покупки и продажи
        </p>
      </div>

      <div className="space-y-4">
        {transactions?.map((transaction) => (
          <Card key={transaction.id}>
            <CardHeader>
              <CardTitle>
                {transaction.listing.title}
              </CardTitle>
              <CardDescription>
                {transaction.buyer.username} → {transaction.seller.username}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">
                    {Number(transaction.amount).toFixed(2)} ₽
                  </span>
                  <div className="space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => setLocation(`/listings/${transaction.listingId}`)}
                    >
                      Объявление
                    </Button>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CreditCard className="h-4 w-4" />
                  <span>
                    {format(new Date(transaction.createdAt), "dd.MM.yyyy HH:mm")}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {transactions?.length === 0 && (
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col items-center gap-2 text-center">
                <CreditCard className="h-8 w-8 text-muted-foreground" />
                <p className="text-muted-foreground">
                  У вас пока нет транзакций
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
