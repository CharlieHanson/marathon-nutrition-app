import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/src/components/ui/dialog';
import { Button } from '@/src/components/shared/Button';

export const RecipeModal = ({ isOpen, onClose, recipe, title }) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-4 border-b">
          <DialogTitle>Recipe: {title}</DialogTitle>
        </DialogHeader>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">
            {recipe}
          </pre>
        </div>

        <DialogFooter className="p-4 border-t bg-muted/50">
          <Button onClick={onClose} variant="primary">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
