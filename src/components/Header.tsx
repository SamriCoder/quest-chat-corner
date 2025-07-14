import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { MessageSquarePlus, LogOut, User } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Header() {
  const { user, signOut } = useAuth();

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <MessageSquarePlus className="h-6 w-6" />
          <h1 className="text-xl font-bold">Forum</h1>
        </Link>

        <div className="flex items-center space-x-4">
          {user ? (
            <>
              <Link to="/ask">
                <Button variant="default">Ask Question</Button>
              </Link>
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4" />
                <span className="text-sm">Welcome back!</span>
              </div>
              <Button variant="outline" onClick={signOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </>
          ) : (
            <Link to="/auth">
              <Button>Sign In</Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}