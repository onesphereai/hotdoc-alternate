import { useState } from 'react';
import { useForm } from 'react-hook-form';
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
}
import { useAuth } from '../contexts/AuthContext';
import { useApi } from '../hooks/useApi';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
}

const steps: OnboardingStep[] = [
  {
    id: 'practice-info',
    title: 'Practice Information',
    description: 'Tell us about your practice'
  },
  {
    id: 'location',
    title: 'Location & Contact',
    description: 'Where are you located?'
  },
  {
    id: 'services',
    title: 'Services & Hours',
    description: 'What services do you offer?'
  },
  {
    id: 'review',
    title: 'Review & Submit',
    description: 'Review your information'
  }
];

const australianStates = [
  { value: 'NSW', label: 'New South Wales' },
  { value: 'VIC', label: 'Victoria' },
  { value: 'QLD', label: 'Queensland' },
  { value: 'WA', label: 'Western Australia' },
  { value: 'SA', label: 'South Australia' },
  { value: 'TAS', label: 'Tasmania' },
  { value: 'ACT', label: 'Australian Capital Territory' },
  { value: 'NT', label: 'Northern Territory' }
];

const commonServices = [
  'General Practice',
  'Bulk Billing',
  'Women\'s Health',
  'Men\'s Health',
  'Pediatrics',
  'Chronic Disease Management',
  'Mental Health',
  'Travel Medicine',
  'Skin Cancer Checks',
  'Pathology'
];

interface OnboardingWizardProps {
  onComplete: (practice: Practice) => void;
  onCancel: () => void;
}

export function OnboardingWizard({ onComplete, onCancel }: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const api = useApi();

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      name: '',
      abn: '',
      address: {
        line1: '',
        suburb: '',
        state: 'VIC',
        postcode: '',
        country: 'AU'
      },
      services: [] as string[],
      hours: [
        { dayOfWeek: 1, openTime: '09:00', closeTime: '17:00' },
        { dayOfWeek: 2, openTime: '09:00', closeTime: '17:00' },
        { dayOfWeek: 3, openTime: '09:00', closeTime: '17:00' },
        { dayOfWeek: 4, openTime: '09:00', closeTime: '17:00' },
        { dayOfWeek: 5, openTime: '09:00', closeTime: '17:00' }
      ],
      billingPolicy: ''
    }
  });

  const formData = watch();

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleServiceToggle = (service: string) => {
    const currentServices = formData.services || [];
    const newServices = currentServices.includes(service)
      ? currentServices.filter(s => s !== service)
      : [...currentServices, service];
    setValue('services', newServices);
  };

  const onSubmit = async (data: any) => {
    if (currentStep < steps.length - 1) {
      nextStep();
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (!user?.tenantId) {
        throw new Error('Tenant ID not found');
      }

      const practice = await api.createPractice(data, user.tenantId);
      onComplete(practice);
    } catch (err: any) {
      setError(err.message || 'Failed to create practice');
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (steps[currentStep].id) {
      case 'practice-info':
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Practice Name *
              </label>
              <input
                {...register('name', { required: 'Practice name is required' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Melbourne Medical Centre"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Australian Business Number (ABN)
              </label>
              <input
                {...register('abn')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="12 345 678 901"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Billing Policy
              </label>
              <textarea
                {...register('billingPolicy')}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Describe your billing policies, bulk billing availability, etc."
              />
            </div>
          </div>
        );

      case 'location':
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Street Address *
              </label>
              <input
                {...register('address.line1', { required: 'Address is required' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="123 Collins Street"
              />
              {errors.address?.line1 && (
                <p className="mt-1 text-sm text-red-600">{errors.address.line1.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Suburb *
                </label>
                <input
                  {...register('address.suburb', { required: 'Suburb is required' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Melbourne"
                />
                {errors.address?.suburb && (
                  <p className="mt-1 text-sm text-red-600">{errors.address.suburb.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Postcode *
                </label>
                <input
                  {...register('address.postcode', { 
                    required: 'Postcode is required',
                    pattern: {
                      value: /^\d{4}$/,
                      message: 'Enter a valid 4-digit postcode'
                    }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="3000"
                />
                {errors.address?.postcode && (
                  <p className="mt-1 text-sm text-red-600">{errors.address.postcode.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                State *
              </label>
              <select
                {...register('address.state', { required: 'State is required' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {australianStates.map(state => (
                  <option key={state.value} value={state.value}>
                    {state.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        );

      case 'services':
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                Services Offered
              </label>
              <div className="grid grid-cols-2 gap-3">
                {commonServices.map(service => (
                  <label key={service} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.services?.includes(service) || false}
                      onChange={() => handleServiceToggle(service)}
                      className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                    />
                    <span className="ml-2 text-sm text-gray-900">{service}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                Opening Hours
              </label>
              <div className="space-y-3">
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((day, index) => (
                  <div key={day} className="flex items-center space-x-4">
                    <div className="w-20 text-sm font-medium text-gray-700">{day}</div>
                    <input
                      {...register(`hours.${index}.openTime`)}
                      type="time"
                      className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-gray-500">to</span>
                    <input
                      {...register(`hours.${index}.closeTime`)}
                      type="time"
                      className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'review':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Review Your Information</h3>
            
            <div className="bg-gray-50 p-4 rounded-lg space-y-4">
              <div>
                <h4 className="font-medium text-gray-700">Practice Details</h4>
                <p className="text-sm text-gray-600">Name: {formData.name}</p>
                {formData.abn && <p className="text-sm text-gray-600">ABN: {formData.abn}</p>}
              </div>

              <div>
                <h4 className="font-medium text-gray-700">Address</h4>
                <p className="text-sm text-gray-600">
                  {formData.address.line1}, {formData.address.suburb} {formData.address.state} {formData.address.postcode}
                </p>
              </div>

              <div>
                <h4 className="font-medium text-gray-700">Services</h4>
                <p className="text-sm text-gray-600">
                  {formData.services?.length ? formData.services.join(', ') : 'None selected'}
                </p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Practice Setup</h2>
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700"
          >
            Cancel
          </button>
        </div>
        <p className="mt-2 text-sm text-gray-600">
          Step {currentStep + 1} of {steps.length}
        </p>
      </div>

      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex items-center">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full ${
                  index <= currentStep
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {index + 1}
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`w-16 h-1 mx-2 ${
                    index < currentStep ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        <div className="mt-4">
          <h3 className="text-lg font-medium text-gray-900">{steps[currentStep].title}</h3>
          <p className="text-sm text-gray-600">{steps[currentStep].description}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {renderStep()}

        <div className="mt-8 flex justify-between">
          <button
            type="button"
            onClick={prevStep}
            disabled={currentStep === 0}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>

          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating...' : currentStep === steps.length - 1 ? 'Create Practice' : 'Next'}
          </button>
        </div>
      </form>
    </div>
  );
}