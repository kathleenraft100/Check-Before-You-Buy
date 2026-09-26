import React from 'react';
import { 
  AlertTriangle, 
  WifiOff, 
  Clock, 
  HelpCircle, 
  FileWarning, 
  RefreshCw, 
  ArrowLeft, 
  RotateCcw,
  Sparkles,
  Link2,
  FileText,
  ShieldAlert,
  Inbox
} from 'lucide-react';

export type ErrorStateType = 
  | 'no_input'
  | 'unsupported_file'
  | 'unreadable_screenshot'
  | 'empty_pasted_text'
  | 'invalid_url'
  | 'ai_failure'
  | 'network_failure'
  | 'insufficient_info'
  | 'timeout'
  | 'usage_limit';

interface ErrorStateCardProps {
  type: ErrorStateType;
  customMessage?: string;
  onPrimaryAction: () => void;
  onSecondaryAction?: () => void;
  primaryActionLabel?: string;
  secondaryActionLabel?: string;
}

export const ErrorStateCard: React.FC<ErrorStateCardProps> = ({
  type,
  customMessage,
  onPrimaryAction,
  onSecondaryAction,
  primaryActionLabel,
  secondaryActionLabel,
}) => {
  const getConfig = () => {
    switch (type) {
      case 'no_input':
        return {
          icon: HelpCircle,
          iconBg: 'bg-amber-50 text-amber-600 border-amber-200',
          title: 'Nothing to check yet',
          message: 'Please paste a store link, write down the offer details, or upload a screenshot to start an evaluation.',
          primaryBtn: primaryActionLabel || 'Add an Offer',
          secondaryBtn: secondaryActionLabel,
        };
      case 'unsupported_file':
        return {
          icon: FileWarning,
          iconBg: 'bg-amber-50 text-amber-600 border-amber-200',
          title: 'Unsupported file type',
          message: 'We can only inspect image screenshots. Please upload a PNG, JPG, or WebP image.',
          primaryBtn: primaryActionLabel || 'Choose an Image',
          secondaryBtn: secondaryActionLabel || 'Paste Text Instead',
        };
      case 'unreadable_screenshot':
        return {
          icon: ShieldAlert,
          iconBg: 'bg-amber-50 text-amber-600 border-amber-200',
          title: 'Unreadable screenshot',
          message: 'We couldn’t clearly detect the price, product name, or seller text in this image. Try taking a tighter crop of the checkout or offer section.',
          primaryBtn: primaryActionLabel || 'Upload a Closer Crop',
          secondaryBtn: secondaryActionLabel || 'Paste Store Link',
        };
      case 'empty_pasted_text':
        return {
          icon: FileText,
          iconBg: 'bg-amber-50 text-amber-600 border-amber-200',
          title: 'Text field is empty',
          message: 'Please paste the ad caption, product description, or fine-print terms to evaluate.',
          primaryBtn: primaryActionLabel || 'Paste Offer Text',
          secondaryBtn: secondaryActionLabel || 'Use Sample Text',
        };
      case 'invalid_url':
        return {
          icon: Link2,
          iconBg: 'bg-amber-50 text-amber-600 border-amber-200',
          title: 'Invalid web link',
          message: 'That doesn’t look like a complete store link. Please enter a full address (e.g. store.com/item or https://...).',
          primaryBtn: primaryActionLabel || 'Fix the Link',
          secondaryBtn: secondaryActionLabel || 'Paste Offer Description',
        };
      case 'ai_failure':
        return {
          icon: AlertTriangle,
          iconBg: 'bg-rose-50 text-rose-600 border-rose-200',
          title: 'Evaluation temporarily paused',
          message: 'Our verification engine couldn’t reach the model right now. In keeping with our consumer promise, we never fabricate or guess an analysis.',
          primaryBtn: primaryActionLabel || 'Try Again',
          secondaryBtn: secondaryActionLabel || 'Start Over',
        };
      case 'network_failure':
        return {
          icon: WifiOff,
          iconBg: 'bg-rose-50 text-rose-600 border-rose-200',
          title: 'No internet connection',
          message: 'Please check your Wi-Fi or mobile data connection and try again to evaluate this purchase.',
          primaryBtn: primaryActionLabel || 'Retry Connection',
          secondaryBtn: secondaryActionLabel || 'Back to Home',
        };
      case 'insufficient_info':
        return {
          icon: HelpCircle,
          iconBg: 'bg-amber-50 text-amber-600 border-amber-200',
          title: 'Not enough offer information',
          message: 'We need to see the price, seller name, or return policy to provide a trustworthy check. The provided text or image was too brief to verify safely.',
          primaryBtn: primaryActionLabel || 'Add More Offer Details',
          secondaryBtn: secondaryActionLabel || 'Paste Link Instead',
        };
      case 'timeout':
        return {
          icon: Clock,
          iconBg: 'bg-amber-50 text-amber-600 border-amber-200',
          title: 'Analysis taking longer than usual',
          message: 'Verifying merchant terms and pricing signals is taking longer than expected. You can keep waiting or switch to text mode.',
          primaryBtn: primaryActionLabel || 'Keep Waiting',
          secondaryBtn: secondaryActionLabel || 'Cancel & Try Text',
        };
      case 'usage_limit':
        return {
          icon: Inbox,
          iconBg: 'bg-purple-50 text-purple-600 border-purple-200',
          title: 'Monthly free limit reached',
          message: 'You have completed all 50 free checks for this month! Your free quota resets on the 1st of next month.',
          primaryBtn: primaryActionLabel || 'View Your History',
          secondaryBtn: secondaryActionLabel || 'Reset Demo Quota',
        };
    }
  };

  const config = getConfig();
  const Icon = config.icon;

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 shadow-[0_4px_24px_rgba(0,0,0,0.03)] space-y-5 text-center max-w-md mx-auto animate-in fade-in duration-200">
      {/* Icon Badge */}
      <div className={`w-16 h-16 rounded-3xl ${config.iconBg} border mx-auto flex items-center justify-center text-2xl shadow-xs`}>
        <Icon className="w-8 h-8 stroke-[2.2]" />
      </div>

      {/* Title & Friendly Plain-English Message */}
      <div className="space-y-1.5">
        <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight leading-snug">
          {config.title}
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-sm mx-auto">
          {customMessage || config.message}
        </p>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2 pt-1 max-w-xs mx-auto">
        <button
          type="button"
          onClick={onPrimaryAction}
          className="w-full h-12 rounded-2xl bg-slate-900 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 hover:bg-slate-800 active:scale-[0.985] transition-all shadow-md shadow-slate-900/10"
        >
          <span>{config.primaryBtn}</span>
        </button>

        {config.secondaryBtn && onSecondaryAction && (
          <button
            type="button"
            onClick={onSecondaryAction}
            className="w-full h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
          >
            {config.secondaryBtn}
          </button>
        )}
      </div>

      <div className="pt-1 text-[11px] text-slate-400">
        Check Before You Buy · Plain-English Consumer Protection
      </div>
    </div>
  );
};
