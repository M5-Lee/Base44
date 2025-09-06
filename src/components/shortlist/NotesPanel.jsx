import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Note } from "@/api/entities";
import { FileText, Save, Plus, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";

export default function NotesPanel({ selectedTicker, notes, onNotesUpdate }) {
  const [noteContent, setNoteContent] = useState("");
  const [tradeRationale, setTradeRationale] = useState("");
  const [riskAssessment, setRiskAssessment] = useState("Medium");
  const [isLoading, setIsLoading] = useState(false);

  const tickerNotes = notes.filter(note => note.ticker === selectedTicker);

  const handleSaveNote = async () => {
    if (!selectedTicker || !noteContent) return;

    setIsLoading(true);
    try {
      await Note.create({
        ticker: selectedTicker,
        content: noteContent,
        trade_rationale: tradeRationale,
        risk_assessment: riskAssessment
      });
      setNoteContent("");
      setTradeRationale("");
      setRiskAssessment("Medium");
      onNotesUpdate();
    } catch (error) {
      console.error("Error saving note:", error);
    }
    setIsLoading(false);
  };

  const riskColors = {
    Low: "text-green-400",
    Medium: "text-yellow-400", 
    High: "text-red-400"
  };

  if (!selectedTicker) {
    return (
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Trading Notes
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <p className="text-gray-400">Select a stock to view and add notes</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Notes for {selectedTicker}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-gray-300">Quick Notes</Label>
            <Textarea
              placeholder="Add your thoughts about this play..."
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-gray-300">Trade Rationale</Label>
            <Textarea
              placeholder="Why are you considering this trade?"
              value={tradeRationale}
              onChange={(e) => setTradeRationale(e.target.value)}
              className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-gray-300">Risk Assessment</Label>
            <Select value={riskAssessment} onValueChange={setRiskAssessment}>
              <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-700 border-gray-600">
                <SelectItem value="Low" className="text-white">Low Risk</SelectItem>
                <SelectItem value="Medium" className="text-white">Medium Risk</SelectItem>
                <SelectItem value="High" className="text-white">High Risk</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button 
            onClick={handleSaveNote}
            disabled={!noteContent || isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            <Save className="w-4 h-4 mr-2" />
            {isLoading ? "Saving..." : "Save Note"}
          </Button>
        </CardContent>
      </Card>

      {/* Previous Notes */}
      {tickerNotes.length > 0 && (
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white text-sm">Previous Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {tickerNotes.map((note) => (
                <motion.div
                  key={note.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gray-700/30 rounded-lg p-4 border border-gray-600"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs text-gray-400">
                      {new Date(note.created_date).toLocaleDateString()}
                    </div>
                    {note.risk_assessment && (
                      <div className={`flex items-center gap-1 text-xs ${riskColors[note.risk_assessment]}`}>
                        <AlertTriangle className="w-3 h-3" />
                        {note.risk_assessment} Risk
                      </div>
                    )}
                  </div>
                  <p className="text-gray-300 text-sm mb-2">{note.content}</p>
                  {note.trade_rationale && (
                    <p className="text-gray-400 text-xs italic">
                      Rationale: {note.trade_rationale}
                    </p>
                  )}
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}