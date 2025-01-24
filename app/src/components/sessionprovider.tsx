'use client'
import React, { createContext, useContext, useState, useEffect } from 'react';
import axiosInstance from '@/app/utils/axiosInstance';
import { useRouter } from 'next/navigation';

// Define the initial context value
const initialContextValue = {
    userData: null,
    loading: true,
    error: null,
};

const SessionContext = createContext(initialContextValue);

export const SessionProvider = ({ children }: any) => {
    const [userData, setUserData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<any>(null);
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
                    setUserData({});
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
    }, []); // Use an empty dependency array to ensure this only runs once on mount

    return (
        <SessionContext.Provider value={{ userData, loading, error }}>
            {children}
        </SessionContext.Provider>
    );
};

// Create a custom hook to use the context
export const useSessionContext = () => {
    return useContext(SessionContext);
};