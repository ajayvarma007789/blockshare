import { Link, useLocation } from 'wouter';
import { useState } from 'react';
import { Bell, Menu, X, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

const Header = () => {
  const [location, setLocation] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase();
  };

  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span className="font-bold text-xl text-gray-900">BlockShare</span>
              </div>
            </div>
            <nav className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link href="/">
                <div className={`${location === '/' ? 'border-accent text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}>
                  Dashboard
                </div>
              </Link>
              <Link href="/my-files">
                <div className={`${location === '/my-files' ? 'border-accent text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}>
                  My Files
                </div>
              </Link>
              <Link href="/shared">
                <div className={`${location === '/shared' ? 'border-accent text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}>
                  Shared
                </div>
              </Link>
            </nav>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-500">
              <Bell className="h-5 w-5" />
              <span className="sr-only">View notifications</span>
            </Button>

            {/* Profile section */}
            <div className="ml-3 relative flex items-center gap-2">
              <Avatar className="h-8 w-8 bg-accent text-white">
                <AvatarFallback>{user?.username ? getInitials(user.username) : 'U'}</AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium text-gray-700">{user?.username || 'User'}</span>
              
              <Button 
                variant="ghost" 
                size="sm" 
                className="ml-2 text-gray-600 hover:text-gray-900"
                onClick={() => {
                  logoutMutation.mutate(undefined, {
                    onSuccess: () => {
                      toast({
                        title: "Logged out",
                        description: "You have been successfully logged out.",
                      });
                      setLocation('/auth');
                    }
                  });
                }}
              >
                <LogOut className="h-4 w-4 mr-1" />
                <span>Logout</span>
              </Button>
            </div>
          </div>
          <div className="-mr-2 flex items-center sm:hidden">
            {/* Mobile menu button */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="inline-flex items-center justify-center p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <span className="sr-only">Open main menu</span>
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden">
          <div className="pt-2 pb-3 space-y-1">
            <Link href="/">
              <div className={`${location === '/' ? 'bg-accent-50 border-accent text-accent' : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'} block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}>
                Dashboard
              </div>
            </Link>
            <Link href="/my-files">
              <div className={`${location === '/my-files' ? 'bg-accent-50 border-accent text-accent' : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'} block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}>
                My Files
              </div>
            </Link>
            <Link href="/shared">
              <div className={`${location === '/shared' ? 'bg-accent-50 border-accent text-accent' : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'} block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}>
                Shared
              </div>
            </Link>
          </div>
          <div className="pt-4 pb-3 border-t border-gray-200">
            <div className="flex items-center px-4">
              <div className="flex-shrink-0">
                <Avatar className="h-10 w-10 bg-accent text-white">
                  <AvatarFallback>{user?.username ? getInitials(user.username) : 'U'}</AvatarFallback>
                </Avatar>
              </div>
              <div className="ml-3">
                <div className="text-base font-medium text-gray-800">{user?.username || 'User'}</div>
                <div className="text-sm font-medium text-gray-500">{user?.email || ''}</div>
              </div>
              <Button variant="ghost" size="icon" className="ml-auto text-gray-400 hover:text-gray-500">
                <Bell className="h-6 w-6" />
                <span className="sr-only">View notifications</span>
              </Button>
            </div>
            
            <div className="mt-3 space-y-1 border-t border-gray-200 pt-3">
              <Button 
                variant="ghost" 
                className="w-full justify-start text-left block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                onClick={() => {
                  logoutMutation.mutate(undefined, {
                    onSuccess: () => {
                      toast({
                        title: "Logged out",
                        description: "You have been successfully logged out.",
                      });
                      setLocation('/auth');
                    }
                  });
                }}
              >
                <LogOut className="h-5 w-5 mr-2" />
                Sign out
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
