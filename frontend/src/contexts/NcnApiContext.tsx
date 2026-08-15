'use client';

import { NcnVerifierService } from '@solana/ncn-verifier-service';
import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

import { env } from '@/env';

type NcnApiContextValue = {
    ncnApiUrl: string;
    ncnVerifierService: NcnVerifierService;
    setNcnApiUrl: (url: string) => void;
};

const DEFAULT_NCN_API_URL = env.NEXT_PUBLIC_NCN_API_URL;
const STORAGE_KEY = 'ncn-api-url';

const NcnApiContext = createContext<NcnApiContextValue | undefined>(undefined);

const normalizeUrl = (url: string): string => url.replace(/\/$/, '');

function getStoredValue(): string {
    if (typeof window === 'undefined') {
        return DEFAULT_NCN_API_URL;
    }

    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            return normalizeUrl(saved);
        }
    } catch {
        console.error('Error: cannot parse NCN API URL from local storage');
    }

    return DEFAULT_NCN_API_URL;
}

export function NcnApiProvider({ children }: { children: ReactNode }) {
    const [ncnApiUrl, setNcnApiUrlState] = useState(getStoredValue);

    const ncnVerifierService = useMemo(() => new NcnVerifierService(ncnApiUrl), [ncnApiUrl]);

    const setNcnApiUrl = (url: string) => {
        const normalized = normalizeUrl(url);
        setNcnApiUrlState(normalized);
        try {
            localStorage.setItem(STORAGE_KEY, normalized);
        } catch {
            // localStorage can throw in private browsing or when quota is exceeded.
        }
    };

    return (
        <NcnApiContext.Provider value={{ ncnApiUrl, ncnVerifierService, setNcnApiUrl }}>
            {children}
        </NcnApiContext.Provider>
    );
}

export function useNcnApi() {
    const context = useContext(NcnApiContext);
    if (context === undefined) {
        throw new Error('useNcnApi must be used within an NcnApiProvider');
    }
    return context;
}

export { DEFAULT_NCN_API_URL, NcnVerifierService };
