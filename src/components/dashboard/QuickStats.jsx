
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, DollarSign, Target, TrendingDown } from "lucide-react";

const StatCard = ({ title, value, icon: Icon, color, subtitle }) => (
  <Card className="bg-gray-800/50 border-gray-700">
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm font-medium">{title}</p>
          <p className={`text-2xl font-bold ${color} mt-1`}>{value}</p>
          {subtitle && (
            <p className="text-gray-500 text-xs mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`p-3 rounded-full ${color.replace('text-', 'bg-').replace('400', '500/20')}`}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
      </div>
    </CardContent>
  </Card>
);

export default function QuickStats({ stocks }) {
  const affordablePlays = stocks.filter(s => s.is_affordable);
  const bullishPlays = stocks.filter(s => s.seasonality_bias === "Bullish");
  const bearishPlays = stocks.filter(s => s.seasonality_bias === "Bearish");
  // The avgExpectedMove calculation is present in the outline but not used in the JSX.
  // Including it as per the outline for completeness, but it will be a dead variable.
  const avgExpectedMove = stocks.reduce((sum, s) => sum + Math.abs(s.expected_move || 0), 0) / (stocks.length || 1);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatCard
        title="Total Plays"
        value={stocks.length}
        icon={Target}
        color="text-blue-400"
        subtitle="Matching filters"
      />
      <StatCard
        title="Affordable Plays"
        value={affordablePlays.length}
        icon={DollarSign}
        color="text-green-400"
        subtitle="Premium < $3"
      />
      <StatCard
        title="Bullish Bias"
        value={bullishPlays.length}
        icon={TrendingUp}
        color="text-emerald-400"
        subtitle="Seasonally bullish"
      />
      <StatCard
        title="Bearish Bias"
        value={bearishPlays.length}
        icon={TrendingDown}
        color="text-red-400"
        subtitle="Seasonally bearish"
      />
    </div>
  );
}
