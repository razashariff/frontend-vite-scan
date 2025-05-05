import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Calendar, Eye, FileText, Loader } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { getUserScans, getScanResults } from '../lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Layout from '../components/Layout';

interface ScanRecord {
  id: string;
  user_id: string;
  url: string;
  file_path: string;
  created_at: string;
  status: string;
  alerts_high: number;
  alerts_medium: number;
  alerts_low: number;
  alerts_info: number;
}

const ScanHistory = () => {
  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchScans = async () => {
      if (!user?.id) return;
      
      setIsLoading(true);
      try {
        const scans = await getUserScans(user.id);
        setScans(scans);
      } catch (error) {
        console.error('Error fetching scan history:', error);
        toast({
          title: 'Error',
          description: 'Failed to load scan history: ' + (error instanceof Error ? error.message : 'Unknown error'),
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchScans();
  }, [user?.id, toast]);

  const handleViewScan = async (scan: ScanRecord) => {
    try {
      // Fetch the actual scan results using the getScanResults function
      const results = await getScanResults(scan.user_id, scan.file_path);
      
      navigate('/scan-results', { 
        state: { 
          scanId: scan.id,
          results: results,
          url: scan.url,
          timestamp: scan.created_at,
        } 
      });
    } catch (error) {
      console.error('Error loading scan results:', error);
      toast({
        title: 'Error',
        description: 'Failed to load scan results: ' + (error instanceof Error ? error.message : 'Unknown error'),
        variant: 'destructive',
      });
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const getSeverityColor = (count: number, type: 'high' | 'medium' | 'low' | 'info') => {
    if (count === 0) return 'text-muted-foreground';
    
    switch(type) {
      case 'high':
        return 'text-severity-high';
      case 'medium':
        return 'text-severity-medium';
      case 'low':
        return 'text-severity-low';
      case 'info':
        return 'text-severity-info';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center">
              <Shield className="mr-2 h-6 w-6 text-primary" />
              Scan History
            </h1>
            <p className="text-muted-foreground mt-1">
              View your previous vulnerability scans
            </p>
          </div>
          <Button onClick={() => navigate('/')}>New Scan</Button>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="flex flex-col items-center">
              <Loader className="h-8 w-8 animate-spin text-primary" />
              <p className="mt-4 text-muted-foreground">Loading scan history...</p>
            </div>
          </div>
        ) : scans.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <Shield className="h-12 w-12 text-muted-foreground mx-auto" />
                <h2 className="mt-4 text-xl font-semibold">No scans found</h2>
                <p className="mt-2 text-muted-foreground">
                  You haven't performed any vulnerability scans yet
                </p>
                <Button className="mt-6" onClick={() => navigate('/')}>
                  Start a New Scan
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {scans.map((scan) => (
              <Card key={scan.id} className="overflow-hidden">
                <CardHeader className="bg-card border-b border-border pb-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <CardTitle className="text-lg font-semibold truncate">
                        {scan.url}
                      </CardTitle>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Calendar className="mr-2 h-4 w-4" />
                        {formatDate(scan.created_at)}
                      </div>
                    </div>
                    <Badge variant={scan.status === 'completed' ? 'default' : 'secondary'}>
                      {scan.status.charAt(0).toUpperCase() + scan.status.slice(1)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="grid grid-cols-4 gap-4 mb-4">
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${getSeverityColor(scan.alerts_high, 'high')}`}>
                        {scan.alerts_high}
                      </div>
                      <div className="text-xs text-muted-foreground">High</div>
                    </div>
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${getSeverityColor(scan.alerts_medium, 'medium')}`}>
                        {scan.alerts_medium}
                      </div>
                      <div className="text-xs text-muted-foreground">Medium</div>
                    </div>
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${getSeverityColor(scan.alerts_low, 'low')}`}>
                        {scan.alerts_low}
                      </div>
                      <div className="text-xs text-muted-foreground">Low</div>
                    </div>
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${getSeverityColor(scan.alerts_info, 'info')}`}>
                        {scan.alerts_info}
                      </div>
                      <div className="text-xs text-muted-foreground">Info</div>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex items-center"
                      onClick={() => handleViewScan(scan)}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      View Report
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ScanHistory;
