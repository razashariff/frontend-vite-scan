import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Shield, Download, ArrowLeft, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import Layout from '../components/Layout';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface ScanAlert {
  pluginid: string;
  alert: string;
  name: string;
  riskcode: string;
  confidence: string;
  riskdesc: string;
  desc: string;
  instances: {
    uri: string;
    method: string;
    param?: string;
    evidence?: string;
  }[];
  count: string;
  solution: string;
  otherinfo?: string;
  reference?: string;
  cweid: string;
  wascid: string;
  risk: string;
}

interface ScanResults {
  '@version': string;
  '@generated': string;
  site: {
    '@name': string;
    '@host': string;
    '@port': string;
    '@ssl': string;
    alerts: ScanAlert[];
  }[];
}

const ScanResults = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const reportRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  
  const { scanId, results, url, timestamp } = location.state || {};
  
  // Type guard for results
  const scanResults = results as ScanResults | undefined;
  
  useEffect(() => {
    if (!scanResults) {
      toast({
        title: 'Error',
        description: 'No scan results found. Please start a new scan.',
        variant: 'destructive',
      });
      navigate('/');
    }
  }, [scanResults, navigate, toast]);

  if (!scanResults) {
    return null;
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const getAlertsBySeverity = (severity: string) => {
    return scanResults.site?.[0]?.alerts?.filter(alert => {
      const riskLevel = alert.riskdesc.toLowerCase();
      if (severity === 'High') {
        return riskLevel.includes('high');
      } else if (severity === 'Medium') {
        return riskLevel.includes('medium');
      } else if (severity === 'Low') {
        return riskLevel.includes('low');
      } else if (severity === 'Informational') {
        return riskLevel.includes('informational');
      }
      return false;
    }) || [];
  };
  
  const highAlerts = getAlertsBySeverity('High');
  const mediumAlerts = getAlertsBySeverity('Medium');
  const lowAlerts = getAlertsBySeverity('Low');
  const infoAlerts = getAlertsBySeverity('Informational');
  
  const totalAlerts = highAlerts.length + mediumAlerts.length + lowAlerts.length + infoAlerts.length;
  
  const getRiskPercentage = (count: number) => {
    return totalAlerts > 0 ? (count / totalAlerts) * 100 : 0;
  };
  
  const getSeverityColor = (severity: string) => {
    switch(severity) {
      case 'High':
        return 'text-severity-high bg-severity-high/10';
      case 'Medium':
        return 'text-severity-medium bg-severity-medium/10';
      case 'Low':
        return 'text-severity-low bg-severity-low/10';
      case 'Informational':
        return 'text-severity-info bg-severity-info/10';
      default:
        return 'text-muted-foreground bg-muted/20';
    }
  };
  
  const getSeverityProgressColor = (severity: string) => {
    switch(severity) {
      case 'High':
        return 'bg-severity-high';
      case 'Medium':
        return 'bg-severity-medium';
      case 'Low':
        return 'bg-severity-low';
      case 'Informational':
        return 'bg-severity-info';
      default:
        return 'bg-primary';
    }
  };

  const generatePDF = async () => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const contentWidth = pageWidth - (margin * 2);
      let yPos = margin;
      let pageNumber = 1;

      // Add header with logo and title
      doc.setFillColor(41, 128, 185);
      doc.rect(0, 0, pageWidth, 50, 'F');
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text('Web Watchdog Guardian', pageWidth / 2, 30, { align: 'center' });
      
      // Add CONFIDENTIAL text
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text('CONFIDENTIAL', pageWidth / 2, 45, { align: 'center' });
      
      yPos = 70;

      // Add scan details in a box
      doc.setDrawColor(200, 200, 200);
      doc.setFillColor(245, 245, 245);
      doc.roundedRect(margin, yPos, contentWidth, 40, 3, 3, 'FD');
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      doc.text(`Scan Report for: ${scanResults.site?.[0]?.['@name'] || 'Unknown URL'}`, margin + 10, yPos + 10);
      doc.text(`Scan Date: ${new Date().toLocaleDateString()}`, margin + 10, yPos + 20);
      doc.text(`Scan ID: ${scanId}`, margin + 10, yPos + 30);
      yPos += 60;

      // Add summary section with severity counts
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(41, 128, 185);
      doc.text('Scan Summary', margin, yPos);
      yPos += 15;

      // Calculate alert counts
      const highCount = scanResults.site?.[0]?.alerts?.filter((alert: any) => alert.riskdesc.toLowerCase().includes('high')).length || 0;
      const mediumCount = scanResults.site?.[0]?.alerts?.filter((alert: any) => alert.riskdesc.toLowerCase().includes('medium')).length || 0;
      const lowCount = scanResults.site?.[0]?.alerts?.filter((alert: any) => alert.riskdesc.toLowerCase().includes('low')).length || 0;
      const infoCount = scanResults.site?.[0]?.alerts?.filter((alert: any) => alert.riskdesc.toLowerCase().includes('informational')).length || 0;
      const totalCount = highCount + mediumCount + lowCount + infoCount;

      // Draw severity bars
      const barWidth = contentWidth;
      const barHeight = 20;
      const spacing = 5;

      // High severity bar
      doc.setFillColor(220, 53, 69); // Red
      const highBarWidth = Math.max((barWidth * highCount) / totalCount, 60); // Ensure minimum width for text
      doc.rect(margin, yPos, highBarWidth, barHeight, 'F');
      doc.setTextColor(255, 255, 255);
      const highText = `High: ${highCount}`;
      doc.text(highText, margin + 5, yPos + 15);

      // Medium severity bar
      doc.setFillColor(255, 193, 7); // Yellow
      doc.rect(margin, yPos + barHeight + spacing, (barWidth * mediumCount) / totalCount, barHeight, 'F');
      doc.text(`Medium: ${mediumCount}`, margin + 5, yPos + barHeight + spacing + 15);

      // Low severity bar
      doc.setFillColor(40, 167, 69); // Green
      doc.rect(margin, yPos + (barHeight + spacing) * 2, (barWidth * lowCount) / totalCount, barHeight, 'F');
      doc.text(`Low: ${lowCount}`, margin + 5, yPos + (barHeight + spacing) * 2 + 15);

      // Informational bar
      doc.setFillColor(23, 162, 184); // Blue
      const infoBarWidth = Math.max((barWidth * infoCount) / totalCount, 60); // Ensure minimum width for text
      doc.rect(margin, yPos + (barHeight + spacing) * 3, infoBarWidth, barHeight, 'F');
      const infoText = `Info: ${infoCount}`;
      doc.text(infoText, margin + 5, yPos + (barHeight + spacing) * 3 + 15);

      yPos += (barHeight + spacing) * 4 + 20;

      // Add detailed findings section
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(41, 128, 185);
      doc.text('Detailed Findings', margin, yPos);
      yPos += 15;

      // Process each alert
      scanResults.site?.[0]?.alerts?.forEach((alert: any) => {
        if (yPos > pageHeight - margin) {
          doc.addPage();
          yPos = margin;
          pageNumber++;
        }

        // Alert title with severity
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        const severity = alert.riskdesc.toLowerCase();
        let severityColor;
        if (severity.includes('high')) {
          severityColor = [220, 53, 69]; // Red
        } else if (severity.includes('medium')) {
          severityColor = [255, 193, 7]; // Yellow
        } else if (severity.includes('low')) {
          severityColor = [40, 167, 69]; // Green
        } else {
          severityColor = [23, 162, 184]; // Blue
        }

        // Draw background for the title
        doc.setFillColor(severityColor[0], severityColor[1], severityColor[2]);
        const title = `${alert.name} (${alert.riskdesc})`;
        const titleWidth = doc.getStringUnitWidth(title) * 14 / doc.internal.scaleFactor;
        const titleHeight = 20;
        doc.roundedRect(margin, yPos - 5, titleWidth + 20, titleHeight, 3, 3, 'F');
        
        // Add title text in black
        doc.setTextColor(0, 0, 0);
        doc.text(title, margin + 10, yPos + 5);
        yPos += titleHeight + 5;

        // Alert description
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);
        const description = doc.splitTextToSize(alert.desc, contentWidth);
        description.forEach((line: string) => {
          if (yPos > pageHeight - margin) {
            doc.addPage();
            yPos = margin;
            pageNumber++;
          }
          doc.text(line, margin, yPos);
          yPos += 7;
        });
        yPos += 5;

        // Solution
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(41, 128, 185);
        doc.text('Solution:', margin, yPos);
        yPos += 7;
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);
        const solution = doc.splitTextToSize(alert.solution, contentWidth);
        solution.forEach((line: string) => {
          if (yPos > pageHeight - margin) {
            doc.addPage();
            yPos = margin;
            pageNumber++;
          }
          doc.text(line, margin, yPos);
          yPos += 7;
        });
        yPos += 5;

        // Affected URLs
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(41, 128, 185);
        doc.text('Affected URLs:', margin, yPos);
        yPos += 7;
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);
        alert.instances?.forEach((instance: any) => {
          if (yPos > pageHeight - margin) {
            doc.addPage();
            yPos = margin;
            pageNumber++;
          }
          doc.text(`${instance.method} ${instance.uri}`, margin, yPos);
          yPos += 7;
        });
        yPos += 10;

        // References
        if (alert.reference) {
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(41, 128, 185);
          doc.text('References:', margin, yPos);
          yPos += 7;
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(0, 0, 0);
          const references = doc.splitTextToSize(alert.reference, contentWidth);
          references.forEach((line: string) => {
            if (yPos > pageHeight - margin) {
              doc.addPage();
              yPos = margin;
              pageNumber++;
            }
            doc.text(line, margin, yPos);
            yPos += 7;
          });
          yPos += 10;
        }

        // Add a separator line
        doc.setDrawColor(200, 200, 200);
        doc.line(margin, yPos, pageWidth - margin, yPos);
        yPos += 15;
      });

      // Add page numbers
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(41, 128, 185);
        doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - margin, { align: 'right' });
      }

      // Save the PDF
      doc.save(`scan-report-${scanId}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF report');
    }
  };
  
  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center"
            onClick={() => navigate('/scan-history')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to History
          </Button>
          
          <Button 
            onClick={generatePDF}
            disabled={isGeneratingPdf}
            className="flex items-center"
          >
            <Download className="mr-2 h-4 w-4" />
            {isGeneratingPdf ? 'Generating PDF...' : 'Download PDF Report'}
          </Button>
        </div>
        
        <div ref={reportRef} className="space-y-8">
          <div className="text-center space-y-2 p-6 border border-border rounded-lg bg-card">
            <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-2">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Vulnerability Scan Report</h1>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-muted-foreground">
              <div className="flex items-center">
                <FileText className="mr-2 h-4 w-4" />
                Target: <span className="font-medium text-foreground ml-1">{scanResults.site?.[0]?.['@name'] || url}</span>
              </div>
              <div className="flex items-center">
                <Calendar className="mr-2 h-4 w-4" />
                Scan Date: <span className="font-medium text-foreground ml-1">
                  {formatDate(scanResults['@generated'] || timestamp)}
                </span>
              </div>
            </div>
          </div>
          
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">Summary</h2>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <div className="flex flex-col items-center p-4 rounded-lg border border-border">
                <div className="text-3xl font-bold text-severity-high">{highAlerts.length}</div>
                <div className="text-sm text-muted-foreground">High Severity</div>
              </div>
              <div className="flex flex-col items-center p-4 rounded-lg border border-border">
                <div className="text-3xl font-bold text-severity-medium">{mediumAlerts.length}</div>
                <div className="text-sm text-muted-foreground">Medium Severity</div>
              </div>
              <div className="flex flex-col items-center p-4 rounded-lg border border-border">
                <div className="text-3xl font-bold text-severity-low">{lowAlerts.length}</div>
                <div className="text-sm text-muted-foreground">Low Severity</div>
              </div>
              <div className="flex flex-col items-center p-4 rounded-lg border border-border">
                <div className="text-3xl font-bold text-severity-info">{infoAlerts.length}</div>
                <div className="text-sm text-muted-foreground">Informational</div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>High</span>
                  <span>{highAlerts.length} issues</span>
                </div>
                <Progress 
                  value={getRiskPercentage(highAlerts.length)}
                  className={`h-2 ${getSeverityProgressColor('High')}`}
                />
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Medium</span>
                  <span>{mediumAlerts.length} issues</span>
                </div>
                <Progress 
                  value={getRiskPercentage(mediumAlerts.length)}
                  className={`h-2 ${getSeverityProgressColor('Medium')}`}
                />
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Low</span>
                  <span>{lowAlerts.length} issues</span>
                </div>
                <Progress 
                  value={getRiskPercentage(lowAlerts.length)}
                  className={`h-2 ${getSeverityProgressColor('Low')}`}
                />
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Informational</span>
                  <span>{infoAlerts.length} issues</span>
                </div>
                <Progress 
                  value={getRiskPercentage(infoAlerts.length)}
                  className={`h-2 ${getSeverityProgressColor('Informational')}`}
                />
              </div>
            </div>
          </Card>
          
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid grid-cols-5 mb-4">
              <TabsTrigger value="all">
                All ({totalAlerts})
              </TabsTrigger>
              <TabsTrigger value="high">
                High ({highAlerts.length})
              </TabsTrigger>
              <TabsTrigger value="medium">
                Medium ({mediumAlerts.length})
              </TabsTrigger>
              <TabsTrigger value="low">
                Low ({lowAlerts.length})
              </TabsTrigger>
              <TabsTrigger value="info">
                Info ({infoAlerts.length})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="space-y-6">
              {scanResults.site?.[0]?.alerts?.map((alert, index) => (
                <AlertItem key={`${alert.pluginid}-${index}`} alert={alert} />
              ))}
              {(!scanResults.site?.[0]?.alerts || scanResults.site[0].alerts.length === 0) && (
                <div className="text-center py-12 text-muted-foreground">
                  No vulnerabilities detected
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="high" className="space-y-6">
              {highAlerts.map((alert, index) => (
                <AlertItem key={`high-${alert.pluginid}-${index}`} alert={alert} />
              ))}
              {highAlerts.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  No high severity vulnerabilities detected
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="medium" className="space-y-6">
              {mediumAlerts.map((alert, index) => (
                <AlertItem key={`medium-${alert.pluginid}-${index}`} alert={alert} />
              ))}
              {mediumAlerts.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  No medium severity vulnerabilities detected
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="low" className="space-y-6">
              {lowAlerts.map((alert, index) => (
                <AlertItem key={`low-${alert.pluginid}-${index}`} alert={alert} />
              ))}
              {lowAlerts.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  No low severity vulnerabilities detected
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="info" className="space-y-6">
              {infoAlerts.map((alert, index) => (
                <AlertItem key={`info-${alert.pluginid}-${index}`} alert={alert} />
              ))}
              {infoAlerts.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  No informational alerts detected
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
};

interface AlertItemProps {
  alert: ScanAlert;
}

// Alert Item Component
const AlertItem = ({ alert }: AlertItemProps) => {
  const [isOpen, setIsOpen] = useState(false);
  
  // Replace HTML tags from ZAP descriptions with proper formatting
  const renderHTML = (htmlString: string) => {
    return { __html: htmlString };
  };
  
  return (
    <Card className="overflow-hidden">
      <div 
        className="flex justify-between items-start p-4 cursor-pointer hover:bg-muted/10 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="space-y-1">
          <h3 className="font-medium">{alert.name}</h3>
          <div className="text-sm text-muted-foreground">
            CWE-{alert.cweid} | WASC-{alert.wascid}
          </div>
        </div>
        <Badge className={`${getSeverityColor(alert.risk)}`}>
          {alert.risk}
        </Badge>
      </div>
      
      {isOpen && (
        <div className="p-4 border-t border-border bg-secondary/20">
          <div className="scan-results space-y-4">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">Description</h4>
              <div dangerouslySetInnerHTML={renderHTML(alert.desc)} />
            </div>
            
            {alert.instances && alert.instances.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Affected URLs</h4>
                <ul className="space-y-2">
                  {alert.instances.map((instance, i) => (
                    <li key={i} className="text-sm">
                      <div className="flex flex-wrap gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">
                          {instance.method}
                        </Badge>
                        <span className="font-mono text-xs break-all bg-secondary/30 p-1 rounded">
                          {instance.uri}
                        </span>
                      </div>
                      {instance.param && (
                        <div className="mt-1">
                          <span className="text-xs text-muted-foreground">Parameter: </span>
                          <code className="text-xs">{instance.param}</code>
                        </div>
                      )}
                      {instance.evidence && (
                        <div className="mt-1">
                          <span className="text-xs text-muted-foreground">Evidence: </span>
                          <code className="text-xs break-all bg-secondary/30 p-1 rounded">{instance.evidence}</code>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">Solution</h4>
              <div dangerouslySetInnerHTML={renderHTML(alert.solution)} />
            </div>
            
            {alert.otherinfo && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Additional Information</h4>
                <div dangerouslySetInnerHTML={renderHTML(alert.otherinfo)} />
              </div>
            )}
            
            {alert.reference && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">References</h4>
                <div dangerouslySetInnerHTML={renderHTML(alert.reference)} />
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  );
};

const getSeverityColor = (severity: string) => {
  switch(severity) {
    case 'High':
      return 'text-severity-high bg-severity-high/10';
    case 'Medium':
      return 'text-severity-medium bg-severity-medium/10';
    case 'Low':
      return 'text-severity-low bg-severity-low/10';
    case 'Informational':
      return 'text-severity-info bg-severity-info/10';
    default:
      return 'text-muted-foreground bg-muted/20';
  }
};

const Calendar = (props: React.SVGProps<SVGSVGElement>) => {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
      <line x1="16" x2="16" y1="2" y2="6" />
      <line x1="8" x2="8" y1="2" y2="6" />
      <line x1="3" x2="21" y1="10" y2="10" />
    </svg>
  );
};

export default ScanResults; 