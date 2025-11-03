import React, { useState, useRef, useEffect } from 'react';
import { PaintBrushIcon } from './IconComponents';

interface ThemePickerProps {
  currentTheme: string;
  onChangeTheme: (color: string) => void;
}

const THEME_COLORS = [
  '#4f46e5', // Indigo
  '#0d9488', // Teal
  '#db2777', // Fuchsia
  '#ca8a04', // Amber
  '#16a34a', // Green
  '#dc2626', // Red
  '#6d28d9', // Violet
  '#ea580c', // Orange
];

const ThemePicker: React.FC<ThemePickerProps> = ({ currentTheme, onChangeTheme }) => {
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

  const handleColorSelect = (color: string) => {
    onChangeTheme(color);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={pickerRef}>
      <button
        onClick={() => setIsOpen(prev => !prev)}
        className="p-2 rounded-full hover:bg-slate-700/50 transition-colors"
        aria-label="Change theme color"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <PaintBrushIcon className="w-6 h-6 text-slate-300" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-slate-900/80 backdrop-blur-lg border border-slate-700/80 rounded-lg shadow-2xl shadow-black/30 z-20 p-4 animate-fade-in origin-top-right">
          <p className="text-sm font-semibold text-slate-200 mb-3">Select a Theme</p>
          <div className="grid grid-cols-4 gap-2">
            {THEME_COLORS.map(color => (
              <button
                key={color}
                onClick={() => handleColorSelect(color)}
                className={`w-8 h-8 rounded-full transition-transform transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-white/50 ${
                  currentTheme.toLowerCase() === color.toLowerCase() ? 'ring-2 ring-offset-2 ring-offset-slate-800 ring-brand-primary' : ''
                }`}
                style={{ 
                  backgroundColor: color,
                  boxShadow: currentTheme.toLowerCase() === color.toLowerCase() ? `0 0 10px ${color}` : 'none'
                }}
                aria-label={`Select ${color} theme`}
              ></button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ThemePicker;