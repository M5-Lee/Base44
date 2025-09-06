import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter, RefreshCw, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

// Helper function to generate week options
const generateWeekOptions = () => {
  const options = [];
  const today = new Date();
  
  // Get current Monday
  const currentMonday = new Date(today);
  currentMonday.setDate(today.getDate() - today.getDay() + 1);
  
  // Generate 8 weeks starting from current week
  for (let i = 0; i < 8; i++) {
    const weekStart = new Date(currentMonday);
    weekStart.setDate(currentMonday.getDate() + (i * 7));
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 4); // Friday
    
    const label = `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    const value = weekStart.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    options.push({ value, label, isCurrent: i === 0 });
  }
  
  return options;
};

export default function FilterControls({ filters, setFilters, stocks, selectedWeek, setSelectedWeek }) {
  const sectors = [...new Set(stocks.map(stock => stock.sector))];
  const weekOptions = generateWeekOptions();

  const resetFilters = () => {
    setFilters({
      sector: "all",
      side: "Both",
      seasonality: "all",
    });
  };

  return (
    <Card className="bg-gray-800/50 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Filter className="w-5 h-5" />
          Screen & Filter
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Week Selection Row */}
        <div className="border-b border-gray-700 pb-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-400" />
              <Label className="text-gray-400 text-sm font-medium">Earnings Week:</Label>
            </div>
            <Select value={selectedWeek} onValueChange={setSelectedWeek}>
              <SelectTrigger className="w-48 bg-gray-700 border-gray-600 text-white">
                <SelectValue placeholder="Select week" />
              </SelectTrigger>
              <SelectContent className="bg-gray-700 border-gray-600">
                {weekOptions.map(option => (
                  <SelectItem key={option.value} value={option.value} className="text-white">
                    {option.label} {option.isCurrent && "(Current)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Simplified Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
          {/* Sector Filter */}
          <div>
            <Label className="text-gray-400 text-xs">Sector</Label>
            <Select
              value={filters.sector}
              onValueChange={(value) => setFilters(prev => ({ ...prev, sector: value }))}
            >
              <SelectTrigger className="bg-gray-700 border-gray-600 text-white mt-1">
                <SelectValue placeholder="All Sectors" />
              </SelectTrigger>
              <SelectContent className="bg-gray-700 border-gray-600">
                <SelectItem value="all" className="text-white">All Sectors</SelectItem>
                {sectors.map(sector => (
                  <SelectItem key={sector} value={sector} className="text-white">
                    {sector}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Side Filter */}
          <div>
            <Label className="text-gray-400 text-xs">Side</Label>
            <Select
              value={filters.side}
              onValueChange={(value) => setFilters(prev => ({ ...prev, side: value }))}
            >
              <SelectTrigger className="bg-gray-700 border-gray-600 text-white mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-700 border-gray-600">
                <SelectItem value="Calls" className="text-white">Calls</SelectItem>
                <SelectItem value="Puts" className="text-white">Puts</SelectItem>
                <SelectItem value="Both" className="text-white">Both</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Seasonality Filter */}
          <div>
            <Label className="text-gray-400 text-xs">Seasonality</Label>
            <Select
              value={filters.seasonality}
              onValueChange={(value) => setFilters(prev => ({ ...prev, seasonality: value }))}
            >
              <SelectTrigger className="bg-gray-700 border-gray-600 text-white mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-700 border-gray-600">
                <SelectItem value="all" className="text-white">All Seasonality</SelectItem>
                <SelectItem value="Bullish" className="text-white">Bullish</SelectItem>
                <SelectItem value="Bearish" className="text-white">Bearish</SelectItem>
                <SelectItem value="Neutral" className="text-white">Neutral</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex justify-end pt-4">
          <Button
            variant="outline"
            onClick={resetFilters}
            className="border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Reset Filters
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}