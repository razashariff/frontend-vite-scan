
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type AuthContextType = {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any, data: any }>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Get the current session and set up an auth state change listener
    const initSession = async () => {
      setIsLoading(true);
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error getting session:', error);
          toast({
            title: 'Authentication Error',
            description: 'Failed to retrieve your session.',
            variant: 'destructive',
          });
        }
        if (session) {
          setSession(session);
          setUser(session.user);
        }
      } catch (error) {
        console.error('Error in session initialization:', error);
      } finally {
        setIsLoading(false);
      }
    };

    // Initialize the session
    initSession();

    // Set up the auth state subscriber
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        setIsLoading(false);
      }
    );

    // Cleanup the subscription
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [toast]);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast({
          title: 'Sign In Failed',
          description: error.message,
          variant: 'destructive',
        });
        return { error };
      }
      toast({
        title: 'Welcome back!',
        description: 'You have successfully signed in.',
      });
      return { error: null };
    } catch (error: any) {
      console.error('Sign in error:', error);
      toast({
        title: 'Sign In Failed',
        description: error.message || 'An unexpected error occurred',
        variant: 'destructive',
      });
      return { error };
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) {
        toast({
          title: 'Registration Failed',
          description: error.message,
          variant: 'destructive',
        });
        return { error, data: null };
      }
      
      toast({
        title: 'Registration Successful',
        description: 'Please check your email for confirmation.',
      });
      
      return { error: null, data };
    } catch (error: any) {
      console.error('Sign up error:', error);
      toast({
        title: 'Registration Failed',
        description: error.message || 'An unexpected error occurred',
        variant: 'destructive',
      });
      return { error, data: null };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: 'Signed Out',
      description: 'You have been successfully signed out.',
    });
  };

  const value = {
    session,
    user,
    isLoading,
    signIn,
    signUp,
    signOut,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
