import React, { useState, useEffect } from "react";
import { Shortlist } from "@/api/entities";
import { Stock } from "@/api/entities";
import { Note } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

import ShortlistTable from "../components/shortlist/ShortlistTable";
import NotesPanel from "../components/shortlist/NotesPanel";

export default function ShortlistPage() {
  const [shortlistItems, setShortlistItems] = useState([]);
  const [stocks, setStocks] = useState([]);
  const [notes, setNotes] = useState([]);
  const [selectedTicker, setSelectedTicker] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [shortlistData, stocksData, notesData] = await Promise.all([
        Shortlist.list("-priority"),
        Stock.list(),
        Note.list()
      ]);
      setShortlistItems(shortlistData);
      setStocks(stocksData);
      setNotes(notesData);
    } catch (error) {
      console.error("Error loading data:", error);
    }
    setIsLoading(false);
  };

  const getStockDetails = (ticker) => {
    return stocks.find(stock => stock.ticker === ticker);
  };

  const exportShortlist = () => {
    const csvContent = [
      ["Ticker", "Company", "Priority", "Strategy", "Current Price", "Target Entry", "Target Exit", "Sector", "Sentiment"],
      ...shortlistItems.map(item => {
        const stock = getStockDetails(item.ticker);
        return [
          item.ticker,
          stock?.company_name || "",
          item.priority || "",
          item.strategy || "",
          stock?.current_price || "",
          item.target_entry || "",
          item.target_exit || "",
          stock?.sector || "",
          stock?.analyst_sentiment || ""
        ];
      })
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "earnings-shortlist.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleUpdateShortlist = async (id, data) => {
    await Shortlist.update(id, data);
    loadData();
  };

  const handleDeleteFromShortlist = async (id) => {
    await Shortlist.delete(id);
    loadData();
  };

  return (
    <div className="p-4 md:p-8 min-h-screen earnings-gradient">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <Link to={createPageUrl("Dashboard")}>
              <Button variant="outline" size="icon" className="border-gray-600 text-gray-300 hover:bg-gray-700">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">My Shortlist</h1>
              <p className="text-gray-400">Final earnings plays and trading notes</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={exportShortlist}
              disabled={shortlistItems.length === 0}
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Shortlist
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Shortlist Table */}
          <div className="lg:col-span-2">
            <ShortlistTable
              shortlistItems={shortlistItems}
              getStockDetails={getStockDetails}
              isLoading={isLoading}
              onUpdate={handleUpdateShortlist}
              onDelete={handleDeleteFromShortlist}
              onSelectTicker={setSelectedTicker}
              selectedTicker={selectedTicker}
            />
          </div>

          {/* Notes Panel */}
          <div>
            <NotesPanel
              selectedTicker={selectedTicker}
              notes={notes}
              onNotesUpdate={loadData}
            />
          </div>
        </div>
      </div>
    </div>
  );
}