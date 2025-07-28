import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Trash2, UserPlus, Edit } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

const createAccountSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  role: z.enum(['manager', 'technician'], { required_error: 'Please select a role' }),
});

const editPasswordSchema = z.object({
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
});

type CreateAccountForm = z.infer<typeof createAccountSchema>;
type EditPasswordForm = z.infer<typeof editPasswordSchema>;

type Profile = Database['public']['Tables']['profiles']['Row'];

interface Account {
  id: string;
  username: string;
  role: 'manager' | 'technician';
  firstName: string;
  lastName: string;
  isActive: boolean;
  createdAt: string;
  password: string;
}

const AccountManagement: React.FC = () => {
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const editPasswordForm = useForm<EditPasswordForm>({
    resolver: zodResolver(editPasswordSchema),
    defaultValues: {
      newPassword: '',
    },
  });

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      // Use the secure function that doesn't expose passwords
      const { data, error } = await supabase
        .rpc('get_user_profiles');

      if (error) throw error;

      const formattedAccounts: Account[] = (data || []).map((profile: any) => ({
        id: profile.id,
        username: profile.username,
        role: profile.role as 'manager' | 'technician',
        firstName: profile.full_name?.split(' ')[0] || '',
        lastName: profile.full_name?.split(' ').slice(1).join(' ') || '',
        isActive: true, // We'll assume all profiles are active for now
        createdAt: new Date(profile.created_at).toISOString().split('T')[0],
        password: '••••••••', // Never expose real passwords
      }));

      setAccounts(formattedAccounts);
    } catch (error) {
      console.error('Error fetching accounts:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch accounts. Make sure you have manager permissions.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const form = useForm<CreateAccountForm>({
    resolver: zodResolver(createAccountSchema),
    defaultValues: {
      username: '',
      password: '',
      firstName: '',
      lastName: '',
      role: undefined,
    },
  });

  const onSubmit = async (data: CreateAccountForm) => {
    try {
      // Client-side validation
      if (data.username.length < 3) {
        toast({
          title: "Validation Error",
          description: "Username must be at least 3 characters long",
          variant: "destructive",
        });
        return;
      }
      
      if (data.password.length < 6) {
        toast({
          title: "Validation Error", 
          description: "Password must be at least 6 characters long",
          variant: "destructive",
        });
        return;
      }

      const { data: result, error } = await supabase
        .rpc('create_user_account', {
          p_username: data.username.trim(),
          p_password: data.password,
          p_first_name: data.firstName.trim(),
          p_last_name: data.lastName.trim(),
          p_role: data.role
        });

      if (error) {
        console.error('Supabase error:', error);
        
        let errorMessage = "Failed to create account";
        
        if (error.message.includes("Username already exists")) {
          errorMessage = "Username already exists. Please choose a different username.";
        } else if (error.message.includes("Username must be at least 3 characters")) {
          errorMessage = "Username must be at least 3 characters long.";
        } else if (error.message.includes("password at least 6 characters")) {
          errorMessage = "Password must be at least 6 characters long.";
        }
        
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Account Created',
        description: `${data.role} account for ${data.firstName} ${data.lastName} has been created successfully.`,
      });

      form.reset();
      fetchAccounts(); // Refresh the list
    } catch (error: any) {
      console.error('Error creating account:', error);
      toast({
        title: 'Error',
        description: 'Failed to create account. Please try again.',
        variant: 'destructive',
      });
    }
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

  const deleteAccount = async (id: string) => {
    try {
      const { data, error } = await supabase.rpc('delete_user_account', {
        p_user_id: id
      });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      if (data) {
        const account = accounts.find(acc => acc.id === id);
        setAccounts(prev => prev.filter(account => account.id !== id));
        
        toast({
          title: 'Account Deleted',
          description: `${account?.firstName} ${account?.lastName}'s account has been deleted.`,
        });
      } else {
        toast({
          title: 'Error',
          description: 'Account not found or could not be deleted.',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Error deleting account:', error);
      toast({
        title: 'Error',
        description: 'Only managers can delete accounts.',
        variant: 'destructive',
      });
    }
  };

  const editPassword = (account: Account) => {
    setEditingAccount(account);
    editPasswordForm.reset({ newPassword: '' });
    setEditDialogOpen(true);
  };

  const onPasswordUpdate = async (data: EditPasswordForm) => {
    if (!editingAccount) return;

    try {
      // Client-side validation
      if (data.newPassword.length < 6) {
        toast({
          title: "Validation Error",
          description: "Password must be at least 6 characters long",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase.rpc('update_user_password', {
        p_user_id: editingAccount.id,
        p_new_password: data.newPassword
      });

      if (error) {
        console.error('Supabase error:', error);
        
        let errorMessage = "Failed to update password";
        
        if (error.message.includes("Password must be at least 6 characters")) {
          errorMessage = "Password must be at least 6 characters long.";
        }
        
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
        return;
      }

      // Update the local state (note: password will now be hashed, so don't display it)
      setAccounts(prev => 
        prev.map(account => 
          account.id === editingAccount.id 
            ? { ...account, password: "••••••••" } // Hide hashed password
            : account
        )
      );

      toast({
        title: 'Password Updated',
        description: `Password for ${editingAccount.firstName} ${editingAccount.lastName} has been updated successfully.`,
      });

      setEditDialogOpen(false);
      setEditingAccount(null);
      editPasswordForm.reset();
    } catch (error: any) {
      console.error('Error updating password:', error);
      toast({
        title: 'Error',
        description: 'Failed to update password. Please try again.',
        variant: 'destructive',
      });
    }
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
                    <TableHead>Username</TableHead>
                    <TableHead>Password</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center">Loading accounts...</TableCell>
                    </TableRow>
                  ) : accounts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center">No accounts found</TableCell>
                    </TableRow>
                  ) : (
                    accounts.map((account) => (
                    <TableRow key={account.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{account.firstName} {account.lastName}</div>
                          <div className="text-sm text-muted-foreground">{account.username}@ptl.local</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="bg-muted px-2 py-1 rounded text-sm">{account.username}</code>
                      </TableCell>
                       <TableCell>
                         <code className="bg-muted px-2 py-1 rounded text-sm">••••••••</code>
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
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => editPassword(account)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
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
                        </div>
                      </TableCell>
                    </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Password Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Password</DialogTitle>
            <DialogDescription>
              Change the password for {editingAccount?.firstName} {editingAccount?.lastName}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={editPasswordForm.handleSubmit(onPasswordUpdate)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                {...editPasswordForm.register('newPassword')}
                className={editPasswordForm.formState.errors.newPassword ? 'border-destructive' : ''}
              />
              {editPasswordForm.formState.errors.newPassword && (
                <p className="text-sm text-destructive">{editPasswordForm.formState.errors.newPassword.message}</p>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                Update Password
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AccountManagement;