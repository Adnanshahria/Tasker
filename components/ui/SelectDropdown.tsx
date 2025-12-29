import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SelectDropdownProps {
    value: string;
    options: { value: string; label: string }[];
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
}

const SelectDropdown: React.FC<SelectDropdownProps> = ({
    value,
    options,
    onChange,
    placeholder = 'Select...',
    className = ''
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find(o => o.value === value);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (optionValue: string) => {
        onChange(optionValue);
        setIsOpen(false);
    };

    return (
        <div ref={dropdownRef} className={`relative ${className}`}>
            {/* Trigger Button */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`
                    flex items-center justify-between gap-2 
                    bg-slate-800/80 hover:bg-slate-700/80 
                    border border-slate-600/50 hover:border-indigo-500/50
                    rounded-xl px-3 py-2 
                    text-sm text-white 
                    cursor-pointer transition-all
                    min-w-[100px] md:min-w-[120px]
                    ${isOpen ? 'border-indigo-500/50 ring-1 ring-indigo-500/30' : ''}
                `}
            >
                <span className={selectedOption ? 'text-white' : 'text-slate-400'}>
                    {selectedOption?.label || placeholder}
                </span>
                <ChevronDown
                    size={14}
                    className={`text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                />
            </button>

            {/* Dropdown Menu */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute z-50 top-full left-0 mt-1 w-full min-w-[140px] 
                                   bg-gradient-to-br from-slate-800 to-slate-900 
                                   border border-indigo-500/30 rounded-xl 
                                   shadow-xl shadow-black/30 overflow-hidden"
                    >
                        <div className="max-h-[200px] overflow-y-auto custom-scrollbar py-1">
                            {options.map((option, idx) => {
                                const isSelected = option.value === value;
                                return (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={() => handleSelect(option.value)}
                                        className={`
                                            w-full flex items-center justify-between gap-2 
                                            px-3 py-2 text-sm text-left
                                            transition-colors
                                            ${isSelected
                                                ? 'bg-indigo-500/20 text-indigo-300'
                                                : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                                            }
                                        `}
                                    >
                                        <span>{option.label}</span>
                                        {isSelected && (
                                            <Check size={14} className="text-indigo-400" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default SelectDropdown;
