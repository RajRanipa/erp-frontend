'use client';
import React, { useRef, useEffect, useState } from 'react';
import { cn } from '../../utils/cn';
import { downArrow, upArrow } from '@/utils/SVG';

const PresetDropdown = ({ 
  displayValue, 
  onSelect, 
  isOpen, 
  setIsOpen, 
  options, 
  error, 
  className,
  selectedPreset,
  specificDate,
  onSpecificDateChange,
  placeholder
}) => {
  const dropdownRef = useRef(null);
  const listRef = useRef(null); // NEW: Ref for the scrollable list
  
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [setIsOpen]);

  // Reset highlight when dropdown closes
  useEffect(() => {
    if (!isOpen) {
      setHighlightedIndex(-1);
    }
  }, [isOpen]);

  // NEW: Auto-scroll to highlighted item
  useEffect(() => {
    if (isOpen && highlightedIndex >= 0 && listRef.current) {
      const listElement = listRef.current;
      const highlightedItem = listElement.children[highlightedIndex];
      
      if (highlightedItem) {
        // 'nearest' ensures it only scrolls if the item is currently out of view
        highlightedItem.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex, isOpen]);

  // Handle Keyboard Navigation
  const handleKeyDown = (e) => {
    if (!isOpen && (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      setIsOpen(true);
      return;
    }

    if (isOpen) {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setHighlightedIndex((prev) => (prev < options.length - 1 ? prev + 1 : prev));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (highlightedIndex >= 0 && highlightedIndex < options.length) {
            onSelect(options[highlightedIndex].value);
            setIsOpen(false);
          }
          break;
        case 'Escape':
          e.preventDefault();
          setIsOpen(false);
          break;
        default:
          break;
      }
    }
  };

  const baseInputClass = `block w-full pl-10 pr-3 py-2 border sm:text-sm rounded-lg shadow-xs focus:outline-none focus:border-0.5 focus:ring-3 text-most-text transition-all bg-transparent`;
  const stateClass = error
    ? 'border-error focus:ring-error focus:border-error'
    : 'border-white-200 focus:ring-blue-500/30 focus:border-blue-500';

  return (
    <div className="relative flex items-center w-full" ref={dropdownRef}>
      {/* Dropdown Toggle Button */}
      <button
        type="button"
        tabIndex="-1" 
        className="absolute inset-y-0 left-0 pl-3 flex items-center text-white-300 z-10"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
      >
        {isOpen ? upArrow() : downArrow()}
      </button>

      {/* Conditionally render Date Input OR Text Input based on selection */}
      {selectedPreset === 'today' ? (
        <input
          type="date"
          value={specificDate || ''}
          onChange={(e) => onSpecificDateChange(e.target.value)}
          className={cn(baseInputClass, stateClass, className)}
        />
      ) : (
        <input
          type="text"
          readOnly
          value={displayValue || ''}
          placeholder={placeholder || "Select a time range..."}
          onClick={() => setIsOpen(true)}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setIsOpen(false)} // <-- ADDED: Closes on Tab out
          onKeyDown={handleKeyDown} 
          className={cn(baseInputClass, stateClass, 'cursor-pointer placeholder-white-400', className)}
        />
      )}

      {/* Dropdown Menu */}
      {isOpen && (
        <div tabIndex="-1"  className="absolute top-full left-0 z-50 w-full mt-1 bg-black-200 border border-white-200 overflow-hidden shadow-lg rounded-lg backdrop-blur-2xl">
          <ul 
            className="overflow-y-auto w-full p-1.5 max-h-52" 
            ref={listRef} // <-- ADDED Ref for scrolling
          >
            {options.map((item, index) => (
              <li
                key={item.value}
                onMouseEnter={() => setHighlightedIndex(index)}
                // CHANGED: Use onMouseDown instead of onClick + preventDefault
                onMouseDown={(e) => {
                  e.preventDefault(); // Prevents input from losing focus, killing the onBlur bug!
                  onSelect(item.value);
                  setIsOpen(false);
                }}
                className={cn(
                  "px-3 py-2 rounded cursor-pointer text-sm text-primary-text transition-colors",
                  highlightedIndex === index ? "bg-black-300" : "hover:bg-black-300"
                )}
              >
                {item.label}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default PresetDropdown;