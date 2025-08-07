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
  { title: 'Dashboard', url: '/dashboard', icon: BarChart3 },
  { title: 'Hardware Orders', url: '/hardware-orders', icon: Package },
  { title: 'PTL Orders', url: '/ptl-orders', icon: ClipboardList },
  { title: 'Order Overview', url: '/order-overview', icon: Search },
  { title: 'Account Management', url: '/account-management', icon: Users },
  { title: 'Log History', url: '/log-history', icon: History },
  { title: 'Barcode Generator', url: '/barcode-generator', icon: QrCode },
];

const technicianItems = [
  { title: 'Scan Validator', url: '/scan-validator', icon: Search },
  { title: 'Repair Log', url: '/repair-log', icon: Wrench },
  { title: 'Scan History', url: '/scan-history', icon: History },
];

export const AppSidebar: React.FC = () => {
  const { user } = useAuth();
  const { state } = useSidebar();
  const location = useLocation();

  const items = user?.role === 'manager' ? managerItems : technicianItems;
  const isCollapsed = state === 'collapsed';

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>
            {user?.role === 'manager' ? 'Manager Tools' : 'Technician Tools'}
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