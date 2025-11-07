import React, { useState, useRef, useEffect } from 'react';
import { UserIcon, ArrowRightOnRectangleIcon } from './IconComponents';

interface UserMenuProps {
  user: {
    name: string;
    email: string;
  };
  onLogout: () => void;
}

const UserMenu: React.FC<UserMenuProps> = ({ user, onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(prev => !prev)}
        className="p-2 rounded-full hover:bg-slate-700/50 transition-colors"
        aria-label="User menu"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <UserIcon className="w-6 h-6 text-slate-300" />
      </button>

      {isOpen && (
        <div className="glass-panel glass-panel-popover absolute right-0 mt-2 w-64 rounded-lg shadow-2xl shadow-black/30 z-20 p-2 animate-fade-in origin-top-right">
          <div className="px-3 py-2 border-b border-slate-700/80">
            <p className="text-sm font-semibold text-slate-100 truncate">{user.name}</p>
            <p className="text-xs text-slate-400 truncate">{user.email}</p>
          </div>
          <button
            onClick={() => {
              onLogout();
              setIsOpen(false);
            }}
            className="w-full flex items-center gap-3 px-3 py-2 mt-1 text-sm rounded-md text-slate-200 hover:bg-slate-700/50 transition-colors"
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default UserMenu;
