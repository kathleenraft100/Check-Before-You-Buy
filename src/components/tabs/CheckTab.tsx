import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, 
  Link2, 
  Clipboard, 
  Sparkles, 
  X, 
  Upload, 
  Check, 
  ArrowRight, 
  ShieldCheck,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Clock,
  HelpCircle,
  RotateCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckResultsView, ResultVerdict, StructuredAnalysisData } from '../CheckResultsView';
import { ErrorStateCard, ErrorStateType } from '../ErrorStateCard';

export const SOURCES = [
  { id: 'AI', label: 'AI', emoji: '🤖' },
  { id: 'TikTok', label: 'TikTok', emoji: '📱' },
  { id: 'Instagram', label: 'Instagram', emoji: '📸' },
  { id: 'Marketplace', label: 'Marketplace', emoji: '🛒' },
  { id: 'Google', label: 'Google', emoji: '🔎' },
  { id: 'Message', label: 'Message', emoji: '💬' },
  { id: 'Email', label: 'Email', emoji: '📧' },
  { id: 'Website', label: 'Website', emoji: '🌐' },
  { id: 'Other', label: 'Other', emoji: '❓' },
] as const;

export type SourceType = (typeof SOURCES)[number]['id'];
export type InputMode = 'screenshot' | 'link' | 'paste' | 'camera';

interface CheckState {
  mode: InputMode;
  value: string;
  source: SourceType | null;
  fileName?: string;
  previewUrl?: string;
}

// 5-step analysis sequence as specified in PROMPT 6
const ANALYSIS_STEPS = [
  '🔎 Reading the offer…',
  '🧠 Looking for important details…',
  '💰 Checking price signals…',
  '🚩 Looking for red flags…',
  '🛡️ Building your safety checklist…',
];

export const CheckTab: React.FC = () => {
  // Flow steps: 'home' -> 'input' -> 'source' -> 'analyzing' -> 'ready' | 'error'
  const [flowStep, setFlowStep] = useState<'home' | 'input' | 'source' | 'analyzing' | 'ready' | 'error'>('home');
  
  // Selected source category (Preserved across all interactions, can be null if skipped)
  const [selectedSource, setSelectedSource] = useState<SourceType | null>('TikTok');

  // Selected input mode
  const [selectedMode, setSelectedMode] = useState<InputMode>('screenshot');

  // Input states
  const [urlValue, setUrlValue] = useState('');
  const [textValue, setTextValue] = useState('');
  const [uploadedImage, setUploadedImage] = useState<{ name: string; url: string } | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<{ name: string; url: string } | null>(null);

  // Analysis simulation state (PROMPT 6)
  const [analysisStepIndex, setAnalysisStepIndex] = useState(0);
  const [isAnalysisComplete, setIsAnalysisComplete] = useState(false);

  // Ready summary check state
  const [currentCheck, setCurrentCheck] = useState<CheckState | null>(null);

  // Real Gemini analysis data state
  const [analysisResult, setAnalysisResult] = useState<StructuredAnalysisData | null>(null);

  // Error & Edge State management (PROMPT 14)
  const [activeError, setActiveError] = useState<ErrorStateType | null>(null);
  const [customErrorMessage, setCustomErrorMessage] = useState<string | undefined>(undefined);
  const [isTakingTooLong, setIsTakingTooLong] = useState(false);

  // Cancellation and timeout refs
  const abortControllerRef = useRef<AbortController | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Hidden native file/camera inputs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Start check flow from Home
  const handleStartCheck = (initialMode: InputMode = 'screenshot') => {
    setSelectedMode(initialMode);
    setActiveError(null);
    setFlowStep('input');
  };

  // Helper to read and update monthly usage quota
  const getUsageCount = (): number => {
    try {
      const stored = localStorage.getItem('cb_usage_count_v1');
      return stored !== null ? parseInt(stored, 10) : 0;
    } catch {
      return 0;
    }
  };

  const incrementUsageCount = () => {
    try {
      const current = getUsageCount();
      localStorage.setItem('cb_usage_count_v1', String(current + 1));
    } catch {
      // Ignore
    }
  };

  // Validate URL format
  const isValidUrl = (url: string): boolean => {
    if (!url || url.trim().length < 4) return false;
    const trimmed = url.trim();
    if (!trimmed.includes('.')) return false;
    try {
      const parsed = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
      return parsed.hostname.length > 3 && parsed.hostname.includes('.');
    } catch {
      return false;
    }
  };

  // Handle native file selection for Screenshot with base64 data URL and file type validation
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif', 'image/heic'];
      const hasValidExt = /\.(png|jpe?g|webp|gif|heic)$/i.test(file.name);

      if (!validTypes.includes(file.type) && !hasValidExt) {
        setActiveError('unsupported_file');
        setCustomErrorMessage(`"${file.name}" is not a supported image file. Please upload a screenshot in PNG, JPG, or WebP format.`);
        setFlowStep('error');
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        setUploadedImage({ name: file.name, url: base64 });
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle native camera capture with base64 data URL
  const handleCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        setCapturedPhoto({ name: file.name || 'camera_photo.jpg', url: base64 });
      };
      reader.readAsDataURL(file);
    }
  };

  // Validate current input and return specific error if invalid
  const validateCurrentInput = (): ErrorStateType | null => {
    if (selectedMode === 'screenshot') {
      return uploadedImage ? null : 'no_input';
    }
    if (selectedMode === 'link') {
      if (!urlValue.trim()) return 'no_input';
      if (!isValidUrl(urlValue)) return 'invalid_url';
      return null;
    }
    if (selectedMode === 'paste') {
      if (!textValue.trim()) return 'empty_pasted_text';
      if (textValue.trim().length < 5) return 'insufficient_info';
      return null;
    }
    if (selectedMode === 'camera') {
      return capturedPhoto ? null : 'no_input';
    }
    return 'no_input';
  };

  // Check if current input has content to proceed
  const canProceedFromInput = () => {
    return validateCurrentInput() === null;
  };

  // Advance from Input step to Source selection step
  const handleProceedToSource = () => {
    // Check monthly usage limit first (PROMPT 14)
    if (getUsageCount() >= 50) {
      setActiveError('usage_limit');
      setFlowStep('error');
      return;
    }

    const validationError = validateCurrentInput();
    if (validationError) {
      setActiveError(validationError);
      setFlowStep('error');
      return;
    }

    setFlowStep('source');
  };

  // User Cancel Action (PROMPT 14)
  const handleUserCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsTakingTooLong(false);
    setFlowStep('home');
    setCurrentCheck(null);
    setAnalysisResult(null);
    setIsAnalysisComplete(false);
  };

  // Trigger the Analysis Experience (PROMPT 6 + PROMPT 13 + PROMPT 14)
  const handleStartAnalysis = (overrideSource?: SourceType | null) => {
    // Verify monthly usage limit
    if (getUsageCount() >= 50) {
      setActiveError('usage_limit');
      setFlowStep('error');
      return;
    }

    const finalSource = overrideSource !== undefined ? overrideSource : selectedSource;

    let value = '';
    let fileName: string | undefined;
    let previewUrl: string | undefined;

    if (selectedMode === 'screenshot' && uploadedImage) {
      value = uploadedImage.name;
      fileName = uploadedImage.name;
      previewUrl = uploadedImage.url;
    } else if (selectedMode === 'link') {
      value = urlValue.trim();
    } else if (selectedMode === 'paste') {
      value = textValue.trim();
    } else if (selectedMode === 'camera' && capturedPhoto) {
      value = capturedPhoto.name;
      fileName = capturedPhoto.name;
      previewUrl = capturedPhoto.url;
    }

    setCurrentCheck({
      mode: selectedMode,
      value,
      source: finalSource,
      fileName,
      previewUrl,
    });

    // Reset analysis progress and enter analysis state
    setAnalysisStepIndex(0);
    setIsAnalysisComplete(false);
    setAnalysisResult(null);
    setIsTakingTooLong(false);
    setFlowStep('analyzing');

    // Create fresh AbortController for cancel handling
    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Set 11-second timer to detect "analysis taking too long"
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setIsTakingTooLong(true);
    }, 11000);

    // Initiate real Gemini analysis on the server
    fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        inputType: selectedMode,
        content: value,
        imageBase64: previewUrl && previewUrl.startsWith('data:') ? previewUrl : undefined,
        sourceCategory: finalSource,
      }),
      signal: controller.signal,
    })
      .then(async (res) => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        if (!res.ok) {
          const errBody = await res.json().catch(() => ({}));
          throw new Error(errBody.code || 'AI_ANALYSIS_FAILED');
        }
        return res.json();
      })
      .then((data: any) => {
        // Check for specific edge responses from the model
        if (data.unreadable_screenshot) {
          setActiveError('unreadable_screenshot');
          setFlowStep('error');
          return;
        }
        if (data.insufficient_information) {
          setActiveError('insufficient_info');
          setFlowStep('error');
          return;
        }

        setAnalysisResult(data);
        incrementUsageCount();
      })
      .catch((err) => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        if (err.name === 'AbortError') {
          // User cancelled cleanly
          return;
        }
        console.error('Gemini analysis error:', err);

        // Friendly plain-English categorization
        if (!navigator.onLine || err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError')) {
          setActiveError('network_failure');
        } else {
          setActiveError('ai_failure');
        }
        setFlowStep('error');
      });
  };

  // Error Recovery Actions
  const handleErrorPrimaryAction = () => {
    if (activeError === 'ai_failure' || activeError === 'network_failure') {
      if (currentCheck) {
        handleStartAnalysis(currentCheck.source);
      } else {
        setFlowStep('input');
      }
      return;
    }
    if (activeError === 'timeout') {
      setIsTakingTooLong(false);
      return;
    }
    if (activeError === 'usage_limit') {
      // Revisit previous checks in History
      setFlowStep('home');
      setActiveError(null);
      return;
    }
    // Default: Return to input to adjust details
    setFlowStep('input');
    setActiveError(null);
  };

  const handleErrorSecondaryAction = () => {
    if (activeError === 'unsupported_file' || activeError === 'invalid_url') {
      setSelectedMode('paste');
      setFlowStep('input');
      setActiveError(null);
      return;
    }
    if (activeError === 'unreadable_screenshot' || activeError === 'insufficient_info') {
      setSelectedMode('link');
      setFlowStep('input');
      setActiveError(null);
      return;
    }

    if (activeError === 'timeout') {
      handleUserCancel();
      setSelectedMode('paste');
      setFlowStep('input');
      setActiveError(null);
      return;
    }
    if (activeError === 'usage_limit') {
      setFlowStep('home');
      setActiveError(null);
      return;
    }
    // Cancel & start fresh
    handleUserCancel();
    setActiveError(null);
  };

  // Run the sequence timer when in 'analyzing' state
  useEffect(() => {
    if (flowStep !== 'analyzing') return;

    let currentStep = 0;
    const intervalTime = 700; // 700ms per step for a snappy, pleasant pace

    const interval = setInterval(() => {
      currentStep += 1;
      if (currentStep < ANALYSIS_STEPS.length) {
        setAnalysisStepIndex(currentStep);
      } else {
        clearInterval(interval);
        setIsAnalysisComplete(true);
      }
    }, intervalTime);

    return () => clearInterval(interval);
  }, [flowStep]);

  // Transition from Analysis completion to Results
  const handleContinueToResults = () => {
    if (currentCheck && analysisResult) {
      try {
        const stored = localStorage.getItem('cb_check_history_v1');
        const existing = stored ? JSON.parse(stored) : [];
        const finalVerdict: ResultVerdict =
          analysisResult.status === 'LOOKS_REASONABLE'
            ? 'reasonable'
            : analysisResult.status === 'DONT_PAY_YET'
            ? 'dont_pay'
            : 'pause';

        const newItem = {
          id: `hist-${Date.now()}`,
          name: currentCheck.fileName || currentCheck.value || 'Evaluated Online Offer',
          date: 'Just now',
          verdict: finalVerdict,
          source: currentCheck.source,
          inputContent: currentCheck.value,
          previewUrl: currentCheck.previewUrl,
          analysisData: analysisResult,
        };
        localStorage.setItem(
          'cb_check_history_v1',
          JSON.stringify([newItem, ...existing.filter((i: any) => i.id !== newItem.id).slice(0, 19)])
        );
      } catch (e) {
        // Ignore storage write errors
      }
    }
    setFlowStep('ready');
  };

  const handleResetToHome = () => {
    setFlowStep('home');
    setCurrentCheck(null);
    setAnalysisResult(null);
    setAnalysisStepIndex(0);
    setIsAnalysisComplete(false);
  };

  // Helper to format source display
  const getSourceDisplay = (sourceId: SourceType | null) => {
    if (!sourceId) return { emoji: '❓', label: 'Not specified' };
    const found = SOURCES.find((s) => s.id === sourceId);
    return found ? { emoji: found.emoji, label: found.label } : { emoji: '❓', label: sourceId };
  };

  // ---------------------------------------------------------------------------
  // VIEW 1: HOME SCREEN
  // ---------------------------------------------------------------------------
  if (flowStep === 'home') {
    return (
      <div className="space-y-6 pb-8">
        {/* Top Header Section */}
        <section className="pt-2 px-1 space-y-1.5">
          <span className="text-sm font-semibold text-emerald-700 tracking-wide uppercase">
            Before you buy…
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 leading-tight">
            Check it first.
          </h1>
          <p className="text-base text-slate-500 pt-1 leading-relaxed max-w-sm">
            Paste a link, upload a screenshot, or show us the offer.
          </p>
        </section>

        {/* Prominent Primary Button */}
        <section>
          <button
            type="button"
            onClick={() => handleStartCheck('screenshot')}
            className="w-full h-15 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-white font-bold text-base flex items-center justify-center gap-3 shadow-lg shadow-slate-950/15 hover:shadow-xl hover:shadow-slate-950/20 active:scale-[0.985] transition-all border border-slate-800"
          >
            <span className="text-lg">✨</span>
            <span className="tracking-wide">CHECK SOMETHING</span>
          </button>
        </section>

        {/* Three Input Choices */}
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Choose how to share:
            </span>
            <span className="text-xs text-slate-400">Tap to start</span>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            {/* Choice 1: Screenshot */}
            <button
              type="button"
              onClick={() => handleStartCheck('screenshot')}
              className="p-3.5 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-1.5 min-h-[82px] active:scale-95 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-800 border-slate-200/80 shadow-2xs group"
            >
              <span className="text-2xl" role="img" aria-label="camera">📸</span>
              <span className="text-xs font-bold tracking-tight">Screenshot</span>
            </button>

            {/* Choice 2: Link */}
            <button
              type="button"
              onClick={() => handleStartCheck('link')}
              className="p-3.5 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-1.5 min-h-[82px] active:scale-95 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-800 border-slate-200/80 shadow-2xs group"
            >
              <span className="text-2xl" role="img" aria-label="link">🔗</span>
              <span className="text-xs font-bold tracking-tight">Link</span>
            </button>

            {/* Choice 3: Paste */}
            <button
              type="button"
              onClick={() => handleStartCheck('paste')}
              className="p-3.5 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-1.5 min-h-[82px] active:scale-95 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-800 border-slate-200/80 shadow-2xs group"
            >
              <span className="text-2xl" role="img" aria-label="clipboard">📋</span>
              <span className="text-xs font-bold tracking-tight">Paste</span>
            </button>
          </div>
        </section>

        {/* “Where did you find it?” section with selectable chips */}
        <section className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-[0_4px_24px_rgba(0,0,0,0.03)] space-y-3.5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Where did you find it?
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Helps spot platform-specific return traps, drop-ship markups, and fake reviews.
              </p>
            </div>
            {selectedSource && (
              <div className="shrink-0 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/60">
                {getSourceDisplay(selectedSource).emoji} {selectedSource}
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            {SOURCES.map((source) => {
              const isSelected = selectedSource === source.id;
              return (
                <button
                  key={source.id}
                  type="button"
                  onClick={() => setSelectedSource(source.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all active:scale-95 min-h-[38px] flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-slate-900 text-white shadow-xs scale-[1.02]'
                      : 'bg-slate-100/90 text-slate-700 hover:bg-slate-200/80 hover:text-slate-900'
                  }`}
                >
                  <span>{source.emoji}</span>
                  <span>{source.label}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Reassurance banner */}
        <section className="bg-slate-50 rounded-2xl p-4 border border-slate-200/60 text-xs text-slate-500 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Private & safe · No account required</span>
          </span>
          <button
            type="button"
            onClick={() => handleStartCheck('camera')}
            className="text-slate-800 font-bold hover:text-emerald-700 underline underline-offset-2"
          >
            Snap photo
          </button>
        </section>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // VIEW 2: STEP 1 - INPUT CHOOSER
  // ---------------------------------------------------------------------------
  if (flowStep === 'input') {
    return (
      <div className="space-y-5 pb-8 animate-in fade-in duration-150">
        {/* Top Navigation bar */}
        <div className="flex items-center justify-between pt-1">
          <button
            type="button"
            onClick={() => setFlowStep('home')}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 px-2.5 py-1.5 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </button>

          {selectedSource && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-medium">
              <span className="text-slate-400">Source:</span>
              <span className="font-bold text-slate-900">
                {getSourceDisplay(selectedSource).emoji} {selectedSource}
              </span>
            </div>
          )}
        </div>

        {/* Header Title */}
        <div className="px-1">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 block">
            Step 1 of 2
          </span>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 mt-0.5">
            Share the item or deal
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Choose an input format below to check before paying.
          </p>
        </div>

        {/* 3 Main Choices + Secondary Photo Option */}
        <div className="space-y-3">
          {/* Choice 1: Screenshot */}
          <div
            className={`rounded-3xl border transition-all overflow-hidden ${
              selectedMode === 'screenshot'
                ? 'bg-white border-slate-900 shadow-md ring-2 ring-slate-900/5'
                : 'bg-white/80 border-slate-200/90 hover:border-slate-300'
            }`}
          >
            <button
              type="button"
              onClick={() => setSelectedMode('screenshot')}
              className="w-full text-left p-4 sm:p-5 flex items-start gap-3.5"
            >
              <div
                className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 text-xl transition-colors ${
                  selectedMode === 'screenshot'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                📸
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900">
                    Upload Screenshot
                  </h3>
                  {selectedMode === 'screenshot' && (
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                      Selected
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  product page, ad, message, checkout, etc.
                </p>
              </div>
            </button>

            {selectedMode === 'screenshot' && (
              <div className="px-4 pb-4 sm:px-5 sm:pb-5 pt-1 space-y-3 border-t border-slate-100">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                {uploadedImage ? (
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-xl bg-slate-200 overflow-hidden shrink-0 border border-slate-300/80">
                        <img
                          src={uploadedImage.url}
                          alt="Screenshot preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-slate-900 block truncate">
                          {uploadedImage.name}
                        </span>
                        <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                          Screenshot ready
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setUploadedImage(null)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-200 rounded-lg transition-colors"
                      aria-label="Remove screenshot"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-slate-200 hover:border-slate-400 bg-slate-50/70 hover:bg-slate-100/60 rounded-2xl p-5 text-center cursor-pointer transition-colors"
                    >
                      <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1.5" />
                      <span className="text-xs font-bold text-slate-800 block">
                        Tap to choose screenshot image
                      </span>
                      <span className="text-[11px] text-slate-400 mt-0.5 block">
                        Supports PNG, JPG, WebP
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Choice 2: Link */}
          <div
            className={`rounded-3xl border transition-all overflow-hidden ${
              selectedMode === 'link'
                ? 'bg-white border-slate-900 shadow-md ring-2 ring-slate-900/5'
                : 'bg-white/80 border-slate-200/90 hover:border-slate-300'
            }`}
          >
            <button
              type="button"
              onClick={() => setSelectedMode('link')}
              className="w-full text-left p-4 sm:p-5 flex items-start gap-3.5"
            >
              <div
                className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 text-xl transition-colors ${
                  selectedMode === 'link'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                🔗
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900">
                    Paste Link
                  </h3>
                  {selectedMode === 'link' && (
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                      Selected
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  product or store URL.
                </p>
              </div>
            </button>

            {selectedMode === 'link' && (
              <div className="px-4 pb-4 sm:px-5 sm:pb-5 pt-1 space-y-3 border-t border-slate-100">
                <div className="relative">
                  <input
                    type="url"
                    value={urlValue}
                    onChange={(e) => setUrlValue(e.target.value)}
                    placeholder="https://... or store link"
                    className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-3.5 pr-10 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all"
                  />
                  {urlValue && (
                    <button
                      type="button"
                      onClick={() => setUrlValue('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Choice 3: Paste Text */}
          <div
            className={`rounded-3xl border transition-all overflow-hidden ${
              selectedMode === 'paste'
                ? 'bg-white border-slate-900 shadow-md ring-2 ring-slate-900/5'
                : 'bg-white/80 border-slate-200/90 hover:border-slate-300'
            }`}
          >
            <button
              type="button"
              onClick={() => setSelectedMode('paste')}
              className="w-full text-left p-4 sm:p-5 flex items-start gap-3.5"
            >
              <div
                className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 text-xl transition-colors ${
                  selectedMode === 'paste'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                📋
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900">
                    Paste Text
                  </h3>
                  {selectedMode === 'paste' && (
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                      Selected
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  listing, offer, message, or description.
                </p>
              </div>
            </button>

            {selectedMode === 'paste' && (
              <div className="px-4 pb-4 sm:px-5 sm:pb-5 pt-1 space-y-3 border-t border-slate-100">
                <textarea
                  rows={3}
                  value={textValue}
                  onChange={(e) => setTextValue(e.target.value)}
                  placeholder="Paste ad caption, direct message offer, or warranty fine print..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all resize-none"
                />

                <div className="flex items-center justify-end text-[11px]">
                  {textValue && (
                    <button
                      type="button"
                      onClick={() => setTextValue('')}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Secondary Option: Photo */}
          <div
            className={`rounded-3xl border transition-all overflow-hidden ${
              selectedMode === 'camera'
                ? 'bg-white border-slate-900 shadow-md ring-2 ring-slate-900/5'
                : 'bg-white/80 border-slate-200/90 hover:border-slate-300'
            }`}
          >
            <button
              type="button"
              onClick={() => setSelectedMode('camera')}
              className="w-full text-left p-4 sm:p-5 flex items-start gap-3.5"
            >
              <div
                className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 text-xl transition-colors ${
                  selectedMode === 'camera'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                📷
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900">
                    Take a photo
                  </h3>
                  {selectedMode === 'camera' && (
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                      Selected
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Snap an in-store tag, physical packaging, or another screen.
                </p>
              </div>
            </button>

            {selectedMode === 'camera' && (
              <div className="px-4 pb-4 sm:px-5 sm:pb-5 pt-1 space-y-3 border-t border-slate-100">
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleCameraCapture}
                  className="hidden"
                />

                {capturedPhoto ? (
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-xl bg-slate-200 overflow-hidden shrink-0 border border-slate-300/80">
                        <img
                          src={capturedPhoto.url}
                          alt="Camera capture preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-slate-900 block truncate">
                          {capturedPhoto.name}
                        </span>
                        <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                          Photo captured
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCapturedPhoto(null)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-200 rounded-lg transition-colors"
                      aria-label="Remove photo"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      className="w-full h-12 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold text-xs flex items-center justify-center gap-2 transition-colors border border-slate-200/80"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Open Camera & Take Photo</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Advance to Step 2: Source Selection */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleProceedToSource}
            className="w-full h-14 rounded-2xl bg-slate-900 text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-800 active:scale-[0.985] transition-all shadow-md shadow-slate-900/10"
          >
            <span>Next: Where did you find it?</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          
          <p className="text-center text-[11px] text-slate-400 mt-2">
            Paste a link, ad text, or screenshot to check seller legitimacy
          </p>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // VIEW 3: STEP 2 - SOURCE SELECTOR
  // ---------------------------------------------------------------------------
  if (flowStep === 'source') {
    return (
      <div className="space-y-5 pb-8 animate-in fade-in duration-150">
        {/* Top Back bar */}
        <div className="flex items-center justify-between pt-1">
          <button
            type="button"
            onClick={() => setFlowStep('input')}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 px-2.5 py-1.5 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Change input</span>
          </button>

          <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/60">
            Step 2 of 2
          </span>
        </div>

        {/* Input preview summary banner */}
        <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-base shrink-0">
              {selectedMode === 'screenshot' && '📸'}
              {selectedMode === 'link' && '🔗'}
              {selectedMode === 'paste' && '📋'}
              {selectedMode === 'camera' && '📷'}
            </span>
            <span className="truncate font-semibold text-slate-800">
              {selectedMode === 'screenshot' && (uploadedImage?.name || 'Screenshot provided')}
              {selectedMode === 'link' && (urlValue || 'Link provided')}
              {selectedMode === 'paste' && (textValue.slice(0, 38) + (textValue.length > 38 ? '...' : ''))}
              {selectedMode === 'camera' && (capturedPhoto?.name || 'Photo captured')}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setFlowStep('input')}
            className="text-[11px] font-bold text-slate-500 hover:text-slate-900 shrink-0 underline"
          >
            Edit
          </button>
        </div>

        {/* Heading Prompt */}
        <div className="px-1">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 leading-tight">
            Where did you find this?
          </h2>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Selecting where you saw this helps spot platform-specific drop-shipping, return fees, and fake reviews.
          </p>
        </div>

        {/* Chips Grid */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-[0_4px_24px_rgba(0,0,0,0.03)] space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Select platform:
            </span>
            {selectedSource && (
              <button
                type="button"
                onClick={() => setSelectedSource(null)}
                className="text-[11px] font-semibold text-slate-400 hover:text-slate-600"
              >
                Clear selection
              </button>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            {SOURCES.map((source) => {
              const isSelected = selectedSource === source.id;
              return (
                <button
                  key={source.id}
                  type="button"
                  onClick={() => setSelectedSource(isSelected ? null : source.id)}
                  className={`p-3.5 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-1.5 min-h-[76px] active:scale-95 ${
                    isSelected
                      ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-slate-900/10 scale-[1.02]'
                      : 'bg-slate-50/70 hover:bg-slate-100 text-slate-800 border-slate-200/80 hover:border-slate-300'
                  }`}
                >
                  <span className="text-2xl" role="img" aria-label={source.label}>
                    {source.emoji}
                  </span>
                  <span className="text-xs font-bold tracking-tight">
                    {source.label}
                  </span>
                </button>
              );
            })}
          </div>

          <p className="text-[11px] text-slate-400 text-center pt-1">
            Tap a chip to select or switch. No personal or account info is required.
          </p>
        </div>

        {/* Trigger Analysis Experience */}
        <div className="space-y-2.5 pt-2">
          <button
            type="button"
            onClick={() => handleStartAnalysis(selectedSource)}
            className="w-full h-14 rounded-2xl bg-slate-900 text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-800 active:scale-[0.985] transition-all shadow-md shadow-slate-900/10"
          >
            {selectedSource ? (
              <>
                <span>Run Check for {getSourceDisplay(selectedSource).emoji} {selectedSource}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            ) : (
              <>
                <span>Run Pre-Purchase Check</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => handleStartAnalysis(null)}
            className="w-full h-11 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center justify-center transition-colors"
          >
            Continue without selecting a source
          </button>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // VIEW 4: ANALYSIS EXPERIENCE / LOADING SEQUENCE (PROMPT 6)
  // Shows sequence:
  // “🔎 Reading the offer…”
  // “🧠 Looking for important details…”
  // “💰 Checking price signals…”
  // “🚩 Looking for red flags…”
  // “🛡️ Building your safety checklist…”
  // Then: “YOUR CHECK IS READY”
  // ---------------------------------------------------------------------------
  if (flowStep === 'analyzing') {
    return (
      <div className="space-y-6 pb-12 pt-4 animate-in fade-in duration-200">
        {/* Top minimal status bar */}
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Evaluation in progress
          </span>
          <span className="text-xs text-slate-400 font-medium">
            {isAnalysisComplete && analysisResult ? '100%' : `${Math.round(((analysisStepIndex + 1) / ANALYSIS_STEPS.length) * 90)}%`}
          </span>
        </div>

        {/* Main Analysis Card */}
        <section className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-[0_8px_30px_rgba(0,0,0,0.04)] space-y-6">
          {!(isAnalysisComplete && analysisResult) ? (
            <>
              {/* Animated Radar/Pulse Graphic */}
              <div className="flex flex-col items-center justify-center py-4 space-y-3">
                <div className="relative w-20 h-20 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-3xl bg-emerald-100/60 animate-ping opacity-75" />
                  <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-tr from-slate-900 to-slate-800 text-white flex items-center justify-center text-2xl shadow-md">
                    <ShieldCheck className="w-8 h-8 text-emerald-400 stroke-[2.2]" />
                  </div>
                </div>

                <div className="text-center pt-1">
                  <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">
                    Evaluating Purchase
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Analyzing offer signals from {getSourceDisplay(currentCheck?.source ?? null).label}
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-emerald-600 rounded-full"
                  initial={{ width: '10%' }}
                  animate={{
                    width: `${((analysisStepIndex + 1) / ANALYSIS_STEPS.length) * 100}%`,
                  }}
                  transition={{ ease: 'easeOut', duration: 0.4 }}
                />
              </div>

              {/* Sequential Steps List as requested in PROMPT 6 */}
              <div className="space-y-2.5 pt-1">
                {ANALYSIS_STEPS.map((stepText, idx) => {
                  const isPast = idx < analysisStepIndex;
                  const isCurrent = idx === analysisStepIndex;

                  return (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0.5, x: 0 }}
                      animate={{
                        opacity: isCurrent ? 1 : isPast ? 0.8 : 0.35,
                        scale: isCurrent ? 1.01 : 1,
                      }}
                      className={`p-3 rounded-2xl border transition-all flex items-center justify-between ${
                        isCurrent
                          ? 'bg-emerald-50/70 border-emerald-200/90 shadow-2xs'
                          : isPast
                          ? 'bg-slate-50/80 border-slate-150'
                          : 'bg-white border-transparent'
                      }`}
                    >
                      <span
                        className={`text-sm font-semibold tracking-tight ${
                          isCurrent
                            ? 'text-emerald-950 font-bold'
                            : isPast
                            ? 'text-slate-700'
                            : 'text-slate-400'
                        }`}
                      >
                        {stepText}
                      </span>

                      <div className="shrink-0 pl-2">
                        {isPast ? (
                          <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        ) : isCurrent ? (
                          <div className="w-4 h-4 border-2 border-emerald-600/30 border-t-emerald-600 rounded-full animate-spin" />
                        ) : (
                          <div className="w-2 h-2 rounded-full bg-slate-200" />
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Timeout Warning Banner (PROMPT 14 - analysis taking too long) */}
              {isTakingTooLong && (
                <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-200 text-xs text-amber-950 space-y-2 animate-in fade-in duration-200">
                  <div className="flex items-center gap-2 font-bold">
                    <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Analysis taking longer than usual…</span>
                  </div>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    We’re still inspecting merchant terms, hidden rebills, and pricing signals. You can keep waiting or cancel and try text mode.
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsTakingTooLong(false)}
                      className="px-3 py-1.5 rounded-xl bg-amber-200/80 hover:bg-amber-300/80 font-bold text-[11px] text-amber-950 transition-colors"
                    >
                      Keep Waiting
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handleUserCancel();
                        setSelectedMode('paste');
                        setFlowStep('input');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-white border border-amber-300 font-semibold text-[11px] text-amber-900 hover:bg-amber-50 transition-colors"
                    >
                      Cancel & Try Text
                    </button>
                  </div>
                </div>
              )}

              {/* User Cancel Action (PROMPT 14 - user cancels) */}
              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={handleUserCancel}
                  className="text-xs font-semibold text-slate-400 hover:text-slate-700 px-3 py-1.5 rounded-xl hover:bg-slate-100 transition-colors"
                >
                  ✕ Cancel check
                </button>
              </div>

              {/* Transparent Disclaimer as instructed */}
              <p className="text-[11px] text-slate-400 text-center pt-1">
                Gemini 3.8 Intelligence Engine · Multi-point consumer safety evaluation
              </p>
            </>
          ) : (
            /* COMPLETION STATE: “YOUR CHECK IS READY” */
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 28 }}
              className="py-6 text-center space-y-5"
            >
              <div className="w-20 h-20 rounded-3xl bg-emerald-100 text-emerald-700 border-2 border-emerald-200 mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/10">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 stroke-[2.4]" />
              </div>

              <div className="space-y-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200/80 inline-block">
                  Evaluation Finished
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                  YOUR CHECK IS READY
                </h2>
                <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed pt-1">
                  We compiled your pre-purchase findings, potential fine-print flags, and cooling-off recommendations.
                </p>
              </div>

              {/* Review summary teaser */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs text-slate-600 space-y-1.5 text-left max-w-xs mx-auto">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Source:</span>
                  <span className="font-bold text-slate-900">
                    {getSourceDisplay(currentCheck?.source ?? null).emoji} {getSourceDisplay(currentCheck?.source ?? null).label}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Safety Checklist:</span>
                  <span className="font-bold text-emerald-700">Compiled</span>
                </div>
              </div>

              {/* Prominent CTA to continue to results */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleContinueToResults}
                  className="w-full h-14 rounded-2xl bg-slate-900 text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-800 active:scale-[0.985] transition-all shadow-md shadow-slate-900/10"
                >
                  <span>View Your Check Results</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              <p className="text-[11px] text-slate-400">
                Gemini 3.8 Intelligence Engine · Multi-point consumer safety evaluation
              </p>
            </motion.div>
          )}
        </section>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // VIEW 5: ERROR & EDGE STATE VIEW (PROMPT 14)
  // Handles all edge states: no input, unsupported file, unreadable screenshot,
  // empty pasted text, invalid URL, AI failure, network failure, insufficient info,
  // timeout, and usage limit reached.
  // ---------------------------------------------------------------------------
  if (flowStep === 'error' && activeError) {
    return (
      <div className="pt-4 pb-12 animate-in fade-in duration-150">
        <ErrorStateCard
          type={activeError}
          customMessage={customErrorMessage}
          onPrimaryAction={handleErrorPrimaryAction}
          onSecondaryAction={handleErrorSecondaryAction}
        />
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // VIEW 6: STEP 4 - MAIN RESULTS EXPERIENCE (PROMPT 7 + PROMPT 13)
  // ---------------------------------------------------------------------------
  return (
    <CheckResultsView
      sourceCategory={currentCheck?.source ?? null}
      inputContent={currentCheck?.value}
      previewUrl={currentCheck?.previewUrl}
      analysisData={analysisResult}
      onStartNewCheck={handleResetToHome}
      onBackToInput={() => setFlowStep('input')}
    />
  );
};

