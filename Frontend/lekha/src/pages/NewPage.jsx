import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api, setAccessToken } from '../services/api';

export default function HomePage() {
  const { accessToken } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  // ✅ Keep API service synced with current access token
  useEffect(() => {
    setAccessToken(accessToken);
  }, [accessToken]);

  // ✅ Example: Fetch protected data
  const fetchUserProfile = async () => {
    setLoading(true);
    try {
      // Token is automatically added to headers
      // If expired, it's automatically refreshed
      const response = await api.get('/profile');
      setData(response.data);
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>Home Page</h1>
      
      <button onClick={fetchUserProfile} disabled={loading}>
        {loading ? 'Loading...' : 'Get My Profile'}
      </button>

      {data && (
        <div>
          <h2>Your Profile:</h2>
          <pre>{JSON.stringify(data, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}