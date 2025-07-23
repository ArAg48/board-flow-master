import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { TesterConfig } from '@/types/scan-validator';
import { Cpu, Grid3X3 } from 'lucide-react';

interface TesterConfigurationProps {
  config: TesterConfig;
  onConfigChange: (config: TesterConfig) => void;
  onConfirm: () => void;
}

const TesterConfiguration: React.FC<TesterConfigurationProps> = ({
  config,
  onConfigChange,
  onConfirm
}) => {
  const [localConfig, setLocalConfig] = useState(config);

  const testerTypes = [
    { value: 1, label: '1-up Tester', description: 'Single board testing' },
    { value: 4, label: '4-up Tester', description: 'Four boards simultaneously' },
    { value: 5, label: '5-up Tester', description: 'Five boards simultaneously' },
    { value: 10, label: '10-up Tester', description: 'Ten boards simultaneously' }
  ];

  const handleTesterTypeChange = (type: string) => {
    const testerType = parseInt(type) as 1 | 4 | 5 | 10;
    const updated = { ...localConfig, type: testerType, scanBoxes: testerType };
    setLocalConfig(updated);
    onConfigChange(updated);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Cpu className="h-5 w-5" />
          Tester Configuration
        </CardTitle>
        <CardDescription>
          Select the tester type and configure scan boxes
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <Label className="text-base font-medium">Tester Type</Label>
          <RadioGroup
            value={localConfig.type.toString()}
            onValueChange={handleTesterTypeChange}
            className="grid grid-cols-2 gap-4"
          >
            {testerTypes.map((tester) => (
              <div key={tester.value} className="flex items-center space-x-2">
                <RadioGroupItem 
                  value={tester.value.toString()} 
                  id={`tester-${tester.value}`}
                />
                <Label 
                  htmlFor={`tester-${tester.value}`}
                  className="flex flex-col cursor-pointer"
                >
                  <span className="font-medium">{tester.label}</span>
                  <span className="text-xs text-muted-foreground">{tester.description}</span>
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        {localConfig.type && (
          <div className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Grid3X3 className="h-4 w-4" />
              <span className="font-medium">Scan Box Configuration</span>
            </div>
            <div className="text-sm text-muted-foreground">
              This {localConfig.type}-up tester will display {localConfig.scanBoxes} scan input boxes
            </div>
            <div className="grid grid-cols-5 gap-2">
              {Array.from({ length: localConfig.scanBoxes }, (_, i) => (
                <div 
                  key={i}
                  className="h-8 border border-dashed border-muted-foreground rounded flex items-center justify-center text-xs"
                >
                  Box {i + 1}
                </div>
              ))}
            </div>
          </div>
        )}

        <Button 
          onClick={onConfirm} 
          disabled={!localConfig.type}
          className="w-full"
        >
          Continue with {localConfig.type}-up Configuration
        </Button>
      </CardContent>
    </Card>
  );
};

export default TesterConfiguration;