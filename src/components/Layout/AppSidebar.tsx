import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { useAuth } from '@/contexts/AuthContext';
import {
  Package,
  ClipboardList,
  Search,
  History,
  Wrench,
  Users,
  BarChart3,
  FileText,
  QrCode,
} from 'lucide-react';

const managerItems = [
  { title: 'Dashboard', url: '/app/dashboard', icon: BarChart3 },
  { title: 'Hardware Orders', url: '/app/hardware-orders', icon: Package },
  { title: 'PTL Orders', url: '/app/ptl-orders', icon: ClipboardList },
  { title: 'Order Overview', url: '/app/order-overview', icon: Search },
  { title: 'Account Management', url: '/app/account-management', icon: Users },
  { title: 'Log History', url: '/app/log-history', icon: History },
  { title: 'Barcode Generator', url: '/app/barcode-generator', icon: QrCode },
];

const technicianItems = [
  { title: 'CW PTL', url: '/app/scan-validator', icon: Search },
  { title: 'Repair Log', url: '/app/repair-log', icon: Wrench },
  { title: 'Scan History', url: '/app/scan-history', icon: History },
];

const customerItems = [
  { title: 'Board Lookup', url: '/app/board-lookup', icon: Search },
];

export const AppSidebar: React.FC = () => {
  const { user } = useAuth();
  const { state } = useSidebar();
  const location = useLocation();

  const items = user?.role === 'manager' ? managerItems : 
               user?.role === 'customer' ? customerItems : technicianItems;
  const isCollapsed = state === 'collapsed';

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>
            {user?.role === 'manager' ? 'Manager Tools' : 
             user?.role === 'customer' ? 'Customer Portal' : 'Technician Tools'}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className={({ isActive }) =>
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-accent hover:text-accent-foreground'
                      }
                    >
                      <item.icon className="h-4 w-4" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};