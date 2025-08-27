import React from 'react';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut, User, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

export const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const lightLogoUrl = '/lovable-uploads/792a7450-aa55-4890-b4ce-2d6c68e8f6e3.png';
  const darkLogoUrl = '/lovable-uploads/78a2dd80-d93a-4575-952e-f397ab2b7d3c.png';

  return (
    <header className="h-16 border-b bg-card flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <SidebarTrigger />
        <img 
          src={theme === 'dark' ? darkLogoUrl : lightLogoUrl} 
          alt="Circuit Works Inc. logo" 
          className="h-10 w-auto" 
        />
      </div>
      
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm">
          <User className="h-4 w-4" />
          <span className="font-medium">{user?.first_name} {user?.last_name}</span>
          <span className="text-muted-foreground">({user?.role})</span>
        </div>
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
        
        <Button variant="outline" size="sm" onClick={logout}>
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>
      </div>
    </header>
  );
};