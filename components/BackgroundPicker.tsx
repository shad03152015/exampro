import React, { useState, useRef, useEffect } from 'react';
import { PhotoIcon } from './IconComponents';

interface BackgroundPickerProps {
  currentBackground: string;
  onChangeBackground: (background: string) => void;
}

const BACKGROUND_OPTIONS = [
  { value: 'gradient', label: 'Animated Gradient', isGradient: true },
  { value: '#000000', label: 'Black' },
  { value: '#FFFFFF', label: 'White' },
  { value: '#1e293b', label: 'Slate' },
  { value: '#312e81', label: 'Indigo' },
];

const BackgroundPicker: React.FC<BackgroundPickerProps> = ({ currentBackground, onChangeBackground }) => {
  const [isOpen, setIsOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSelect = (value: string) => {
    onChangeBackground(value);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={pickerRef}>
      <button
        onClick={() => setIsOpen(prev => !prev)}
        className="p-2 rounded-full hover:bg-slate-700/50 transition-colors"
        aria-label="Change background"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <PhotoIcon className="w-6 h-6 text-slate-300" />
      </button>

      {isOpen && (
        <div className="glass-panel glass-panel-popover absolute right-0 mt-2 w-52 rounded-lg shadow-2xl shadow-black/30 z-20 p-4 animate-fade-in origin-top-right">
          <p className="text-sm font-semibold text-slate-200 mb-3">Select Background</p>
          <div className="space-y-2">
            {BACKGROUND_OPTIONS.map(option => (
              <button
                key={option.value}
                onClick={() => handleSelect(option.value)}
                className={`w-full text-left text-sm p-2 rounded-md flex items-center gap-3 transition-colors hover:bg-slate-700/50 ${
                  currentBackground === option.value ? 'bg-brand-primary/20' : ''
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full border border-slate-500 shrink-0 ${option.isGradient ? 'bg-animated-gradient' : ''}`}
                  style={{ backgroundColor: option.isGradient ? undefined : option.value }}
                ></div>
                <span className="text-slate-200">{option.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BackgroundPicker;