import React, { useState } from 'react';
import {
  Camera,
  MapPin,
  ShieldCheck,
  Plus,
  Sparkles,
  Lock,
  ListFilter,
  CheckCircle2,
  Volume2
} from 'lucide-react';
import { useIncidents } from '../../context/IncidentContext';
import { useAuth } from '../../context/AuthContext';
import { IncidentFeed } from '../feed/IncidentFeed';
import { IncidentCard } from '../feed/IncidentCard';
import { IncidentReport } from '../../types';

interface CitizenDashboardProps {
  onSelectReport: (report: IncidentReport) => void;
}

export const CitizenDashboard: React.FC<CitizenDashboardProps> = ({ onSelectReport }) => {
  const { reports, setIsReportingModalOpen, testLoudAlertSound } = useIncidents();
  const { currentUser, openLoginModal } = useAuth();
  const [activeTab, setActiveTab] = useState<'feed' | 'my_reports'>('feed');

  // Filter reports submitted by current citizen
  const myReports = reports.filter(
    (r) => r.reporterId === currentUser.id || (!r.isAnonymous && r.reporterName === currentUser.name)
  );

  return (
    <div className="space-y-4">
      {/* Quick Action Hero Card */}
      <div className="bg-gradient-to-r from-stone-900 to-stone-800 text-white rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded">
                Verified Citizen Portal
              </span>
              <span className="text-xs text-stone-400">Welcome, {currentUser.name}</span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
              Community Incident & Hazard Reporter
            </h2>
            <p className="text-xs text-stone-300 max-w-lg leading-relaxed">
              Report potholes, water leaks, unlit corridors, or active hazards with automated EXIF photo verification, precise GPS map pinning, and voice memos.
            </p>
          </div>

          <div className="flex-shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <button
              type="button"
              id="btn-citizen-open-login"
              onClick={() => openLoginModal('citizen')}
              className="px-3 py-2.5 bg-stone-700/90 hover:bg-stone-600 text-stone-100 border border-stone-600 text-xs font-bold rounded-xl flex items-center justify-center space-x-1.5 transition-all"
              title="Citizen Reporter Sign In & Profile Calibration"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>{currentUser.name === 'Citizen Reporter' ? 'Citizen Sign In' : 'Reporter Profile'}</span>
            </button>

            <button
              type="button"
              id="btn-citizen-test-emergency-buzzer"
              onClick={testLoudAlertSound}
              className="px-3.5 py-2.5 bg-stone-700/80 hover:bg-stone-700 text-red-300 border border-red-500/30 text-xs font-bold rounded-xl flex items-center justify-center space-x-1.5 transition-all active:scale-95"
              title="Test emergency alert buzzer"
            >
              <Volume2 className="w-3.5 h-3.5 text-red-400 animate-pulse" />
              <span>Emergency Buzzer 🚨</span>
            </button>

            <button
              type="button"
              id="btn-citizen-quick-report"
              onClick={() => setIsReportingModalOpen(true)}
              className="px-3.5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl flex items-center justify-center space-x-1.5 shadow-md transition-all active:scale-95"
            >
              <Camera className="w-4 h-4" />
              <span>Report Incident</span>
            </button>
          </div>
        </div>

        {/* Feature Highlights Pill Bar */}
        <div className="pt-2 border-t border-stone-700/80 flex flex-wrap items-center gap-3 text-[11px] text-stone-300">
          <div className="flex items-center space-x-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Automated EXIF Geotags</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <Lock className="w-3.5 h-3.5 text-blue-400" />
            <span>Safety Anonymity Shield</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Smart Severity Engine</span>
          </div>
        </div>
      </div>

      {/* Citizen Tab Switcher: Feed vs My Filings */}
      <div className="flex items-center space-x-2 border-b border-stone-200 pb-2 text-xs">
        <button
          type="button"
          onClick={() => setActiveTab('feed')}
          className={`pb-1 font-bold transition-colors ${
            activeTab === 'feed'
              ? 'text-stone-900 border-b-2 border-stone-900'
              : 'text-stone-400 hover:text-stone-600'
          }`}
        >
          All Community Reports ({reports.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('my_reports')}
          className={`pb-1 font-bold transition-colors ${
            activeTab === 'my_reports'
              ? 'text-stone-900 border-b-2 border-stone-900'
              : 'text-stone-400 hover:text-stone-600'
          }`}
        >
          My Submissions ({myReports.length})
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'feed' ? (
        <IncidentFeed onSelectReport={onSelectReport} />
      ) : (
        <div>
          {myReports.length === 0 ? (
            <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-stone-100 text-stone-400 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-stone-900">No reports submitted yet</h4>
              <p className="text-xs text-stone-500 max-w-xs mx-auto">
                Spot a road pothole, dark alley, or water leak? Submit a report with EXIF evidence.
              </p>
              <button
                type="button"
                onClick={() => setIsReportingModalOpen(true)}
                className="px-4 py-2 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700 transition-colors"
              >
                Submit First Incident Report
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myReports.map((report) => (
                <IncidentCard
                  key={report.id}
                  report={report}
                  onOpenDetail={onSelectReport}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
