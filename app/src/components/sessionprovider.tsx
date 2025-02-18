'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';
import axiosInstance from '@/app/utils/axiosInstance';
import { useRouter } from 'next/navigation';

interface UserData {
    id: string;
    email: string;
    username: string;
}

interface SessionContextValue {
    userData: UserData | null;
    loading: boolean;
    error: string | null;
}

const initialContextValue: SessionContextValue = {
    userData: null,
    loading: true,
    error: null,
};

const SessionContext = createContext<SessionContextValue>(initialContextValue);

export const SessionProvider = ({ children }: { children: React.ReactNode }) => {
    const [userData, setUserData] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const response = await axiosInstance.get('/api/session', {
                    withCredentials: true, // Include cookies in the request
                });
                if (response.status === 200) {
                    const data = response.data;
                    setUserData(data);
                } else if (response.status === 401) {
                    setUserData(null);
                    router.push('/');
                } else {
                    setError('Failed to fetch user data');
                }
            } catch (error: any) {
                setError('Error fetching user data: ' + error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, [router]); // Add `router` to the dependency array

    return (
        <SessionContext.Provider value={{ userData, loading, error }}>
            {children}
        </SessionContext.Provider>
    );
};

export const useSessionContext = (): SessionContextValue => {
    return useContext(SessionContext);
};
