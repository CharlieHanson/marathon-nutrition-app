// src/components/modals/NutritionistModal.js
import React, { useState } from 'react';
import { X, User, Briefcase, Globe, MapPin, UserX } from 'lucide-react';
import { Button } from '../shared/Button';

export const NutritionistModal = ({ isOpen, onClose, nutritionist, onDisconnect }) => {
  const [showConfirm, setShowConfirm] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  if (!isOpen || !nutritionist) return null;

  const handleDisconnect = async () => {
    setDisconnecting(true);
    try {
      await onDisconnect();
      onClose();
    } catch (error) {
      console.error('Error disconnecting:', error);
    } finally {
      setDisconnecting(false);
      setShowConfirm(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Your Nutritionist</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Name */}
          {nutritionist.name && (
            <div className="flex items-start gap-3">
              <User className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-gray-500">Name</p>
                <p className="text-base font-medium text-gray-900">{nutritionist.name}</p>
              </div>
            </div>
          )}

          {/* Business Name */}
          {nutritionist.business_name && (
            <div className="flex items-start gap-3">
              <Briefcase className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-gray-500">Business</p>
                <p className="text-base font-medium text-gray-900">{nutritionist.business_name}</p>
              </div>
            </div>
          )}

          {/* Website */}
          {nutritionist.website && (
            <div className="flex items-start gap-3">
              <Globe className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-gray-500">Website</p>
                <a
                  href={nutritionist.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-base font-medium text-primary hover:text-primary-700 hover:underline"
                >
                  {nutritionist.website}
                </a>
              </div>
            </div>
          )}

          {/* Location */}
          {nutritionist.location && (
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-gray-500">Location</p>
                <p className="text-base font-medium text-gray-900">{nutritionist.location}</p>
              </div>
            </div>
          )}

          {/* Macro Bounds (if set) */}
          {nutritionist.has_macro_bounds && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm font-medium text-blue-900 mb-2">Macro Boundaries Set</p>
              <p className="text-xs text-blue-700">
                Your nutritionist has set custom macro boundaries for your meal plans.
              </p>
            </div>
          )}
        </div>

        {/* Footer - Disconnect Button */}
        <div className="p-6 border-t border-gray-200">
          {!showConfirm ? (
            <Button
              onClick={() => setShowConfirm(true)}
              variant="outline"
              className="w-full text-red-600 border-red-300 hover:bg-red-50"
              icon={UserX}
            >
              Disconnect from Nutritionist
            </Button>
          ) : (
            <div className="space-y-3">
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm font-medium text-red-900">Are you sure?</p>
                <p className="text-xs text-red-700 mt-1">
                  This will remove your connection to {nutritionist.name || 'this nutritionist'}. 
                  Any macro boundaries they set will no longer apply.
                </p>
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={() => setShowConfirm(false)}
                  variant="outline"
                  className="flex-1"
                  disabled={disconnecting}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDisconnect}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                  disabled={disconnecting}
                >
                  {disconnecting ? 'Disconnecting...' : 'Yes, Disconnect'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};