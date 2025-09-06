import React from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DollarSign, TrendingUp } from "lucide-react";

export default function AffordabilityAlert({ stocks }) {
  const cheapOptions = stocks.filter(s => s.option_affordability === "Under $1");
  const affordable = stocks.filter(s => s.option_affordability === "$1-$3");

  if (cheapOptions.length === 0 && affordable.length === 0) return null;

  return (
    <Alert className="bg-green-500/10 border-green-500/30 text-green-400">
      <DollarSign className="h-4 w-4" />
      <AlertDescription>
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          <span className="font-medium">
            {cheapOptions.length > 0 && (
              <span>{cheapOptions.length} plays under $1 • </span>
            )}
            {affordable.length} affordable plays under $3 available this week
          </span>
        </div>
      </AlertDescription>
    </Alert>
  );
}