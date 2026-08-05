import React, { useState } from 'react';
import { User, Briefcase, Globe, MapPin, UserX } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/src/components/ui/dialog';
import { Button } from '@/src/components/shared/Button';
import { Separator } from '@/src/components/ui/separator';

export const NutritionistModal = ({ isOpen, onClose, nutritionist, onDisconnect }) => {
  const [showConfirm, setShowConfirm] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

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
    <Dialog
      open={isOpen && !!nutritionist}
      onOpenChange={(open) => {
        if (!open) {
          setShowConfirm(false);
          onClose();
        }
      }}
    >
      <DialogContent className="max-w-md p-0 gap-0">
        <DialogHeader className="p-6 border-b">
          <DialogTitle>Your Nutritionist</DialogTitle>
        </DialogHeader>

        {nutritionist && (
          <div className="p-6 space-y-4">
            {nutritionist.name && (
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="text-base font-medium text-foreground">{nutritionist.name}</p>
                </div>
              </div>
            )}

            {nutritionist.business_name && (
              <div className="flex items-start gap-3">
                <Briefcase className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-muted-foreground">Business</p>
                  <p className="text-base font-medium text-foreground">{nutritionist.business_name}</p>
                </div>
              </div>
            )}

            {nutritionist.website && (
              <div className="flex items-start gap-3">
                <Globe className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-muted-foreground">Website</p>
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

            {nutritionist.location && (
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p className="text-base font-medium text-foreground">{nutritionist.location}</p>
                </div>
              </div>
            )}

            {nutritionist.has_macro_bounds && (
              <div className="mt-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-medium text-blue-900 mb-2">Macro Boundaries Set</p>
                <p className="text-xs text-blue-700">
                  Your nutritionist has set custom macro boundaries for your meal plans.
                </p>
              </div>
            )}
          </div>
        )}

        <Separator />

        <DialogFooter className="p-6 sm:flex-col sm:space-x-0">
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
            <div className="space-y-3 w-full">
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm font-medium text-red-900">Are you sure?</p>
                <p className="text-xs text-red-700 mt-1">
                  This will remove your connection to {nutritionist?.name || 'this nutritionist'}.
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
                  variant="danger"
                  className="flex-1"
                  disabled={disconnecting}
                >
                  {disconnecting ? 'Disconnecting...' : 'Yes, Disconnect'}
                </Button>
              </div>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
