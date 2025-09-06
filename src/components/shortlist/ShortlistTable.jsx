import React, { useState } from "react";
import { motion } from "framer-motion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Star, Trash2, Edit, Save, X, TrendingUp, TrendingDown } from "lucide-react";
import { format } from "date-fns";

const sentimentColors = {
  Bullish: "bg-green-500/20 text-green-400 border-green-500/30",
  Bearish: "bg-red-500/20 text-red-400 border-red-500/30",
  Neutral: "bg-gray-500/20 text-gray-400 border-gray-500/30"
};

export default function ShortlistTable({ 
  shortlistItems, 
  getStockDetails, 
  isLoading, 
  onUpdate, 
  onDelete,
  onSelectTicker,
  selectedTicker 
}) {
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});

  const startEdit = (item) => {
    setEditingId(item.id);
    setEditData(item);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditData({});
  };

  const saveEdit = async () => {
    await onUpdate(editingId, editData);
    setEditingId(null);
    setEditData({});
  };

  if (isLoading) {
    return (
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Loading shortlist...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  if (shortlistItems.length === 0) {
    return (
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Star className="w-5 h-5" />
            Your Shortlist
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <p className="text-gray-400 mb-4">No stocks in your shortlist yet.</p>
          <p className="text-gray-500 text-sm">Add stocks from the earnings dashboard to get started.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-800/50 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Star className="w-5 h-5" />
          Your Shortlist ({shortlistItems.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-gray-700">
                <TableHead className="text-gray-300">Ticker</TableHead>
                <TableHead className="text-gray-300">Price</TableHead>
                <TableHead className="text-gray-300">Priority</TableHead>
                <TableHead className="text-gray-300">Strategy</TableHead>
                <TableHead className="text-gray-300">Entry</TableHead>
                <TableHead className="text-gray-300">Exit</TableHead>
                <TableHead className="text-gray-300">Sentiment</TableHead>
                <TableHead className="text-gray-300">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shortlistItems.map((item) => {
                const stock = getStockDetails(item.ticker);
                const isEditing = editingId === item.id;
                const isSelected = selectedTicker === item.ticker;

                return (
                  <motion.tr
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`border-gray-700 hover:bg-gray-700/20 transition-colors cursor-pointer ${
                      isSelected ? 'bg-blue-500/10 border-blue-500/30' : ''
                    }`}
                    onClick={() => onSelectTicker(item.ticker)}
                  >
                    <TableCell>
                      <div className="font-mono font-bold text-white text-lg flex items-center gap-2">
                        {item.ticker}
                        {stock?.seasonality_bias === "Bullish" ? (
                          <TrendingUp className="w-4 h-4 text-green-400" />
                        ) : stock?.seasonality_bias === "Bearish" ? (
                          <TrendingDown className="w-4 h-4 text-red-400" />
                        ) : null}
                      </div>
                      <div className="text-gray-400 text-xs">
                        {stock?.company_name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-white">
                        ${stock?.current_price?.toFixed(2)}
                      </div>
                      <div className="text-gray-400 text-xs">
                        {stock?.option_affordability}
                      </div>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      {isEditing ? (
                        <Input
                          type="number"
                          min="1"
                          max="10"
                          value={editData.priority || ""}
                          onChange={(e) => setEditData({...editData, priority: parseInt(e.target.value)})}
                          className="w-16 bg-gray-700 border-gray-600 text-white"
                        />
                      ) : (
                        <Badge variant="outline" className="border-gray-500 text-gray-300">
                          {item.priority || "-"}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      {isEditing ? (
                        <Select
                          value={editData.strategy || ""}
                          onValueChange={(value) => setEditData({...editData, strategy: value})}
                        >
                          <SelectTrigger className="w-32 bg-gray-700 border-gray-600 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-700 border-gray-600">
                            <SelectItem value="Long Call" className="text-white">Long Call</SelectItem>
                            <SelectItem value="Long Put" className="text-white">Long Put</SelectItem>
                            <SelectItem value="Iron Condor" className="text-white">Iron Condor</SelectItem>
                            <SelectItem value="Straddle" className="text-white">Straddle</SelectItem>
                            <SelectItem value="Strangle" className="text-white">Strangle</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="text-gray-300 text-sm">
                          {item.strategy || "-"}
                        </div>
                      )}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      {isEditing ? (
                        <Input
                          type="number"
                          step="0.01"
                          value={editData.target_entry || ""}
                          onChange={(e) => setEditData({...editData, target_entry: parseFloat(e.target.value)})}
                          className="w-20 bg-gray-700 border-gray-600 text-white"
                        />
                      ) : (
                        <div className="text-gray-300 text-sm">
                          {item.target_entry ? `$${item.target_entry}` : "-"}
                        </div>
                      )}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      {isEditing ? (
                        <Input
                          type="number"
                          step="0.01"
                          value={editData.target_exit || ""}
                          onChange={(e) => setEditData({...editData, target_exit: parseFloat(e.target.value)})}
                          className="w-20 bg-gray-700 border-gray-600 text-white"
                        />
                      ) : (
                        <div className="text-gray-300 text-sm">
                          {item.target_exit ? `$${item.target_exit}` : "-"}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {stock?.analyst_sentiment && (
                        <Badge 
                          variant="outline"
                          className={sentimentColors[stock.analyst_sentiment]}
                        >
                          {stock.analyst_sentiment}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div className="flex gap-2">
                        {isEditing ? (
                          <>
                            <Button size="sm" onClick={saveEdit} className="bg-green-600 hover:bg-green-700">
                              <Save className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={cancelEdit} className="border-gray-600">
                              <X className="w-4 h-4" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button size="sm" variant="outline" onClick={() => startEdit(item)} className="border-gray-600">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => onDelete(item.id)} className="border-red-500 text-red-400 hover:bg-red-500/20">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </div>
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