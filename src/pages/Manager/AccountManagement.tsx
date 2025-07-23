import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Trash2, UserPlus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const createAccountSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  role: z.enum(['manager', 'technician'], { required_error: 'Please select a role' }),
});

type CreateAccountForm = z.infer<typeof createAccountSchema>;

interface Account {
  id: string;
  username: string;
  role: 'manager' | 'technician';
  firstName: string;
  lastName: string;
  email: string;
  isActive: boolean;
  createdAt: string;
}

const AccountManagement: React.FC = () => {
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<Account[]>([
    {
      id: '1',
      username: 'manager',
      role: 'manager',
      firstName: 'John',
      lastName: 'Manager',
      email: 'manager@ptl.com',
      isActive: true,
      createdAt: '2024-01-15',
    },
    {
      id: '2',
      username: 'tech',
      role: 'technician',
      firstName: 'Jane',
      lastName: 'Technician',
      email: 'tech@ptl.com',
      isActive: true,
      createdAt: '2024-01-20',
    },
    {
      id: '3',
      username: 'tech2',
      role: 'technician',
      firstName: 'Bob',
      lastName: 'Smith',
      email: 'bob@ptl.com',
      isActive: false,
      createdAt: '2024-02-01',
    },
  ]);

  const form = useForm<CreateAccountForm>({
    resolver: zodResolver(createAccountSchema),
    defaultValues: {
      username: '',
      password: '',
      firstName: '',
      lastName: '',
      email: '',
      role: undefined,
    },
  });

  const onSubmit = (data: CreateAccountForm) => {
    // TODO: Replace with actual API call
    const newAccount: Account = {
      id: Date.now().toString(),
      username: data.username,
      role: data.role,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      isActive: true,
      createdAt: new Date().toISOString().split('T')[0],
    };

    setAccounts(prev => [...prev, newAccount]);
    form.reset();
    
    toast({
      title: 'Account Created',
      description: `${data.role} account for ${data.firstName} ${data.lastName} has been created successfully.`,
    });
  };

  const toggleAccountStatus = (id: string) => {
    setAccounts(prev => 
      prev.map(account => 
        account.id === id 
          ? { ...account, isActive: !account.isActive }
          : account
      )
    );
    
    const account = accounts.find(acc => acc.id === id);
    toast({
      title: 'Account Status Updated',
      description: `${account?.firstName} ${account?.lastName}'s account has been ${account?.isActive ? 'deactivated' : 'activated'}.`,
    });
  };

  const deleteAccount = (id: string) => {
    const account = accounts.find(acc => acc.id === id);
    setAccounts(prev => prev.filter(account => account.id !== id));
    
    toast({
      title: 'Account Deleted',
      description: `${account?.firstName} ${account?.lastName}'s account has been deleted.`,
      variant: 'destructive',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Account Management</h1>
          <p className="text-muted-foreground">Create and manage user accounts</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Create Account Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Create New Account
            </CardTitle>
            <CardDescription>
              Add a new manager or technician account to the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    {...form.register('firstName')}
                    className={form.formState.errors.firstName ? 'border-destructive' : ''}
                  />
                  {form.formState.errors.firstName && (
                    <p className="text-sm text-destructive">{form.formState.errors.firstName.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    {...form.register('lastName')}
                    className={form.formState.errors.lastName ? 'border-destructive' : ''}
                  />
                  {form.formState.errors.lastName && (
                    <p className="text-sm text-destructive">{form.formState.errors.lastName.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  {...form.register('username')}
                  className={form.formState.errors.username ? 'border-destructive' : ''}
                />
                {form.formState.errors.username && (
                  <p className="text-sm text-destructive">{form.formState.errors.username.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  {...form.register('email')}
                  className={form.formState.errors.email ? 'border-destructive' : ''}
                />
                {form.formState.errors.email && (
                  <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  {...form.register('password')}
                  className={form.formState.errors.password ? 'border-destructive' : ''}
                />
                {form.formState.errors.password && (
                  <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select onValueChange={(value) => form.setValue('role', value as 'manager' | 'technician')}>
                  <SelectTrigger className={form.formState.errors.role ? 'border-destructive' : ''}>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="technician">Technician</SelectItem>
                  </SelectContent>
                </Select>
                {form.formState.errors.role && (
                  <p className="text-sm text-destructive">{form.formState.errors.role.message}</p>
                )}
              </div>

              <Button type="submit" className="w-full">
                Create Account
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Account List */}
        <Card>
          <CardHeader>
            <CardTitle>Existing Accounts</CardTitle>
            <CardDescription>
              Manage existing user accounts and their status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accounts.map((account) => (
                    <TableRow key={account.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{account.firstName} {account.lastName}</div>
                          <div className="text-sm text-muted-foreground">@{account.username}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={account.role === 'manager' ? 'default' : 'secondary'}>
                          {account.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={account.isActive}
                            onCheckedChange={() => toggleAccountStatus(account.id)}
                          />
                          <span className="text-sm">
                            {account.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Account</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete {account.firstName} {account.lastName}'s account? 
                                This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteAccount(account.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete Account
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AccountManagement;