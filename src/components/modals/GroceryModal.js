import React from 'react';
import { Download, ShoppingCart, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/src/components/ui/dialog';
import { Button } from '@/src/components/shared/Button';
import { PageDecor } from '@/src/components/shared/PageDecor';

const SectionLabel = ({ children }) => (
  <p className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.9px] text-muted-foreground">
    {children}
  </p>
);

const SoftCard = ({ children, className = '' }) => (
  <div
    className={`rounded-[18px] border border-cream-300 bg-cream-paper p-4 shadow-soft ${className}`}
  >
    {children}
  </div>
);

export const GroceryModal = ({ isOpen, onClose, groceryList }) => {
  const categories = groceryList || [];

  const downloadList = () => {
    const text = categories
      .map((category) =>
        `${category.category}\n${(category.items || []).map((item) => `  - ${item}`).join('\n')}`
      )
      .join('\n\n');

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'grocery-list.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showClose={false}
        className="max-w-lg max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0 bg-cream border-cream-300 sm:rounded-2xl"
      >
        <PageDecor className="opacity-70" />

        <div className="relative z-10 flex flex-col min-h-0 flex-1">
          <div className="flex items-start gap-3 px-5 pt-5 pb-4">
            <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <ShoppingCart className="h-[18px] w-[18px] text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold uppercase tracking-[0.9px] text-muted-foreground">
                Groceries
              </p>
              <DialogTitle className="text-xl font-bold leading-snug text-gray-900">
                Weekly Grocery List
              </DialogTitle>
              <DialogDescription className="sr-only">
                Ingredients grouped by category from your meal plan
              </DialogDescription>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={downloadList}
                disabled={categories.length === 0}
                className="rounded-lg p-2 text-gray-700 hover:bg-cream-200 disabled:opacity-40"
                aria-label="Download grocery list"
                title="Download"
              >
                <Download className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-2 text-gray-700 hover:bg-cream-200"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-3">
            {categories.length === 0 ? (
              <SoftCard>
                <p className="text-center text-sm font-medium leading-snug text-muted-foreground">
                  No grocery items yet. Generate a list from your meal plan.
                </p>
              </SoftCard>
            ) : (
              categories.map((category, categoryIndex) => (
                <SoftCard key={`category-${categoryIndex}`}>
                  <SectionLabel>{(category.category || 'Uncategorized').toUpperCase()}</SectionLabel>
                  <ul className="space-y-0">
                    {(category.items || []).map((item, itemIndex) => (
                      <li
                        key={`item-${categoryIndex}-${itemIndex}`}
                        className={`flex items-start gap-2.5 py-2 ${
                          itemIndex < (category.items || []).length - 1
                            ? 'border-b border-cream-300/80'
                            : ''
                        }`}
                      >
                        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                        <span className="text-[15px] font-semibold leading-snug text-gray-900">
                          {item}
                        </span>
                      </li>
                    ))}
                  </ul>
                </SoftCard>
              ))
            )}
          </div>

          <div className="relative z-10 flex flex-wrap gap-2 border-t border-cream-300 bg-cream-50/80 px-5 py-4">
            <Button
              onClick={downloadList}
              variant="outline"
              icon={Download}
              disabled={categories.length === 0}
            >
              Download
            </Button>
            <Button onClick={onClose} variant="primary">
              Done
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
