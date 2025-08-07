import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Download, Printer, QrCode, RefreshCw } from 'lucide-react';
import JsBarcode from 'jsbarcode';
import { toast } from 'sonner';

interface GeneratedBarcode {
  id: string;
  text: string;
  fullText: string;
  dataUrl: string;
}

const BarcodeGenerator: React.FC = () => {
  const [baseText, setBaseText] = useState('');
  const [startingNumber, setStartingNumber] = useState('0000001');
  const [quantity, setQuantity] = useState(1);
  const [generatedBarcodes, setGeneratedBarcodes] = useState<GeneratedBarcode[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const printableRef = useRef<HTMLDivElement>(null);

  const generateBarcodes = async () => {
    if (!baseText.trim()) {
      toast.error('Please enter base text for the barcode');
      return;
    }

    if (quantity < 1 || quantity > 210) {
      toast.error('Quantity must be between 1 and 210');
      return;
    }

    if (!startingNumber.trim()) {
      toast.error('Please enter a starting number');
      return;
    }

    setIsGenerating(true);
    const barcodes: GeneratedBarcode[] = [];

    try {
      // Parse starting number and preserve leading zeros
      const startNum = parseInt(startingNumber);
      const numLength = startingNumber.length;

      for (let i = 0; i < quantity; i++) {
        const currentNumber = (startNum + i).toString().padStart(numLength, '0');
        const fullText = `${baseText.trim()}${currentNumber}`;
        
        // Create a temporary canvas to generate barcode
        const canvas = document.createElement('canvas');
        
        try {
          JsBarcode(canvas, fullText, {
            format: 'CODE128',
            width: 3,
            height: 60,
            displayValue: true,
            fontSize: 16,
            textAlign: 'center',
            textPosition: 'bottom',
            margin: 4,
            background: '#ffffff',
            lineColor: '#000000'
          });

          const dataUrl = canvas.toDataURL('image/png');
          
          barcodes.push({
            id: `barcode-${i}`,
            text: currentNumber,
            fullText: fullText,
            dataUrl: dataUrl
          });
        } catch (error) {
          console.error(`Error generating barcode ${i + 1}:`, error);
          toast.error(`Error generating barcode ${i + 1}`);
        }
      }

      setGeneratedBarcodes(barcodes);
      toast.success(`Successfully generated ${barcodes.length} barcodes`);
    } catch (error) {
      console.error('Error generating barcodes:', error);
      toast.error('Failed to generate barcodes');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = () => {
    if (generatedBarcodes.length === 0) {
      toast.error('No barcodes to print');
      return;
    }

    // Create a print-ready sheet
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Failed to open print window');
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Barcode Labels - Panduit c100x025yjj</title>
          <style>
            @page {
              size: 8.5in 11in;
              margin: 0;
            }
            
            body {
              margin: 0;
              padding: 0;
              font-family: Arial, sans-serif;
              background: white;
            }
            
            .label-sheet {
              width: 8.5in;
              height: 11in;
              position: relative;
              margin: 0;
              padding: 0;
            }
            
            .barcode-grid {
              position: absolute;
              top: 0.875in;
              left: 0.45in;
              width: 7.6in;
              display: grid;
              grid-template-columns: repeat(7, 1in);
              grid-column-gap: 0.1in;
              grid-row-gap: 0.08in;
            }
            
            .barcode-cell {
              width: 1in;
              height: 0.25in;
              display: flex;
              align-items: center;
              justify-content: center;
              overflow: hidden;
            }
            
            .barcode-cell img {
              max-width: 1in;
              max-height: 0.25in;
              object-fit: contain;
            }
            
            @media print {
              body { -webkit-print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          <div class="label-sheet">
            <div class="barcode-grid">
              ${generatedBarcodes.map(barcode => `
                <div class="barcode-cell">
                  <img src="${barcode.dataUrl}" alt="${barcode.fullText}" />
                </div>
              `).join('')}
            </div>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    
    // Wait for images to load then trigger print
    setTimeout(() => {
      printWindow.print();
    }, 1000);
  };

  const downloadBarcodes = () => {
    if (generatedBarcodes.length === 0) {
      toast.error('No barcodes to download');
      return;
    }

    // Create a zip-like download by creating multiple links
    generatedBarcodes.forEach((barcode, index) => {
      const link = document.createElement('a');
      link.href = barcode.dataUrl;
      link.download = `barcode_${barcode.fullText}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });

    toast.success('Barcode downloads started');
  };


  const clearBarcodes = () => {
    setGeneratedBarcodes([]);
    toast.success('Barcodes cleared');
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <QrCode className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">Barcode Generator</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuration Panel */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Barcode Configuration</CardTitle>
            <CardDescription>
              Generate barcodes for Panduit c100x025yjj labels (7 columns)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="baseText">Base Text</Label>
              <Input
                id="baseText"
                value={baseText}
                onChange={(e) => setBaseText(e.target.value)}
                placeholder="Enter base text (e.g., 'PART-')"
                maxLength={20}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="startingNumber">Starting Number</Label>
              <Input
                id="startingNumber"
                value={startingNumber}
                onChange={(e) => setStartingNumber(e.target.value)}
                placeholder="0000001"
                pattern="[0-9]+"
              />
              <p className="text-xs text-muted-foreground">
                Use leading zeros to maintain number format (e.g., 0000001)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                min="1"
                max="1000"
              />
            </div>

            <Separator />

            <div className="space-y-2">
              <Button 
                onClick={generateBarcodes} 
                disabled={isGenerating || !baseText.trim()}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <QrCode className="h-4 w-4 mr-2" />
                    Generate Barcodes
                  </>
                )}
              </Button>

              {generatedBarcodes.length > 0 && (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Button onClick={handlePrint} variant="default" className="flex-1">
                      <Printer className="h-4 w-4 mr-2" />
                      Print
                    </Button>
                    <Button onClick={downloadBarcodes} variant="outline" className="flex-1">
                      <Download className="h-4 w-4 mr-2" />
                      Individual
                    </Button>
                  </div>
                </div>
              )}

              {generatedBarcodes.length > 0 && (
                <Button onClick={clearBarcodes} variant="destructive" className="w-full">
                  Clear Barcodes
                </Button>
              )}
            </div>

            {generatedBarcodes.length > 0 && (
              <div className="pt-2">
                <Badge variant="secondary">
                  {generatedBarcodes.length} barcode{generatedBarcodes.length !== 1 ? 's' : ''} generated
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Preview Panel */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Preview - Panduit c100x025yjj Format</CardTitle>
            <CardDescription>
              7 columns layout optimized for printing
            </CardDescription>
          </CardHeader>
          <CardContent>
            {generatedBarcodes.length > 0 ? (
              <div 
                ref={printableRef}
                className="border border-gray-200 p-4 bg-white rounded-lg overflow-auto max-h-96"
              >
                <div className="barcode-grid grid grid-cols-7 gap-1">
                  {generatedBarcodes.map((barcode) => (
                    <div
                      key={barcode.id}
                      className="barcode-cell border border-gray-300 p-1 flex flex-col items-center justify-center bg-white"
                      style={{ aspectRatio: '2/1' }}
                    >
                      <img 
                        src={barcode.dataUrl} 
                        alt={barcode.fullText}
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                  ))}
                  
                  {/* Fill remaining cells to complete the grid */}
                  {Array.from({ length: (7 - (generatedBarcodes.length % 7)) % 7 }).map((_, index) => (
                    <div
                      key={`empty-${index}`}
                      className="barcode-cell border border-gray-300 border-dashed bg-gray-50"
                      style={{ aspectRatio: '2/1' }}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                <QrCode className="h-12 w-12 mb-4" />
                <p className="text-lg font-medium">No barcodes generated yet</p>
                <p className="text-sm">Configure settings and click "Generate Barcodes" to start</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Example Usage */}
      <Card>
        <CardHeader>
          <CardTitle>Usage Example</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">Step 1: Base Text</h4>
              <p className="text-muted-foreground">Enter your base text like "PART-" or "ITEM"</p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Step 2: Starting Number</h4>
              <p className="text-muted-foreground">Enter starting number with leading zeros like "0000001"</p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Step 3: Quantity</h4>
              <p className="text-muted-foreground">Specify how many barcodes to generate</p>
            </div>
          </div>
          <Separator className="my-4" />
          <div className="text-sm text-muted-foreground">
            <p><strong>Result:</strong> If you enter "PART-" as base text, "0000001" as starting number, and quantity of 3:</p>
            <p className="mt-1">You'll get: PART-0000001, PART-0000002, PART-0000003</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BarcodeGenerator;