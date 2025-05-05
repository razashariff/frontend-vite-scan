
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Menu, X, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '../contexts/AuthContext';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <header className="border-b border-border bg-card">
      <div className="container flex justify-between items-center h-16 px-4">
        <Link to="/" className="flex items-center space-x-2">
          <Shield className="h-6 w-6 text-primary" />
          <span className="font-bold text-lg">WebWatchdog</span>
        </Link>

        {/* Mobile menu button */}
        <Button variant="ghost" size="icon" className="md:hidden" onClick={toggleMenu}>
          {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>

        {/* Desktop navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          {user ? (
            <>
              <Link to="/" className="text-foreground hover:text-primary transition-colors">
                Dashboard
              </Link>
              <Link to="/scan-history" className="text-foreground hover:text-primary transition-colors">
                Scan History
              </Link>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-muted-foreground">
                  {user.email}
                </span>
                <Button variant="ghost" size="icon" onClick={handleSignOut}>
                  <LogOut className="h-5 w-5" />
                </Button>
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="text-foreground hover:text-primary transition-colors">
                Login
              </Link>
              <Link to="/register">
                <Button>Register</Button>
              </Link>
            </>
          )}
        </nav>

        {/* Mobile navigation */}
        {isMenuOpen && (
          <div className="absolute top-16 left-0 right-0 bg-card border-b border-border z-50 md:hidden">
            <nav className="container flex flex-col py-4">
              {user ? (
                <>
                  <Link 
                    to="/" 
                    className="px-4 py-2 hover:bg-secondary rounded-md"
                    onClick={toggleMenu}
                  >
                    Dashboard
                  </Link>
                  <Link 
                    to="/scan-history" 
                    className="px-4 py-2 hover:bg-secondary rounded-md"
                    onClick={toggleMenu}
                  >
                    Scan History
                  </Link>
                  <div className="border-t border-border mt-2 pt-2 px-4 py-2">
                    <div className="text-sm text-muted-foreground mb-2">
                      {user.email}
                    </div>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={handleSignOut}
                      className="w-full flex items-center justify-center"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <Link 
                    to="/login" 
                    className="px-4 py-2 hover:bg-secondary rounded-md"
                    onClick={toggleMenu}
                  >
                    Login
                  </Link>
                  <Link 
                    to="/register" 
                    className="px-4 py-2 hover:bg-secondary rounded-md"
                    onClick={toggleMenu}
                  >
                    Register
                  </Link>
                </>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
