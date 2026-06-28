import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { ACTIVE_PROFILE_STORAGE_KEY } from '../constants/profileStorage';
import { fetchProfiles, type Profile } from '../services/api';

type ProfileContextValue = {
  profiles: Profile[];
  activeProfileId: number | null;
  setActiveProfileId: (id: number) => void;
  refreshProfiles: () => Promise<void>;
  loading: boolean;
};

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeProfileId, setActiveProfileIdState] = useState<number | null>(() => {
    const raw = localStorage.getItem(ACTIVE_PROFILE_STORAGE_KEY);
    return raw ? Number(raw) : null;
  });
  const [loading, setLoading] = useState(true);

  const refreshProfiles = useCallback(async () => {
    const { data } = await fetchProfiles();
    setProfiles(data);
    if (data.length === 0) {
      setActiveProfileIdState(null);
      localStorage.removeItem(ACTIVE_PROFILE_STORAGE_KEY);
      return;
    }
    const stored = localStorage.getItem(ACTIVE_PROFILE_STORAGE_KEY);
    const storedId = stored ? Number(stored) : null;
    const valid = storedId != null && data.some((p) => p.id === storedId);
    const nextId = valid ? storedId! : data[0].id;
    setActiveProfileIdState(nextId);
    localStorage.setItem(ACTIVE_PROFILE_STORAGE_KEY, String(nextId));
  }, []);

  useEffect(() => {
    refreshProfiles()
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [refreshProfiles]);

  const setActiveProfileId = useCallback((id: number) => {
    setActiveProfileIdState(id);
    localStorage.setItem(ACTIVE_PROFILE_STORAGE_KEY, String(id));
  }, []);

  const value = useMemo(
    () => ({ profiles, activeProfileId, setActiveProfileId, refreshProfiles, loading }),
    [profiles, activeProfileId, setActiveProfileId, refreshProfiles, loading],
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile must be used within ProfileProvider');
  return ctx;
}