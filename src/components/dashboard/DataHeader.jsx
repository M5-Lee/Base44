
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RefreshCw, Clock, Database, CheckCircle, AlertTriangle, XCircle, Upload } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function DataHeader({ lastUpdated, recordsLoaded, onRefresh, onCSVUpload }) {
  const [timeSinceUpdate, setTimeSinceUpdate] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const updateTimer = () => {
      const seconds = Math.floor((new Date() - new Date(lastUpdated)) / 1000);
      setTimeSinceUpdate(seconds);
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [lastUpdated]);

  const getFreshness = () => {
    if (!lastUpdated || recordsLoaded === 0) {
        return { label: 'No Data', color: 'bg-gray-500/20 text-gray-400 border-gray-500/30', icon: XCircle };
    }
    const minutes = timeSinceUpdate / 60;
    if (minutes <= 15) return { label: 'Fresh', color: 'bg-green-500/20 text-green-400 border-green-500/30', icon: CheckCircle };
    if (minutes <= 120) return { label: 'Stale', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', icon: AlertTriangle };
    return { label: 'Outdated', color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: XCircle };
  };
  
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await onRefresh();
    setIsRefreshing(false);
  };

  const handleCSVUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      await onCSVUpload(file);
    } catch (error) {
      console.error("CSV upload failed:", error);
    }
    setIsUploading(false);
    event.target.value = '';
  };
  
  const freshness = getFreshness();
  const FreshIcon = freshness.icon; // use a capitalized variable for JSX

  return (
    <Card className="bg-gray-800/50 border-gray-700">
      <CardContent className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
            <h3 className="text-white font-semibold">Data Control</h3>
        </div>

        <div className="flex items-center gap-6 text-sm text-gray-300">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-blue-400" />
            <span>{recordsLoaded} Records Loaded</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-purple-400" />
            <span>Updated: {recordsLoaded > 0 ? `${Math.floor(timeSinceUpdate / 60)}m ago` : 'N/A'}</span>
          </div>
          <Badge variant="outline" className={`gap-1 ${freshness.color}`}>
            <FreshIcon className="w-3 h-3" />
            {freshness.label}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
            <Button
              onClick={handleRefresh}
              disabled={isRefreshing}
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh Live Data'}
            </Button>
            <div className="flex items-center gap-2">
              <Input
                type="file"
                accept=".csv"
                onChange={handleCSVUpload}
                disabled={isUploading}
                className="hidden"
                id="csv-upload"
              />
              <Button
                asChild
                disabled={isUploading}
                className="bg-green-600 hover:bg-green-700"
              >
                <label htmlFor="csv-upload" className="cursor-pointer">
                  <Upload className={`w-4 h-4 mr-2`} />
                  {isUploading ? 'Uploading...' : 'Upload CSV'}
                </label>
              </Button>
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
