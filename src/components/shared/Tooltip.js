import React from 'react';
import {
  Tooltip as ShadcnTooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/src/components/ui/tooltip';

export const Tooltip = ({ children, text }) => (
  <TooltipProvider delayDuration={200}>
    <ShadcnTooltip>
      <TooltipTrigger asChild>
        <span className="inline-block">{children}</span>
      </TooltipTrigger>
      <TooltipContent>
        <p>{text}</p>
      </TooltipContent>
    </ShadcnTooltip>
  </TooltipProvider>
);
