import React, { useState, useMemo } from 'react';
import {
  ShieldAlert,
  Building2,
  CheckCircle2,
  AlertTriangle,
  GitMerge,
  Filter,
  Search,
  Layers,
  BarChart3,
  MapPin,
  Truck,
  Clock,
  UserCheck,
  ChevronRight,
  ExternalLink,
  Camera,
  Server,
  ThumbsUp,
  RefreshCw,
  Flame,
  CheckSquare,
  Square,
  SlidersHorizontal,
  Trash2,
  Volume2,
  ImageOff,
  Sparkles
} from 'lucide-react';
import { IncidentReport, IncidentStatus, SeverityLevel, isAiAutoReport } from '../../types';
import { useIncidents } from '../../context/IncidentContext';
import { useAuth } from '../../context/AuthContext';
import { AnalyticsDashboardView } from './AnalyticsDashboardView';
import { DuplicateMergeModal } from './DuplicateMergeModal';
import { IncidentMap } from '../map/IncidentMap';

interface AdminTriageConsoleProps {
  onSelectReport: (report: IncidentReport) => void;
}

const AGENCIES = [
  { id: 'all', name: 'All Municipal & Safety Agencies' },
  { id: 'Department of Transportation & Roads', name: 'Dept of Transportation & Roads' },
  { id: 'Municipal Sanitation Bureau', name: 'Sanitation Bureau' },
  { id: 'Bureau of Street Lighting', name: 'Street Lighting Bureau' },
  { id: 'Municipal Water & Sewerage Agency', name: 'Water & Sewerage Agency' },
  { id: 'Metropolitan Safety & Emergency Command', name: 'Safety & Emergency Command' }
];

export const AdminTriageConsole: React.FC<AdminTriageConsoleProps> = ({ onSelectReport }) => {
  const {
    reports,
    bulkUpdateStatus,
    bulkAssignDepartment,
    openWebhookInspector,
    openResolutionProofModal,
    deleteReport,
    deleteReportImage,
    bulkDeleteReports,
    ringEmergencyBuzzer
  } = useIncidents();
  const { currentUser, isAuthority } = useAuth();

  // Active View Tab: 'triage' | 'analytics' | 'heatmap'
  const [activeTab, setActiveTab] = useState<'triage' | 'analytics' | 'heatmap'>('triage');

  // Filters
  const [selectedAgency, setSelectedAgency] = useState<string>('all');
  const [filterDomain, setFilterDomain] = useState<'all' | 'civic' | 'safety'>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterZone, setFilterZone] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Bulk Selection
  const [selectedReportIds, setSelectedReportIds] = useState<string[]>([]);
  const [bulkStatusTarget, setBulkStatusTarget] = useState<IncidentStatus>('in_progress');
  const [bulkAgencyTarget, setBulkAgencyTarget] = useState<string>(
    'Department of Transportation & Roads'
  );
  const [bulkCrewTarget, setBulkCrewTarget] = useState<string>('Rapid Response Alpha');
  const [bulkNoteInput, setBulkNoteInput] = useState<string>('');
  const [isBulkAssignOpen, setIsBulkAssignOpen] = useState<boolean>(false);

  // Duplicate Merge Modal State
  const [mergePrimaryReport, setMergePrimaryReport] = useState<IncidentReport | null>(null);
  const [isMergeModalOpen, setIsMergeModalOpen] = useState<boolean>(false);

  // Dedicated In-App Incident Deletion Confirmation Modal State
  const [pendingDeleteReport, setPendingDeleteReport] = useState<IncidentReport | null>(null);
  const [pendingBulkDelete, setPendingBulkDelete] = useState<boolean>(false);
  const [pendingDeleteImageReport, setPendingDeleteImageReport] = useState<IncidentReport | null>(null);

  const emergencyCount = useMemo(() => {
    return reports.filter((r) => r.severity === 'emergency' && r.status !== 'resolved').length;
  }, [reports]);

  // Filtered Reports
  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      // Exclude tickets already merged into other tickets unless searching
      if (r.mergedIntoTicketId && filterStatus !== 'merged') {
        return false;
      }
      if (filterStatus === 'merged' && !r.mergedIntoTicketId) {
        return false;
      }

      // Agency filter
      if (selectedAgency !== 'all') {
        if (
          selectedAgency.includes('Safety') &&
          r.domain !== 'safety' &&
          r.assignedDepartment !== selectedAgency
        ) {
          return false;
        }
        if (
          !selectedAgency.includes('Safety') &&
          r.assignedDepartment !== selectedAgency
        ) {
          return false;
        }
      }

      // Domain filter
      if (filterDomain !== 'all' && r.domain !== filterDomain) return false;

      // Status filter
      if (filterStatus !== 'all' && filterStatus !== 'merged' && r.status !== filterStatus) {
        return false;
      }

      // Severity filter
      if (filterSeverity !== 'all' && r.severity !== filterSeverity) return false;

      // Zone filter
      if (filterZone !== 'all' && r.location.neighborhood !== filterZone) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = r.title.toLowerCase().includes(q);
        const matchDesc = r.description.toLowerCase().includes(q);
        const matchTicket = r.ticketNumber.toLowerCase().includes(q);
        const matchAddress = r.location.address.toLowerCase().includes(q);
        const matchCategory = r.categoryName.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchTicket && !matchAddress && !matchCategory) {
          return false;
        }
      }

      return true;
    });
  }, [
    reports,
    selectedAgency,
    filterDomain,
    filterStatus,
    filterSeverity,
    filterZone,
    searchQuery
  ]);

  // Bulk Selection Helpers
  const handleSelectAll = () => {
    if (selectedReportIds.length === filteredReports.length) {
      setSelectedReportIds([]);
    } else {
      setSelectedReportIds(filteredReports.map((r) => r.id));
    }
  };

  const handleToggleSelectRow = (id: string) => {
    if (selectedReportIds.includes(id)) {
      setSelectedReportIds(selectedReportIds.filter((item) => item !== id));
    } else {
      setSelectedReportIds([...selectedReportIds, id]);
    }
  };

  const handleExecuteBulkStatus = () => {
    if (selectedReportIds.length === 0) return;
    bulkUpdateStatus(
      selectedReportIds,
      bulkStatusTarget,
      bulkNoteInput || `Bulk status update to ${bulkStatusTarget}`
    );
    setSelectedReportIds([]);
    setBulkNoteInput('');
  };

  const handleExecuteBulkAssign = () => {
    if (selectedReportIds.length === 0) return;
    bulkAssignDepartment(selectedReportIds, bulkAgencyTarget, bulkCrewTarget);
    setIsBulkAssignOpen(false);
    setSelectedReportIds([]);
  };

  const handleOpenMergeWithSelected = () => {
    if (selectedReportIds.length === 0) return;
    const primary = reports.find((r) => r.id === selectedReportIds[0]);
    if (primary) {
      setMergePrimaryReport(primary);
      setIsMergeModalOpen(true);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Multi-Agency Console Command Header */}
      <div className="bg-stone-900 text-white rounded-2xl p-4 sm:p-5 shadow-md border border-stone-800 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-800 pb-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center font-black text-sm shadow-md">
              BCN
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-amber-400">
                  BEACON UNIFIED COMMAND
                </span>
                <span className="text-[9px] bg-stone-800 text-stone-300 font-mono px-2 py-0.5 rounded-full border border-stone-700">
                  Multi-Agency Ops
                </span>
              </div>
              <h1 className="text-base sm:text-lg font-bold text-white">
                Admin Triage & Inter-Agency Dispatch Console
              </h1>
            </div>
          </div>

          {/* Tab Navigation Switcher */}
          <div className="flex items-center bg-stone-800/90 p-1 rounded-xl border border-stone-700 text-xs">
            <button
              type="button"
              id="tab-admin-triage"
              onClick={() => setActiveTab('triage')}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center space-x-1.5 transition-colors ${
                activeTab === 'triage'
                  ? 'bg-amber-500 text-stone-950 shadow-xs'
                  : 'text-stone-300 hover:text-white'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>Triage Queue ({filteredReports.length})</span>
            </button>

            <button
              type="button"
              id="tab-admin-analytics"
              onClick={() => setActiveTab('analytics')}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center space-x-1.5 transition-colors ${
                activeTab === 'analytics'
                  ? 'bg-amber-500 text-stone-950 shadow-xs'
                  : 'text-stone-300 hover:text-white'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Analytics & Bottlenecks</span>
            </button>

            <button
              type="button"
              id="tab-admin-heatmap"
              onClick={() => setActiveTab('heatmap')}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center space-x-1.5 transition-colors ${
                activeTab === 'heatmap'
                  ? 'bg-amber-500 text-stone-950 shadow-xs'
                  : 'text-stone-300 hover:text-white'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>Spatial Heatmap</span>
            </button>
          </div>
        </div>

        {/* Agency Filter Bar */}
        <div className="space-y-1.5 pt-0.5">
          <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider flex items-center space-x-1">
            <Building2 className="w-3.5 h-3.5 text-amber-400" />
            <span>Participating Municipal Agency / Dispatch Jurisdiction:</span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {AGENCIES.map((agency) => (
              <button
                key={agency.id}
                type="button"
                onClick={() => setSelectedAgency(agency.id)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                  selectedAgency === agency.id
                    ? 'bg-amber-500 text-stone-950 font-bold shadow-xs'
                    : 'bg-stone-800 text-stone-300 hover:bg-stone-700 border border-stone-700/60'
                }`}
              >
                {agency.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Immediate Emergency Alert Buzzer Banner for Authorities */}
      {emergencyCount > 0 && (
        <div className="bg-red-950/95 border-2 border-red-600 rounded-2xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-white shadow-lg">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-red-600 flex items-center justify-center flex-shrink-0 animate-pulse shadow-md">
              <Flame className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-black uppercase tracking-wider text-red-200">
                  {emergencyCount} CRITICAL EMERGENCY INCIDENT{emergencyCount > 1 ? 'S' : ''} DETECTED
                </span>
                <span className="text-[10px] bg-red-800 text-white px-2 py-0.5 rounded-full font-mono font-bold">
                  PRIORITY 1
                </span>
              </div>
              <p className="text-xs text-red-300">
                Audible industrial alert buzzer rings immediately to warn municipal responders, field authorities, and citizens.
              </p>
            </div>
          </div>
          <button
            type="button"
            id="btn-admin-ring-buzzer"
            onClick={() => ringEmergencyBuzzer()}
            className="px-3.5 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl transition-all flex items-center space-x-1.5 shadow-md active:scale-95 flex-shrink-0 animate-pulse"
            title="Sound Industrial Alert Buzzer"
          >
            <Volume2 className="w-4 h-4" />
            <span>RING ALERT BUZZER 🚨</span>
          </button>
        </div>
      )}

      {/* Main Tab Views */}
      {activeTab === 'analytics' && <AnalyticsDashboardView />}

      {activeTab === 'heatmap' && (
        <div className="space-y-3">
          <div className="bg-white p-3.5 rounded-2xl border border-stone-200 shadow-xs flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-stone-900 flex items-center space-x-1.5">
                <Flame className="w-4 h-4 text-red-600 animate-pulse" />
                <span>Citywide Spatial Density & Bottleneck Heatmap</span>
              </h3>
              <p className="text-[11px] text-stone-500">
                Visual incident concentration across city sectors: Red clusters indicate recurring bottlenecks requiring cross-department intervention.
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-stone-700 bg-stone-100 px-2.5 py-1 rounded-lg">
              {filteredReports.length} Active Pins Plotted
            </span>
          </div>

          <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden h-[540px]">
            <IncidentMap reports={filteredReports} onSelectReport={onSelectReport} />
          </div>
        </div>
      )}

      {activeTab === 'triage' && (
        <div className="space-y-3">
          {/* Triage Search & Multi-Filter Bar */}
          <div className="bg-white p-3.5 rounded-2xl border border-stone-200 shadow-xs space-y-2.5">
            <div className="flex flex-col sm:flex-row gap-2.5">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by ticket #, category, description, address, or neighborhood..."
                  className="w-full text-xs pl-9 pr-4 py-2 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-900"
                />
              </div>

              {/* Status Filter */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="text-xs bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-800 font-medium focus:outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="reported">Reported (Pending Triage)</option>
                <option value="acknowledged">Acknowledged</option>
                <option value="in_progress">In Progress</option>
                <option value="dispatched">Dispatched</option>
                <option value="resolved">Resolved & Closed</option>
                <option value="merged">Merged Duplicates</option>
              </select>

              {/* Severity Filter */}
              <select
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value)}
                className="text-xs bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-800 font-medium focus:outline-none"
              >
                <option value="all">All Severities</option>
                <option value="emergency">Emergency Priority</option>
                <option value="high">High Severity</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>

              {/* Domain Filter */}
              <select
                value={filterDomain}
                onChange={(e) => setFilterDomain(e.target.value as any)}
                className="text-xs bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-800 font-medium focus:outline-none"
              >
                <option value="all">Civic + Safety</option>
                <option value="civic">Civic Only</option>
                <option value="safety">Safety Only</option>
              </select>
            </div>
          </div>

          {/* Bulk Action & Status Update Bar (Activates when items are selected) */}
          <div className="bg-stone-900 text-white p-3 rounded-2xl shadow-sm border border-stone-800 flex flex-wrap items-center justify-between gap-2.5 text-xs">
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={handleSelectAll}
                className="flex items-center space-x-1.5 text-stone-300 hover:text-white font-semibold"
              >
                {selectedReportIds.length > 0 &&
                selectedReportIds.length === filteredReports.length ? (
                  <CheckSquare className="w-4 h-4 text-amber-400" />
                ) : (
                  <Square className="w-4 h-4 text-stone-500" />
                )}
                <span>
                  {selectedReportIds.length === 0
                    ? 'Select All'
                    : `${selectedReportIds.length} Selected`}
                </span>
              </button>

              {selectedReportIds.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedReportIds([])}
                  className="text-[11px] text-stone-400 hover:text-stone-200 underline"
                >
                  Clear Selection
                </button>
              )}
            </div>

            {/* Action Buttons */}
            {selectedReportIds.length > 0 ? (
              <div className="flex flex-wrap items-center gap-2">
                {/* Bulk Status Select */}
                <div className="flex items-center space-x-1">
                  <select
                    value={bulkStatusTarget}
                    onChange={(e) => setBulkStatusTarget(e.target.value as IncidentStatus)}
                    className="bg-stone-800 text-white border border-stone-700 rounded-lg px-2 py-1 text-xs font-semibold focus:outline-none"
                  >
                    <option value="acknowledged">Acknowledge</option>
                    <option value="in_progress">Set In Progress</option>
                    <option value="dispatched">Dispatch Unit</option>
                    <option value="resolved">Mark Resolved</option>
                  </select>
                  <button
                    type="button"
                    onClick={handleExecuteBulkStatus}
                    className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold rounded-lg transition-colors"
                  >
                    Apply Status
                  </button>
                </div>

                {/* Bulk Assign Trigger */}
                <button
                  type="button"
                  onClick={() => setIsBulkAssignOpen(!isBulkAssignOpen)}
                  className="px-2.5 py-1 bg-stone-800 hover:bg-stone-700 text-stone-200 font-semibold rounded-lg border border-stone-700 flex items-center space-x-1"
                >
                  <Truck className="w-3.5 h-3.5 text-blue-400" />
                  <span>Assign Field Crew</span>
                </button>

                {/* Combine Duplicate Pins Button */}
                <button
                  type="button"
                  onClick={handleOpenMergeWithSelected}
                  className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg flex items-center space-x-1 shadow-xs"
                >
                  <GitMerge className="w-3.5 h-3.5 text-white" />
                  <span>Combine Duplicate Pins</span>
                </button>

                {/* Bulk Delete Selected */}
                <button
                  type="button"
                  id="btn-admin-bulk-delete"
                  onClick={() => setPendingBulkDelete(true)}
                  className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg flex items-center space-x-1 shadow-xs transition-all active:scale-95"
                  title="Permanently delete selected incident tickets from system"
                >
                  <Trash2 className="w-3.5 h-3.5 text-white" />
                  <span>Delete Selected ({selectedReportIds.length})</span>
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-2 w-full">
                <div className="text-[11px] text-stone-400">
                  Select one or more tickets to execute bulk status updates, crew dispatches, or duplicate merges.
                </div>
              </div>
            )}
          </div>

          {/* Bulk Assign Drawer (collapsible) */}
          {isBulkAssignOpen && selectedReportIds.length > 0 && (
            <div className="bg-stone-50 border border-stone-300 rounded-2xl p-3.5 space-y-3 text-xs animate-in slide-in-from-top-2">
              <div className="font-bold text-stone-900 flex items-center justify-between">
                <span>Assign {selectedReportIds.length} Selected Reports to Agency & Unit</span>
                <button
                  type="button"
                  onClick={() => setIsBulkAssignOpen(false)}
                  className="text-stone-400 hover:text-stone-600 font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-semibold text-stone-600 block mb-1">
                    Target Agency / Department Queue
                  </label>
                  <select
                    value={bulkAgencyTarget}
                    onChange={(e) => setBulkAgencyTarget(e.target.value)}
                    className="w-full bg-white border border-stone-300 rounded-lg p-2 text-stone-900 font-medium"
                  >
                    {AGENCIES.filter((a) => a.id !== 'all').map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-stone-600 block mb-1">
                    Response Unit / Crew Name
                  </label>
                  <input
                    type="text"
                    value={bulkCrewTarget}
                    onChange={(e) => setBulkCrewTarget(e.target.value)}
                    placeholder="e.g. Asphalt Maintenance Crew #3"
                    className="w-full bg-white border border-stone-300 rounded-lg p-2 text-stone-900"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleExecuteBulkAssign}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors flex items-center space-x-1.5 shadow-xs"
                >
                  <Truck className="w-3.5 h-3.5" />
                  <span>Confirm Inter-Agency Dispatch</span>
                </button>
              </div>
            </div>
          )}

          {/* Triage Incident Table / Queue */}
          <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-stone-100 border-b border-stone-200 text-stone-700 font-bold uppercase tracking-wider text-[10px]">
                    <th className="p-3 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={
                          selectedReportIds.length > 0 &&
                          selectedReportIds.length === filteredReports.length
                        }
                        onChange={handleSelectAll}
                        className="rounded text-amber-600 focus:ring-amber-500"
                      />
                    </th>
                    <th className="p-3">Ticket / Domain</th>
                    <th className="p-3">Issue Title & Category</th>
                    <th className="p-3">Location & Zone</th>
                    <th className="p-3">Severity</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Assigned Agency</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredReports.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-stone-500">
                        No incident tickets match the selected multi-agency filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredReports.map((report) => {
                      const isSelected = selectedReportIds.includes(report.id);
                      const isAi = isAiAutoReport(report);

                      return (
                        <tr
                          key={report.id}
                          className={`hover:bg-stone-50/80 transition-colors ${
                            isSelected ? 'bg-amber-50/60' : ''
                          }`}
                        >
                          {/* Selection Checkbox */}
                          <td className="p-3 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleSelectRow(report.id)}
                              className="rounded text-amber-600 focus:ring-amber-500"
                            />
                          </td>

                          {/* Ticket Number & Domain */}
                          <td className="p-3">
                            <div className="font-mono font-bold text-stone-900 flex items-center space-x-1.5">
                              <span>{report.ticketNumber}</span>
                              {isAi && (
                                <span className="bg-purple-100 text-purple-800 text-[9px] font-bold px-1.5 py-0.2 rounded font-sans flex items-center space-x-0.5 border border-purple-300">
                                  <Sparkles className="w-2.5 h-2.5 text-purple-600" />
                                  <span>AI</span>
                                </span>
                              )}
                              {report.mergedDuplicateIds && report.mergedDuplicateIds.length > 0 && (
                                <span className="bg-indigo-100 text-indigo-800 text-[9px] font-bold px-1.5 py-0.2 rounded font-sans flex items-center space-x-0.5">
                                  <GitMerge className="w-2.5 h-2.5" />
                                  <span>+{report.mergedDuplicateIds.length} merged</span>
                                </span>
                              )}
                            </div>
                            <span
                              className={`text-[10px] font-bold uppercase ${
                                report.domain === 'safety' ? 'text-red-600' : 'text-blue-600'
                              }`}
                            >
                              {report.domain}
                            </span>
                          </td>

                          {/* Title & Category */}
                          <td className="p-3 max-w-xs">
                            <div className="font-bold text-stone-900 truncate">
                              <span className="truncate">{report.title}</span>
                            </div>
                            <div className="text-[11px] text-stone-500 flex items-center space-x-1.5 mt-0.5">
                              <span>{report.categoryName}</span>
                              <span>•</span>
                              <span className="flex items-center space-x-0.5 text-blue-600 font-semibold">
                                <ThumbsUp className="w-3 h-3" />
                                <span>{report.upvotesCount}</span>
                              </span>
                            </div>
                          </td>

                          {/* Location & Zone */}
                          <td className="p-3 max-w-[180px]">
                            <div className="text-stone-800 font-medium truncate">
                              {report.location.address}
                            </div>
                            <div className="text-[10px] text-stone-500">
                              {report.location.neighborhood}
                            </div>
                          </td>

                          {/* Severity */}
                          <td className="p-3">
                            <span
                              className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                report.severity === 'emergency'
                                  ? 'bg-red-600 text-white animate-pulse'
                                  : report.severity === 'high'
                                  ? 'bg-orange-100 text-orange-800'
                                  : 'bg-amber-100 text-amber-900'
                              }`}
                            >
                              {report.severity}
                            </span>
                          </td>

                          {/* Status */}
                          <td className="p-3">
                            <span
                              className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                                report.status === 'resolved'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : report.status === 'in_progress' || report.status === 'dispatched'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-stone-100 text-stone-700'
                              }`}
                            >
                              {report.status.replace('_', ' ')}
                            </span>
                          </td>

                          {/* Assigned Agency */}
                          <td className="p-3 text-[11px] max-w-[160px]">
                            <div className="text-stone-800 font-semibold truncate">
                              {report.assignedDepartment
                                ? report.assignedDepartment
                                    .replace('Department of ', '')
                                    .replace('Municipal ', '')
                                : 'Unassigned'}
                            </div>
                            {report.assignedUnit && (
                              <div className="text-[10px] text-stone-500 font-mono">
                                Unit: {report.assignedUnit}
                              </div>
                            )}
                          </td>

                          {/* Row Action Buttons */}
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end space-x-1">
                              {report.webhookRouting && (
                                <button
                                  type="button"
                                  onClick={() => openWebhookInspector(report)}
                                  title="Inspect Webhook Dispatch"
                                  className="p-1 rounded-md text-blue-600 hover:bg-blue-50 transition-colors"
                                >
                                  <Server className="w-4 h-4" />
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => {
                                  setMergePrimaryReport(report);
                                  setIsMergeModalOpen(true);
                                }}
                                title="Merge duplicate pins into this ticket"
                                className="p-1 rounded-md text-indigo-600 hover:bg-indigo-50 transition-colors"
                              >
                                <GitMerge className="w-4 h-4" />
                              </button>

                              {report.domain === 'civic' && !report.resolutionProof && (
                                <button
                                  type="button"
                                  onClick={() => openResolutionProofModal(report)}
                                  title="Upload resolution proof photo"
                                  className="p-1 rounded-md text-emerald-600 hover:bg-emerald-50 transition-colors"
                                >
                                  <Camera className="w-4 h-4" />
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => onSelectReport(report)}
                                className="px-2 py-1 bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold rounded-md transition-colors text-[11px]"
                              >
                                View
                              </button>

                              {report.imageUrl && (
                                <button
                                  type="button"
                                  id={`btn-admin-delete-image-${report.id}`}
                                  onClick={() => setPendingDeleteImageReport(report)}
                                  title="Authority Action: Delete AI/incident image"
                                  className="p-1 rounded-md text-stone-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                                >
                                  <ImageOff className="w-4 h-4" />
                                </button>
                              )}

                              <button
                                type="button"
                                id={`btn-admin-delete-row-${report.id}`}
                                onClick={() => setPendingDeleteReport(report)}
                                title={isAi ? "Authority Action: Permanently delete AI post" : "Authority Action: Permanently delete incident"}
                                className={
                                  isAi
                                    ? "px-2.5 py-1 bg-purple-50 hover:bg-red-600 text-purple-900 hover:text-white border border-purple-200 hover:border-red-600 font-bold rounded-md transition-all text-[11px] flex items-center space-x-1 shadow-xs active:scale-95"
                                    : "px-2.5 py-1 bg-red-50 hover:bg-red-600 text-red-700 hover:text-white border border-red-200 hover:border-red-600 font-bold rounded-md transition-all text-[11px] flex items-center space-x-1 shadow-xs active:scale-95"
                                }
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>{isAi ? 'Delete AI Post' : 'Delete'}</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* In-App Single Incident Delete Confirmation Modal */}
      {pendingDeleteReport && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-stone-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start space-x-3 text-red-600">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-bold text-stone-900">
                  {isAiAutoReport(pendingDeleteReport) ? 'Permanently Delete AI Post?' : 'Permanently Delete Incident?'}
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Ticket <strong className="font-mono text-stone-800">{pendingDeleteReport.ticketNumber}</strong>
                </p>
              </div>
            </div>

            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs space-y-1.5">
              <div className="font-semibold text-stone-900 truncate">
                {pendingDeleteReport.title}
              </div>
              <div className="text-stone-500 text-[11px] truncate">
                Location: {pendingDeleteReport.location.address}
              </div>
              <div className="text-[11px] text-red-700 bg-red-50 p-2 rounded-lg border border-red-200 mt-2">
                {isAiAutoReport(pendingDeleteReport)
                  ? '⚠️ This AI-reported post will be permanently purged from the cloud database and client caches. It will never reappear.'
                  : '⚠️ This authority action will permanently purge this incident record and all associated media from the database.'}
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-1">
              <button
                type="button"
                onClick={() => setPendingDeleteReport(null)}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold rounded-xl text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                id="btn-confirm-delete-report-modal"
                onClick={() => {
                  const id = pendingDeleteReport.id;
                  deleteReport(id);
                  setPendingDeleteReport(null);
                  setSelectedReportIds((prev) => prev.filter((item) => item !== id));
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs transition-colors flex items-center space-x-1.5 shadow-sm active:scale-95"
              >
                <Trash2 className="w-4 h-4" />
                <span>Permanently Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* In-App Bulk Delete Confirmation Modal */}
      {pendingBulkDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-stone-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start space-x-3 text-red-600">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-stone-900">
                  Delete {selectedReportIds.length} Selected Tickets?
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  This will permanently remove all {selectedReportIds.length} selected incidents from the central system.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-1">
              <button
                type="button"
                onClick={() => setPendingBulkDelete(false)}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold rounded-xl text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                id="btn-confirm-bulk-delete-modal"
                onClick={() => {
                  bulkDeleteReports(selectedReportIds);
                  setSelectedReportIds([]);
                  setPendingBulkDelete(false);
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs transition-colors flex items-center space-x-1.5 shadow-sm active:scale-95"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete {selectedReportIds.length} Tickets</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* In-App Delete Image Confirmation Modal */}
      {pendingDeleteImageReport && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-stone-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start space-x-3 text-amber-600">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                <ImageOff className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-stone-900">
                  Delete Incident Image?
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Ticket <strong className="font-mono">{pendingDeleteImageReport.ticketNumber}</strong>
                </p>
              </div>
            </div>

            <p className="text-xs text-stone-600">
              This authority action will remove the AI/incident image attached to this ticket while retaining the rest of the report.
            </p>

            <div className="flex items-center justify-end space-x-2 pt-1">
              <button
                type="button"
                onClick={() => setPendingDeleteImageReport(null)}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold rounded-xl text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                id="btn-confirm-delete-image-modal"
                onClick={() => {
                  deleteReportImage(pendingDeleteImageReport.id);
                  setPendingDeleteImageReport(null);
                }}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs transition-colors flex items-center space-x-1.5 shadow-sm active:scale-95"
              >
                <ImageOff className="w-4 h-4" />
                <span>Delete Image</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Duplicate Merge Modal Mount */}
      <DuplicateMergeModal
        isOpen={isMergeModalOpen}
        onClose={() => {
          setIsMergeModalOpen(false);
          setMergePrimaryReport(null);
        }}
        primaryReport={mergePrimaryReport}
      />
    </div>
  );
};
