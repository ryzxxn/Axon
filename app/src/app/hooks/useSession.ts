// src/hooks/useSession.js
import { useState, useEffect } from 'react';
import Cookies from 'js-cookie';

const useSession = () => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSession = async () => {
      const sessionToken = Cookies.get('session-token');
      if (sessionToken) {
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/session`, {
            credentials: 'include',
          });
          const data = await response.json();
          setSession(data);
        } catch (error) {
          console.error('Error fetching session:', error);
        }
      }
      setLoading(false);
    };

    fetchSession();
  }, []);

  return { session, loading };
};

export default useSession;
