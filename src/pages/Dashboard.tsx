import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, ExternalLink, Loader } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { uploadScanResults } from '../lib/api';
import Layout from '../components/Layout';

const Dashboard = () => {
  const [url, setUrl] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const validateUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch (e) {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateUrl(url)) {
      toast({
        title: 'Invalid URL',
        description: 'Please enter a valid URL including http:// or https://',
        variant: 'destructive',
      });
      return;
    }
    
    if (!user?.id) {
      toast({
        title: 'Authentication Required',
        description: 'Please sign in to perform scans',
        variant: 'destructive',
      });
      return;
    }
    
    setIsScanning(true);
    
    try {
      toast({
        title: 'Scan Started',
        description: `Scanning ${url}`,
      });

      const response = await fetch('/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ 
          url: url,
          scanType: 'full',
          recursive: true
        })
      });

      if (!response.ok) {
        throw new Error(`Scan failed: ${await response.text()}`);
      }

      const result = await response.json();
      const scanId = `scan-${Date.now()}`;
      
      // Save scan results to Supabase
      const { filePath } = await uploadScanResults(scanId, result, user.id, url);
      console.log('Scan results saved to:', filePath);
      
      navigate('/scan-results', { 
        state: { 
          scanId: scanId,
          results: result,
          url: url,
          timestamp: new Date().toISOString(),
        } 
      });
      
      toast({
        title: 'Scan Complete',
        description: 'Vulnerability scan completed successfully',
      });

    } catch (error) {
      console.error('Scan error:', error);
      toast({
        title: 'Scan Failed',
        description: error instanceof Error ? error.message : 'Failed to complete scan',
        variant: 'destructive',
      });
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Web Vulnerability Scanner</h1>
          <p className="text-muted-foreground">
            Scan websites for security vulnerabilities using OWASP ZAP
          </p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="mr-2 h-5 w-5 text-primary" />
              New Vulnerability Scan
            </CardTitle>
            <CardDescription>
              Enter a URL to scan for security vulnerabilities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="url">Target URL</Label>
                <div className="flex gap-2">
                  <Input
                    id="url"
                    type="text"
                    placeholder="https://example.com"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    required
                    className="flex-1"
                  />
                  <Button type="submit" disabled={isScanning}>
                    {isScanning ? (
                      <>
                        <Loader className="mr-2 h-4 w-4 animate-spin" />
                        Scanning...
                      </>
                    ) : (
                      <>
                        <Shield className="mr-2 h-4 w-4" />
                        Scan
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Enter a complete URL including http:// or https://
                </p>
              </div>
            </form>
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            <div className="flex items-center text-xs text-muted-foreground">
              <ExternalLink className="mr-2 h-3 w-3" />
              Powered by OWASP ZAP Scanner
            </div>
          </CardFooter>
        </Card>
      </div>
    </Layout>
  );
};

export default Dashboard;
