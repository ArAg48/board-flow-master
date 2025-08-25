import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { PostTestVerification as PostTestVerificationType } from '@/types/scan-validator';
import { CheckSquare, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface PostTestVerificationProps {
  verification: PostTestVerificationType;
  expectedCount: number;
  actualCount: number;
  firmwareRevision?: string;
  onVerificationChange: (verification: PostTestVerificationType) => void;
  onComplete: () => void;
}

const PostTestVerification: React.FC<PostTestVerificationProps> = ({
  verification,
  expectedCount,
  actualCount,
  firmwareRevision,
  onVerificationChange,
  onComplete
}) => {
  const { user } = useAuth();
  const [localVerification, setLocalVerification] = useState(verification);
  const [finalCountInput, setFinalCountInput] = useState(verification.finalCount.toString());
  const [productCountVerified, setProductCountVerified] = useState(verification.productCountVerified || '');
  const [axxessUpdater, setAxxessUpdater] = useState(verification.axxessUpdater || '');
  const [firmwareConfirmed, setFirmwareConfirmed] = useState(false);

  const handleFinalCountChange = (value: string) => {
    setFinalCountInput(value);
    const numValue = parseInt(value) || 0;
    const updated = { ...localVerification, finalCount: numValue };
    setLocalVerification(updated);
    onVerificationChange(updated);
  };

  const handleAccessUpdaterChange = (checked: boolean) => {
    const updated = { ...localVerification, accessUpdaterSync: checked };
    setLocalVerification(updated);
    onVerificationChange(updated);
  };

  const handleProductCountVerifiedChange = (value: string) => {
    setProductCountVerified(value);
    const updated = { ...localVerification, productCountVerified: value };
    setLocalVerification(updated);
    onVerificationChange(updated);
  };

  const handleAxxessUpdaterChange = (value: string) => {
    setAxxessUpdater(value);
    const updated = { ...localVerification, axxessUpdater: value };
    setLocalVerification(updated);
    onVerificationChange(updated);
  };

  const isCountMatching = localVerification.finalCount === actualCount;
  const isProductCountValid = productCountVerified.trim().length >= 2;
  const isAxxessUpdaterValid = axxessUpdater.trim().length >= 2;
  const isComplete = isCountMatching && localVerification.accessUpdaterSync && firmwareConfirmed && isProductCountValid && isAxxessUpdaterValid;
  const countDifference = actualCount - expectedCount;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckSquare className="h-5 w-5" />
          Post-Test Verification
        </CardTitle>
        <CardDescription>
          Verify final counts and complete system updates before finishing
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-3 gap-4 p-4 border rounded-lg">
          <div className="text-center">
            <div className="text-sm text-muted-foreground">Expected</div>
            <div className="text-2xl font-bold">{expectedCount}</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-muted-foreground">Scanned</div>
            <div className="text-2xl font-bold">{actualCount}</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-muted-foreground">Difference</div>
            <div className={`text-2xl font-bold ${countDifference === 0 ? 'text-green-600' : 'text-red-600'}`}>
              {countDifference > 0 ? '+' : ''}{countDifference}
            </div>
          </div>
        </div>

        {countDifference !== 0 && (
          <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <span className="text-sm text-amber-700">
              Count mismatch detected. Please verify the final count before proceeding.
            </span>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="final-count">Final Count Verification</Label>
          <Input
            id="final-count"
            type="number"
            value={finalCountInput}
            onChange={(e) => handleFinalCountChange(e.target.value)}
            placeholder="Enter final verified count"
          />
          {!isCountMatching && localVerification.finalCount > 0 && (
            <p className="text-sm text-red-600">
              Final count must match scanned count ({actualCount})
            </p>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="access-updater"
              checked={localVerification.accessUpdaterSync}
              onCheckedChange={handleAccessUpdaterChange}
            />
            <Label htmlFor="access-updater" className="text-sm font-normal">
              Access updater synchronized and database updated successfully
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="firmware-confirm"
              checked={firmwareConfirmed}
              onCheckedChange={(checked) => setFirmwareConfirmed(Boolean(checked))}
            />
            <Label htmlFor="firmware-confirm" className="text-sm font-normal">
              Firmware revision verified against PTL order requirements
            </Label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="product-count">Product Count Verified</Label>
              <Input
                id="product-count"
                placeholder="Enter verified count"
                value={productCountVerified}
                onChange={(e) => handleProductCountVerifiedChange(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="axxess-updater">Axxess Updater</Label>
              <Input
                id="axxess-updater"
                placeholder="Enter updater info"
                value={axxessUpdater}
                onChange={(e) => handleAxxessUpdaterChange(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="expected-info">Expected Information</Label>
            <Input
              id="expected-info"
              value={`${expectedCount} SR and ${firmwareRevision || '1.3'} SR`}
              readOnly
              className="bg-muted"
            />
          </div>
        </div>

        <div className="border-t pt-4">
          <Button 
            onClick={onComplete} 
            disabled={!isComplete}
            className="w-full"
            variant={isComplete ? "default" : "outline"}
          >
            {isComplete ? "Complete Session" : "Verify All Items to Continue"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PostTestVerification;