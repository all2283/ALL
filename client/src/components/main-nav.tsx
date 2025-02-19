import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./theme-toggle";
import { useAuth } from "@/hooks/use-auth";

export function MainNav() {
  const { user, logoutMutation } = useAuth();

  return (
    <nav className="border-b">
      <div className="flex h-16 items-center px-4">
        <div className="flex items-center space-x-4">
          <Link href="/">
            <a className="text-2xl font-bold">GameMarket</a>
          </Link>
        </div>

        <div className="ml-auto flex items-center space-x-4">
          <ThemeToggle />
          
          {user ? (
            <>
              <Link href="/profile">
                <Button variant="ghost">Profile</Button>
              </Link>
              <Link href="/listing">
                <Button>Sell Item</Button>
              </Link>
              <Button 
                variant="ghost" 
                onClick={() => logoutMutation.mutate()}
              >
                Logout
              </Button>
            </>
          ) : (
            <Link href="/auth">
              <Button>Login</Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
