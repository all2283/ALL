import { useQuery } from "@tanstack/react-query";
import { Chat, User } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChatWindow } from "@/components/chat/chat-window";
import { Loader2, MessageSquare } from "lucide-react";
import { useState } from "react";

export default function ChatsPage() {
  const [selectedChatId, setSelectedChatId] = useState<number | null>(null);
  
  const { data: chats, isLoading } = useQuery<(Chat & { 
    buyer: User;
    seller: User;
    listing: { title: string; }
  })[]>({
    queryKey: ["/api/chats"],
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
      <div className="grid gap-6 lg:grid-cols-[300px,1fr]">
        {/* Список чатов */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Сообщения</h2>
          {chats?.map((chat) => (
            <Card
              key={chat.id}
              className={`cursor-pointer transition-colors hover:bg-accent ${
                selectedChatId === chat.id ? "border-primary" : ""
              }`}
              onClick={() => setSelectedChatId(chat.id)}
            >
              <CardHeader className="p-4">
                <CardTitle className="text-base">
                  {chat.listing.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>
                    {chat.buyer.username} → {chat.seller.username}
                  </span>
                  <MessageSquare className="h-4 w-4" />
                </div>
              </CardContent>
            </Card>
          ))}

          {chats?.length === 0 && (
            <Card>
              <CardContent className="p-6">
                <p className="text-center text-muted-foreground">
                  У вас пока нет активных чатов
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Окно чата */}
        {selectedChatId ? (
          <div>
            {chats?.map((chat) => {
              if (chat.id === selectedChatId) {
                const otherUser = chat.buyer.id === chat.sellerId ? chat.seller : chat.buyer;
                return (
                  <ChatWindow
                    key={chat.id}
                    chatId={chat.id}
                    otherUserName={otherUser.username}
                    otherUserAvatar={otherUser.avatar}
                  />
                );
              }
              return null;
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="p-6">
              <p className="text-center text-muted-foreground">
                Выберите чат чтобы начать общение
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
