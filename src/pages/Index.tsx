import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LogIn } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">CKT WORKS Inventory</CardTitle>
            <p className="text-muted-foreground">
              Please log in to access the inventory system
            </p>
          </CardHeader>
          <CardContent>
            <Link to="/login">
              <Button className="w-full" size="lg">
                <LogIn className="h-4 w-4 mr-2" />
                Log In
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;