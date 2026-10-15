'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  FileText,
  Loader2,
  Upload,
  Check,
  DollarSign,
  Shield,
  CheckCircle2,
  Briefcase,
  FileCheck,
} from 'lucide-react';

import { Card } from '@/components/shared/Card';
import { Button } from '@/components/shared/Button';
import { Toast } from '@/components/shared/Toast';
import { LockedServiceView } from '@/components/dashboard/UpgradeRequiredCard';
import { useUIStore } from '@/store/ui.store';
import { useAuth } from '@/hooks/useAuth';
import { useUsdAccount } from '@/hooks/useUsdAccount';
import { isTierOneOrAbove } from '@/utils/tier.utils';
import {
  EmploymentStatus,
  USResidencyStatus,
  IdentificationType,
  USDAccountFormData,
} from '@/types/usd-account.types';

const EMPLOYMENT_STATUSES: EmploymentStatus[] = [
  'EMPLOYED',
  'SELF_EMPLOYED',
  'UNEMPLOYED',
  'STUDENT',
  'RETIRED',
];

const US_RESIDENCY_STATUSES: USResidencyStatus[] = [
  'NON_RESIDENT_ALIEN',
  'RESIDENT_ALIEN',
  'US_CITIZEN',
];

const IDENTIFICATION_TYPES: IdentificationType[] = ['PASSPORT', 'NIN', 'DRIVERS_LICENSE'];

const COUNTRY_CODES = [
  { code: 'NG', name: 'Nigeria' },
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australia' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'KE', name: 'Kenya' },
  { code: 'GH', name: 'Ghana' },
];

const STEPS = [
  { id: 1, title: 'Employment Info', icon: Briefcase },
  { id: 2, title: 'Identification', icon: FileCheck },
  { id: 3, title: 'Documents', icon: Upload },
  { id: 4, title: 'Review', icon: CheckCircle2 },
];

interface FormErrors {
  [key: string]: string;
}

type StepNumber = 1 | 2 | 3 | 4;

export default function USDAccountPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { addToast } = useUIStore();
  const { account, isCreating, error, createAccount, clearError } = useUsdAccount();

  const [currentStep, setCurrentStep] = useState<StepNumber>(1);
  const [formData, setFormData] = useState<USDAccountFormData>({
    employmentStatus: 'EMPLOYED',
    employmentDescription: '',
    nationality: 'NG',
    employerName: '',
    occupation: '',
    usResidencyStatus: 'NON_RESIDENT_ALIEN',
    identificationNumber: '',
    passportNumber: '',
    identificationCountry: 'NG',
    identificationType: 'NIN',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [filePreview, setFilePreview] = useState<{
    sourceOfFunds?: string;
    proofOfAddress?: string;
    frontImage?: string;
    backImage?: string;
  }>({});

  const customerId = useMemo(() => {
    return user?.mapleradCustomer?.maplerad_id || '';
  }, [user?.mapleradCustomer?.maplerad_id]);

  const upgraded = isTierOneOrAbove(user?.mapleradCustomer?.tier);

  useEffect(() => {
    if (error) {
      addToast({
        message: error,
        type: 'error',
      });
      clearError();
    }
  }, [error, addToast, clearError]);

  useEffect(() => {
    if (account) {
      addToast({
        message: 'USD account created successfully!',
        type: 'success',
      });
      setTimeout(() => {
        router.push('/dashboard/usd-account/success');
      }, 2000);
    }
  }, [account, addToast, router]);

  const validateStep1 = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.employmentStatus) {
      newErrors.employmentStatus = 'Employment status is required';
    }
    if (!formData.employmentDescription.trim()) {
      newErrors.employmentDescription = 'Employment description is required';
    }
    if (!formData.nationality) {
      newErrors.nationality = 'Nationality is required';
    }
    if (!formData.employerName.trim()) {
      newErrors.employerName = 'Employer name is required';
    }
    if (!formData.occupation.trim()) {
      newErrors.occupation = 'Occupation is required';
    }
    if (!formData.usResidencyStatus) {
      newErrors.usResidencyStatus = 'US residency status is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.identificationNumber.trim()) {
      newErrors.identificationNumber = 'Identification number is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep3 = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.sourceOfFundsFile) {
      newErrors.sourceOfFundsFile = 'Source of funds document is required';
    }
    if (!formData.proofOfAddressFile) {
      newErrors.proofOfAddressFile = 'Proof of address document is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    let isValid = false;

    switch (currentStep) {
      case 1:
        isValid = validateStep1();
        break;
      case 2:
        isValid = validateStep2();
        break;
      case 3:
        isValid = validateStep3();
        break;
      default:
        isValid = true;
    }

    if (isValid && currentStep < 4) {
      setCurrentStep((currentStep + 1) as StepNumber);
      setErrors({});
    } else if (!isValid) {
      addToast({
        message: 'Please fill in all required fields',
        type: 'error',
      });
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as StepNumber);
      setErrors({});
    }
  };

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    fieldName: string
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      addToast({
        message: 'File size must be less than 5MB',
        type: 'error',
      });
      return;
    }

    const fieldKey = `${fieldName}File` as keyof USDAccountFormData;
    setFormData((prev) => ({
      ...prev,
      [fieldKey]: file,
    }));

    if (fieldName.includes('Image')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setFilePreview((prev) => ({
          ...prev,
          [fieldName]: event.target?.result as string,
        }));
      };
      reader.readAsDataURL(file);
    } else {
      setFilePreview((prev) => ({
        ...prev,
        [fieldName]: file.name,
      }));
    }

    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    if (!upgraded) return;
    e.preventDefault();

    if (!customerId) {
      addToast({
        message: 'Unable to retrieve customer ID. Please try logging in again.',
        type: 'error',
      });
      return;
    }

    await createAccount(customerId, formData);
  };

  const StepProgress = () => (
    <div className="mb-8 flex items-center justify-between">
      {STEPS.map((step, index) => {
        const isCompleted = step.id < currentStep;
        const isCurrent = step.id === currentStep;
        const StepIcon = step.icon;

        return (
          <div key={step.id} className="flex flex-1 items-center">
            <div className="flex flex-col items-center">
              <div
                className={`mb-2 flex h-12 w-12 items-center justify-center rounded-full font-bold transition ${
                  isCompleted
                    ? 'bg-green-100 text-green-700'
                    : isCurrent
                      ? 'bg-[#d71927] text-white shadow-lg shadow-red-300'
                      : 'bg-gray-100 text-gray-500'
                }`}
              >
                {isCompleted ? (
                  <Check size={24} />
                ) : (
                  <StepIcon size={20} />
                )}
              </div>
              <p
                className={`text-center text-xs font-bold ${
                  isCurrent ? 'text-gray-900' : isCompleted ? 'text-green-700' : 'text-gray-500'
                }`}
              >
                {step.title}
              </p>
            </div>

            {index < STEPS.length - 1 && (
              <div
                className={`mx-2 flex-1 transition ${
                  isCompleted ? 'bg-green-300' : 'bg-gray-200'
                }`}
                style={{ height: '2px' }}
              />
            )}
          </div>
        );
      })}
    </div>
  );

  return (
    <div
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
      className="space-y-8"
    >
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
      `}</style>

      <Card className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 bg-gray-50 px-6 py-8 sm:px-8">
          <StepProgress />
        </div>

        <LockedServiceView locked={!upgraded} service="USD virtual account">
        <form onSubmit={handleCreateAccount} className="space-y-8 p-6 sm:p-8">
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="mb-2 text-xl font-bold text-gray-900">Employment Information</h2>
                <p className="text-sm text-gray-600">Tell us about your current employment.</p>
              </div>

              <div>
                <label className="mb-3 block text-sm font-bold text-gray-900">
                  Employment Status <span className="text-red-600">*</span>
                </label>
                <select
                  name="employmentStatus"
                  value={formData.employmentStatus}
                  onChange={handleInputChange}
                  className={`w-full rounded-2xl border px-4 py-3 text-sm font-medium text-gray-900 outline-none transition ${
                    errors.employmentStatus
                      ? 'border-red-300 bg-red-50'
                      : 'border-gray-200 bg-white hover:border-gray-300 focus:border-[#d71927]'
                  }`}
                >
                  {EMPLOYMENT_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
                {errors.employmentStatus && (
                  <p className="mt-2 text-sm font-medium text-red-600">{errors.employmentStatus}</p>
                )}
              </div>

              <div>
                <label className="mb-3 block text-sm font-bold text-gray-900">
                  Employment Description <span className="text-red-600">*</span>
                </label>
                <textarea
                  name="employmentDescription"
                  value={formData.employmentDescription}
                  onChange={handleInputChange}
                  placeholder="Describe your current employment or occupation..."
                  rows={3}
                  className={`w-full rounded-2xl border px-4 py-3 text-sm font-medium text-gray-900 outline-none transition resize-none ${
                    errors.employmentDescription
                      ? 'border-red-300 bg-red-50'
                      : 'border-gray-200 bg-white hover:border-gray-300 focus:border-[#d71927]'
                  }`}
                />
                {errors.employmentDescription && (
                  <p className="mt-2 text-sm font-medium text-red-600">
                    {errors.employmentDescription}
                  </p>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-3 block text-sm font-bold text-gray-900">
                    Employer Name <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    name="employerName"
                    value={formData.employerName}
                    onChange={handleInputChange}
                    placeholder="e.g., Acme Corporation"
                    className={`w-full rounded-2xl border px-4 py-3 text-sm font-medium text-gray-900 outline-none transition ${
                      errors.employerName
                        ? 'border-red-300 bg-red-50'
                        : 'border-gray-200 bg-white hover:border-gray-300 focus:border-[#d71927]'
                    }`}
                  />
                  {errors.employerName && (
                    <p className="mt-2 text-sm font-medium text-red-600">{errors.employerName}</p>
                  )}
                </div>

                <div>
                  <label className="mb-3 block text-sm font-bold text-gray-900">
                    Occupation <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    name="occupation"
                    value={formData.occupation}
                    onChange={handleInputChange}
                    placeholder="e.g., Software Engineer"
                    className={`w-full rounded-2xl border px-4 py-3 text-sm font-medium text-gray-900 outline-none transition ${
                      errors.occupation
                        ? 'border-red-300 bg-red-50'
                        : 'border-gray-200 bg-white hover:border-gray-300 focus:border-[#d71927]'
                    }`}
                  />
                  {errors.occupation && (
                    <p className="mt-2 text-sm font-medium text-red-600">{errors.occupation}</p>
                  )}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-3 block text-sm font-bold text-gray-900">
                    Nationality <span className="text-red-600">*</span>
                  </label>
                  <select
                    name="nationality"
                    value={formData.nationality}
                    onChange={handleInputChange}
                    className={`w-full rounded-2xl border px-4 py-3 text-sm font-medium text-gray-900 outline-none transition ${
                      errors.nationality
                        ? 'border-red-300 bg-red-50'
                        : 'border-gray-200 bg-white hover:border-gray-300 focus:border-[#d71927]'
                    }`}
                  >
                    {COUNTRY_CODES.map(({ code, name }) => (
                      <option key={code} value={code}>
                        {name} ({code})
                      </option>
                    ))}
                  </select>
                  {errors.nationality && (
                    <p className="mt-2 text-sm font-medium text-red-600">{errors.nationality}</p>
                  )}
                </div>

                <div>
                  <label className="mb-3 block text-sm font-bold text-gray-900">
                    US Residency Status <span className="text-red-600">*</span>
                  </label>
                  <select
                    name="usResidencyStatus"
                    value={formData.usResidencyStatus}
                    onChange={handleInputChange}
                    className={`w-full rounded-2xl border px-4 py-3 text-sm font-medium text-gray-900 outline-none transition ${
                      errors.usResidencyStatus
                        ? 'border-red-300 bg-red-50'
                        : 'border-gray-200 bg-white hover:border-gray-300 focus:border-[#d71927]'
                    }`}
                  >
                    {US_RESIDENCY_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status.replace(/_/g, ' ')}
                      </option>
                    ))}
                  </select>
                  {errors.usResidencyStatus && (
                    <p className="mt-2 text-sm font-medium text-red-600">
                      {errors.usResidencyStatus}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="mb-2 text-xl font-bold text-gray-900">Identification Details</h2>
                <p className="text-sm text-gray-600">Provide your identification information.</p>
              </div>

              <div>
                <label className="mb-3 block text-sm font-bold text-gray-900">
                  ID Number <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  name="identificationNumber"
                  value={formData.identificationNumber}
                  onChange={handleInputChange}
                  placeholder="e.g., 12345678901"
                  className={`w-full rounded-2xl border px-4 py-3 text-sm font-medium text-gray-900 outline-none transition ${
                    errors.identificationNumber
                      ? 'border-red-300 bg-red-50'
                      : 'border-gray-200 bg-white hover:border-gray-300 focus:border-[#d71927]'
                  }`}
                />
                {errors.identificationNumber && (
                  <p className="mt-2 text-sm font-medium text-red-600">
                    {errors.identificationNumber}
                  </p>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-3 block text-sm font-bold text-gray-900">ID Type</label>
                  <select
                    name="identificationType"
                    value={formData.identificationType || 'NIN'}
                    onChange={handleInputChange}
                    className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-900 outline-none transition hover:border-gray-300 focus:border-[#d71927]"
                  >
                    {IDENTIFICATION_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-3 block text-sm font-bold text-gray-900">
                    Passport Number
                  </label>
                  <input
                    type="text"
                    name="passportNumber"
                    value={formData.passportNumber}
                    onChange={handleInputChange}
                    placeholder="e.g., A12345678"
                    className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-900 outline-none transition hover:border-gray-300 focus:border-[#d71927]"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-3 block text-sm font-bold text-gray-900">
                    ID Country
                  </label>
                  <select
                    name="identificationCountry"
                    value={formData.identificationCountry || 'NG'}
                    onChange={handleInputChange}
                    className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-900 outline-none transition hover:border-gray-300 focus:border-[#d71927]"
                  >
                    {COUNTRY_CODES.map(({ code, name }) => (
                      <option key={code} value={code}>
                        {name} ({code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-3 block text-sm font-bold text-gray-900">
                    ID Expiration Date
                  </label>
                  <input
                    type="text"
                    name="identificationExpiration"
                    value={formData.identificationExpiration}
                    onChange={handleInputChange}
                    placeholder="DD-MM-YYYY (optional)"
                    className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-900 outline-none transition hover:border-gray-300 focus:border-[#d71927]"
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">
                  💡 Tip
                </p>
                <p className="mt-2 text-sm text-blue-900">
                  You can optionally upload your ID images in the next step for faster verification.
                </p>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="mb-2 text-xl font-bold text-gray-900">Required Documents</h2>
                <p className="text-sm text-gray-600">Upload the documents needed to verify your account.</p>
              </div>

              <div>
                <label className="mb-3 block text-sm font-bold text-gray-900">
                  Source of Funds Document <span className="text-red-600">*</span>
                </label>
                <label className="block">
                  <div className="relative cursor-pointer rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 px-6 py-8 text-center transition hover:border-gray-300">
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => handleFileChange(e, 'sourceOfFunds')}
                      className="hidden"
                    />
                    <Upload className="mx-auto mb-3 text-gray-400" size={28} />
                    <p className="text-sm font-semibold text-gray-900">
                      {filePreview.sourceOfFunds ? filePreview.sourceOfFunds : 'Click to upload'}
                    </p>
                    <p className="mt-1 text-xs text-gray-600">PDF, JPG, or PNG (Max 5MB)</p>
                  </div>
                </label>
                {errors.sourceOfFundsFile && (
                  <p className="mt-2 text-sm font-medium text-red-600">{errors.sourceOfFundsFile}</p>
                )}
              </div>

              <div>
                <label className="mb-3 block text-sm font-bold text-gray-900">
                  Proof of Address Document <span className="text-red-600">*</span>
                </label>
                <label className="block">
                  <div className="relative cursor-pointer rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 px-6 py-8 text-center transition hover:border-gray-300">
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => handleFileChange(e, 'proofOfAddress')}
                      className="hidden"
                    />
                    <Upload className="mx-auto mb-3 text-gray-400" size={28} />
                    <p className="text-sm font-semibold text-gray-900">
                      {filePreview.proofOfAddress ? filePreview.proofOfAddress : 'Click to upload'}
                    </p>
                    <p className="mt-1 text-xs text-gray-600">PDF, JPG, or PNG (Max 5MB)</p>
                  </div>
                </label>
                {errors.proofOfAddressFile && (
                  <p className="mt-2 text-sm font-medium text-red-600">{errors.proofOfAddressFile}</p>
                )}
              </div>

              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6">
                <p className="mb-4 text-sm font-bold text-gray-900">Optional: ID Images</p>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-xs font-semibold text-gray-700">
                      Front Side
                    </label>
                    <label className="block">
                      <div className="relative cursor-pointer rounded-xl border-2 border-dashed border-gray-300 bg-white px-3 py-4 text-center transition hover:border-gray-400">
                        <input
                          type="file"
                          accept=".jpg,.jpeg,.png"
                          onChange={(e) => handleFileChange(e, 'identificationFrontImage')}
                          className="hidden"
                        />
                        {filePreview.frontImage ? (
                          <>
                            <img
                              src={filePreview.frontImage}
                              alt="ID Front"
                              className="mx-auto mb-2 h-20 w-full rounded object-cover"
                            />
                            <Check className="mx-auto text-green-600" size={20} />
                          </>
                        ) : (
                          <>
                            <Upload className="mx-auto mb-2 text-gray-400" size={20} />
                            <p className="text-xs font-semibold text-gray-600">Upload</p>
                          </>
                        )}
                      </div>
                    </label>
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-semibold text-gray-700">
                      Back Side
                    </label>
                    <label className="block">
                      <div className="relative cursor-pointer rounded-xl border-2 border-dashed border-gray-300 bg-white px-3 py-4 text-center transition hover:border-gray-400">
                        <input
                          type="file"
                          accept=".jpg,.jpeg,.png"
                          onChange={(e) => handleFileChange(e, 'identificationBackImage')}
                          className="hidden"
                        />
                        {filePreview.backImage ? (
                          <>
                            <img
                              src={filePreview.backImage}
                              alt="ID Back"
                              className="mx-auto mb-2 h-20 w-full rounded object-cover"
                            />
                            <Check className="mx-auto text-green-600" size={20} />
                          </>
                        ) : (
                          <>
                            <Upload className="mx-auto mb-2 text-gray-400" size={20} />
                            <p className="text-xs font-semibold text-gray-600">Upload</p>
                          </>
                        )}
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="mb-2 text-xl font-bold text-gray-900">Review Your Information</h2>
                <p className="text-sm text-gray-600">
                  Please review all details before submitting.
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-gray-600">
                    Employment
                  </p>
                  <div className="mt-3 space-y-2">
                    <div>
                      <p className="text-xs text-gray-600">Status</p>
                      <p className="font-semibold text-gray-900">
                        {formData.employmentStatus.replace(/_/g, ' ')}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Employer</p>
                      <p className="font-semibold text-gray-900">{formData.employerName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Occupation</p>
                      <p className="font-semibold text-gray-900">{formData.occupation}</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-gray-600">
                    Location & Tax
                  </p>
                  <div className="mt-3 space-y-2">
                    <div>
                      <p className="text-xs text-gray-600">Nationality</p>
                      <p className="font-semibold text-gray-900">
                        {COUNTRY_CODES.find((c) => c.code === formData.nationality)?.name}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">US Residency</p>
                      <p className="font-semibold text-gray-900">
                        {formData.usResidencyStatus.replace(/_/g, ' ')}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-gray-600">
                    Identification
                  </p>
                  <div className="mt-3 space-y-2">
                    <div>
                      <p className="text-xs text-gray-600">ID Type</p>
                      <p className="font-semibold text-gray-900">
                        {formData.identificationType}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">ID Number</p>
                      <p className="font-semibold text-gray-900">
                        {formData.identificationNumber}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">
                    Account Currency
                  </p>
                  <div className="mt-3 flex items-center gap-2">
                    <DollarSign className="text-blue-600" size={24} />
                    <p className="text-2xl font-extrabold text-blue-900">USD</p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-green-200 bg-green-50 p-4">
                <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-green-700">
                  ✓ Documents Attached
                </p>
                <ul className="space-y-1 text-sm">
                  <li className="flex items-center gap-2 text-green-900">
                    <Check size={16} className="text-green-600" />
                    Source of Funds: {formData.sourceOfFundsFile?.name}
                  </li>
                  <li className="flex items-center gap-2 text-green-900">
                    <Check size={16} className="text-green-600" />
                    Proof of Address: {formData.proofOfAddressFile?.name}
                  </li>
                </ul>
              </div>

              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-700">
                  ⚠️ Before You Submit
                </p>
                <ul className="mt-2 space-y-1 text-sm text-amber-900">
                  <li>• All information must be accurate and truthful</li>
                  <li>• Document review typically takes 24 hours</li>
                  <li>• We may contact you for additional information</li>
                  <li>• Your data is encrypted and secure</li>
                </ul>
              </div>
            </div>
          )}

          <div className="mt-8 flex gap-4">
            <Button
              type="button"
              onClick={handlePrevStep}
              disabled={currentStep === 1}
              className="flex items-center gap-2 rounded-2xl border-2 border-gray-300 bg-white px-6 py-3 font-bold text-gray-900 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ChevronLeft size={20} />
              Previous
            </Button>

            {currentStep < 4 ? (
              <Button
                type="button"
                onClick={handleNextStep}
                className="ml-auto flex items-center gap-2 rounded-2xl bg-[#d71927] px-6 py-3 font-bold text-white shadow-sm shadow-red-300 transition hover:bg-[#b81420]"
              >
                Next
                <ChevronRight size={20} />
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={isCreating}
                className="ml-auto flex items-center gap-2 rounded-2xl bg-green-600 px-6 py-3 font-bold text-white shadow-sm shadow-green-300 transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Creating Account...
                  </>
                ) : (
                  <>
                    <Check size={20} />
                    Create Account
                  </>
                )}
              </Button>
            )}
          </div>
        </form>
        </LockedServiceView>
      </Card>

      <Toast />
    </div>
  );
}
