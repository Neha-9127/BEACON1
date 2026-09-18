import React, { useState } from 'react';
import { X, ChevronRight, ChevronLeft, Check, AlertCircle, Sparkles, Building2, Shield, Radio } from 'lucide-react';
import { useIncidents } from '../../context/IncidentContext';
import { useAuth } from '../../context/AuthContext';
import { CategorySelector } from './CategorySelector';
import { CameraCapture } from './CameraCapture';
import { AudioRecorder } from './AudioRecorder';
import { GpsPinPicker } from './GpsPinPicker';
import { IncidentDomain, SeverityLevel, ExifMetadata, AudioNote } from '../../types';
import { getCategoryById } from '../../config/categories';
import { resolveChennaiAuthorityRouting, formatDistance } from '../../utils/geoRouting';

export const IncidentReportModal: React.FC = () => {
  const { isReportingModalOpen, setIsReportingModalOpen, addReport } = useIncidents();
  const { currentUser } = useAuth();

  // Wizard steps: 1: Classification & Privacy -> 2: Media & Voice Notes -> 3: Precise Map Pin -> 4: Review
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Form State
  const [domain, setDomain] = useState<IncidentDomain>('civic');
  const [categoryId, setCategoryId] = useState<string>('potholes');
  const [subcategory, setSubcategory] = useState<string>('Deep Pothole (>15cm)');
  const [isAnonymous, setIsAnonymous] = useState<boolean>(false);
  const [isImmediateDanger, setIsImmediateDanger] = useState<boolean>(false);

  // Media
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);
  const [videoUrl, setVideoUrl] = useState<string | undefined>(undefined);
  const [videoDurationSeconds, setVideoDurationSeconds] = useState<number | undefined>(undefined);
  const [exifData, setExifData] = useState<ExifMetadata | undefined>(undefined);
  const [audioNote, setAudioNote] = useState<AudioNote | undefined>(undefined);

  // Location & Geocoding
  type ProximityZoneType = 'school' | 'hospital' | 'transit_hub' | 'residential' | 'commercial' | 'general';
  const [location, setLocation] = useState<{
    lat: number;
    lng: number;
    address: string;
    neighborhood: string;
    proximityZone: ProximityZoneType;
  }>({
    lat: currentUser.anchorLocation?.lat && currentUser.anchorLocation.lat > 8 && currentUser.anchorLocation.lat < 36 ? currentUser.anchorLocation.lat : 13.0567,
    lng: currentUser.anchorLocation?.lng && currentUser.anchorLocation.lng > 68 && currentUser.anchorLocation.lng < 98 ? currentUser.anchorLocation.lng : 80.2524,
    address: '742 Anna Salai, Thousand Lights',
    neighborhood: currentUser.anchorLocation?.districtName || 'Central Chennai & Anna Salai (Zone 9)',
    proximityZone: 'transit_hub'
  });

  // Severity & Notes
  const [severity, setSeverity] = useState<SeverityLevel>('high');
  const [severityReason, setSeverityReason] = useState<string>(
    'Base category (Potholes) starts at MEDIUM • Proximity indicator: Near Major Transit Hub (+1 level)'
  );
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  if (!isReportingModalOpen) return null;

  const currentCategory = getCategoryById(categoryId);

  const handleMediaCaptured = (img: string, exif: ExifMetadata) => {
    setImageUrl(img);
    setExifData(exif);
    // Optionally update lat/lng from EXIF
    setLocation((prev) => ({
      ...prev,
      lat: exif.originalGps.lat,
      lng: exif.originalGps.lng
    }));
  };

  const handleVideoCaptured = (vid: string, durationSec: number) => {
    setVideoUrl(vid);
    setVideoDurationSeconds(durationSec);
  };

  const handleClearMedia = () => {
    setImageUrl(undefined);
    setExifData(undefined);
  };

  const handleClearVideo = () => {
    setVideoUrl(undefined);
    setVideoDurationSeconds(undefined);
  };

  const handleNextStep = () => {
    setValidationError(null);
    if (currentStep === 1) {
      if (!categoryId) {
        setValidationError('Please select an incident category.');
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!imageUrl && !videoUrl) {
        setValidationError('Media evidence is required. Please capture a photo or record an instant video from your device.');
        return;
      }
      // Description is optional per user preference
      setCurrentStep(3);
    } else if (currentStep === 3) {
      setCurrentStep(4);
    }
  };

  const handleSubmitReport = async () => {
    setIsSubmitting(true);
    const finalTitle =
      title.trim() || `${currentCategory?.name || 'Incident'}: ${subcategory}`;

    await addReport({
      domain,
      categoryId,
      categoryName: currentCategory?.name || 'Community Incident',
      subcategory,
      title: finalTitle,
      description: description.trim() || 'Visual evidence captured via live camera inspection.',
      severity,
      severityReason,
      autoSeveritySuggested: severity,
      status: 'reported',
      location: {
        lat: location.lat,
        lng: location.lng,
        address: location.address,
        neighborhood: location.neighborhood,
        proximityZone: location.proximityZone
      },
      imageUrl,
      videoUrl,
      videoDurationSeconds,
      exifData,
      audioNote,
      isAnonymous,
      reporterId: isAnonymous ? `usr-anon-${Date.now().toString().slice(-4)}` : currentUser.id,
      reporterName: isAnonymous ? 'Anonymous Citizen (Identity Protected)' : currentUser.name,
      reporterPhoneMasked: currentUser.phone ? `+1 (555) ***-${currentUser.phone.slice(-4)}` : undefined,
      assignedDepartment: currentCategory?.departmentTarget
    });

    setIsSubmitting(false);
    setIsReportingModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs overflow-y-auto">
      <div
        id="incident-reporting-modal"
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden my-auto max-h-[92vh] flex flex-col"
      >
        {/* Modal Header */}
        <div className="px-4 py-3 bg-stone-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <h3 className="text-sm font-bold tracking-tight">
              Unified Incident Reporting Engine
            </h3>
          </div>
          <button
            type="button"
            id="btn-close-reporting-modal"
            onClick={() => setIsReportingModalOpen(false)}
            className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Wizard Stepper Progress */}
        <div className="bg-stone-100 border-b border-stone-200 px-4 py-2 flex items-center justify-between text-xs">
          {[
            { step: 1, label: 'Categorize' },
            { step: 2, label: 'Media & EXIF' },
            { step: 3, label: 'GPS Pin' },
            { step: 4, label: 'Review' }
          ].map((item) => (
            <div
              key={item.step}
              className={`flex items-center space-x-1 font-medium ${
                currentStep === item.step
                  ? 'text-stone-900 font-bold'
                  : currentStep > item.step
                  ? 'text-emerald-700'
                  : 'text-stone-400'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                  currentStep === item.step
                    ? 'bg-stone-900 text-white'
                    : currentStep > item.step
                    ? 'bg-emerald-600 text-white'
                    : 'bg-stone-300 text-stone-600'
                }`}
              >
                {currentStep > item.step ? <Check className="w-3 h-3" /> : item.step}
              </div>
              <span className="hidden sm:inline">{item.label}</span>
            </div>
          ))}
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
          {validationError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
              <span>{validationError}</span>
            </div>
          )}

          {/* STEP 1: Classification, Anonymity & Smart Severity */}
          {currentStep === 1 && (
            <CategorySelector
              selectedDomain={domain}
              onDomainChange={setDomain}
              selectedCategoryId={categoryId}
              onCategoryChange={setCategoryId}
              selectedSubcategory={subcategory}
              onSubcategoryChange={setSubcategory}
              isAnonymous={isAnonymous}
              onAnonymousChange={setIsAnonymous}
              proximityZone={location.proximityZone}
              severity={severity}
              onSeverityChange={(sev, reason) => {
                setSeverity(sev);
                setSeverityReason(reason);
              }}
              isImmediateDanger={isImmediateDanger}
              onImmediateDangerChange={setIsImmediateDanger}
            />
          )}

          {/* STEP 2: Camera Capture + Automated EXIF + Audio Note + Description */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <CameraCapture
                currentImageUrl={imageUrl}
                currentVideoUrl={videoUrl}
                currentVideoDuration={videoDurationSeconds}
                currentExif={exifData}
                currentGps={{ lat: location.lat, lng: location.lng }}
                onMediaCaptured={handleMediaCaptured}
                onVideoCaptured={handleVideoCaptured}
                onClearMedia={handleClearMedia}
                onClearVideo={handleClearVideo}
              />

              <AudioRecorder
                audioNote={audioNote}
                onChange={setAudioNote}
              />

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-stone-700">
                    Incident Description
                  </label>
                  <span className="text-[10px] font-semibold text-stone-500 bg-stone-100 px-2 py-0.5 rounded-full border border-stone-200">
                    Optional
                  </span>
                </div>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional: Provide extra context, landmarks, or notes (you may leave this blank)..."
                  rows={2}
                  className="w-full text-xs bg-white border border-stone-300 rounded-lg p-2.5 text-stone-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* STEP 3: Interactive GPS Pin Positioning & Proximity */}
          {currentStep === 3 && (
            <GpsPinPicker
              location={location}
              onChangeLocation={setLocation}
            />
          )}

          {/* STEP 4: Review & Final Audit Verification */}
          {currentStep === 4 && (
            <div className="space-y-3">
              <div className="p-3 bg-stone-900 text-stone-100 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-stone-400">
                    Summary Verification
                  </span>
                  <span
                    className={`text-[11px] font-extrabold uppercase px-2 py-0.5 rounded ${
                      severity === 'emergency'
                        ? 'bg-red-500 text-white'
                        : severity === 'high'
                        ? 'bg-orange-500 text-white'
                        : 'bg-amber-400 text-black'
                    }`}
                  >
                    {severity} Priority
                  </span>
                </div>

                <div className="text-sm font-bold text-white">
                  {currentCategory?.name}: {subcategory}
                </div>

                <p className="text-xs text-stone-300">
                  {description || 'No additional note provided.'}
                </p>

                <div className="pt-2 border-t border-stone-800 text-[11px] text-stone-400 space-y-1">
                  <div>
                    <strong className="text-stone-300">Target Dispatch:</strong>{' '}
                    {currentCategory?.departmentTarget}
                  </div>
                  <div>
                    <strong className="text-stone-300">Location:</strong> {location.address} (
                    {location.lat}°, {location.lng}°)
                  </div>
                  <div>
                    <strong className="text-stone-300">Privacy Status:</strong>{' '}
                    {isAnonymous ? (
                      <span className="text-emerald-400 font-semibold">
                        Shielded Anonymously (Citizen ID Masked)
                      </span>
                    ) : (
                      <span>Verified Public Account ({currentUser.name})</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Automated Chennai Authority Notification Routing Preview */}
              {(() => {
                const authorityPreview = resolveChennaiAuthorityRouting(
                  location.lat,
                  location.lng,
                  categoryId,
                  currentCategory?.name || 'Incident',
                  severity,
                  domain
                );
                return (
                  <div className="p-3 bg-stone-900 border border-stone-800 rounded-xl text-xs space-y-2">
                    <div className="flex items-center justify-between pb-1.5 border-b border-stone-800">
                      <span className="font-bold text-[11px] text-amber-400 uppercase tracking-wider flex items-center space-x-1.5">
                        <Radio className="w-3.5 h-3.5 animate-pulse text-amber-400" />
                        <span>Automated Authority Notification Routing</span>
                      </span>
                      <span className="text-[10px] text-stone-400 font-mono">
                        GPS Proximity Matrix
                      </span>
                    </div>

                    <div className="space-y-2">
                      {/* Municipal Corporation Dispatch */}
                      <div className="flex items-start space-x-2 bg-stone-950 p-2 rounded-lg border border-stone-800">
                        <Building2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-stone-200 truncate">
                              {authorityPreview.nearestMunicipalOffice.name}
                            </span>
                            <span className="text-emerald-400 font-bold font-mono text-[11px] ml-2">
                              {formatDistance(authorityPreview.nearestMunicipalOffice.distanceKm)}
                            </span>
                          </div>
                          <div className="text-[10px] text-stone-400 mt-0.5">
                            {authorityPreview.nearestMunicipalOffice.zone} • {authorityPreview.nearestMunicipalOffice.contactOfficer}
                          </div>
                        </div>
                      </div>

                      {/* Greater Chennai Police Station Dispatch */}
                      <div className="flex items-start space-x-2 bg-stone-950 p-2 rounded-lg border border-stone-800">
                        <Shield className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-stone-200 truncate">
                              {authorityPreview.nearestPoliceStation.name}
                            </span>
                            <span className="text-blue-400 font-bold font-mono text-[11px] ml-2">
                              {formatDistance(authorityPreview.nearestPoliceStation.distanceKm)}
                            </span>
                          </div>
                          <div className="text-[10px] text-stone-400 mt-0.5">
                            Station Code: {authorityPreview.nearestPoliceStation.stationCode} • {authorityPreview.nearestPoliceStation.shoOfficer}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* EXIF, Video and Audio indicator badges */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900">
                  <div className="font-semibold flex items-center space-x-1">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Photo Verified</span>
                  </div>
                  <div className="text-[10px] text-emerald-700 mt-0.5 truncate">
                    {imageUrl ? 'Hardware EXIF Attached' : 'No photo'}
                  </div>
                </div>

                <div className="p-2 bg-red-50 border border-red-200 rounded-lg text-red-900">
                  <div className="font-semibold flex items-center space-x-1">
                    <Check className="w-3.5 h-3.5 text-red-600" />
                    <span>Instant Video</span>
                  </div>
                  <div className="text-[10px] text-red-700 mt-0.5 truncate">
                    {videoUrl ? `${videoDurationSeconds || 5}s Recorded Video` : 'No video attached'}
                  </div>
                </div>

                <div className="p-2 bg-stone-50 border border-stone-200 rounded-lg text-stone-800 col-span-2 sm:col-span-1">
                  <div className="font-semibold">
                    {audioNote ? 'Voice Memo' : 'Audio Note'}
                  </div>
                  <div className="text-[10px] text-stone-500 mt-0.5 truncate">
                    {audioNote ? `${audioNote.durationSeconds}s recording` : 'None'}
                  </div>
                </div>
              </div>

              {/* Emergency Alert Buzzer Warning Notice */}
              {severity === 'emergency' && (
                <div className="p-3 bg-red-950/90 border-2 border-red-500 rounded-xl text-xs text-red-200 flex items-start space-x-2.5 animate-pulse">
                  <div className="w-7 h-7 rounded-lg bg-red-600 text-white flex items-center justify-center font-bold flex-shrink-0 mt-0.5 shadow-md">
                    🚨
                  </div>
                  <div className="space-y-0.5">
                    <div className="font-black text-white text-xs uppercase tracking-wider flex items-center space-x-1.5">
                      <span>CRITICAL EMERGENCY ALERT TRIGGER</span>
                    </div>
                    <div className="text-[11px] text-red-200 leading-snug">
                      Upon submission, an industrial alert buzzer will immediately ring across all connected citizen terminals and municipal authority dispatch desks.
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="px-4 py-3 bg-stone-100 border-t border-stone-200 flex items-center justify-between">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={() => setCurrentStep((prev) => (prev - 1) as any)}
              className="px-3.5 py-2 text-xs font-semibold text-stone-700 hover:text-stone-900 flex items-center space-x-1"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>
          ) : (
            <div />
          )}

          {currentStep < 4 ? (
            <button
              type="button"
              id="btn-next-step"
              onClick={handleNextStep}
              className="px-4 py-2 bg-stone-900 hover:bg-black text-white text-xs font-bold rounded-lg flex items-center space-x-1 shadow-sm transition-colors"
            >
              <span>Continue</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              id="btn-submit-report"
              disabled={isSubmitting}
              onClick={handleSubmitReport}
              className={`px-5 py-2.5 text-white text-xs font-bold rounded-lg flex items-center space-x-1.5 shadow-md transition-all active:scale-95 ${
                severity === 'emergency'
                  ? 'bg-red-600 hover:bg-red-700 ring-2 ring-red-400 animate-pulse'
                  : 'bg-stone-900 hover:bg-black'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>
                {isSubmitting
                  ? 'Transmitting EXIF Telemetry...'
                  : severity === 'emergency'
                  ? '🚨 Submit Emergency (Buzzer Rings Immediately)'
                  : 'Submit Incident Report'}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
