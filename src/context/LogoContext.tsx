import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface LogoContextType {
  logoUrl: string | null;
  hasLogo: boolean;
  isUploading: boolean;
  uploadError: string | null;
  uploadLogoFile: (file: File) => Promise<boolean>;
  clearLogo: () => void;
}

const LogoContext = createContext<LogoContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'cb_official_logo_b64';
const DEFAULT_LOGO_PATH = '/ai-creation-cmuoefa7204m00iu6p6skzg82-1790798010521.jpg';
const FALLBACK_LOGO_PATH = '/check-logo.png';

export const LogoProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [hasLogo, setHasLogo] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Initialize and check logo existence
  useEffect(() => {
    let isMounted = true;

    const initLogo = async () => {
      // 1. Check localStorage first (instant and persistent across server resets)
      try {
        const storedB64 = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (storedB64) {
          if (isMounted) {
            setLogoUrl(storedB64);
            setHasLogo(true);
          }
          // Silently sync to backend to ensure server publicDir has the file too
          fetch('/api/upload-brand-logo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageBase64: storedB64 }),
          }).catch(() => {});
          return;
        }
      } catch (e) {
        console.warn('Could not read logo from localStorage', e);
      }

      // 2. Check if default file exists on server
      try {
        const res = await fetch(DEFAULT_LOGO_PATH, { method: 'HEAD' });
        if (res.ok) {
          if (isMounted) {
            setLogoUrl(DEFAULT_LOGO_PATH);
            setHasLogo(true);
          }
          return;
        }
      } catch {}

      // 3. Check fallback /check-logo.png
      try {
        const res2 = await fetch(FALLBACK_LOGO_PATH, { method: 'HEAD' });
        if (res2.ok) {
          if (isMounted) {
            setLogoUrl(FALLBACK_LOGO_PATH);
            setHasLogo(true);
          }
          return;
        }
      } catch {}

      // 4. Check /api/brand-logo status
      try {
        const res3 = await fetch('/api/brand-logo');
        if (res3.ok) {
          const data = await res3.json();
          if (data.exists && isMounted) {
            setLogoUrl(data.path);
            setHasLogo(true);
          }
        }
      } catch {}
    };

    initLogo();
    return () => {
      isMounted = false;
    };
  }, []);

  const uploadLogoFile = async (file: File): Promise<boolean> => {
    setIsUploading(true);
    setUploadError(null);

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Data = e.target?.result as string;
        if (!base64Data) {
          setIsUploading(false);
          setUploadError('Failed to read image file');
          resolve(false);
          return;
        }

        // Save to localStorage immediately for instant client persistence
        try {
          localStorage.setItem(LOCAL_STORAGE_KEY, base64Data);
        } catch (err) {
          console.warn('Could not save logo to localStorage:', err);
        }

        // Update state immediately
        setLogoUrl(base64Data);
        setHasLogo(true);

        // Upload to server to persist in /public directory
        try {
          const res = await fetch('/api/upload-brand-logo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              imageBase64: base64Data,
              filename: file.name,
            }),
          });
          if (!res.ok) {
            const errJson = await res.json().catch(() => ({}));
            console.warn('Server save warning:', errJson);
          }
        } catch (err: any) {
          console.warn('Network upload to server warning:', err);
        }

        setIsUploading(false);
        resolve(true);
      };

      reader.onerror = () => {
        setIsUploading(false);
        setUploadError('Failed to read file from disk');
        resolve(false);
      };

      reader.readAsDataURL(file);
    });
  };

  const clearLogo = () => {
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    } catch {}
    setLogoUrl(null);
    setHasLogo(false);
  };

  return (
    <LogoContext.Provider
      value={{
        logoUrl,
        hasLogo,
        isUploading,
        uploadError,
        uploadLogoFile,
        clearLogo,
      }}
    >
      {children}
    </LogoContext.Provider>
  );
};

export const useBrandLogo = () => {
  const context = useContext(LogoContext);
  if (!context) {
    throw new Error('useBrandLogo must be used within a LogoProvider');
  }
  return context;
};
