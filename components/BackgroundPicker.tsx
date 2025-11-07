import React, { useState, useRef, useEffect } from 'react';
import { PhotoIcon } from './IconComponents';

interface BackgroundPickerProps {
  currentBackground: string;
  onChangeBackground: (background: string) => void;
}

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

  const isCustomColor = currentBackground !== 'gradient';
  // Default to a dark slate color for the picker if the gradient is currently active
  const colorPickerValue = isCustomColor ? currentBackground : '#0f172a';

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
            <button
              onClick={() => onChangeBackground('gradient')}
              className={`w-full text-left text-sm p-2 rounded-md flex items-center gap-3 transition-colors hover:bg-slate-700/50 ${
                !isCustomColor ? 'bg-brand-primary/20' : ''
              }`}
            >
              <div className="w-5 h-5 rounded-full border border-slate-500 shrink-0 bg-animated-gradient"></div>
              <span className="text-slate-200">Animated Gradient</span>
            </button>
            
            <div className={`w-full text-left text-sm p-2 rounded-md flex items-center gap-3 transition-colors ${ isCustomColor ? 'bg-brand-primary/20' : 'hover:bg-slate-700/50' }`}>
                <label htmlFor="bg-color-picker" className="w-5 h-5 rounded-full border border-slate-500 shrink-0 cursor-pointer relative overflow-hidden" style={{ backgroundColor: colorPickerValue }}>
                    <input
                        id="bg-color-picker"
                        type="color"
                        value={colorPickerValue}
                        onChange={(e) => onChangeBackground(e.target.value)}
                        className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
                    />
                </label>
                <span className="text-slate-200">Custom Color</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BackgroundPicker;
