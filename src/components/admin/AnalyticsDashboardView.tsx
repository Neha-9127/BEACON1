import React from 'react';
import {
  TrendingUp,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Building2,
  ShieldAlert,
  MapPin,
  Flame,
  GitMerge,
  BarChart3,
  Percent,
  Truck
} from 'lucide-react';
import { useIncidents } from '../../context/IncidentContext';
import {
  calculateExecutiveKpis,
  calculateZoneBottlenecks,
  calculateDepartmentPerformances
} from '../../utils/analytics';

export const AnalyticsDashboardView: React.FC = () => {
  const { reports } = useIncidents();

  const kpis = calculateExecutiveKpis(reports);
  const zoneBottlenecks = calculateZoneBottlenecks(reports);
  const deptPerformances = calculateDepartmentPerformances(reports);

  return (
    <div className="space-y-4">
      {/* Executive KPI Metric Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-2xl border border-stone-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-stone-500 text-[11px] font-semibold">
            <span>TOTAL INCIDENTS</span>
            <BarChart3 className="w-3.5 h-3.5 text-stone-400" />
          </div>
          <div className="text-2xl font-black text-stone-900">{kpis.totalReports}</div>
          <div className="text-[10px] text-stone-500 font-mono">
            {kpis.activeCount} active • {kpis.resolvedCount} closed
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-stone-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-stone-500 text-[11px] font-semibold">
            <span>RESOLUTION RATE</span>
            <Percent className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-600">{kpis.overallResolutionRate}%</div>
          <div className="text-[10px] text-emerald-700 font-medium">
            +4.2% higher than municipal SLA
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-stone-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-stone-500 text-[11px] font-semibold">
            <span>AVG RESPONSE TIME</span>
            <Clock className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-stone-900">{kpis.civicAvgHours}h</div>
          <div className="text-[10px] text-stone-500 font-mono">
            Safety Emergency: <strong>{kpis.safetyAvgMinutes}m</strong>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-stone-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-stone-500 text-[11px] font-semibold">
            <span>DUPLICATES MERGED</span>
            <GitMerge className="w-3.5 h-3.5 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-indigo-600">{kpis.duplicatesConsolidated}</div>
          <div className="text-[10px] text-stone-500">
            Consolidated into single work orders
          </div>
        </div>
      </div>

      {/* Frequent Bottleneck Areas & Zone Heatmap Ratings */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-stone-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-red-100 text-red-700 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-stone-900">
                Frequent Bottleneck Areas & Zone Vulnerability
              </h3>
              <p className="text-[11px] text-stone-500">
                Identifies districts with highest active backlog, response lag, and recurring issues
              </p>
            </div>
          </div>
          <span className="text-[11px] font-mono font-bold text-stone-500">
            5 Geographic Sectors
          </span>
        </div>

        <div className="divide-y divide-stone-100">
          {zoneBottlenecks.map((zone) => (
            <div
              key={zone.zoneName}
              className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-stone-50/70 transition-colors"
            >
              <div className="space-y-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-stone-900 text-xs">{zone.zoneName}</span>
                  <span
                    className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      zone.bottleneckLevel === 'critical'
                        ? 'bg-red-600 text-white animate-pulse'
                        : zone.bottleneckLevel === 'moderate'
                        ? 'bg-amber-100 text-amber-900'
                        : 'bg-emerald-100 text-emerald-900'
                    }`}
                  >
                    {zone.bottleneckLevel} Bottleneck
                  </span>
                </div>
                <div className="text-[11px] text-stone-500 flex items-center space-x-2">
                  <span>Dominant: <strong>{zone.dominantCategory}</strong></span>
                  <span>•</span>
                  <span>Avg Response: <strong>{zone.avgResponseMinutes} mins</strong></span>
                </div>
              </div>

              {/* Progress & Stat pill */}
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <div className="text-xs font-bold text-stone-800">
                    {zone.resolvedIncidents}/{zone.totalIncidents} Resolved
                  </div>
                  <div className="w-28 bg-stone-200 h-2 rounded-full overflow-hidden mt-1">
                    <div
                      className={`h-full rounded-full ${
                        zone.resolutionRatePercent > 70
                          ? 'bg-emerald-500'
                          : zone.resolutionRatePercent > 40
                          ? 'bg-amber-500'
                          : 'bg-red-500'
                      }`}
                      style={{ width: `${zone.resolutionRatePercent}%` }}
                    />
                  </div>
                </div>
                <div className="font-mono text-xs font-black text-stone-700 w-10 text-right">
                  {zone.resolutionRatePercent}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Multi-Agency Historical Resolution Rates & Field Crews */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-stone-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-stone-900">
                Departmental Historical Resolution Rates & Field Crew Load
              </h3>
              <p className="text-[11px] text-stone-500">
                Cross-agency service level tracking across municipal utilities and safety squads
              </p>
            </div>
          </div>
          <span className="text-[11px] font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
            Active Multi-Agency Mesh
          </span>
        </div>

        <div className="divide-y divide-stone-100">
          {deptPerformances.map((dept) => (
            <div
              key={dept.department}
              className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-stone-50/70 transition-colors text-xs"
            >
              <div className="space-y-0.5 min-w-0 flex-1">
                <div className="font-bold text-stone-900 text-xs">
                  {dept.department}
                </div>
                <div className="text-[11px] text-stone-500 flex items-center space-x-3">
                  <span className="flex items-center space-x-1">
                    <Truck className="w-3 h-3 text-stone-400" />
                    <span>{dept.activeFieldCrews} Crews Deployed</span>
                  </span>
                  <span>•</span>
                  <span>Avg Turnaround: <strong>{dept.avgResolutionHours} hrs</strong></span>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <div className="text-xs font-bold text-stone-800">
                    {dept.resolvedCount}/{dept.totalAssigned} Work Orders
                  </div>
                  <div className="w-32 bg-stone-200 h-2 rounded-full overflow-hidden mt-1">
                    <div
                      className="bg-blue-600 h-full rounded-full"
                      style={{ width: `${dept.resolutionRatePercent}%` }}
                    />
                  </div>
                </div>
                <div className="font-mono text-xs font-black text-blue-700 w-10 text-right">
                  {dept.resolutionRatePercent}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
