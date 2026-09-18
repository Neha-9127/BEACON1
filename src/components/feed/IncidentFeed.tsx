import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Map as MapIcon,
  List,
  AlertTriangle,
  Building2,
  ShieldAlert,
  SlidersHorizontal,
  Compass,
  ArrowUpDown,
  Radio,
  Sparkles,
  Flame,
  Volume2,
  VolumeX,
  Clock,
  ThumbsUp,
  MapPin
} from 'lucide-react';
import { useIncidents } from '../../context/IncidentContext';
import { useAuth } from '../../context/AuthContext';
import { IncidentCard } from './IncidentCard';
import { IncidentMap } from '../map/IncidentMap';
import { IncidentReport, SeverityLevel, SortMode, RadiusFilter } from '../../types';
import { calculateDistanceKm } from '../../utils/geoRouting';

interface IncidentFeedProps {
  onSelectReport: (report: IncidentReport) => void;
}

export const IncidentFeed: React.FC<IncidentFeedProps> = ({ onSelectReport }) => {
  const {
    reports,
    activeFilterDomain,
    setActiveFilterDomain,
    activeFilterSeverity,
    setActiveFilterSeverity,
    activeFilterStatus,
    setActiveFilterStatus,
    sortMode,
    setSortMode,
    filterRadiusKm,
    setFilterRadiusKm,
    searchQuery,
    setSearchQuery,
    alertRadiusKm,
    setAlertRadiusKm,
    triggerDemoSafetyAlert,
    isSoundMuted,
    setIsSoundMuted
  } = useIncidents();

  const { currentRole, currentUser } = useAuth();
  const [viewMode, setViewMode] = useState<'feed' | 'map'>('feed');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [showRadiusConfig, setShowRadiusConfig] = useState<boolean>(false);

  const userLat = currentUser?.anchorLocation?.lat && currentUser.anchorLocation.lat > 8 && currentUser.anchorLocation.lat < 36
    ? currentUser.anchorLocation.lat
    : 13.0827;
  const userLng = currentUser?.anchorLocation?.lng && currentUser.anchorLocation.lng > 68 && currentUser.anchorLocation.lng < 98
    ? currentUser.anchorLocation.lng
    : 80.2707;

  // Filtered and Sorted Reports
  const filteredAndSortedReports = useMemo(() => {
    // 1. Filter
    const filtered = reports.filter((rep) => {
      // Domain filter
      if (activeFilterDomain !== 'all' && rep.domain !== activeFilterDomain) {
        return false;
      }
      // Severity filter
      if (activeFilterSeverity !== 'all' && rep.severity !== activeFilterSeverity) {
        return false;
      }
      // Status filter
      if (activeFilterStatus === 'active' && rep.status === 'resolved') {
        return false;
      }
      if (activeFilterStatus === 'resolved' && rep.status !== 'resolved') {
        return false;
      }
      // Specific Category filter
      if (selectedCategoryFilter !== 'all' && rep.categoryId !== selectedCategoryFilter) {
        return false;
      }
      // Radius filter
      if (filterRadiusKm !== 'all') {
        const dist = calculateDistanceKm(userLat, userLng, rep.location.lat, rep.location.lng);
        if (dist > filterRadiusKm) {
          return false;
        }
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = rep.title.toLowerCase().includes(q);
        const matchDesc = rep.description.toLowerCase().includes(q);
        const matchTicket = rep.ticketNumber.toLowerCase().includes(q);
        const matchAddress = rep.location.address.toLowerCase().includes(q);
        const matchCat = rep.categoryName.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchTicket && !matchAddress && !matchCat) {
          return false;
        }
      }
      return true;
    });

    // 2. Sort
    return filtered.sort((a, b) => {
      if (sortMode === 'distance') {
        const distA = calculateDistanceKm(userLat, userLng, a.location.lat, a.location.lng);
        const distB = calculateDistanceKm(userLat, userLng, b.location.lat, b.location.lng);
        return distA - distB;
      }

      if (sortMode === 'upvotes') {
        // Priority bumping algorithm: upvotes + severity weight
        const severityWeight = (sev: string) => {
          if (sev === 'emergency') return 30;
          if (sev === 'high') return 15;
          if (sev === 'medium') return 5;
          return 0;
        };
        const scoreA = a.upvotesCount + severityWeight(a.severity);
        const scoreB = b.upvotesCount + severityWeight(b.severity);
        return scoreB - scoreA;
      }

      // Default: recency (newest first)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [
    reports,
    activeFilterDomain,
    activeFilterSeverity,
    activeFilterStatus,
    selectedCategoryFilter,
    filterRadiusKm,
    searchQuery,
    sortMode,
    userLat,
    userLng
  ]);

  const emergencyCount = useMemo(
    () => reports.filter((r) => r.severity === 'emergency' && r.status !== 'resolved').length,
    [reports]
  );

  return (
    <div className="space-y-4">
      {/* Emergency Alert Banner if any emergency hazard is active */}
      {emergencyCount > 0 && (
        <div
          id="active-emergency-banner"
          className="bg-red-600 text-white p-3 rounded-2xl shadow-md flex items-center justify-between animate-pulse cursor-pointer"
          onClick={() => {
            setActiveFilterSeverity('emergency');
            setViewMode('feed');
          }}
        >
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-xs font-black uppercase tracking-wider flex items-center space-x-1.5">
                <span>{emergencyCount} Active Emergency Hazard{emergencyCount > 1 ? 's' : ''} in Vicinity</span>
                <span className="text-[10px] bg-red-950/80 px-1.5 py-0.5 rounded font-mono">
                  {alertRadiusKm} km Geo-Fence
                </span>
              </div>
              <div className="text-[11px] text-red-100 line-clamp-1">
                FCM / APNs instant broadcast armed. Tap to filter priority response items.
              </div>
            </div>
          </div>
          <span className="text-[10px] uppercase font-bold bg-white text-red-700 px-2.5 py-1 rounded-md shadow-xs">
            Filter Emergencies
          </span>
        </div>
      )}

      {/* Safety Alert Engine Broadcast Bar */}
      <div className="bg-gradient-to-r from-stone-900 to-stone-950 text-white rounded-2xl p-3.5 border border-stone-800 shadow-md flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-red-600/20 text-red-400 border border-red-500/30 flex items-center justify-center flex-shrink-0">
            <Radio className="w-4 h-4 text-red-400 animate-pulse" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-white">Safety Alert Engine</span>
              <span className="text-[10px] font-mono bg-stone-800 text-stone-300 px-1.5 py-0.5 rounded border border-stone-700">
                APNs / FCM Geo-Fence: {alertRadiusKm} km
              </span>
            </div>
            <div className="text-[11px] text-stone-400 truncate">
              Anchored to: <strong className="text-stone-300">{currentUser?.anchorLocation?.districtName || 'Downtown Core'}</strong>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2 flex-wrap">
          {/* Quick Radius Selector */}
          <div className="flex items-center space-x-1 bg-stone-800 p-1 rounded-xl border border-stone-700 text-xs">
            <span className="text-[10px] text-stone-400 font-semibold px-1">Alert Radius:</span>
            {[1, 3, 5].map((km) => (
              <button
                key={km}
                type="button"
                onClick={() => setAlertRadiusKm(km)}
                className={`px-2 py-0.5 rounded-lg text-xs font-bold transition-all ${
                  alertRadiusKm === km
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                {km} km
              </button>
            ))}
          </div>

          {/* Sound Mute Toggle */}
          <button
            type="button"
            onClick={() => setIsSoundMuted(!isSoundMuted)}
            title={isSoundMuted ? 'Unmute alert sirens' : 'Mute alert sirens'}
            className="p-1.5 bg-stone-800 hover:bg-stone-700 border border-stone-700 text-stone-300 rounded-xl transition-colors"
          >
            {isSoundMuted ? (
              <VolumeX className="w-4 h-4 text-stone-500" />
            ) : (
              <Volume2 className="w-4 h-4 text-amber-400" />
            )}
          </button>

          {/* Test Push Ping button */}
          <button
            type="button"
            id="btn-test-push-alert"
            onClick={triggerDemoSafetyAlert}
            className="px-2.5 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl flex items-center space-x-1.5 shadow-sm transition-colors"
            title="Trigger simulated instant FCM/APNs emergency broadcast alert"
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Simulate Push Alert</span>
          </button>
        </div>
      </div>

      {/* Filter, Sort, and Search Toolbar */}
      <div className="bg-white rounded-2xl p-3.5 border border-stone-200 shadow-xs space-y-3">
        {/* Top bar: Search + View Mode Switcher */}
        <div className="flex items-center justify-between gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reports, streets, categories, or ticket #..."
              className="w-full text-xs bg-stone-50 border border-stone-200 rounded-xl pl-9 pr-3 py-2 text-stone-900 focus:bg-white focus:ring-2 focus:ring-stone-900 focus:outline-none transition-colors"
            />
          </div>

          <div className="flex items-center space-x-1 bg-stone-100 p-1 rounded-xl border border-stone-200">
            <button
              type="button"
              id="view-mode-feed"
              onClick={() => setViewMode('feed')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-all ${
                viewMode === 'feed'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Feed</span>
            </button>
            <button
              type="button"
              id="view-mode-map"
              onClick={() => setViewMode('map')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-all ${
                viewMode === 'map'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              <MapIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Map</span>
            </button>
          </div>
        </div>

        {/* Second bar: Domain Tabs + Sort Options + Radius Filter */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1 border-t border-stone-100 text-xs">
          {/* Domain tabs */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-0.5">
            <button
              type="button"
              onClick={() => setActiveFilterDomain('all')}
              className={`px-3 py-1 rounded-full font-semibold transition-colors ${
                activeFilterDomain === 'all'
                  ? 'bg-stone-900 text-white'
                  : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
              }`}
            >
              All Reports ({reports.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveFilterDomain('civic')}
              className={`px-3 py-1 rounded-full font-semibold flex items-center space-x-1 transition-colors ${
                activeFilterDomain === 'civic'
                  ? 'bg-blue-600 text-white'
                  : 'bg-blue-50 hover:bg-blue-100 text-blue-800'
              }`}
            >
              <Building2 className="w-3 h-3" />
              <span>Civic Issues</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveFilterDomain('safety')}
              className={`px-3 py-1 rounded-full font-semibold flex items-center space-x-1 transition-colors ${
                activeFilterDomain === 'safety'
                  ? 'bg-red-600 text-white'
                  : 'bg-red-50 hover:bg-red-100 text-red-800'
              }`}
            >
              <ShieldAlert className="w-3 h-3" />
              <span>Safety & Hazards</span>
            </button>
          </div>

          {/* Sorting Controls (Distance, Recency, Upvotes/Urgency) */}
          <div className="flex items-center space-x-2 flex-wrap">
            <div className="flex items-center space-x-1 bg-stone-50 border border-stone-200 rounded-lg p-1 text-xs">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider px-1">
                Sort:
              </span>
              <button
                type="button"
                id="sort-distance"
                onClick={() => setSortMode('distance')}
                className={`px-2 py-0.5 rounded text-xs font-semibold flex items-center space-x-1 transition-colors ${
                  sortMode === 'distance'
                    ? 'bg-stone-900 text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
                title="Sort by nearest distance from your anchor location"
              >
                <Compass className="w-3 h-3" />
                <span>Distance</span>
              </button>

              <button
                type="button"
                id="sort-recency"
                onClick={() => setSortMode('recency')}
                className={`px-2 py-0.5 rounded text-xs font-semibold flex items-center space-x-1 transition-colors ${
                  sortMode === 'recency'
                    ? 'bg-stone-900 text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
                title="Sort by most recent reports first"
              >
                <Clock className="w-3 h-3" />
                <span>Recency</span>
              </button>

              <button
                type="button"
                id="sort-upvotes"
                onClick={() => setSortMode('upvotes')}
                className={`px-2 py-0.5 rounded text-xs font-semibold flex items-center space-x-1 transition-colors ${
                  sortMode === 'upvotes'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
                title="Sort by Upvotes & Community Urgency Bump"
              >
                <ThumbsUp className="w-3 h-3" />
                <span>Upvotes / Urgency</span>
              </button>
            </div>

            {/* Radius Filter Pills */}
            <div className="flex items-center space-x-1 bg-stone-50 border border-stone-200 rounded-lg p-1 text-xs">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider px-1">
                Radius:
              </span>
              {(['all', 1, 3, 5] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setFilterRadiusKm(r)}
                  className={`px-2 py-0.5 rounded text-xs font-semibold transition-colors ${
                    filterRadiusKm === r
                      ? 'bg-stone-900 text-white shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  {r === 'all' ? 'All' : `${r} km`}
                </button>
              ))}
            </div>

            {/* Status Filter */}
            <select
              value={activeFilterStatus}
              onChange={(e) => setActiveFilterStatus(e.target.value as any)}
              className="bg-stone-50 border border-stone-200 rounded-lg px-2 py-1 text-stone-800 font-medium text-xs focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="resolved">Resolved Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content: Map or Card Grid */}
      {viewMode === 'map' ? (
        <div className="h-[500px] sm:h-[580px]">
          <IncidentMap
            reports={filteredAndSortedReports}
            onSelectReport={onSelectReport}
          />
        </div>
      ) : (
        <div>
          {filteredAndSortedReports.length === 0 ? (
            <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-stone-100 text-stone-400 mx-auto flex items-center justify-center">
                <Filter className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-stone-900">No matching incidents found</h4>
                <p className="text-xs text-stone-500 max-w-xs mx-auto mt-1">
                  Try clearing your search query, increasing your distance radius, or adjusting filters.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setActiveFilterDomain('all');
                  setActiveFilterSeverity('all');
                  setActiveFilterStatus('all');
                  setFilterRadiusKm('all');
                  setSearchQuery('');
                }}
                className="px-4 py-2 bg-stone-900 text-white text-xs font-semibold rounded-lg hover:bg-black transition-colors"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-stone-500 px-1 font-medium">
                <span>Showing {filteredAndSortedReports.length} incidents</span>
                <span>
                  Sorted by: <strong className="text-stone-800 uppercase text-[11px] font-bold">{sortMode}</strong>
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredAndSortedReports.map((report) => (
                  <IncidentCard
                    key={report.id}
                    report={report}
                    onOpenDetail={onSelectReport}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
