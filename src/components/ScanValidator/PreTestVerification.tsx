import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { PreTestVerification as PreTestVerificationType } from '@/types/scan-validator';
import { Settings, CheckCircle } from 'lucide-react';

interface PreTestVerificationProps {
  verification: PreTestVerificationType;
  onVerificationChange: (verification: PreTestVerificationType) => void;
  onComplete: () => void;
}

const PreTestVerification: React.FC<PreTestVerificationProps> = ({
  verification,
  onVerificationChange,
  onComplete
}) => {
  const [localVerification, setLocalVerification] = useState(verification);

  const handleChange = (field: keyof PreTestVerificationType, value: any) => {
    const updated = { ...localVerification, [field]: value };
    setLocalVerification(updated);
    onVerificationChange(updated);
  };

  const isComplete = localVerification.testerCheck && localVerification.firmwareCheck;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Pre-Test Verification
        </CardTitle>
        <CardDescription>
          Complete these checks before starting the scanning session
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="tester"
              checked={localVerification.testerCheck}
              onCheckedChange={(checked) => handleChange('testerCheck', checked)}
            />
            <Label htmlFor="tester" className="text-sm font-normal">
              Tester calibration verified and within tolerance
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="firmware"
              checked={localVerification.firmwareCheck}
              onCheckedChange={(checked) => handleChange('firmwareCheck', checked)}
            />
            <Label htmlFor="firmware" className="text-sm font-normal">
              Firmware version verified and up to date
            </Label>
          </div>
        </div>

        <div className="border-t pt-4">
          <Button 
            onClick={onComplete} 
            disabled={!isComplete}
            className="w-full flex items-center gap-2"
          >
            <CheckCircle className="h-4 w-4" />
            Complete Pre-Test Verification
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PreTestVerification;