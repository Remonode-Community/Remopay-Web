'use client';

import React from 'react';

interface AdminHeaderProps {
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
  };
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  title,
  description,
  action,
}) => {
  return (
    <div className="mb-6 flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-gray-500">{description}</p>
        )}
      </div>
      {action && (
        <button
          onClick={action.onClick}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            action.variant === 'secondary'
              ? 'bg-gray-200 text-gray-900 hover:bg-gray-300'
              : 'bg-[#d71927] text-white hover:bg-[#b91420]'
          }`}
        >
          {action.label}
        </button>
      )}
    </div>
  );
};
