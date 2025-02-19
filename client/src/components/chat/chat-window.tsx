import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Message, InsertMessage } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Send } from "lucide-react";
import { format } from "date-fns";

interface ChatWindowProps {
  chatId: number;
  otherUserName: string;
  otherUserAvatar: string | null;
}

export function ChatWindow({ chatId, otherUserName, otherUserAvatar }: ChatWindowProps) {
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: messages, isLoading } = useQuery<Message[]>({
    queryKey: [`/api/chats/${chatId}/messages`],
    refetchInterval: 5000, // Poll every 5 seconds
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await apiRequest("POST", `/api/chats/${chatId}/messages`, { content });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/chats/${chatId}/messages`] });
      setMessage("");
    },
  });

  // Auto-scroll to latest message when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Mark messages as read when chat is opened
  useEffect(() => {
    if (user) {
      apiRequest("POST", `/api/chats/${chatId}/read`);
    }
  }, [chatId, user]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[600px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Avatar>
            <AvatarImage src={otherUserAvatar || undefined} />
            <AvatarFallback>{otherUserName[0]}</AvatarFallback>
          </Avatar>
          <CardTitle>{otherUserName}</CardTitle>
        </div>
      </CardHeader>
      <ScrollArea ref={scrollRef} className="flex-1 p-4">
        <div className="space-y-4">
          {messages?.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.senderId === user?.id ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                  message.senderId === user?.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                <p>{message.content}</p>
                <p className="text-xs opacity-70">
                  {format(new Date(message.createdAt), "HH:mm")}
                </p>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
      <CardContent className="p-4 border-t">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (message.trim()) {
              sendMessageMutation.mutate(message);
            }
          }}
          className="flex gap-2"
        >
          <Input
            placeholder="Введите сообщение..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <Button
            type="submit"
            size="icon"
            disabled={!message.trim() || sendMessageMutation.isPending}
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}