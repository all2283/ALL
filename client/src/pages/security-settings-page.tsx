import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useMutation } from "@tanstack/react-query";
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
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Loader2, Shield, Mail, Phone, History, Key } from "lucide-react";

export default function SecuritySettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState(user?.phone || "");

  const toggle2faMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/user/2fa/toggle");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Успешно",
        description: user?.twoFactorEnabled
          ? "Двухфакторная аутентификация отключена"
          : "Двухфакторная аутентификация включена",
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

  const verifyContactMutation = useMutation({
    mutationFn: async (data: { type: "email" | "phone"; value: string }) => {
      const res = await apiRequest("POST", `/api/user/verify/${data.type}`, {
        value: data.value,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Код отправлен",
        description: "Проверьте вашу почту или телефон для подтверждения",
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

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Безопасность</h1>
        <p className="text-muted-foreground">
          Настройки безопасности вашего аккаунта
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Двухфакторная аутентификация</CardTitle>
            <CardDescription>
              Дополнительный уровень защиты вашего аккаунта
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span>2FA Аутентификация</span>
            </div>
            <Switch
              checked={user?.twoFactorEnabled}
              onCheckedChange={() => toggle2faMutation.mutate()}
              disabled={toggle2faMutation.isPending}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Контактные данные</CardTitle>
            <CardDescription>
              Подтвердите ваш email и телефон для повышения безопасности
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Mail className="h-4 w-4" />
                  <span>Email</span>
                </div>
                <Input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Введите email"
                />
              </div>
              <Button
                variant="outline"
                onClick={() =>
                  verifyContactMutation.mutate({ type: "email", value: email })
                }
                disabled={!email || verifyContactMutation.isPending}
              >
                {user?.email === email && user?.isVerified
                  ? "Подтверждено"
                  : "Подтвердить"}
              </Button>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Phone className="h-4 w-4" />
                  <span>Телефон</span>
                </div>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Введите номер телефона"
                />
              </div>
              <Button
                variant="outline"
                onClick={() =>
                  verifyContactMutation.mutate({ type: "phone", value: phone })
                }
                disabled={!phone || verifyContactMutation.isPending}
              >
                {user?.phone === phone && user?.isVerified
                  ? "Подтверждено"
                  : "Подтвердить"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>История входов</CardTitle>
            <CardDescription>
              Последние входы в ваш аккаунт
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* История входов будет загружаться с сервера */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <History className="h-4 w-4" />
                  <div>
                    <p className="font-medium">Москва, Россия</p>
                    <p className="text-sm text-muted-foreground">
                      Chrome на Windows • IP: 192.168.1.1
                    </p>
                  </div>
                </div>
                <span className="text-sm text-muted-foreground">
                  2 часа назад
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Пароль</CardTitle>
            <CardDescription>
              Изменение пароля и восстановление доступа
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Key className="h-4 w-4" />
                <span>Изменить пароль</span>
              </div>
              <Button variant="outline">
                Сменить пароль
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
