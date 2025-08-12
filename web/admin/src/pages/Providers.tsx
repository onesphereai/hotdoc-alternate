import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../contexts/AuthContext';
interface Practice {
  practiceId: string;
  name: string;
}

interface Provider {
  providerId: string;
  tenantId: string;
  practiceId: string;
  name: string;
  specialties: string[];
  languages: string[];
  sessionRules?: {
    maxDailySlots: number;
    slotDuration: number;
    bufferMinutes: number;
    defaultSessionDuration: number;
  };
  createdAt: string;
  updatedAt: string;
}

export function Providers() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [practices, setPractices] = useState<Practice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const { user } = useAuth();
  const api = useApi();

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      name: '',
      practiceId: '',
      gender: '',
      languages: ['English'],
      specialties: ['General Practice'],
      sessionRules: {
        defaultSessionDuration: 15,
        defaultBreakDuration: 5
      }
    }
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [practicesResponse] = await Promise.all([
        api.getPractices()
      ]);
      setPractices(practicesResponse.practices || []);
      // Note: We would normally load providers here too, but we don't have a list endpoint yet
      setProviders([]);
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: any) => {
    if (!user?.tenantId) {
      setError('Tenant ID not found');
      return;
    }

    setSubmitLoading(true);
    setError('');

    try {
      const provider = await api.createProvider({
        ...data,
        languages: Array.isArray(data.languages) ? data.languages : data.languages.split(',').map((s: string) => s.trim()),
        specialties: Array.isArray(data.specialties) ? data.specialties : data.specialties.split(',').map((s: string) => s.trim())
      }, user.tenantId);

      setProviders(prev => [...prev, provider]);
      setShowForm(false);
      reset();
    } catch (err: any) {
      setError(err.message || 'Failed to create provider');
    } finally {
      setSubmitLoading(false);
    }
  };

  const commonSpecialties = [
    'General Practice',
    'Family Medicine',
    'Internal Medicine',
    'Pediatrics',
    'Women\'s Health',
    'Men\'s Health',
    'Mental Health',
    'Chronic Disease Management',
    'Dermatology',
    'Cardiology'
  ];

  const commonLanguages = [
    'English',
    'Mandarin',
    'Cantonese',
    'Arabic',
    'Vietnamese',
    'Greek',
    'Italian',
    'Spanish',
    'Hindi',
    'French'
  ];

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Healthcare Providers</h1>
          <p className="mt-2 text-gray-600">
            Manage doctors and healthcare professionals
          </p>
        </div>
        {practices.length > 0 && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium"
          >
            Add New Provider
          </button>
        )}
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {practices.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto h-12 w-12 text-gray-400">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h3 className="mt-4 text-lg font-medium text-gray-900">No practices found</h3>
          <p className="mt-2 text-gray-500">You need to create a practice first before adding providers.</p>
        </div>
      ) : showForm ? (
        <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg border">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">Add New Provider</h2>
            <button
              onClick={() => setShowForm(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </label>
              <input
                {...register('name', { required: 'Name is required' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Dr. First Last"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Practice *
              </label>
              <select
                {...register('practiceId', { required: 'Practice is required' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a practice</option>
                {practices.map(practice => (
                  <option key={practice.practiceId} value={practice.practiceId}>
                    {practice.name}
                  </option>
                ))}
              </select>
              {errors.practiceId && (
                <p className="mt-1 text-sm text-red-600">{errors.practiceId.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gender
              </label>
              <select
                {...register('gender')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Prefer not to say</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Languages Spoken
              </label>
              <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto border border-gray-300 rounded-md p-3">
                {commonLanguages.map(language => (
                  <label key={language} className="flex items-center">
                    <input
                      type="checkbox"
                      value={language}
                      {...register('languages')}
                      className="rounded border-gray-300 text-blue-600"
                    />
                    <span className="ml-2 text-sm">{language}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Specialties
              </label>
              <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto border border-gray-300 rounded-md p-3">
                {commonSpecialties.map(specialty => (
                  <label key={specialty} className="flex items-center">
                    <input
                      type="checkbox"
                      value={specialty}
                      {...register('specialties')}
                      className="rounded border-gray-300 text-blue-600"
                    />
                    <span className="ml-2 text-sm">{specialty}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Session Duration (minutes)
                </label>
                <input
                  {...register('sessionRules.defaultSessionDuration', { 
                    valueAsNumber: true,
                    min: { value: 5, message: 'Minimum 5 minutes' },
                    max: { value: 120, message: 'Maximum 120 minutes' }
                  })}
                  type="number"
                  min="5"
                  max="120"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Break Duration (minutes)
                </label>
                <input
                  {...register('sessionRules.defaultBreakDuration', { 
                    valueAsNumber: true,
                    min: { value: 0, message: 'Minimum 0 minutes' },
                    max: { value: 30, message: 'Maximum 30 minutes' }
                  })}
                  type="number"
                  min="0"
                  max="30"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitLoading}
                className="px-6 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {submitLoading ? 'Creating...' : 'Create Provider'}
              </button>
            </div>
          </form>
        </div>
      ) : providers.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto h-12 w-12 text-gray-400">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h3 className="mt-4 text-lg font-medium text-gray-900">No providers yet</h3>
          <p className="mt-2 text-gray-500">Add your first healthcare provider to get started.</p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium"
          >
            Add First Provider
          </button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {providers.map((provider) => (
            <div key={provider.providerId} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {provider.name}
                  </h3>
                  
                  <div className="mb-4">
                    {provider.specialties && provider.specialties.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {provider.specialties.slice(0, 2).map((specialty, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"
                          >
                            {specialty}
                          </span>
                        ))}
                        {provider.specialties.length > 2 && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                            +{provider.specialties.length - 2}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="text-sm text-gray-600 space-y-1">
                    {provider.languages && (
                      <p>Languages: {provider.languages.join(', ')}</p>
                    )}
                    {provider.sessionRules && (
                      <p>Session: {provider.sessionRules.defaultSessionDuration}min</p>
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