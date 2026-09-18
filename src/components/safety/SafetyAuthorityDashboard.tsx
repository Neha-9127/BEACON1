import React, { useState } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  Radio,
  Lock,
  Compass,
  CheckCircle2,
  PhoneCall,
  Flame,
  UserCheck
} from 'lucide-react';
import { useIncidents } from '../../context/IncidentContext';
import { useAuth } from '../../context/AuthContext';
import { IncidentCard } from '../feed/IncidentCard';
import { IncidentReport } from '../../types';

interface SafetyAuthorityDashboardProps {
  onSelectReport: (report: IncidentReport) => void;
}

export const SafetyAuthorityDashboard: React.FC<SafetyAuthorityDashboardProps> = ({
  onSelectReport
}) => {
  const { reports } = useIncidents();
  const { currentUser } = useAuth();
  const [severityTab, setSeverityTab] = useState<'all' | 'emergency' | 'high'>('all');

  // Filter only safety reports
  const safetyReports = reports.filter((r) => r.domain === 'safety');

  const emergencyCount = safetyReports.filter((r) => r.severity === 'emergency' && r.status !== 'resolved').length;
  const highCount = safetyReports.filter((r) => r.severity === 'high' && r.status !== 'resolved').length;

  const displayedReports = safetyReports.filter((r) => {
    if (severityTab === 'emergency') return r.severity === 'emergency';
    if (severityTab === 'high') return r.severity === 'high';
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Safety Authority Command Header */}
      <div className="bg-red-950 text-white rounded-2xl p-4 sm:p-5 border border-red-800/80 shadow-md space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-red-900 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center shadow-md">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="text-[11px] font-black uppercase tracking-wider text-red-400 flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                <span>Local Safety Authority & Emergency Dispatch</span>
              </div>
              <h2 className="text-base font-bold text-white">
                {currentUser.name} • Badge #{currentUser.badgeNumber || 'SF-SHIELD-489'}
              </h2>
            </div>
          </div>
          <div className="text-[11px] text-red-200">
            Sector: <strong className="text-white">Metro Central High-Alert Division</strong>
          </div>
        </div>

        {/* Priority Triage Metrics */}
        <div className="grid grid-cols-3 gap-2 text-center pt-1">
          <div className="bg-red-900/60 p-2.5 rounded-xl border border-red-800">
            <div className="text-lg font-black text-red-400 animate-pulse">{emergencyCount}</div>
            <div className="text-[10px] uppercase font-bold text-red-200">Emergency Hazards</div>
          </div>
          <div className="bg-red-900/60 p-2.5 rounded-xl border border-red-800">
            <div className="text-lg font-black text-orange-400">{highCount}</div>
            <div className="text-[10px] uppercase font-bold text-red-200">High Priority Alerts</div>
          </div>
          <div className="bg-red-900/60 p-2.5 rounded-xl border border-red-800">
            <div className="text-lg font-black text-emerald-400">100%</div>
            <div className="text-[10px] uppercase font-bold text-red-200">GPS Locked (EXIF)</div>
          </div>
        </div>

        {/* Anonymity Protocol Information */}
        <div className="p-2.5 bg-black/40 rounded-xl border border-red-900/60 flex items-start space-x-2 text-xs text-red-200">
          <Lock className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
          <div className="text-[11px] leading-relaxed">
            <strong className="text-white">Anonymity Shield Protocol:</strong> Reporting citizens who engaged the privacy toggle have their personal identity hashed. High-precision hardware GPS coordinates and live EXIF camera streams are preserved for emergency tactical deployment.
          </div>
        </div>
      </div>

      {/* Severity Filter Tabs */}
      <div className="flex items-center space-x-2 text-xs">
        <button
          type="button"
          onClick={() => setSeverityTab('all')}
          className={`px-3 py-1.5 rounded-full font-bold transition-colors ${
            severityTab === 'all'
              ? 'bg-red-600 text-white'
              : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-50'
          }`}
        >
          All Safety Reports ({safetyReports.length})
        </button>

        <button
          type="button"
          onClick={() => setSeverityTab('emergency')}
          className={`px-3 py-1.5 rounded-full font-bold flex items-center space-x-1.5 transition-colors ${
            severityTab === 'emergency'
              ? 'bg-red-600 text-white'
              : 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
          }`}
        >
          <Flame className="w-3.5 h-3.5" />
          <span>Active Emergencies ({emergencyCount})</span>
        </button>

        <button
          type="button"
          onClick={() => setSeverityTab('high')}
          className={`px-3 py-1.5 rounded-full font-bold transition-colors ${
            severityTab === 'high'
              ? 'bg-orange-600 text-white'
              : 'bg-orange-50 text-orange-800 border border-orange-200 hover:bg-orange-100'
          }`}
        >
          High Alerts ({highCount})
        </button>
      </div>

      {/* Grid of Safety Incident Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {displayedReports.map((report) => (
          <IncidentCard
            key={report.id}
            report={report}
            onOpenDetail={onSelectReport}
          />
        ))}
      </div>
    </div>
  );
};
