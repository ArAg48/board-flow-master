import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';

interface LoginForm {
  email: string;
  password: string;
}

interface SignupForm extends LoginForm {}

const Auth: React.FC = () => {
  const { user, login, isLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/', { replace: true });
    }
    document.title = 'Sign in - CKT Works Inventory';
  }, [user, navigate]);

  const loginForm = useForm<LoginForm>({ defaultValues: { email: '', password: '' } });
  const signupForm = useForm<SignupForm>({ defaultValues: { email: '', password: '' } });

  const onLogin = async (values: LoginForm) => {
    try {
      await login(values.email, values.password);
      toast({ title: 'Welcome back', description: 'You are now signed in.' });
      navigate('/', { replace: true });
    } catch (e: any) {
      toast({ title: 'Login failed', description: e?.message || 'Please check your credentials.', variant: 'destructive' });
    }
  };

  const onSignup = async (values: SignupForm) => {
    try {
      const redirectUrl = `${window.location.origin}/auth`;
      const { error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: { emailRedirectTo: redirectUrl },
      });
      if (error) throw error;
      toast({ title: 'Check your email', description: 'Confirm your email to finish sign up.' });
    } catch (e: any) {
      toast({ title: 'Sign up failed', description: e?.message || 'Please try again.', variant: 'destructive' });
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <section className="w-full max-w-md">
        <h1 className="text-2xl font-semibold text-center mb-6">CKT Works Inventory</h1>
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="login">Log in</TabsTrigger>
            <TabsTrigger value="signup">Sign up</TabsTrigger>
          </TabsList>
          <TabsContent value="login">
            <form className="space-y-4 mt-4" onSubmit={loginForm.handleSubmit(onLogin)}>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="you@example.com" {...loginForm.register('email', { required: true })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" {...loginForm.register('password', { required: true })} />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Signing in…' : 'Sign in'}
              </Button>
            </form>
          </TabsContent>
          <TabsContent value="signup">
            <form className="space-y-4 mt-4" onSubmit={signupForm.handleSubmit(onSignup)}>
              <div className="space-y-2">
                <Label htmlFor="signup-email">Email</Label>
                <Input id="signup-email" type="email" placeholder="you@example.com" {...signupForm.register('email', { required: true })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-password">Password</Label>
                <Input id="signup-password" type="password" {...signupForm.register('password', { required: true, minLength: 6 })} />
              </div>
              <Button type="submit" className="w-full">
                Create account
              </Button>
            </form>
          </TabsContent>
        </Tabs>
        <p className="text-sm text-center mt-4 opacity-80">
          Already have an account? Use the Log in tab above. After signing up, check your email for a confirmation link.
        </p>
      </section>
    </main>
  );
};

export default Auth;
