import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { IncidentProvider, useIncidents } from './context/IncidentContext';
import { Header } from './components/common/Header';
import { CitizenDashboard } from './components/citizen/CitizenDashboard';
import { OperatorDashboard } from './components/operator/OperatorDashboard';
import { SafetyAuthorityDashboard } from './components/safety/SafetyAuthorityDashboard';
import { AdminTriageConsole } from './components/admin/AdminTriageConsole';
import { IncidentDetailModal } from './components/feed/IncidentDetailModal';
import { IncidentReportModal } from './components/reporting/IncidentReportModal';
import { UnifiedLoginModal } from './components/auth/UnifiedLoginModal';
import { LiveCivicBackground } from './components/common/LiveCivicBackground';
import { SafetyAlertBanner } from './components/common/SafetyAlertBanner';
import { WebhookInspectorModal } from './components/operator/WebhookInspectorModal';
import { ResolutionProofModal } from './components/operator/ResolutionProofModal';
import { IncidentReport } from './types';
import { Plus, Camera, Wifi, Battery, Signal, CheckCircle2, Trash2, X } from 'lucide-react';

const AppContent: React.FC = () => {
  const { currentRole } = useAuth();
  const {
    reports,
    setIsReportingModalOpen,
    isResolutionProofModalOpen,
    closeResolutionProofModal,
    resolvingReport,
    confirmResolutionWithProof,
    resolvedNotice,
    dismissResolvedNotice
  } = useIncidents();
  const [selectedReport, setSelectedReport] = useState<IncidentReport | null>(null);
  const [isMobileFrame, setIsMobileFrame] = useState<boolean>(false);

  const renderDashboardByRole = () => {
    switch (currentRole) {
      case 'admin':
        return <AdminTriageConsole onSelectReport={setSelectedReport} />;
      case 'operator':
        return <OperatorDashboard onSelectReport={setSelectedReport} />;
      case 'safety':
        return <SafetyAuthorityDashboard onSelectReport={setSelectedReport} />;
      default:
        return <CitizenDashboard onSelectReport={setSelectedReport} />;
    }
  };

  return (
    <div className={`min-h-screen text-stone-900 flex flex-col justify-center items-center relative ${isMobileFrame ? 'py-6 px-4' : ''}`}>
      {/* Responsive Live Civic Background */}
      <LiveCivicBackground />

      {/* Auto-Purge & Stability / Deletion Notification Toast */}
      {resolvedNotice && (
        <div
          className={`fixed top-4 right-4 left-4 sm:left-auto sm:max-w-md z-[100] text-white p-3.5 rounded-2xl shadow-2xl border flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-4 duration-300 ${
            resolvedNotice.ticketNumber.includes('DELETE') || resolvedNotice.title.toLowerCase().includes('delete')
              ? 'bg-red-950 border-red-700/60'
              : 'bg-emerald-950 border-emerald-700/60'
          }`}
        >
          <div className="flex items-center space-x-2.5 min-w-0">
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                resolvedNotice.ticketNumber.includes('DELETE') || resolvedNotice.title.toLowerCase().includes('delete')
                  ? 'bg-red-500/20 text-red-400'
                  : 'bg-emerald-500/20 text-emerald-400'
              }`}
            >
              {resolvedNotice.ticketNumber.includes('DELETE') || resolvedNotice.title.toLowerCase().includes('delete') ? (
                <Trash2 className="w-4 h-4" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
            </div>
            <div className="min-w-0">
              <div
                className={`text-[10px] font-mono uppercase font-bold flex items-center space-x-1 ${
                  resolvedNotice.ticketNumber.includes('DELETE') || resolvedNotice.title.toLowerCase().includes('delete')
                    ? 'text-red-300'
                    : 'text-emerald-300'
                }`}
              >
                <span>
                  {resolvedNotice.ticketNumber.includes('DELETE') || resolvedNotice.title.toLowerCase().includes('delete')
                    ? 'INCIDENT DELETED FROM DATABASE'
                    : 'ISSUE RESOLVED & AUTO-PURGED'}
                </span>
                {!resolvedNotice.title.toLowerCase().includes('delete') && (
                  <span className="bg-emerald-800 text-white text-[9px] px-1 rounded">STABILITY +1</span>
                )}
              </div>
              <div className="text-xs font-semibold text-stone-100 truncate">
                {resolvedNotice.title}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={dismissResolvedNotice}
            className="p-1.5 text-stone-400 hover:text-white rounded-lg transition-colors flex-shrink-0"
            title="Dismiss notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Geo-Fenced Push Alert Notification Banner */}
      <SafetyAlertBanner
        onSelectReportById={(id) => {
          const rep = reports.find((r) => r.id === id);
          if (rep) setSelectedReport(rep);
        }}
      />

      {/* Mobile Frame Container (when toggled on for mobile app simulation) */}
      <div
        className={`w-full transition-all duration-300 ${
          isMobileFrame
            ? 'max-w-[420px] bg-white rounded-[44px] shadow-2xl border-[10px] border-stone-800 overflow-hidden flex flex-col min-h-[850px] max-h-[92vh]'
            : 'max-w-7xl flex-1 flex flex-col bg-white sm:shadow-xs min-h-screen'
        }`}
      >
        {/* Mobile Device Status Bar (only shown in mobile frame mode) */}
        {isMobileFrame && (
          <div className="bg-white px-6 pt-3 pb-1 flex items-center justify-between text-xs text-stone-900 select-none border-b border-stone-100">
            <span className="font-semibold text-[11px] font-mono">9:41</span>
            {/* Dynamic Island / Notch Pill */}
            <div className="w-20 h-4 bg-stone-900 rounded-full mx-auto" />
            <div className="flex items-center space-x-1.5 text-stone-700">
              <Signal className="w-3 h-3" />
              <Wifi className="w-3 h-3" />
              <Battery className="w-3.5 h-3.5" />
            </div>
          </div>
        )}

        {/* Global Navigation Header */}
        <Header
          isMobileFrame={isMobileFrame}
          onToggleMobileFrame={() => setIsMobileFrame(!isMobileFrame)}
        />

        {/* Main App Content Area */}
        <main className="flex-1 p-3 sm:p-5 overflow-y-auto">
          {renderDashboardByRole()}
        </main>

        {/* Mobile Bottom Floating Quick-Report Button */}
        <div className="sticky bottom-3 right-3 left-3 flex justify-end pointer-events-none p-2 sm:hidden z-30">
          <button
            type="button"
            onClick={() => setIsReportingModalOpen(true)}
            className="pointer-events-auto w-13 h-13 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-xl flex items-center justify-center transition-transform active:scale-95"
            title="File Incident Report"
          >
            <Camera className="w-6 h-6" />
          </button>
        </div>

        {/* Modals & Dialogs */}
        <IncidentDetailModal
          report={selectedReport}
          onClose={() => setSelectedReport(null)}
        />
        <IncidentReportModal />
        {/* Single Unified Login Page for Citizen and Authority */}
        <UnifiedLoginModal />
        <WebhookInspectorModal />
        <ResolutionProofModal
          isOpen={isResolutionProofModalOpen}
          onClose={closeResolutionProofModal}
          report={resolvingReport}
          onConfirmResolution={confirmResolutionWithProof}
        />
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <IncidentProvider>
        <AppContent />
      </IncidentProvider>
    </AuthProvider>
  );
}
