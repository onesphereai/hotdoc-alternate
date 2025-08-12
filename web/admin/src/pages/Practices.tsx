import { useState, useEffect, useRef } from 'react';
import { OnboardingWizard } from '../components/OnboardingWizard';
import { useApi } from '../hooks/useApi';
interface Practice {
  practiceId: string;
  tenantId: string;
  name: string;
  address: {
    line1: string;
    suburb: string;
    state: string;
    postcode: string;
    country: string;
  };
  services: string[];
  hours: Array<{
    dayOfWeek: number;
    openTime: string;
    closeTime: string;
  }>;
  createdAt: string;
  updatedAt: string;
  providerCount?: number;
}

export function Practices() {
  const [practices, setPractices] = useState<Practice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWizard, setShowWizard] = useState(false);
  const [error, setError] = useState('');
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const api = useApi();

  useEffect(() => {
    loadPractices();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadPractices = async () => {
    try {
      setLoading(true);
      const response = await api.getPractices();
      const practicesWithCounts = await Promise.all(
        (response.practices || []).map(async (practice) => {
          try {
            const providerResponse = await api.getProviders(practice.practiceId);
            return {
              ...practice,
              providerCount: providerResponse.count
            };
          } catch (err) {
            console.warn(`Failed to fetch provider count for practice ${practice.practiceId}:`, err);
            return {
              ...practice,
              providerCount: 0
            };
          }
        })
      );
      setPractices(practicesWithCounts);
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

                  <div className="space-y-2 text-sm text-gray-500">
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span>
                        {practice.providerCount || 0} provider{(practice.providerCount || 0) !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="flex items-center">
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
                </div>

                <div className="relative" ref={openDropdown === practice.practiceId ? dropdownRef : null}>
                  <button 
                    className="ml-4 text-gray-400 hover:text-gray-600"
                    onClick={() => setOpenDropdown(openDropdown === practice.practiceId ? null : practice.practiceId)}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                    </svg>
                  </button>
                  
                  {openDropdown === practice.practiceId && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-50 border border-gray-200">
                      <div className="py-1">
                        <button
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          onClick={() => {
                            console.log('View practice:', practice.practiceId);
                            setOpenDropdown(null);
                          }}
                        >
                          <div className="flex items-center">
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            View Details
                          </div>
                        </button>
                        <button
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          onClick={() => {
                            console.log('Edit practice:', practice.practiceId);
                            setOpenDropdown(null);
                          }}
                        >
                          <div className="flex items-center">
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Edit Practice
                          </div>
                        </button>
                        <button
                          className="block w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                          onClick={() => {
                            if (confirm(`Are you sure you want to delete ${practice.name}? This action cannot be undone.`)) {
                              console.log('Delete practice:', practice.practiceId);
                              setOpenDropdown(null);
                            }
                          }}
                        >
                          <div className="flex items-center">
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Delete Practice
                          </div>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}