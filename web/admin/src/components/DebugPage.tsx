import { useAuth } from '../contexts/AuthContext';

export function DebugPage() {
  const { user, loading } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-2xl mx-auto p-8 bg-white rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-6">Debug Information</h1>
        
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold">Loading State:</h3>
            <p>{loading ? 'Loading...' : 'Not loading'}</p>
          </div>
          
          <div>
            <h3 className="font-semibold">User State:</h3>
            <p>{user ? 'User exists' : 'No user'}</p>
            {user && (
              <pre className="bg-gray-100 p-2 rounded text-sm mt-2">
                {JSON.stringify(user, null, 2)}
              </pre>
            )}
          </div>

          <div>
            <h3 className="font-semibold">Environment Variables:</h3>
            <pre className="bg-gray-100 p-2 rounded text-sm">
{`VITE_USER_POOL_ID: ${import.meta.env.VITE_USER_POOL_ID || 'undefined'}
VITE_USER_POOL_CLIENT_ID: ${import.meta.env.VITE_USER_POOL_CLIENT_ID || 'undefined'}
VITE_API_URL: ${import.meta.env.VITE_API_URL || 'undefined'}`}
            </pre>
          </div>

          <div>
            <h3 className="font-semibold">Current URL:</h3>
            <p>{window.location.href}</p>
          </div>
        </div>
      </div>
    </div>
  );
}