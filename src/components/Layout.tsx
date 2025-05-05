
import { ReactNode } from 'react';
import Navbar from './Navbar';
import { useAuth } from '../contexts/AuthContext';
import { Loader } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <Loader className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container py-6 px-4 md:px-6">
        {children}
      </main>
      <footer className="py-6 border-t border-border">
        <div className="container text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} WebWatchdog Guardian Scan. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
