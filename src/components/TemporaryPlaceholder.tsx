import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';

interface TemporaryPlaceholderProps {
  title: string;
  description: string;
  message?: string;
}

export const TemporaryPlaceholder: React.FC<TemporaryPlaceholderProps> = ({ 
  title, 
  description, 
  message = "This feature is being updated to work with the new PHP backend." 
}) => {
  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              {message}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};

export default TemporaryPlaceholder;