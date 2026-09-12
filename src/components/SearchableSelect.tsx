import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, ChevronDown, Check, X } from 'lucide-react';
import './SearchableSelect.css';

interface SearchableSelectProps {
  id?: string;
  label?: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  hint?: string;
  error?: string;
  className?: string;
  labelClassName?: string;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  id,
  label,
  options,
  value,
  onChange,
  placeholder = 'Select an option...',
  required = false,
  disabled = false,
  hint,
  error,
  className = '',
  labelClassName = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter options based on query
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options;
    const query = searchQuery.toLowerCase().trim();
    return options.filter((opt) => opt.toLowerCase().includes(query));
  }, [options, searchQuery]);

  // Scroll active/highlighted item into view
  useEffect(() => {
    if (isOpen && highlightedIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll('li');
      if (items[highlightedIndex]) {
        items[highlightedIndex].scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex, isOpen]);

  const handleSelect = (option: string) => {
    onChange(option);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < filteredOptions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : filteredOptions.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
        handleSelect(filteredOptions[highlightedIndex]);
      } else if (filteredOptions.length === 1) {
        handleSelect(filteredOptions[0]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      setSearchQuery('');
    }
  };

  const clearSelection = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setSearchQuery('');
    if (inputRef.current) inputRef.current.focus();
  };

  return (
    <div className={`resq-searchable-select-container ${className}`} ref={containerRef}>
      {label && (
        <label
          htmlFor={id}
          className={`resq-searchable-select-label ${labelClassName}`}
        >
          {label} {required && <span style={{ color: '#EF4444' }}>*</span>}
        </label>
      )}

      {/* Input / Combobox Trigger */}
      <div
        className={`resq-searchable-select-wrapper ${isOpen ? 'is-open' : ''} ${
          error ? 'is-error' : ''
        } ${disabled ? 'is-disabled' : ''}`}
        onClick={() => {
          if (!disabled) {
            setIsOpen(true);
            if (inputRef.current) inputRef.current.focus();
          }
        }}
      >
        <div className="resq-searchable-select-icon-left">
          <Search size={15} />
        </div>

        <input
          ref={inputRef}
          id={id}
          type="text"
          disabled={disabled}
          value={isOpen ? searchQuery : value}
          placeholder={isOpen ? (value || placeholder) : (value || placeholder)}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
            setHighlightedIndex(0);
          }}
          onFocus={() => {
            setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          className="resq-searchable-select-input"
          autoComplete="off"
        />

        <div className="resq-searchable-select-actions">
          {value && !disabled && (
            <button
              type="button"
              onClick={clearSelection}
              className="resq-searchable-select-clear-btn"
              title="Clear selection"
            >
              <X size={12} />
            </button>
          )}
          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.stopPropagation();
              if (!disabled) {
                setIsOpen(!isOpen);
                if (!isOpen && inputRef.current) inputRef.current.focus();
              }
            }}
            className={`resq-searchable-select-chevron-btn ${isOpen ? 'is-rotated' : ''}`}
          >
            <ChevronDown size={15} />
          </button>
        </div>
      </div>

      {hint && !error && <p className="resq-searchable-select-hint">{hint}</p>}
      {error && <p className="resq-searchable-select-error">{error}</p>}

      {/* Floating Dropdown List */}
      {isOpen && (
        <div className="resq-searchable-select-dropdown">
          <div className="resq-searchable-select-dropdown-header">
            <span>
              {filteredOptions.length} {filteredOptions.length === 1 ? 'part' : 'body parts'} available
            </span>
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="resq-searchable-select-clear-filter"
              >
                Clear filter
              </button>
            )}
          </div>

          <ul ref={listRef} className="resq-searchable-select-list" role="listbox">
            {filteredOptions.length === 0 ? (
              <li className="resq-searchable-select-empty">
                No matching results found for "{searchQuery}"
              </li>
            ) : (
              filteredOptions.map((option, index) => {
                const isSelected = option === value;
                const isHighlighted = index === highlightedIndex;

                return (
                  <li
                    key={option}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(option)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={`resq-searchable-select-item ${
                      isSelected ? 'is-selected' : ''
                    } ${isHighlighted ? 'is-highlighted' : ''}`}
                  >
                    <span>{option}</span>
                    {isSelected && <Check size={14} style={{ color: '#0A7E64' }} />}
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
};
