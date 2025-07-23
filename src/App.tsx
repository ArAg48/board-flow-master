import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/Layout/ProtectedRoute";
import AppLayout from "@/components/Layout/AppLayout";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import HardwareOrders from "@/pages/Manager/HardwareOrders";
import PTLOrders from "@/pages/Manager/PTLOrders";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/unauthorized" element={
              <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                  <h1 className="text-2xl font-bold mb-4">Unauthorized</h1>
                  <p className="text-muted-foreground">You don't have permission to access this page.</p>
                </div>
              </div>
            } />
            
            <Route path="/" element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              
              {/* Manager Routes */}
              <Route path="hardware-orders" element={
                <ProtectedRoute requiredRole="manager">
                  <HardwareOrders />
                </ProtectedRoute>
              } />
              <Route path="ptl-orders" element={
                <ProtectedRoute requiredRole="manager">
                  <PTLOrders />
                </ProtectedRoute>
              } />
              <Route path="order-overview" element={
                <ProtectedRoute requiredRole="manager">
                  <div>Order Overview Page - Coming Soon</div>
                </ProtectedRoute>
              } />
              <Route path="technician-management" element={
                <ProtectedRoute requiredRole="manager">
                  <div>Technician Management Page - Coming Soon</div>
                </ProtectedRoute>
              } />
              <Route path="log-history" element={
                <ProtectedRoute requiredRole="manager">
                  <div>Log History Page - Coming Soon</div>
                </ProtectedRoute>
              } />
              
              {/* Technician Routes */}
              <Route path="scan-validator" element={
                <ProtectedRoute requiredRole="technician">
                  <div>Scan Validator Page - Coming Soon</div>
                </ProtectedRoute>
              } />
              <Route path="repair-log" element={
                <ProtectedRoute requiredRole="technician">
                  <div>Repair Log Page - Coming Soon</div>
                </ProtectedRoute>
              } />
              <Route path="scan-history" element={
                <ProtectedRoute requiredRole="technician">
                  <div>Scan History Page - Coming Soon</div>
                </ProtectedRoute>
              } />
            </Route>
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
