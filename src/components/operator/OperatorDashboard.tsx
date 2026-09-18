import React, { useState } from 'react';
import {
  Building2,
  CheckCircle2,
  Clock,
  Truck,
  AlertCircle,
  Wrench,
  ChevronRight,
  Filter
} from 'lucide-react';
import { useIncidents } from '../../context/IncidentContext';
import { useAuth } from '../../context/AuthContext';
import { IncidentCard } from '../feed/IncidentCard';
import { IncidentReport } from '../../types';

interface OperatorDashboardProps {
  onSelectReport: (report: IncidentReport) => void;
}

export const OperatorDashboard: React.FC<OperatorDashboardProps> = ({ onSelectReport }) => {
  const { reports, updateReportStatus } = useIncidents();
  const { currentUser } = useAuth();
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('all');

  // Filter only civic reports for Municipal operators
  const civicReports = reports.filter((r) => r.domain === 'civic');

  const pendingCount = civicReports.filter((r) => r.status === 'reported').length;
  const inProgressCount = civicReports.filter((r) => r.status === 'in_progress' || r.status === 'dispatched').length;
  const resolvedCount = civicReports.filter((r) => r.status === 'resolved').length;

  const departments = [
    'Greater Chennai Corporation (GCC) - Bus Route Roads',
    'GCC Department of Solid Waste Management',
    'GCC Bureau of Street Lighting & Electrical Works',
    'Chennai Metro Water (CMWSSB)',
    'Greater Chennai Corporation (GCC) - Storm Water Drains'
  ];

  const displayedReports = civicReports.filter((r) => {
    if (selectedDeptFilter !== 'all' && r.assignedDepartment !== selectedDeptFilter) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Operator Welcome & Overview Card */}
      <div className="bg-stone-900 text-white rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-800 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
                Municipal Operations Command
              </div>
              <h2 className="text-base font-bold text-white">
                {currentUser.name} • {currentUser.department || 'Public Works'}
              </h2>
            </div>
          </div>
          <div className="text-[11px] text-stone-400">
            Jurisdiction: <strong className="text-stone-200">Greater Chennai Corporation (15 Zones)</strong>
          </div>
        </div>

        {/* Workflow Metric Badges */}
        <div className="grid grid-cols-3 gap-2 text-center pt-1">
          <div className="bg-stone-800/80 p-2.5 rounded-xl border border-stone-700/80">
            <div className="text-lg font-black text-amber-400">{pendingCount}</div>
            <div className="text-[10px] uppercase font-bold text-stone-400">Needs Triage</div>
          </div>
          <div className="bg-stone-800/80 p-2.5 rounded-xl border border-stone-700/80">
            <div className="text-lg font-black text-blue-400">{inProgressCount}</div>
            <div className="text-[10px] uppercase font-bold text-stone-400">Crew Dispatched</div>
          </div>
          <div className="bg-stone-800/80 p-2.5 rounded-xl border border-stone-700/80">
            <div className="text-lg font-black text-emerald-400">{resolvedCount}</div>
            <div className="text-[10px] uppercase font-bold text-stone-400">Resolved Today</div>
          </div>
        </div>
      </div>

      {/* Department Filter Pills */}
      <div className="bg-white p-3 rounded-2xl border border-stone-200 shadow-xs space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-stone-700 uppercase tracking-wider">
            Municipal Department Filter
          </span>
          <span className="text-stone-500">{displayedReports.length} civic tickets</span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setSelectedDeptFilter('all')}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
              selectedDeptFilter === 'all'
                ? 'bg-amber-600 text-white'
                : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
            }`}
          >
            All Departments
          </button>
          {departments.map((dept) => (
            <button
              key={dept}
              type="button"
              onClick={() => setSelectedDeptFilter(dept)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                selectedDeptFilter === dept
                  ? 'bg-amber-600 text-white font-bold'
                  : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
              }`}
            >
              {dept.replace('Department of ', '').replace('Bureau of ', '')}
            </button>
          ))}
        </div>
      </div>

      {/* Queue of Civic Maintenance Tickets */}
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
