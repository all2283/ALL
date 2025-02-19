import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertListingSchema } from "@shared/schema";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { type Category } from "@shared/schema";

export default function ListingPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const form = useForm({
    resolver: zodResolver(insertListingSchema),
    defaultValues: {
      title: "",
      description: "",
      price: "",
      category: "",
      imageUrl: "",
      accountLogin: "",
      accountPassword: "",
      accountEmail: "",
      accountLevel: "",
      accountRank: "",
      accountServer: "",
      additionalImages: [],
    },
  });

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const createListingMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/listings", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/listings"] });
      toast({
        title: "Успешно",
        description: "Ваше объявление создано и ожидает проверки модератором",
      });
      setLocation("/profile");
    },
    onError: (error: Error) => {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const selectedCategory = form.watch("category");
  const isGameAccount = selectedCategory?.includes("аккаунт");

  return (
    <div className="container max-w-2xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Создать объявление</h1>
        <p className="text-muted-foreground">
          Заполните форму ниже, чтобы разместить свой товар
        </p>
      </div>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit((data) => createListingMutation.mutate(data))}
          className="space-y-6"
        >
          <Card>
            <CardHeader>
              <CardTitle>Основная информация</CardTitle>
              <CardDescription>
                Укажите основные параметры вашего товара
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Название</FormLabel>
                    <FormControl>
                      <Input placeholder="Введите название товара" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Описание</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Опишите ваш товар"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Цена (₽)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="Введите цену"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Категория</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Выберите категорию" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories?.map((category) => (
                          <SelectItem key={category.id} value={category.name}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Изображения</CardTitle>
              <CardDescription>
                Добавьте фотографии вашего товара
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Основное изображение</FormLabel>
                    <FormControl>
                      <Input placeholder="Введите URL изображения" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="additionalImages"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Дополнительные изображения</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Введите URL изображений через запятую"
                        onChange={(e) => field.onChange(e.target.value.split(","))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {isGameAccount && (
            <Card>
              <CardHeader>
                <CardTitle>Данные аккаунта</CardTitle>
                <CardDescription>
                  Эти данные будут зашифрованы и переданы покупателю после оплаты
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="accountLogin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Логин</FormLabel>
                      <FormControl>
                        <Input placeholder="Логин от аккаунта" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="accountPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Пароль</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Пароль от аккаунта"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="accountEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="Email от аккаунта" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="accountLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Уровень</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Уровень аккаунта"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="accountRank"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ранг/Звание</FormLabel>
                      <FormControl>
                        <Input placeholder="Ранг или звание" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="accountServer"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Сервер</FormLabel>
                      <FormControl>
                        <Input placeholder="Игровой сервер" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={createListingMutation.isPending}
          >
            {createListingMutation.isPending ? "Создание..." : "Создать объявление"}
          </Button>
        </form>
      </Form>
    </div>
  );
}