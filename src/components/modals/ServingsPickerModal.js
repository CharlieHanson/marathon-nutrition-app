import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/src/components/ui/dialog';
import { Button } from '@/src/components/shared/Button';

export const ServingsPickerModal = ({ isOpen, onClose, onConfirm, mealName }) => {
  const [selectedServings, setSelectedServings] = useState(1);

  const handleConfirm = () => {
    onConfirm(selectedServings);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md" showClose={false}>
        <DialogHeader className="text-center sm:text-center">
          <DialogTitle className="text-xl text-center">How many servings?</DialogTitle>
          {mealName && (
            <DialogDescription className="text-center line-clamp-2">
              {mealName}
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="grid grid-cols-6 gap-3 py-2">
          {[1, 2, 3, 4, 5, 6].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => setSelectedServings(num)}
              className={`
                aspect-square rounded-xl border-2 font-bold text-lg
                transition-all duration-200 hover:scale-105
                ${
                  selectedServings === num
                    ? 'bg-primary border-primary text-white shadow-md'
                    : 'bg-muted border-border text-gray-700 hover:border-primary/50'
                }
              `}
            >
              {num}
            </button>
          ))}
        </div>

        <DialogFooter className="flex-row gap-3 sm:space-x-0">
          <Button onClick={onClose} variant="outline" className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleConfirm} variant="primary" className="flex-1">
            Generate Recipe
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
