import { useState, useEffect } from 'react';
import { OnboardingWizard } from '../components/OnboardingWizard';
import { useApi } from '../hooks/useApi';
import type { Practice } from '@hotdoc-alt/models';

export function Practices() {
  const [practices, setPractices] = useState<Practice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWizard, setShowWizard] = useState(false);
  const [error, setError] = useState('');
  const api = useApi();

  useEffect(() => {
    loadPractices();
  }, []);

  const loadPractices = async () => {
    try {
      setLoading(true);
      const response = await api.getPractices();
      setPractices(response.practices || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load practices');
    } finally {
      setLoading(false);
    }
  };

  const handlePracticeCreated = (practice: Practice) => {
    setPractices(prev => [...prev, practice]);
    setShowWizard(false);
  };

  if (showWizard) {
    return (
      <OnboardingWizard
        onComplete={handlePracticeCreated}
        onCancel={() => setShowWizard(false)}
      />
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Practices</h1>
          <p className="mt-2 text-gray-600">
            Manage your healthcare practices and locations
          </p>
        </div>
        <button
          onClick={() => setShowWizard(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium"
        >
          Add New Practice
        </button>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : practices.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto h-12 w-12 text-gray-400">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h3 className="mt-4 text-lg font-medium text-gray-900">No practices yet</h3>
          <p className="mt-2 text-gray-500">Get started by creating your first practice.</p>
          <button
            onClick={() => setShowWizard(true)}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium"
          >
            Create First Practice
          </button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {practices.map((practice) => (
            <div key={practice.practiceId} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {practice.name}
                  </h3>
                  
                  <div className="text-sm text-gray-600 mb-4">
                    <p>{practice.address.line1}</p>
                    <p>{practice.address.suburb}, {practice.address.state} {practice.address.postcode}</p>
                  </div>

                  {practice.services && practice.services.length > 0 && (
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-2">
                        {practice.services.slice(0, 3).map((service, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            {service}
                          </span>
                        ))}
                        {practice.services.length > 3 && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                            +{practice.services.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center text-sm text-gray-500">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {practice.hours && practice.hours.length > 0 && (
                      <span>
                        {practice.hours[0].openTime} - {practice.hours[0].closeTime}
                      </span>
                    )}
                  </div>
                </div>

                <button className="ml-4 text-gray-400 hover:text-gray-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}