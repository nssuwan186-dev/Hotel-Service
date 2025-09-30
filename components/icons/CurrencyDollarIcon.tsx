import React from 'react';

export const CurrencyDollarIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width="24" 
        height="24" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        className={className}
    >
        <circle cx="12" cy="12" r="8"></circle>
        <line x1="12" y1="1" x2="12" y2="23"></line>
        <path d="M12 1a9 9 0 0 0 0 18"></path>
    </svg>
);
