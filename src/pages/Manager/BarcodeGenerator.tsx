import React, { useState } from 'react';
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
  svgElement: string;
}

const BarcodeGenerator: React.FC = () => {
  const [baseText, setBaseText] = useState('assembly');
  const [startingNumber, setStartingNumber] = useState(1);
  const [quantity, setQuantity] = useState(5);
  const [generatedBarcodes, setGeneratedBarcodes] = useState<GeneratedBarcode[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateBarcodes = () => {
    if (!baseText.trim()) {
      toast.error('Please enter a base text for the barcode.');
      return;
    }

    if (isNaN(startingNumber) || startingNumber < 0) {
      toast.error('Please enter a valid starting number (non-negative integer).');
      return;
    }

    if (quantity < 1) {
      toast.error('Please enter a valid number of barcodes (at least 1).');
      return;
    }

    if (quantity > 210) {
      toast.error('For performance reasons, please generate a maximum of 210 barcodes at a time.');
      return;
    }

    setIsGenerating(true);
    const barcodes: GeneratedBarcode[] = [];

    try {
      for (let i = 0; i < quantity; i++) {
        const currentNumber = startingNumber + i;
        const paddedNumber = String(currentNumber).padStart(7, '0');
        const barcodeValue = `${baseText.trim()}${paddedNumber}`;

        // Create a temporary div to render the barcode SVG
        const tempDiv = document.createElement('div');
        const tempSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        tempSvg.id = `temp-barcode-${i}`;
        tempDiv.appendChild(tempSvg);

        try {
          JsBarcode(tempSvg, barcodeValue, {
            format: "CODE128",
            displayValue: false,
            height: 16,
            width: 0.64,
            margin: 0,
            lineColor: "#000000",
            textMargin: 0,
            fontOptions: "bold",
            fontSize: 0
          });

          barcodes.push({
            id: `barcode-${i}`,
            text: paddedNumber,
            fullText: barcodeValue,
            svgElement: tempSvg.outerHTML
          });
        } catch (error) {
          console.error(`Error generating barcode for value "${barcodeValue}":`, error);
          barcodes.push({
            id: `barcode-${i}`,
            text: paddedNumber,
            fullText: barcodeValue,
            svgElement: `<div style="color:#ef4444; font-size:0.1in; text-align:center;">Error: ${barcodeValue}</div>`
          });
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

  const generateBarcodeHtmlContent = () => {
    if (!baseText.trim()) return '';
    if (isNaN(startingNumber) || startingNumber < 0) return '';
    if (quantity < 1 || quantity > 210) return '';

    let barcodesHtml = '';
    for (let i = 0; i < quantity; i++) {
      const currentNumber = startingNumber + i;
      const paddedNumber = String(currentNumber).padStart(7, '0');
      const barcodeValue = `${baseText.trim()}${paddedNumber}`;

      const tempDiv = document.createElement('div');
      const tempSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      tempSvg.id = `temp-barcode-${i}`;
      tempDiv.appendChild(tempSvg);

      try {
        JsBarcode(tempSvg, barcodeValue, {
          format: "CODE128",
          displayValue: true,
          height: 12,
          width: 0.64,
          margin: 0,
          lineColor: "#000000",
          textMargin: 0,
          fontOptions: "bold",
          fontSize: 9
        });

        const svgInnerHtml = tempSvg.outerHTML;

        barcodesHtml += `
          <div class="barcode-item">
            ${svgInnerHtml}
          </div>
        `;
      } catch (error) {
        console.error(`Error generating barcode for value "${barcodeValue}" during print preparation:`, error);
        barcodesHtml += `
          <div class="barcode-item" style="color:#ef4444; font-size:0.1in; text-align:center;">
            Error: ${barcodeValue}
          </div>
        `;
      }
    }
    return barcodesHtml;
  };

  const handlePrint = () => {
    if (!baseText.trim()) {
      toast.error('Please enter a base text for the barcode before printing.');
      return;
    }
    if (isNaN(startingNumber) || startingNumber < 0) {
      toast.error('Please enter a valid starting number (non-negative integer) before printing.');
      return;
    }
    if (quantity < 1) {
      toast.error('Please enter a valid number of barcodes (at least 1) before printing.');
      return;
    }
    if (quantity > 210) {
      toast.error('For performance and print stability, please generate a maximum of 210 barcodes for printing at a time.');
      return;
    }

    const barcodesHtml = generateBarcodeHtmlContent();

    if (!barcodesHtml) {
      toast.error('Could not generate barcodes for printing. Please check your input.');
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Failed to open print window');
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Print Barcodes</title>
        <style>
          body {
            font-family: 'Inter', sans-serif;
            margin: 0 !important;
            padding: 0 !important;
            box-sizing: border-box !important;
            background-color: #fff !important;
            display: block !important;
            overflow: visible !important;
          }
          #printContainer {
            display: grid;
            grid-template-columns: repeat(7, 1in);
            gap: 0.1in;
            row-gap: 0.08in;
            width: 7.6in;
            margin-left: 0.105in !important;
            margin-top: 0.41in !important;
            padding: 0 !important;
            max-width: 8.5in;
            justify-content: start;
          }
          .barcode-item {
            width: 1in;
            height: 0.25in;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            overflow: hidden;
            box-sizing: border-box;
          }
          .barcode-item svg {
            max-width: 95%;
            height: auto;
            display: block;
          }
          @media print {
            body {
              background-color: #fff !important;
              margin: 0 !important;
              padding: 0 !important;
              display: block !important;
              overflow: visible !important;
              box-sizing: border-box !important;
            }
            #printContainer {
              border: none !important;
              padding: 0 !important;
              grid-template-columns: repeat(7, 1in) !important;
              gap: 0.1in !important;
              row-gap: 0.08in !important;
              width: 7.6in !important;
              margin-left: 0.105in !important;
              margin-top: 0.41in !important;
              max-width: 8.5in !important;
              justify-content: start !important;
              display: grid !important;
            }
            .barcode-item {
              width: 1in !important;
              height: 0.25in !important;
              border: none !important;
              display: flex !important;
              flex-direction: column !important;
              justify-content: center !important;
              align-items: center !important;
              overflow: hidden !important;
              box-sizing: border-box !important;
            }
            .barcode-item svg {
              max-width: 95% !important;
              height: auto !important;
              display: block !important;
            }
          }
        </style>
      </head>
      <body>
        <div id="printContainer">
          ${barcodesHtml}
        </div>
        <script>
          window.onload = function() {
            setTimeout(() => {
              window.print();
            }, 500);
          };
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
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
              <Label htmlFor="baseText">Assembly</Label>
              <Input
                id="baseText"
                value={baseText}
                onChange={(e) => setBaseText(e.target.value)}
                placeholder="assembly"
                maxLength={20}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="startingNumber">Starting Number</Label>
              <Input
                id="startingNumber"
                type="number"
                value={startingNumber}
                onChange={(e) => setStartingNumber(parseInt(e.target.value) || 1)}
                placeholder="1"
                min="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                min="1"
                max="210"
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
                     <Button onClick={handlePrint} variant="outline" className="flex-1">
                       <Download className="h-4 w-4 mr-2" />
                       Download for Print
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
              <div className="border border-gray-200 p-4 bg-white rounded-lg overflow-auto max-h-96">
                <div className="grid grid-cols-7 gap-1">
                  {generatedBarcodes.map((barcode) => (
                    <div
                      key={barcode.id}
                      className="border border-gray-300 p-1 flex flex-col items-center justify-center bg-white"
                      style={{ 
                        aspectRatio: '4/1',
                        width: '1in',
                        height: '0.25in',
                        minHeight: '0.25in'
                      }}
                    >
                      <div 
                        dangerouslySetInnerHTML={{ __html: barcode.svgElement }}
                        className="w-full h-full flex items-center justify-center"
                      />
                    </div>
                  ))}
                  
                  {/* Fill remaining cells to complete the grid */}
                  {Array.from({ length: (7 - (generatedBarcodes.length % 7)) % 7 }).map((_, index) => (
                    <div
                      key={`empty-${index}`}
                      className="border border-gray-300 border-dashed bg-gray-50"
                      style={{ 
                        aspectRatio: '4/1',
                        width: '1in',
                        height: '0.25in',
                        minHeight: '0.25in'
                      }}
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

    </div>
  );
};

export default BarcodeGenerator;