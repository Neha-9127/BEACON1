import React from 'react';
import {
  AlertTriangle,
  BellRing,
  Volume2,
  VolumeX,
  X,
  ChevronRight,
  ShieldAlert,
  Flame,
  Radio
} from 'lucide-react';
import { useIncidents } from '../../context/IncidentContext';
import { testSafetyAlertSiren, playEmergencyAlertBuzzer } from '../../utils/geoRouting';

interface SafetyAlertBannerProps {
  onSelectReportById: (reportId: string) => void;
}

export const SafetyAlertBanner: React.FC<SafetyAlertBannerProps> = ({ onSelectReportById }) => {
  const {
    activePushAlert,
    dismissPushAlert,
    alertRadiusKm,
    isSoundMuted,
    setIsSoundMuted
  } = useIncidents();

  if (!activePushAlert) return null;

  return (
    <div className="fixed top-3 left-3 right-3 sm:left-auto sm:right-4 sm:w-96 z-[1100] animate-in slide-in-from-top-4 duration-300">
      <div
        id="safety-push-alert-card"
        className="bg-stone-900/98 backdrop-blur-md text-white rounded-2xl shadow-2xl border-2 border-red-500/80 p-3.5 space-y-2.5 overflow-hidden"
      >
        {/* APNs / FCM Push Header */}
        <div className="flex items-center justify-between border-b border-stone-800 pb-2">
          <div className="flex items-center space-x-2 min-w-0">
            <div className="w-6 h-6 rounded-lg bg-red-600 flex items-center justify-center flex-shrink-0 animate-pulse">
              <Flame className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-red-400">
                  FCM / APNs Geo-Alert
                </span>
                <span className="text-[9px] bg-red-950 text-red-300 border border-red-800 px-1 rounded font-mono">
                  {alertRadiusKm} km Geo-Fence
                </span>
              </div>
              <div className="text-[11px] font-mono text-stone-400 truncate">
                {activePushAlert.ticketNumber} • {activePushAlert.timestamp}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-1.5 flex-shrink-0">
            <button
              type="button"
              onClick={() => {
                setIsSoundMuted(false);
                playEmergencyAlertBuzzer();
              }}
              title="Ring Loud Emergency Buzzer"
              className="px-2 py-0.5 rounded bg-red-600 hover:bg-red-700 border border-red-500 text-[10px] font-bold text-white flex items-center space-x-1 transition-colors animate-pulse shadow-xs"
            >
              <Volume2 className="w-3 h-3 text-white" />
              <span>BUZZER 🚨</span>
            </button>
            <button
              type="button"
              onClick={() => setIsSoundMuted(!isSoundMuted)}
              title={isSoundMuted ? 'Unmute alert sirens' : 'Mute alert sirens'}
              className="p-1 rounded-md text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
            >
              {isSoundMuted ? (
                <VolumeX className="w-3.5 h-3.5 text-stone-500" />
              ) : (
                <Volume2 className="w-3.5 h-3.5 text-amber-400" />
              )}
            </button>
            <button
              type="button"
              id="btn-dismiss-safety-alert"
              onClick={dismissPushAlert}
              className="p-1 rounded-md text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Alert Content */}
        <div className="space-y-1">
          <div className="flex items-center space-x-1.5 text-xs font-bold text-red-400">
            <Radio className="w-3.5 h-3.5 text-red-500 animate-ping" />
            <span>
              EMERGENCY PROXIMITY ALERT ({activePushAlert.distanceKm.toFixed(1)} km away)
            </span>
          </div>
          <h4 className="text-xs font-bold text-white leading-snug">
            {activePushAlert.title}
          </h4>
          <p className="text-[11px] text-stone-300 line-clamp-2">
            {activePushAlert.address}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="pt-1 flex items-center space-x-2">
          <button
            type="button"
            id="btn-view-emergency-hazard"
            onClick={() => {
              onSelectReportById(activePushAlert.reportId);
              dismissPushAlert();
            }}
            className="flex-1 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg flex items-center justify-center space-x-1.5 transition-colors shadow-xs"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Inspect Hazard Queue</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={dismissPushAlert}
            className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-medium rounded-lg transition-colors"
          >
            Acknowledge
          </button>
        </div>
      </div>
    </div>
  );
};
