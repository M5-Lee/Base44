
import React from "react";
import { motion } from "framer-motion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star, TrendingUp, TrendingDown, Calendar, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Helper: generate 8 week options starting current week (Mon–Fri label)
const generateWeekOptions = () => {
  const options = [];
  const today = new Date();

  // Get current Monday
  const currentMonday = new Date(today);
  currentMonday.setDate(today.getDate() - today.getDay() + 1); // Adjust to Monday of the current week
  currentMonday.setHours(0, 0, 0, 0); // Normalize to start of day

  for (let i = 0; i < 8; i++) {
    const weekStart = new Date(currentMonday);
    weekStart.setDate(currentMonday.getDate() + i * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 4); // Friday of the same week (Monday + 4 days)
    const label = `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    const value = weekStart.toISOString().split('T')[0]; // Format as YYYY-MM-DD
    options.push({ value, label, isCurrent: i === 0 });
  }
  return options;
};

const sentimentColors = {
  Bullish: "text-green-400",
  Bearish: "text-red-400",
  Neutral: "text-gray-400"
};

export default function StockTable({ stocks, isLoading, onAddToShortlist, isInShortlist, onRowClick, analystTapes, selectedWeek, setSelectedWeek }) {

  if (isLoading) {
    return (
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Earnings This Week</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array(8).fill(0).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-8 w-16 bg-gray-600" />
                  <Skeleton className="h-4 w-32 bg-gray-600" />
                  <Skeleton className="h-4 w-20 bg-gray-600" />
                </div>
                <Skeleton className="h-8 w-24 bg-gray-600" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const weekOptions = generateWeekOptions();

  return (
    <Card className="bg-gray-800/50 border-gray-700">
      <CardHeader className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Earnings This Week ({stocks.length})
          </CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-sm">Week:</span>
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
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-gray-700 hover:bg-gray-700/30">
                <TableHead className="text-gray-300">Ticker</TableHead>
                <TableHead className="text-gray-300">Price</TableHead>
                <TableHead className="text-gray-300">Expected Move</TableHead>
                <TableHead className="text-gray-300">ATM Call/Put</TableHead>
                <TableHead className="text-gray-300">Analyst Tape</TableHead>
                <TableHead className="text-gray-300">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stocks.map((stock) => {
                const tape = analystTapes.find(t => t.ticker === stock.ticker);
                // const freshness = stock.source === 'Live API' ? 'text-green-400' : 'text-gray-400'; // Removed as no longer used
                return (
                  <motion.tr
                    key={stock.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border-gray-700 hover:bg-gray-700/20 transition-colors group cursor-pointer"
                    onClick={() => onRowClick(stock)}
                  >
                    <TableCell>
                      <div className="font-mono font-bold text-white text-lg">
                        {stock.ticker}
                      </div>
                      <div className="text-gray-400 text-xs max-w-32 truncate">
                        {stock.company_name} • {format(new Date(stock.earnings_date), "MMM d")}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-white">
                        {typeof stock.current_price === 'number' ? `$${stock.current_price.toFixed(2)}` : '—'}
                      </div>
                      <div className="text-gray-400 text-xs">
                        {typeof stock.wk52_low === 'number' && typeof stock.wk52_high === 'number'
                          ? `52W: $${stock.wk52_low.toFixed(0)}-$${stock.wk52_high.toFixed(0)}`
                          : null}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <TrendingUp className="w-4 h-4 text-purple-400" />
                        <span className="text-white font-medium">
                          {Math.abs(stock.expected_move || 0)}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm">
                          <span className="text-green-400">C: ${(stock.call_premium || 0).toFixed(2)}</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-red-400">P: ${(stock.put_premium || 0).toFixed(2)}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {tape ? (
                        <Badge variant="secondary" className={`gap-2 bg-gray-700/50 border-gray-600`}>
                          <span className={sentimentColors[tape.consensus]}>{tape.consensus}</span>
                          <span className="text-gray-300">PT {tape.mean_pt_delta_percent > 0 ? '+' : ''}{tape.mean_pt_delta_percent}%</span>
                        </Badge>
                      ) : (
                        <span className="text-gray-500 text-xs">No data</span>
                      )}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Button
                        size="sm"
                        variant={isInShortlist(stock.ticker) ? "secondary" : "default"}
                        onClick={() => onAddToShortlist(stock)}
                        disabled={isInShortlist(stock.ticker)}
                        className={isInShortlist(stock.ticker)
                          ? "bg-gray-600 text-gray-400"
                          : "bg-blue-600 hover:bg-blue-700"
                        }
                      >
                        <Star className="w-4 h-4 mr-1" />
                        {isInShortlist(stock.ticker) ? "Added" : "Add"}
                      </Button>
                    </TableCell>
                  </motion.tr>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
