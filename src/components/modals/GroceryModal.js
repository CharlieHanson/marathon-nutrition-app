import React from 'react';
import { Download } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/src/components/ui/dialog';
import { Button } from '@/src/components/shared/Button';

export const GroceryModal = ({ isOpen, onClose, groceryList }) => {
  const downloadList = () => {
    const text = groceryList
      .map((category) =>
        `${category.category}\n${category.items.map((item) => `  - ${item}`).join('\n')}`
      )
      .join('\n\n');

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'grocery-list.txt';
    a.click();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-4 border-b">
          <DialogTitle>Weekly Grocery List</DialogTitle>
        </DialogHeader>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <div className="space-y-4">
            {(groceryList || []).map((category, index) => (
              <div key={index}>
                <h4 className="font-semibold text-gray-800 mb-2">
                  {category.category}
                </h4>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  {category.items.map((item, itemIndex) => (
                    <li key={itemIndex} className="text-gray-700">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter className="p-4 border-t bg-muted/50 gap-2">
          <Button onClick={downloadList} variant="outline" icon={Download}>
            Download
          </Button>
          <Button onClick={onClose} variant="primary">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
