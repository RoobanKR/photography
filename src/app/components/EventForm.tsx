"use client";

import { useState, useEffect } from 'react';
import { Calendar, MapPin, Type, AlignLeft, Clock, ChevronRight, LayoutGrid } from 'lucide-react';

export default function EventForm({ onSubmit, onCancel, initialData }) {
  const [formData, setFormData] = useState({
    eventName: '',
    description: '',
    eventDate: '',
    eventPlace: '',
    expiryDate: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        eventName: initialData.eventName || '',
        description: initialData.description || '',
        eventDate: initialData.eventDate ? new Date(initialData.eventDate).toISOString().split('T')[0] : '',
        eventPlace: initialData.eventPlace || '',
        expiryDate: initialData.expiryDate ? new Date(initialData.expiryDate).toISOString().split('T')[0] : '',
      });
    }
  }, [initialData]);

  const validateForm = () => {
    const newErrors = {};
    const today = new Date().toISOString().split('T')[0];

    if (!formData.eventName.trim()) newErrors.eventName = 'Event name is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.eventDate) newErrors.eventDate = 'Event date is required';
    if (!formData.eventPlace.trim()) newErrors.eventPlace = 'Event place is required';
    if (!formData.expiryDate) newErrors.expiryDate = 'Expiry date is required';

    if (formData.eventDate < today) {
      newErrors.eventDate = 'Event date cannot be in the past';
    }

    if (formData.expiryDate < formData.eventDate) {
      newErrors.expiryDate = 'Expiry date must be after event date';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="w-full">
      
      {/* --- Header Section --- */}
      <div className="mb-6">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs font-medium text-slate-400 dark:text-zinc-500 mb-3">
          <span className="flex items-center gap-1 hover:text-slate-600 dark:hover:text-zinc-300 transition-colors cursor-pointer">
            <LayoutGrid className="w-3 h-3" /> Dashboard
          </span>
          <ChevronRight className="w-3 h-3" />
          <span className="hover:text-slate-600 dark:hover:text-zinc-300 transition-colors cursor-pointer">
            Events
          </span>
          <ChevronRight className="w-3 h-3" />
          <span className="text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-full">
            {initialData ? 'Edit Details' : 'New Entry'}
          </span>
        </div>

        {/* Title & Subtitle */}
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            {initialData ? 'Update Event Details' : 'Create New Event'}
          </h2>
          <p className="text-sm text-slate-500 dark:text-zinc-400">
            {initialData 
              ? 'Modify the details below to update your existing event.' 
              : 'Fill in the information below to schedule and publish a new event.'}
          </p>
        </div>

        {/* Divider */}
        <div className="h-px w-full bg-slate-100 dark:bg-zinc-800 mt-5 mb-1" />
      </div>

      {/* --- Form Section --- */}
      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* Row 1: Event Name */}
        <div className="space-y-1">
          <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
            <Type className="w-3.5 h-3.5" /> Event Name
          </label>
          <input
            type="text"
            name="eventName"
            value={formData.eventName}
            onChange={handleChange}
            className={`
              w-full px-3 py-2.5 rounded-lg text-sm
              bg-slate-50 dark:bg-zinc-900 
              border border-slate-200 dark:border-zinc-800 
              text-slate-900 dark:text-white placeholder-slate-400 
              focus:outline-none focus:bg-white dark:focus:bg-black
              focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 
              transition-all duration-200
              ${errors.eventName ? 'border-red-500 focus:ring-red-500/10' : ''}
            `}
            placeholder="e.g. Annual Tech Conference 2024"
          />
          {errors.eventName && <p className="text-[11px] text-red-500 font-medium mt-0.5">{errors.eventName}</p>}
        </div>

        {/* Row 2: Dates Grid (Compact) */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
              <Calendar className="w-3.5 h-3.5" /> Event Date
            </label>
            {/* Fixed: Added 'cursor-pointer' and specific onClick handler 
                to ensure calendar opens on click anywhere on the input 
            */}
            <input
              type="date"
              name="eventDate"
              value={formData.eventDate}
              onChange={handleChange}
              onClick={(e) => e.target.showPicker && e.target.showPicker()} // Force show picker on click
              min={today}
              className={`
                w-full px-3 py-2.5 rounded-lg text-sm cursor-pointer
                bg-slate-50 dark:bg-zinc-900 
                border border-slate-200 dark:border-zinc-800 
                text-slate-900 dark:text-white 
                focus:outline-none focus:bg-white dark:focus:bg-black
                focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 
                transition-all duration-200
                ${errors.eventDate ? 'border-red-500' : ''}
              `}
            />
            {errors.eventDate && <p className="text-[11px] text-red-500 font-medium mt-0.5">{errors.eventDate}</p>}
          </div>

          <div className="space-y-1">
            <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
              <Clock className="w-3.5 h-3.5" /> Expiry Date
            </label>
            {/* Fixed: Added 'cursor-pointer' and specific onClick handler 
                to ensure calendar opens on click anywhere on the input 
            */}
            <input
              type="date"
              name="expiryDate"
              value={formData.expiryDate}
              onChange={handleChange}
              onClick={(e) => e.target.showPicker && e.target.showPicker()} // Force show picker on click
              min={formData.eventDate || today}
              className={`
                w-full px-3 py-2.5 rounded-lg text-sm cursor-pointer
                bg-slate-50 dark:bg-zinc-900 
                border border-slate-200 dark:border-zinc-800 
                text-slate-900 dark:text-white 
                focus:outline-none focus:bg-white dark:focus:bg-black
                focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 
                transition-all duration-200
                ${errors.expiryDate ? 'border-red-500' : ''}
              `}
            />
            {errors.expiryDate && <p className="text-[11px] text-red-500 font-medium mt-0.5">{errors.expiryDate}</p>}
          </div>
        </div>

        {/* Row 3: Venue */}
        <div className="space-y-1">
          <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
            <MapPin className="w-3.5 h-3.5" /> Venue
          </label>
          <input
            type="text"
            name="eventPlace"
            value={formData.eventPlace}
            onChange={handleChange}
            className={`
              w-full px-3 py-2.5 rounded-lg text-sm
              bg-slate-50 dark:bg-zinc-900 
              border border-slate-200 dark:border-zinc-800 
              text-slate-900 dark:text-white placeholder-slate-400 
              focus:outline-none focus:bg-white dark:focus:bg-black
              focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 
              transition-all duration-200
              ${errors.eventPlace ? 'border-red-500' : ''}
            `}
            placeholder="e.g. Grand Hall, NYC"
          />
          {errors.eventPlace && <p className="text-[11px] text-red-500 font-medium mt-0.5">{errors.eventPlace}</p>}
        </div>

        {/* Row 4: Description */}
        <div className="space-y-1">
          <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
            <AlignLeft className="w-3.5 h-3.5" /> Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            className={`
              w-full px-3 py-2.5 rounded-lg text-sm
              bg-slate-50 dark:bg-zinc-900 
              border border-slate-200 dark:border-zinc-800 
              text-slate-900 dark:text-white placeholder-slate-400 
              focus:outline-none focus:bg-white dark:focus:bg-black
              focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 
              transition-all duration-200 resize-none
              ${errors.description ? 'border-red-500 focus:ring-red-500/10' : ''}
            `}
            placeholder="Brief details regarding the event schedule..."
          />
          {errors.description && <p className="text-[11px] text-red-500 font-medium mt-0.5">{errors.description}</p>}
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-zinc-800 mt-6">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 rounded-lg text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/10 font-bold transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg font-bold shadow-lg shadow-blue-600/20 dark:shadow-blue-900/20 active:scale-95 transition-all duration-200 flex items-center gap-2"
          >
            {initialData ? 'Save Changes' : 'Create Event'}
          </button>
        </div>
      </form>
    </div>
  );
}