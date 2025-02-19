import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";
import { SiteHeader } from "./components/layout/site-header";

import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import ProfilePage from "@/pages/profile-page";
import ListingPage from "@/pages/listing-page";
import ListingDetailsPage from "@/pages/listing-details";
import ModerationPage from "@/pages/moderation-page";
import ChatsPage from "@/pages/chats-page";
import FavoritesPage from "@/pages/favorites-page";
import DisputesPage from "@/pages/disputes-page";
import SearchSubscriptionsPage from "@/pages/search-subscriptions-page";
import SecuritySettingsPage from "@/pages/security-settings-page";
import AchievementsPage from "@/pages/achievements-page";
import SearchPage from "@/pages/search-page";
import BlacklistPage from "@/pages/blacklist-page";
import TransactionsPage from "@/pages/transactions-page";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <div className="relative flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <Switch>
          <Route path="/" component={HomePage} />
          <Route path="/auth" component={AuthPage} />
          <Route path="/listings/:id" component={ListingDetailsPage} />
          <ProtectedRoute path="/profile" component={ProfilePage} />
          <ProtectedRoute path="/listings/new" component={ListingPage} />
          <ProtectedRoute path="/moderate" component={ModerationPage} />
          <ProtectedRoute path="/chats" component={ChatsPage} />
          <ProtectedRoute path="/favorites" component={FavoritesPage} />
          <ProtectedRoute path="/disputes" component={DisputesPage} />
          <ProtectedRoute path="/search-subscriptions" component={SearchSubscriptionsPage} />
          <ProtectedRoute path="/security" component={SecuritySettingsPage} />
          <ProtectedRoute path="/achievements" component={AchievementsPage} />
          <ProtectedRoute path="/search" component={SearchPage} />
          <ProtectedRoute path="/blacklist" component={BlacklistPage} />
          <ProtectedRoute path="/transactions" component={TransactionsPage} />
          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;