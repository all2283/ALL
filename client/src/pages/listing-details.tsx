import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Listing } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Package, Star, Server, User } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { useAuth } from "@/hooks/use-auth";

export default function ListingDetailsPage() {
  const { id } = useParams();
  const { user } = useAuth();
  
  const { data: listing, isLoading } = useQuery<Listing>({
    queryKey: [`/api/listings/${id}`],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-4">Объявление не найдено</h1>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Изображения */}
        <div className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <Carousel>
                <CarouselContent>
                  <CarouselItem>
                    <img
                      src={listing.imageUrl || "/placeholder.png"}
                      alt={listing.title}
                      className="w-full h-[400px] object-cover rounded-lg"
                    />
                  </CarouselItem>
                  {listing.additionalImages?.map((image, index) => (
                    <CarouselItem key={index}>
                      <img
                        src={image}
                        alt={`${listing.title} - изображение ${index + 2}`}
                        className="w-full h-[400px] object-cover rounded-lg"
                      />
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious />
                <CarouselNext />
              </Carousel>
            </CardContent>
          </Card>
        </div>

        {/* Информация */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{listing.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-bold">
                    {Number(listing.price).toFixed(2)} ₽
                  </span>
                  <span className="px-2 py-1 bg-secondary rounded-full text-sm">
                    {listing.category}
                  </span>
                </div>

                <p className="text-muted-foreground">{listing.description}</p>

                {/* Информация об аккаунте */}
                {listing.accountLevel && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4" />
                      <span>Уровень: {listing.accountLevel}</span>
                    </div>
                    {listing.accountRank && (
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span>Ранг: {listing.accountRank}</span>
                      </div>
                    )}
                    {listing.accountServer && (
                      <div className="flex items-center gap-2">
                        <Server className="h-4 w-4" />
                        <span>Сервер: {listing.accountServer}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Кнопка покупки */}
                {user && user.id !== listing.sellerId && (
                  <Button className="w-full">Купить</Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
