import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { Button } from './ui/button';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="relative w-9 h-9 rounded-lg hover:bg-accent"
      aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
    >
      <Sun 
        className="absolute rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" 
        size={20} 
      />
      <Moon 
        className="absolute rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" 
        size={20} 
      />
    </Button>
  );
}

