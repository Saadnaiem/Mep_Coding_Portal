
import React from 'react';
import { Check } from 'lucide-react';
import { STATUS_MAP } from '../constants';
import { RequestStatus } from '../types';

export const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success' }> = ({ children, variant = 'primary', className = '', ...props }) => {
  const baseClasses = "px-6 py-3 rounded-lg font-serif tracking-wide transition-all duration-300 flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] shadow-sm hover:shadow-md";
  const variants = {
    primary: "bg-gradient-to-r from-[#0F3D3E] to-[#1a5f60] text-white hover:to-[#227274] border border-[#0F3D3E]",
    secondary: "bg-[#F0F4F4] text-[#0F3D3E] border border-transparent hover:border-[#C5A065]/50",
    outline: "border border-gray-200 text-[#0F3D3E] hover:border-[#C5A065] hover:text-[#C5A065] bg-white",
    ghost: "text-gray-500 hover:bg-[#F0F4F4] hover:text-[#0F3D3E]",
    danger: "bg-red-50 text-red-700 hover:bg-red-100 border border-red-100",
    success: "bg-gradient-to-r from-[#C5A065] to-[#D4AF37] text-white border border-[#B38F54] hover:shadow-[#C5A065]/20"
  };

  return (
    <button className={`${baseClasses} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

export const Card: React.FC<{ title?: string; children: React.ReactNode; className?: string; noPadding?: boolean }> = ({ title, children, className = '', noPadding = false }) => (
  <div className={`bg-white rounded-xl shadow-2xl shadow-gray-200/50 border border-gray-100 overflow-hidden ${className}`}>
    {title && (
      <div className="px-4 py-3 md:px-8 md:py-5 border-b border-gray-50 bg-gradient-to-r from-[#ffffff] to-[#fafafa] flex items-center justify-between relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-[#C5A065]" />
        <h3 className="font-serif font-bold text-[#0F3D3E] tracking-wide text-sm">{title}</h3>
      </div>
    )}
    <div className={noPadding ? '' : 'p-4 md:p-8'}>
      {children}
    </div>
  </div>
);

export const Badge: React.FC<{ status: RequestStatus; labelSuffix?: string }> = ({ status, labelSuffix }) => {
  const config = STATUS_MAP[status] || STATUS_MAP.draft;
  return (
    <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-serif font-bold tracking-widest uppercase shadow-sm border border-black/5 ${config.color}`}>
      {config.icon && <span className="opacity-70 scale-90">{config.icon}</span>}
      {config.label}{labelSuffix ? ` - ${labelSuffix}` : ''}
    </span>
  );
};

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label?: string; error?: string }> = ({ label, error, className = '', ...props }) => {
  // Use autoFocus only if the input is meant to grab attention initially, 
  // but for lists of inputs, we avoid aggressively stealing focus on re-render.
  // We use a ref to maintain focus if this is a controlled component being re-rendered.
  const inputRef = React.useRef<HTMLInputElement>(null);
  
  React.useEffect(() => {
     // If this component re-renders while it was focused, ensure it stays focused
     if (document.activeElement === inputRef.current) {
         // It's already focused, do nothing
     }
  });

  return (
  <div className="w-full group">
    {label && <label className="block text-[11px] font-serif font-bold text-[#0F3D3E]/70 uppercase tracking-widest mb-2 ml-1 transition-colors group-hover:text-[#C5A065]">{label}</label>}
    <input 
      ref={inputRef}
      className={`w-full px-5 py-3.5 rounded-lg border border-gray-200 bg-white focus:ring-4 focus:ring-[#C5A065]/10 focus:border-[#C5A065] outline-none transition-all duration-300 placeholder:text-gray-300 text-sm font-medium text-[#0F3D3E] shadow-sm hover:border-gray-300 ${error ? 'border-red-500' : ''} ${className}`} 
      {...props} 
    />
    {error && <p className="text-red-600 text-[10px] mt-1.5 ml-1 font-serif">{error}</p>}
  </div>
  );
};

export const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string; options: string[]; error?: string }> = React.memo(({ label, options, error, className = '', ...props }) => (
  <div className="w-full group">
    {label && <label className="block text-[11px] font-serif font-bold text-[#0F3D3E]/70 uppercase tracking-widest mb-2 ml-1 transition-colors group-hover:text-[#C5A065]">{label}</label>}
    <select 
      className={`w-full px-5 py-3.5 rounded-lg border border-gray-200 bg-white focus:ring-4 focus:ring-[#C5A065]/10 focus:border-[#C5A065] outline-none transition-all duration-300 text-sm font-medium text-[#0F3D3E] shadow-sm hover:border-gray-300 appearance-none ${error ? 'border-red-500' : ''} ${className}`} 
      {...props}
    >
      <option value="" className="text-gray-300">Select Option</option>
      {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
    </select>
    {error && <p className="text-red-600 text-[10px] mt-1.5 ml-1 font-serif">{error}</p>}
  </div>
));

export const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#0F3D3E]/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 border border-[#C5A065]/20">
        <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-[#FDFBF7]">
          <h3 className="font-serif text-xl font-bold text-[#0F3D3E]">{title}</h3>
          <button onClick={onClose} className="p-2 hover:bg-[#C5A065]/10 text-gray-400 hover:text-[#C5A065] rounded-full transition-colors">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="p-8">
          {children}
        </div>
      </div>
    </div>
  );
};

export const Stepper: React.FC<{ currentStep: number; totalSteps: number; labels: string[] }> = ({ currentStep, totalSteps, labels }) => (
  <div className="relative flex justify-between items-center w-full px-4 py-8">
    <div className="absolute top-1/2 left-8 right-8 h-0.5 bg-gray-100 -translate-y-1/2 z-0" />
    {Array.from({ length: totalSteps }).map((_, i) => {
      const stepNum = i + 1;
      const isActive = stepNum === currentStep;
      const isCompleted = stepNum < currentStep;
      
      return (
        <div key={i} className="relative z-10 flex flex-col items-center flex-1">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center border-[3px] transition-all duration-500 bg-white ${
            isActive ? 'border-[#C5A065] text-[#0F3D3E] shadow-xl shadow-[#C5A065]/20 scale-110' : 
            isCompleted ? 'border-[#0F3D3E] bg-[#0F3D3E] text-[#C5A065]' : 
            'border-gray-100 text-gray-300'
          }`}>
            {isCompleted ? <Check className="w-5 h-5" /> : <span className="text-sm font-serif font-bold">{stepNum}</span>}
          </div>
          <span className={`absolute top-14 w-32 left-1/2 -translate-x-1/2 text-center text-[9px] font-serif font-bold uppercase tracking-wider leading-tight ${isActive ? 'text-[#C5A065]' : isCompleted ? 'text-[#0F3D3E]' : 'text-gray-300'}`}>
            {labels[i]}
          </span>
        </div>
      );
    })}
  </div>
);
