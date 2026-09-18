import React, { useState } from 'react';
import {
  X,
  Radio,
  CheckCircle2,
  Copy,
  Check,
  Server,
  Building2,
  MapPin,
  ExternalLink,
  Code2
} from 'lucide-react';
import { useIncidents } from '../../context/IncidentContext';

export const WebhookInspectorModal: React.FC = () => {
  const { isWebhookModalOpen, setIsWebhookModalOpen, inspectingWebhookReport } = useIncidents();
  const [copied, setCopied] = useState(false);

  if (!isWebhookModalOpen || !inspectingWebhookReport) return null;

  const routing = inspectingWebhookReport.webhookRouting;

  const handleCopyPayload = () => {
    if (routing?.payloadSnippet) {
      navigator.clipboard.writeText(routing.payloadSnippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-[1150] flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs overflow-y-auto">
      <div
        id="webhook-inspector-modal"
        className="relative w-full max-w-xl bg-stone-950 text-white rounded-2xl shadow-2xl border border-stone-800 overflow-hidden my-auto max-h-[90vh] flex flex-col font-mono text-xs"
      >
        {/* Header */}
        <div className="px-5 py-3.5 bg-stone-900 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
              <Server className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-blue-400 uppercase tracking-wider font-bold">
                Civic Automated Workflow Engine
              </div>
              <div className="text-xs font-bold text-white">
                Municipal Webhook Dispatch Audit
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsWebhookModalOpen(false)}
            className="text-stone-400 hover:text-white p-1 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1 font-sans">
          {/* Ticket & Target Summary */}
          <div className="bg-stone-900 rounded-xl p-3.5 border border-stone-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-stone-400">Ticket Identifier:</span>
              <span className="font-mono font-bold text-white">
                {inspectingWebhookReport.ticketNumber}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-stone-400">Target Department:</span>
              <span className="font-bold text-blue-400">
                {routing?.targetDepartment || inspectingWebhookReport.assignedDepartment || 'Municipal Works Bureau'}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-stone-400">Geotag Jurisdiction Zone:</span>
              <span className="text-stone-200 font-medium">
                {routing?.municipalZone || 'Zone 1: Downtown Metro Center'}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-stone-400">Delivery Status:</span>
              <span className="inline-flex items-center space-x-1 text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded">
                <CheckCircle2 className="w-3 h-3" />
                <span>200 OK • Delivered</span>
              </span>
            </div>
          </div>

          {/* Webhook Endpoint Banner */}
          <div className="space-y-1.5">
            <div className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
              Dispatched REST Webhook Endpoint
            </div>
            <div className="p-2.5 bg-stone-900 border border-stone-800 rounded-lg font-mono text-[11px] text-emerald-300 break-all flex items-center justify-between">
              <span>{routing?.endpoint || 'https://api.civicgov.city/v1/work-orders/dispatch'}</span>
              <span className="ml-2 text-[10px] bg-stone-800 text-stone-300 px-1.5 py-0.5 rounded flex-shrink-0">
                POST
              </span>
            </div>
          </div>

          {/* Live JSON Payload */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 flex items-center space-x-1">
                <Code2 className="w-3.5 h-3.5" />
                <span>Synchronized JSON Dispatch Payload</span>
              </span>
              <button
                type="button"
                onClick={handleCopyPayload}
                className="text-[11px] text-stone-400 hover:text-white flex items-center space-x-1 px-2 py-0.5 rounded bg-stone-800 border border-stone-700 transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy JSON</span>
                  </>
                )}
              </button>
            </div>

            <pre className="p-3 bg-black rounded-xl border border-stone-800 font-mono text-[11px] text-stone-300 overflow-x-auto leading-relaxed max-h-56">
              {routing?.payloadSnippet ||
                JSON.stringify(
                  {
                    event: 'civic.report.routed',
                    ticketNumber: inspectingWebhookReport.ticketNumber,
                    category: inspectingWebhookReport.categoryName,
                    department: inspectingWebhookReport.assignedDepartment,
                    location: inspectingWebhookReport.location,
                    timestamp: inspectingWebhookReport.createdAt
                  },
                  null,
                  2
                )}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-stone-900 border-t border-stone-800 flex justify-end">
          <button
            type="button"
            onClick={() => setIsWebhookModalOpen(false)}
            className="px-4 py-1.5 bg-stone-800 hover:bg-stone-700 text-white rounded-lg text-xs font-semibold transition-colors"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
