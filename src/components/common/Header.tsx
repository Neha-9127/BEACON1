import React, { useState } from 'react';
import {
  ShieldAlert,
  Building2,
  UserCheck,
  MapPin,
  Plus,
  Smartphone,
  Monitor,
  User,
  LogOut,
  ChevronDown,
  LayoutDashboard,
  Flame,
  GitMerge,
  KeyRound,
  LogIn,
  Shield
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useIncidents } from '../../context/IncidentContext';
import { UserRole } from '../../types';

interface HeaderProps {
  isMobileFrame: boolean;
  onToggleMobileFrame: () => void;
}

export const Header: React.FC<HeaderProps> = ({ isMobileFrame, onToggleMobileFrame }) => {
  const {
    currentRole,
    setRole,
    currentUser,
    isAuthorityLoggedIn,
    openLoginModal,
    setShowOnboardingModal,
    setIsCitizenLoginPageOpen,
    logout
  } = useAuth();
  const {
    setIsReportingModalOpen
  } = useIncidents();
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);

  const getRoleConfig = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return {
          title: 'Admin Triage Command',
          icon: <LayoutDashboard className="w-3.5 h-3.5 text-amber-600" />,
          badgeClass: 'bg-amber-50 text-amber-900 border-amber-300 shadow-xs'
        };
      case 'safety':
        return {
          title: 'Safety Authority',
          icon: <ShieldAlert className="w-3.5 h-3.5 text-red-600" />,
          badgeClass: 'bg-red-50 text-red-700 border-red-200'
        };
      case 'operator':
        return {
          title: 'Municipal Operator',
          icon: <Building2 className="w-3.5 h-3.5 text-blue-600" />,
          badgeClass: 'bg-blue-50 text-blue-700 border-blue-200'
        };
      default:
        return {
          title: 'Citizen Reporter',
          icon: <UserCheck className="w-3.5 h-3.5 text-emerald-600" />,
          badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200'
        };
    }
  };

  const roleConfig = getRoleConfig(currentRole);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200 px-3 sm:px-4 py-2.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
        {/* Brand & App Name: BEACON */}
        <div className="flex items-center space-x-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center font-black text-xs shadow-xs flex-shrink-0 tracking-wider">
            BCN
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-1.5">
              <h1 className="text-sm font-black text-stone-900 truncate tracking-tight uppercase">
                BEACON
              </h1>
            </div>
            <div className="flex items-center space-x-1 text-[11px] text-stone-500 truncate">
              <MapPin className="w-3 h-3 text-red-500 flex-shrink-0" />
              <span className="truncate max-w-[140px] sm:max-w-[200px]">
                {currentUser.anchorLocation?.districtName || 'Metro Central Command'}
              </span>
            </div>
          </div>
        </div>

        {/* Center/Right Controls */}
        <div className="flex items-center space-x-2">
          {/* Quick Admin Triage Toggle Button */}
          {currentRole !== 'admin' ? (
            <button
              type="button"
              id="btn-quick-admin-console"
              onClick={() => setRole('admin')}
              className="text-xs font-bold px-2.5 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-amber-400 border border-stone-800 shadow-xs flex items-center space-x-1.5 transition-all"
              title="Open Unified Multi-Agency Admin Triage Console"
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden md:inline">Admin Triage Console</span>
              <span className="md:hidden">Admin</span>
            </button>
          ) : (
            <button
              type="button"
              id="btn-quick-citizen-feed"
              onClick={() => setRole('citizen')}
              className="text-xs font-bold px-2.5 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-300 shadow-xs flex items-center space-x-1.5 transition-all"
              title="Switch back to Citizen Mobile Feed"
            >
              <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden md:inline">Citizen Feed View</span>
              <span className="md:hidden">Citizen</span>
            </button>
          )}

          {/* Role Switcher Pill */}
          <div className="relative">
            <button
              type="button"
              id="btn-role-switcher"
              onClick={() => setShowRoleDropdown(!showRoleDropdown)}
              className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg border flex items-center space-x-1.5 transition-colors ${roleConfig.badgeClass}`}
            >
              {roleConfig.icon}
              <span className="hidden sm:inline font-bold">{roleConfig.title}</span>
              <ChevronDown className="w-3 h-3" />
            </button>

            {showRoleDropdown && (
              <div className="absolute right-0 mt-1.5 w-60 bg-white rounded-xl shadow-xl border border-stone-200 py-1.5 z-50 text-xs">
                <div className="px-3 py-1 text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                  Switch Operational Role
                </div>

                {/* Admin Console Option */}
                <button
                  type="button"
                  onClick={() => {
                    setRole('admin');
                    setShowRoleDropdown(false);
                  }}
                  className={`w-full px-3 py-2 text-left flex items-center space-x-2 hover:bg-stone-50 transition-colors ${
                    currentRole === 'admin' ? 'bg-amber-50 font-bold text-amber-950' : 'text-stone-700'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <div>
                    <div className="font-bold flex items-center space-x-1">
                      <span>Unified Admin Triage</span>
                      <span className="text-[9px] bg-amber-500 text-stone-950 px-1 py-0.2 rounded font-black">
                        ALL AGENCIES
                      </span>
                    </div>
                    <div className="text-[10px] text-stone-400">Multi-agency console & bulk actions</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setRole('citizen');
                    setShowRoleDropdown(false);
                  }}
                  className={`w-full px-3 py-2 text-left flex items-center space-x-2 hover:bg-stone-50 transition-colors ${
                    currentRole === 'citizen' ? 'bg-emerald-50 font-bold text-emerald-900' : 'text-stone-700'
                  }`}
                >
                  <UserCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <div>
                    <div className="font-semibold">Citizens</div>
                    <div className="text-[10px] text-stone-400">File reports & verify issues</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setRole('operator');
                    setShowRoleDropdown(false);
                  }}
                  className={`w-full px-3 py-2 text-left flex items-center space-x-2 hover:bg-stone-50 transition-colors ${
                    currentRole === 'operator' ? 'bg-blue-50 font-bold text-blue-900' : 'text-stone-700'
                  }`}
                >
                  <Building2 className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <div>
                    <div className="font-semibold">Municipal Operators</div>
                    <div className="text-[10px] text-stone-400">Civic triage & crew dispatch</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setRole('safety');
                    setShowRoleDropdown(false);
                  }}
                  className={`w-full px-3 py-2 text-left flex items-center space-x-2 hover:bg-stone-50 transition-colors ${
                    currentRole === 'safety' ? 'bg-red-50 font-bold text-red-900' : 'text-stone-700'
                  }`}
                >
                  <ShieldAlert className="w-4 h-4 text-red-600 flex-shrink-0" />
                  <div>
                    <div className="font-semibold">Safety Authorities</div>
                    <div className="text-[10px] text-stone-400">Emergency & hazard response</div>
                  </div>
                </button>

                <div className="border-t border-stone-100 mt-1 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setShowOnboardingModal(true);
                      setShowRoleDropdown(false);
                    }}
                    className="w-full px-3 py-1.5 text-left text-[11px] text-stone-600 hover:text-stone-900 hover:bg-stone-50"
                  >
                    Onboarding & Credentials Setup
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Single Unified Login Button */}
          <button
            type="button"
            id="btn-header-login"
            onClick={() => openLoginModal()}
            className={`text-xs font-bold px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-all shadow-xs active:scale-95 ${
              isAuthorityLoggedIn
                ? 'bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300'
                : 'bg-stone-900 hover:bg-black text-white border border-stone-800'
            }`}
            title="Unified Sign-In Portal: Access Citizen or Civic Authority login"
          >
            {isAuthorityLoggedIn ? (
              <>
                <Shield className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                <span className="hidden sm:inline">Authority Active</span>
                <span className="sm:hidden">Auth</span>
              </>
            ) : (
              <>
                <LogIn className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                <span className="hidden sm:inline">Sign In / Login</span>
                <span className="sm:hidden">Login</span>
              </>
            )}
          </button>

          {/* Mobile frame simulator toggle for desktop previewers */}
          <button
            type="button"
            onClick={onToggleMobileFrame}
            title={isMobileFrame ? 'Switch to Full Screen View' : 'Switch to Mobile Device Frame View'}
            className="p-1.5 rounded-lg border border-stone-200 hover:bg-stone-100 text-stone-600 transition-colors hidden md:flex items-center space-x-1 text-xs"
          >
            {isMobileFrame ? (
              <>
                <Monitor className="w-3.5 h-3.5" />
                <span className="hidden lg:inline text-[11px]">Full Width</span>
              </>
            ) : (
              <>
                <Smartphone className="w-3.5 h-3.5" />
                <span className="hidden lg:inline text-[11px]">Mobile Frame</span>
              </>
            )}
          </button>

          {/* Report Button */}
          <button
            type="button"
            id="btn-header-file-report"
            onClick={() => setIsReportingModalOpen(true)}
            className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg shadow-xs flex items-center space-x-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span className="hidden sm:inline">Report Issue</span>
          </button>
        </div>
      </div>
    </header>
  );
};

