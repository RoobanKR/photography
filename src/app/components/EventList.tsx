"use client";

import { MapPin, Calendar, Edit2, Trash2, QrCode } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function EventList({ events, onEdit, onDelete, onDownloadQR }) {

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20';
      case 'expired':
        return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20';
      default:
        // Default matches the Slate/Blue theme
        return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700';
    }
  };

  // --- Empty State (Blue Theme) ---
  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center bg-white dark:bg-zinc-950 rounded-2xl border border-dashed border-slate-300 dark:border-zinc-800">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-full mb-4">
          <Calendar className="w-8 h-8 text-blue-500 dark:text-blue-400" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">No events found</h3>
        <p className="text-slate-500 dark:text-zinc-400 mt-1 max-w-sm">
          Your schedule is clear. Create your first event to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
       {/* List Header - Slate Text */}
       <div className="hidden md:flex px-4 pb-2 text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
          <div className="w-20">Date</div>
          <div className="flex-1">Event Details</div>
          <div className="w-32">Status</div>
          <div className="w-32 text-right">Actions</div>
       </div>

      <AnimatePresence>
        {events.map((event, index) => {
          const eventDate = new Date(event.eventDate);
          
          return (
            <motion.div
              key={event._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`
                group relative flex flex-col md:flex-row md:items-center gap-4 p-4 rounded-xl transition-all duration-200
                bg-white dark:bg-zinc-900/50 
                border border-slate-200 dark:border-zinc-800
                
                /* --- BLUE THEME HOVER STATES --- */
                hover:border-blue-300 dark:hover:border-blue-700
                hover:bg-blue-50/50 dark:hover:bg-blue-900/10
                hover:shadow-md hover:shadow-blue-900/5 dark:hover:shadow-none
              `}
            >
              
              {/* 1. Date Badge (Slate & Blue) */}
              <div className="flex flex-row md:flex-col items-center justify-center md:w-20 md:h-16 h-12 w-full bg-slate-50 dark:bg-zinc-800 rounded-lg border border-slate-200 dark:border-zinc-700 shrink-0 group-hover:border-blue-200 dark:group-hover:border-blue-800 transition-colors">
                <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-zinc-400 md:mb-0.5 mr-2 md:mr-0 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                  {eventDate.toLocaleString('default', { month: 'short' })}
                </span>
                <span className="text-xl md:text-2xl font-bold text-slate-800 dark:text-white leading-none">
                  {eventDate.getDate()}
                </span>
                <span className="text-[10px] text-slate-400 md:hidden ml-auto">
                    {eventDate.getFullYear()}
                </span>
              </div>

              {/* 2. Event Info */}
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <div className="flex items-center justify-between md:justify-start gap-3">
                   <h3 className="font-bold text-slate-800 dark:text-white text-lg truncate group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">
                     {event.eventName}
                   </h3>
                   {/* Mobile Status */}
                   <span className={`md:hidden px-2 py-0.5 text-[10px] font-semibold rounded-full border ${getStatusColor(event.status)}`}>
                      {event.status || 'Active'}
                   </span>
                </div>
                
                <div className="flex flex-col gap-1 mt-1">
                  <div className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-zinc-400">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-500 transition-colors" />
                    <span className="truncate">{event.eventPlace}</span>
                  </div>
                  <p className="text-xs text-slate-400 dark:text-zinc-500 truncate max-w-md">
                    {event.description}
                  </p>
                </div>
              </div>

              {/* 3. Status Badge (Desktop) */}
              <div className="hidden md:flex w-32 justify-start">
                 <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${getStatusColor(event.status || 'active')}`}>
                    {(event.status || 'Active').toUpperCase()}
                 </span>
              </div>

              {/* 4. Actions Area */}
              <div className="flex items-center justify-between md:justify-end gap-3 w-full md:w-auto mt-2 md:mt-0 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-zinc-800">
                
                {/* QR Code Action (Blue Theme) */}
                {event.qrCode ? (
                   <button
                    onClick={() => onDownloadQR(event.qrCode, event.eventName)}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 rounded-md border border-blue-100 dark:border-blue-500/20 hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span className="md:hidden lg:inline">QR Code</span>
                  </button>
                ) : (
                  <span className="text-xs text-slate-300 dark:text-zinc-600 italic">No QR</span>
                )}

                <div className="flex items-center gap-1 bg-white dark:bg-zinc-800 rounded-lg border border-slate-200 dark:border-zinc-700 p-1 shadow-sm">
                  <button
                    onClick={() => onEdit(event)}
                    className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
                    title="Edit"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <div className="w-px h-4 bg-slate-200 dark:bg-zinc-700" />
                  <button
                    onClick={() => onDelete(event._id)}
                    className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-md transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}