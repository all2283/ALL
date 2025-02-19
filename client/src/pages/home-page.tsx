import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Listing } from "@shared/schema";

export default function HomePage() {
  const { data: listings, isLoading } = useQuery<Listing[]>({ 
    queryKey: ["/api/listings"]
  });

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="container py-8">
      <h1 className="text-4xl font-bold mb-8">Featured Listings</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {listings?.map((listing) => (
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
                  ${Number(listing.price).toFixed(2)}
                </span>
                <span className="text-sm text-muted-foreground">
                  {listing.category}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="container py-8">
      <Skeleton className="h-12 w-48 mb-8" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-3/4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-20 mb-4" />
              <div className="flex justify-between items-center">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-4 w-24" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
