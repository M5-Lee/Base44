import React from 'react';
import ReactMarkdown from 'react-markdown';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { ExternalLink, Link as LinkIcon, Edit, ToggleLeft, ToggleRight } from 'lucide-react';

export default function StockDetailsModal({ stock, analystTape, isOpen, onClose }) {
  if (!stock) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl bg-gray-800/80 backdrop-blur-sm border-gray-700 text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-3">
            {stock.ticker} <span className="text-lg text-gray-400 font-normal">{stock.company_name}</span>
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Sector: {stock.sector} • Market Cap: {stock.market_cap}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
          {/* Analyst Tape Details */}
          <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
            <h3 className="font-semibold text-lg mb-3">Analyst Tape</h3>
            {analystTape ? (
              <div className="space-y-4">
                <div>
                  <Label className="text-xs text-gray-500">Consensus</Label>
                  <p className={`font-bold ${
                    analystTape.consensus === 'Bullish' ? 'text-green-400' :
                    analystTape.consensus === 'Bearish' ? 'text-red-400' : 'text-yellow-400'
                  }`}>{analystTape.consensus}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Mean PT Δ%</Label>
                  <p className="font-bold">{analystTape.mean_pt_delta_percent > 0 ? '+':''}{analystTape.mean_pt_delta_percent}%</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Notables</Label>
                  <div className="prose prose-sm prose-invert max-w-none text-gray-300 bg-gray-800/50 p-3 rounded-md">
                    <ReactMarkdown>{analystTape.notables || 'No notable comments.'}</ReactMarkdown>
                  </div>
                </div>
                {analystTape.source_links?.length > 0 && (
                  <div>
                    <Label className="text-xs text-gray-500">Sources</Label>
                    <div className="flex flex-col gap-2 mt-1">
                      {analystTape.source_links.map((link, i) => (
                        <a href={link} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline text-sm flex items-center gap-1" key={i}>
                          <ExternalLink className="w-3 h-3"/> Source {i+1}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex items-center justify-between pt-2">
                  <Label className="text-xs text-gray-500">Use in Bias Score</Label>
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    {analystTape.use_in_bias_score ? <ToggleRight className="w-5 h-5 text-green-400"/> : <ToggleLeft className="w-5 h-5 text-gray-500"/>}
                    {analystTape.use_in_bias_score ? 'Enabled' : 'Disabled'}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">No analyst data available for this ticker.</p>
            )}
          </div>
          {/* Placeholder for Price/Option Chart */}
          <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700 flex items-center justify-center">
            <p className="text-gray-600">Price/Option Chart (Coming Soon)</p>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="secondary" onClick={onClose} className="bg-gray-700 hover:bg-gray-600">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}