import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/Layout/ProtectedRoute";
import AppLayout from "@/components/Layout/AppLayout";
import Index from "@/pages/Index";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import HardwareOrders from "@/pages/Manager/HardwareOrders";
import PTLOrders from "@/pages/Manager/PTLOrders";
import PTLOrderDetails from "@/pages/Manager/PTLOrderDetails";
import HardwareOrderDetails from "@/pages/Manager/HardwareOrderDetails";
import AccountManagement from "@/pages/Manager/AccountManagement";
import OrderOverview from "@/pages/Manager/OrderOverview";
import LogHistory from "@/pages/Manager/LogHistory";
import BarcodeGenerator from "@/pages/Manager/BarcodeGenerator";
import PTLOrderArchive from "@/pages/Manager/PTLOrderArchive";
import HardwareOrderArchive from "@/pages/Manager/HardwareOrderArchive";
import ScanValidator from "@/pages/Technician/ScanValidator";
import RepairLog from "@/pages/Technician/RepairLog";
import ScanHistory from "@/pages/Technician/ScanHistory";
import BoardLookup from "@/pages/Customer/BoardLookup";
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
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/unauthorized" element={
              <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                  <h1 className="text-2xl font-bold mb-4">Unauthorized</h1>
                  <p className="text-muted-foreground">You don't have permission to access this page.</p>
                </div>
              </div>
            } />
            
            <Route path="/app" element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }>
              <Route index element={<Navigate to="/app/dashboard" replace />} />
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
              <Route path="ptl-orders/:id" element={
                <ProtectedRoute requiredRole="manager">
                  <PTLOrderDetails />
                </ProtectedRoute>
              } />
              <Route path="hardware-orders/:id" element={
                <ProtectedRoute requiredRole="manager">
                  <HardwareOrderDetails />
                </ProtectedRoute>
              } />
              <Route path="order-overview" element={
                <ProtectedRoute requiredRole="manager">
                  <OrderOverview />
                </ProtectedRoute>
              } />
              <Route path="account-management" element={
                <ProtectedRoute requiredRole="manager">
                  <AccountManagement />
                </ProtectedRoute>
              } />
              <Route path="log-history" element={
                <ProtectedRoute requiredRole="manager">
                  <LogHistory />
                </ProtectedRoute>
              } />
              <Route path="barcode-generator" element={
                <ProtectedRoute requiredRole="manager">
                  <BarcodeGenerator />
                </ProtectedRoute>
              } />
              <Route path="ptl-order-archive" element={
                <ProtectedRoute requiredRole="manager">
                  <PTLOrderArchive />
                </ProtectedRoute>
              } />
              <Route path="hardware-order-archive" element={
                <ProtectedRoute requiredRole="manager">
                  <HardwareOrderArchive />
                </ProtectedRoute>
              } />
              <Route path="repair-log" element={
                <ProtectedRoute requiredRole="manager">
                  <RepairLog />
                </ProtectedRoute>
              } />
              
              {/* Technician Routes */}
              <Route path="scan-validator" element={
                <ProtectedRoute requiredRole="technician">
                  <ScanValidator />
                </ProtectedRoute>
              } />
              <Route path="repair-log" element={
                <ProtectedRoute requiredRole="technician">
                  <RepairLog />
                </ProtectedRoute>
              } />
              <Route path="scan-history" element={
                <ProtectedRoute requiredRole="technician">
                  <ScanHistory />
                </ProtectedRoute>
              } />
              
              {/* Customer Routes */}
              <Route path="board-lookup" element={
                <ProtectedRoute requiredRole="customer">
                  <BoardLookup />
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
