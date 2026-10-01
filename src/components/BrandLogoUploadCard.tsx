import React, { useRef, useState } from 'react';
import { Upload, Check, Image, AlertCircle, RefreshCw } from 'lucide-react';
import { useBrandLogo } from '../context/LogoContext';

export const BrandLogoUploadCard: React.FC = () => {
  const { logoUrl, hasLogo, isUploading, uploadError, uploadLogoFile } = useBrandLogo();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [justUploaded, setJustUploaded] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const success = await uploadLogoFile(file);
      if (success) {
        setJustUploaded(true);
        setTimeout(() => setJustUploaded(false), 3000);
      }
    }
  };

  return (
    <section className="bg-white rounded-3xl border border-slate-200/90 p-4 sm:p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] space-y-3.5 transition-all">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={handleFileChange}
        className="hidden"
      />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#070e24] text-[#00e5a3] flex items-center justify-center shrink-0 border border-slate-800">
            <Image className="w-4 h-4 stroke-[2.2]" />
          </div>
          <div>
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-[#070e24]">
              Brand Logo
            </h2>
            <p className="text-[11px] text-slate-400 font-medium">
              {hasLogo ? 'Official artwork active across app' : 'Upload approved CHECK logo artwork'}
            </p>
          </div>
        </div>

        {hasLogo && (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200/80 uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00e5a3]" />
            Active
          </span>
        )}
      </div>

      {hasLogo && logoUrl ? (
        <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/80 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-xl bg-[#070e24] p-0.5 border border-slate-800/40 shrink-0 overflow-hidden flex items-center justify-center shadow-xs">
              <img
                src={logoUrl}
                alt="Active CHECK Logo"
                className="w-full h-full object-contain rounded-lg"
              />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-slate-900 block truncate">
                CHECK / Check Before You Buy
              </span>
              <span className="text-[11px] text-teal-700 font-semibold flex items-center gap-1 mt-0.5">
                <Check className="w-3 h-3 text-[#00e5a3] stroke-[3]" />
                {justUploaded ? 'Logo updated successfully!' : 'Displayed in header & views'}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200 shadow-2xs transition-colors shrink-0 flex items-center gap-1.5 active:scale-95"
          >
            <RefreshCw className={`w-3 h-3 ${isUploading ? 'animate-spin' : ''}`} />
            <span>Re-upload</span>
          </button>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-300 hover:border-[#00e5a3] bg-slate-50/70 hover:bg-teal-50/20 rounded-2xl p-5 text-center cursor-pointer transition-all group"
        >
          <div className="w-10 h-10 rounded-2xl bg-[#070e24] text-[#00e5a3] flex items-center justify-center mx-auto mb-2 border border-slate-800 group-hover:scale-105 transition-transform shadow-xs">
            <Upload className="w-5 h-5 stroke-[2.2]" />
          </div>
          <span className="text-xs font-bold text-slate-900 block">
            {isUploading ? 'Uploading and saving logo…' : 'Tap to upload official CHECK logo'}
          </span>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            Select your uploaded logo file (PNG, JPG, WebP)
          </span>

          <div className="mt-3">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#070e24] hover:bg-[#0c183a] text-white text-xs font-bold shadow-xs transition-colors"
            >
              <Upload className="w-3.5 h-3.5 text-[#00e5a3]" />
              <span>Select Logo File</span>
            </button>
          </div>
        </div>
      )}

      {uploadError && (
        <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
          <span>{uploadError}</span>
        </div>
      )}
    </section>
  );
};
