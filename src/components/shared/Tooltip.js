// src/components/shared/Tooltip.js
export const Tooltip = ({ children, text }) => (
  <div className="relative group inline-block">
    {children}
    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 text-xs font-medium text-white bg-gray-800 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
      {text}
    </span>
  </div>
);