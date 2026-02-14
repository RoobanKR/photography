"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Calendar, 
  MapPin, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  QrCode, 
  X,
  Clock,
  Loader2,
  LayoutGrid,
  List,
  ChevronRight,
  Home,
  ArrowLeft,
  ArrowRight,
  Filter,
  CheckCircle2,
  UploadCloud, 
  FileVideo,
  FileImage,
  File as FileIcon,
  FolderUp,
  FileUp,
  Folder,
  Eye,
  Download,
  ExternalLink,
  CheckSquare,
  Square,
  AlertCircle,
  Shield,
  ShieldAlert,
  TriangleAlert,
  AlertTriangle,
  Users,
  BarChart3,
  Sparkles
} from "lucide-react";

import EventForm from "../../components/EventForm"; 
import AdminLayout from "@/app/components/AdminLayout";

// --- INTERFACES ---
interface MediaFile {
  _id?: string;
  publicId: string;
  url: string;
  type: 'image' | 'video' | 'document';
  originalName: string;
  size: number;
  format: string;
  folderPath?: string;
  uploadedAt: string;
}

interface Event {
  _id: string;
  eventName: string;   
  eventDate: string;   
  eventPlace: string;  
  description: string;
  qrCode?: string;
  status?: string;
  expiryDate?: string;
  mediaFiles?: MediaFile[];
  [key: string]: any;
}

interface User {
  name: string;
  email: string;
}

// --- UTILITY: FORMAT BYTES ---
const formatBytes = (bytes: number, decimals = 2) => {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

// --- SUB-COMPONENT: ENHANCED DELETE CONFIRMATION MODAL ---
const DeleteConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  eventName,
  mediaCount = 0,
  isMediaDelete = false,
  fileName = ""
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onConfirm: () => void; 
  eventName: string;
  mediaCount?: number;
  isMediaDelete?: boolean;
  fileName?: string;
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [shake, setShake] = useState(false);
  const [confirmationText, setConfirmationText] = useState("");
  const [userInput, setUserInput] = useState("");
  const [showNuclearOption, setShowNuclearOption] = useState(false);

  const handleConfirm = async () => {
    if (isMediaDelete && !showNuclearOption) {
      // For single media deletion, just confirm
      setIsDeleting(true);
      try {
        await onConfirm();
        onClose();
      } catch (error) {
        console.error("Delete error:", error);
      } finally {
        setIsDeleting(false);
      }
    } else {
      // For event deletion or nuclear media deletion
      if (userInput.toLowerCase() !== confirmationText.toLowerCase()) {
        setShake(true);
        setTimeout(() => setShake(false), 500);
        return;
      }
      
      setIsDeleting(true);
      try {
        await onConfirm();
        onClose();
      } catch (error) {
        console.error("Delete error:", error);
      } finally {
        setIsDeleting(false);
        setUserInput("");
        setShowNuclearOption(false);
      }
    }
  };

  const handleCancel = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
    setTimeout(() => {
      onClose();
      setUserInput("");
      setShowNuclearOption(false);
    }, 300);
  };

  useEffect(() => {
    if (isOpen) {
      if (isMediaDelete && !showNuclearOption) {
        setConfirmationText("");
      } else {
        setConfirmationText(`delete ${isMediaDelete ? "all media" : eventName}`);
      }
    }
  }, [isOpen, eventName, isMediaDelete, showNuclearOption]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl"
            onClick={handleCancel}
          >
            {/* Animated Particles */}
            <div className="absolute inset-0 overflow-hidden">
              {[...Array(15)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ 
                    opacity: 0,
                    scale: 0,
                    x: Math.random() * window.innerWidth,
                    y: Math.random() * window.innerHeight
                  }}
                  animate={{ 
                    opacity: [0, 0.8, 0],
                    scale: [0, 1, 0],
                    x: Math.random() * window.innerWidth,
                    y: Math.random() * window.innerHeight
                  }}
                  transition={{ 
                    duration: 2 + Math.random() * 2,
                    repeat: Infinity,
                    delay: i * 0.2
                  }}
                  className="absolute w-1 h-1 bg-red-500/30 rounded-full"
                />
              ))}
            </div>

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 40 }}
              transition={{ 
                type: "spring", 
                stiffness: 400, 
                damping: 25 
              }}
              className="relative w-full max-w-lg bg-gradient-to-br from-gray-900 to-black rounded-3xl shadow-2xl overflow-hidden border border-red-900/50"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Glowing Header */}
              <div className="relative p-8 pb-6 overflow-hidden">
                {/* Animated Background Glow */}
                <motion.div
                  animate={{ 
                    rotate: 360,
                    scale: [1, 1.2, 1]
                  }}
                  transition={{ 
                    rotate: { duration: 20, repeat: Infinity, ease: "linear" },
                    scale: { duration: 2, repeat: Infinity }
                  }}
                  className="absolute -top-32 -left-32 w-64 h-64 bg-gradient-to-r from-red-900/20 via-orange-900/10 to-transparent rounded-full blur-3xl"
                />
                
                {/* Warning Icon */}
                <motion.div
                  animate={{ 
                    scale: [1, 1.1, 1],
                    rotate: [0, -5, 5, -5, 0]
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    repeatDelay: 1
                  }}
                  className="relative mx-auto w-20 h-20 mb-4"
                >
                  <div className="absolute inset-0 bg-red-500/20 blur-xl rounded-full animate-pulse"></div>
                  <div className="relative w-full h-full bg-gradient-to-br from-red-600 to-orange-600 rounded-full flex items-center justify-center shadow-2xl">
                    <ShieldAlert className="w-10 h-10 text-white" />
                  </div>
                  
                  {/* Pulsing Ring */}
                  <motion.div
                    animate={{ 
                      scale: [1, 1.5, 1],
                      opacity: [0.3, 0, 0.3]
                    }}
                    transition={{ 
                      duration: 2,
                      repeat: Infinity 
                    }}
                    className="absolute inset-0 border-2 border-red-500/50 rounded-full"
                  />
                </motion.div>

                <div className="text-center relative z-10">
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent mb-2">
                    {isMediaDelete ? (showNuclearOption ? "Nuclear Media Delete" : "Delete Media File") : "Delete Event"}
                  </h3>
                  <p className="text-gray-400 text-sm">
                    {isMediaDelete 
                      ? (showNuclearOption 
                        ? "This will permanently delete ALL media files"
                        : `Delete "${fileName}"`)
                      : "This action is irreversible"}
                  </p>
                </div>
              </div>

              {/* Content */}
              <div className="px-8 pb-8">
                {/* Info Card */}
                <div className="relative overflow-hidden bg-gradient-to-b from-gray-800/50 to-gray-900/30 rounded-2xl p-6 mb-6 border border-gray-700/50">
                  {/* Background Pattern */}
                  <div className="absolute inset-0 opacity-5">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.1)_1px,transparent_0)] bg-[length:20px_20px]"></div>
                  </div>

                  <div className="relative">
                    <div className="flex items-center justify-center gap-3 mb-4">
                      <div className="p-3 bg-gradient-to-br from-red-900/30 to-orange-900/30 rounded-xl">
                        {isMediaDelete ? (
                          <FileImage className="w-6 h-6 text-orange-400" />
                        ) : (
                          <Calendar className="w-6 h-6 text-red-400" />
                        )}
                      </div>
                      <div className="text-center">
                        <h4 className="text-lg font-bold text-white">
                          {isMediaDelete ? (showNuclearOption ? "All Media Files" : fileName) : `"${eventName}"`}
                        </h4>
                        {!isMediaDelete && mediaCount > 0 && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center justify-center gap-2 mt-2"
                          >
                            <FileImage className="w-4 h-4 text-red-400" />
                            <span className="text-sm font-medium text-red-400">
                              + {mediaCount} media file{mediaCount !== 1 ? 's' : ''}
                            </span>
                          </motion.div>
                        )}
                        {isMediaDelete && showNuclearOption && mediaCount > 0 && (
                          <div className="mt-2">
                            <span className="text-sm font-medium text-red-400">
                              {mediaCount} files will be deleted
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-3 mt-4">
                      <div className="bg-gray-800/50 rounded-lg p-3 text-center">
                        <div className="text-xs text-gray-400 mb-1">Type</div>
                        <div className="text-sm font-semibold text-white">
                          {isMediaDelete ? 'Media File' : 'Event'}
                        </div>
                      </div>
                      <div className="bg-gray-800/50 rounded-lg p-3 text-center">
                        <div className="text-xs text-gray-400 mb-1">Impact</div>
                        <div className="text-sm font-semibold text-red-400">
                          {isMediaDelete ? 'Permanent' : 'Irreversible'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Warning Message */}
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="flex items-start gap-3 p-4 bg-gradient-to-r from-red-900/20 to-orange-900/10 border border-red-800/30 rounded-xl mb-6"
                >
                  <AlertTriangle className="w-5 h-5 text-orange-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-orange-300 mb-1">
                      Critical Action Required
                    </p>
                    <p className="text-xs text-orange-400/80">
                      {isMediaDelete 
                        ? (showNuclearOption
                          ? "This will permanently remove all media files from storage and database. Recovery is impossible."
                          : "This file will be permanently deleted from Cloudinary storage and removed from the event.")
                        : "All event data including analytics, media files, and QR codes will be permanently deleted."}
                    </p>
                  </div>
                </motion.div>

                {/* Confirmation Input (only for event deletion or nuclear media delete) */}
                {(!isMediaDelete || showNuclearOption) && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="mb-6"
                  >
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Type <span className="text-red-400 font-bold">{confirmationText}</span> to confirm:
                    </label>
                    <input
                      type="text"
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      className={`w-full px-4 py-3 bg-gray-800/50 border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all ${
                        shake ? 'border-red-500 shake-animation' : 'border-gray-700'
                      }`}
                      placeholder="Type the confirmation text..."
                      autoComplete="off"
                    />
                  </motion.div>
                )}

                {/* Nuclear Option for Media */}
                {isMediaDelete && !showNuclearOption && mediaCount > 1 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="mb-6"
                  >
                    <button
                      onClick={() => setShowNuclearOption(true)}
                      className="w-full p-4 bg-gradient-to-r from-red-900/30 to-orange-900/20 border border-red-800/30 rounded-xl hover:border-red-700/50 transition-all group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-red-900/50 rounded-lg">
                            <Trash2 className="w-5 h-5 text-red-400" />
                          </div>
                          <div className="text-left">
                            <p className="text-sm font-semibold text-white">Delete All Media</p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              Delete all {mediaCount} media files at once
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-red-400 transition-colors" />
                      </div>
                    </button>
                  </motion.div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="px-8 pb-8 flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCancel}
                  className={`flex-1 px-6 py-3 text-sm font-semibold rounded-xl transition-all ${
                    shake 
                      ? 'bg-gray-800 border border-red-500/50' 
                      : 'bg-gray-800 hover:bg-gray-700 border border-gray-700'
                  }`}
                >
                  <span className={`${shake ? 'text-red-400' : 'text-gray-300'}`}>
                    Cancel • Keep {isMediaDelete ? 'File' : 'Event'}
                  </span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleConfirm}
                  disabled={isDeleting || (!isMediaDelete && userInput.toLowerCase() !== confirmationText.toLowerCase())}
                  className="flex-1 px-6 py-3 text-sm font-semibold text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
                  style={{
                    background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
                    boxShadow: '0 4px 20px rgba(220, 38, 38, 0.4)'
                  }}
                >
                  {/* Animated Background */}
                  <motion.div
                    animate={{ x: [-100, 200] }}
                    transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 1 }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                  />
                  
                  {/* Button Content */}
                  <div className="relative z-10 flex items-center justify-center gap-2">
                    {isDeleting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Deleting...</span>
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4" />
                        <span>
                          {isMediaDelete 
                            ? (showNuclearOption ? 'Delete All Files' : 'Delete File')
                            : 'Delete Permanently'}
                        </span>
                      </>
                    )}
                  </div>
                  
                  {/* Warning Glow */}
                  {!isDeleting && (
                    <motion.div
                      animate={{ opacity: [0.3, 0.6, 0.3] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-orange-500/10"
                    />
                  )}
                </motion.button>
              </div>

              {/* Bottom Note */}
              <div className="px-8 pb-6">
                <div className="text-center text-xs text-gray-500 flex items-center justify-center gap-1">
                  <Shield className="w-3 h-3" />
                  <span>Secured by enterprise-grade encryption • Action logged for audit</span>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* CSS for shake animation */}
          <style jsx>{`
            @keyframes shake {
              0%, 100% { transform: translateX(0); }
              10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
              20%, 40%, 60%, 80% { transform: translateX(2px); }
            }
            .shake-animation {
              animation: shake 0.5s ease-in-out;
            }
          `}</style>
        </>
      )}
    </AnimatePresence>
  );
};

// --- SUB-COMPONENT: MEDIA MANAGEMENT MODAL ---
const MediaPreviewModal = ({ isOpen, onClose, mediaFiles, eventName, eventId, onMediaUpdate }: any) => {
  const [selectedMedia, setSelectedMedia] = useState<MediaFile | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'images' | 'videos' | 'documents'>('all');
  const [selectedMediaIds, setSelectedMediaIds] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectAll, setSelectAll] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [mediaToDelete, setMediaToDelete] = useState<{publicId: string, fileName: string} | null>(null);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);

  const filteredMedia = mediaFiles.filter((file: MediaFile) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'images') return file.type === 'image';
    if (activeTab === 'videos') return file.type === 'video';
    if (activeTab === 'documents') return file.type === 'document';
    return true;
  });

  // Update select all when filtered media changes
  useEffect(() => {
    if (selectAll) {
      setSelectedMediaIds(filteredMedia.map((file: MediaFile) => file.publicId));
    }
  }, [filteredMedia, selectAll]);

  const getMediaIcon = (type: string) => {
    switch(type) {
      case 'video': return <FileVideo className="w-5 h-5 text-rose-500" />;
      case 'image': return <FileImage className="w-5 h-5 text-emerald-500" />;
      default: return <FileIcon className="w-5 h-5 text-blue-500" />;
    }
  };

  const handleSelectMedia = (publicId: string) => {
    setSelectedMediaIds(prev => 
      prev.includes(publicId) 
        ? prev.filter(id => id !== publicId)
        : [...prev, publicId]
    );
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedMediaIds([]);
    } else {
      setSelectedMediaIds(filteredMedia.map((file: MediaFile) => file.publicId));
    }
    setSelectAll(!selectAll);
  };

  const handleDeleteSingle = async (publicId: string, fileName: string) => {
    setMediaToDelete({ publicId, fileName });
    setShowDeleteModal(true);
  };

  const confirmDeleteSingle = async () => {
    if (!mediaToDelete) return;
    
    setIsDeleting(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "https://photography-server-1.onrender.com/api"}/events/${eventId}/media/${encodeURIComponent(mediaToDelete.publicId)}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      const data = await response.json();
      
      if (data.success) {
        toast.success(`File "${mediaToDelete.fileName}" deleted successfully`);
        setSelectedMediaIds(prev => prev.filter(id => id !== mediaToDelete.publicId));
        onMediaUpdate(); // Refresh media files
      } else {
        toast.error(data.message || "Failed to delete file");
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Network error during deletion');
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
      setMediaToDelete(null);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedMediaIds.length === 0) return;
    setShowBulkDeleteModal(true);
  };

  const confirmBulkDelete = async () => {
    setIsDeleting(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "https://photography-server-1.onrender.com/api"}/events/${eventId}/media/bulk-delete`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ publicIds: selectedMediaIds })
        }
      );

      const data = await response.json();
      
      if (data.success) {
        toast.success(`Successfully deleted ${selectedMediaIds.length} file(s)`);
        setSelectedMediaIds([]);
        setSelectAll(false);
        onMediaUpdate(); // Refresh media files
      } else {
        toast.error(data.message || "Failed to delete files");
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Network error during deletion');
    } finally {
      setIsDeleting(false);
      setShowBulkDeleteModal(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Single File Delete Modal */}
      <DeleteConfirmationModal 
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setMediaToDelete(null);
        }}
        onConfirm={confirmDeleteSingle}
        eventName={eventName}
        isMediaDelete={true}
        fileName={mediaToDelete?.fileName || ""}
      />

      {/* Bulk Delete Modal */}
      <DeleteConfirmationModal 
        isOpen={showBulkDeleteModal}
        onClose={() => setShowBulkDeleteModal(false)}
        onConfirm={confirmBulkDelete}
        eventName={eventName}
        mediaCount={selectedMediaIds.length}
        isMediaDelete={true}
      />

      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md"
        onClick={(e) => { if(e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }} 
          animate={{ opacity: 1, scale: 1, y: 0 }} 
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="bg-white dark:bg-zinc-900 w-full max-w-6xl rounded-2xl shadow-2xl border border-slate-200 dark:border-zinc-800 flex flex-col overflow-hidden max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-zinc-800 bg-slate-50/80 dark:bg-zinc-900/80 backdrop-blur-sm z-10">
            <div>
              <h3 className="font-bold text-xl text-slate-800 dark:text-white flex items-center gap-2">
                <FileImage className="w-5 h-5 text-blue-600" />
                Event Media Gallery
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                Event: <span className="font-semibold text-blue-600">{eventName}</span> • 
                Files: <span className="font-semibold text-purple-600">{mediaFiles.length}</span>
              </p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-zinc-800 rounded-full transition-colors">
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>

          {/* Bulk Actions Bar */}
          {selectedMediaIds.length > 0 && (
            <div className="px-6 py-3 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-100 dark:border-blue-800/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="p-1 bg-blue-100 dark:bg-blue-800 rounded">
                    <CheckSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                    {selectedMediaIds.length} file(s) selected
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedMediaIds([])}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg transition-all"
                >
                  Clear Selection
                </button>
                <button
                  onClick={handleDeleteSelected}
                  disabled={isDeleting}
                  className="px-3 py-1.5 text-xs font-medium bg-red-500 hover:bg-red-600 text-white rounded-lg transition-all flex items-center gap-1 disabled:opacity-50"
                >
                  {isDeleting ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Trash2 className="w-3 h-3" />
                  )}
                  Delete Selected
                </button>
              </div>
            </div>
          )}

          {/* Filter Tabs */}
          <div className="px-6 pt-4 pb-2 bg-white dark:bg-zinc-900 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between">
            <div className="flex gap-1">
              {['all', 'images', 'videos', 'documents'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => {
                    setActiveTab(tab as any);
                    setSelectedMediaIds([]);
                    setSelectAll(false);
                  }}
                  className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all capitalize ${
                    activeTab === tab 
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                      : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={handleSelectAll}
                className="flex items-center gap-2 px-3 py-1 text-xs text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition-all"
              >
                {selectAll ? (
                  <CheckSquare className="w-4 h-4 text-blue-600" />
                ) : (
                  <Square className="w-4 h-4" />
                )}
                Select All
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
            {filteredMedia.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48">
                <FileIcon className="w-12 h-12 text-slate-300 mb-3" />
                <p className="text-slate-500 text-sm">No media files found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredMedia.map((file: MediaFile) => (
                  <motion.div
                    key={file.publicId}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`group relative bg-white dark:bg-zinc-800 rounded-xl border-2 overflow-hidden transition-all ${
                      selectedMediaIds.includes(file.publicId)
                        ? 'border-blue-500 dark:border-blue-500 ring-2 ring-blue-500/20'
                        : 'border-slate-200 dark:border-zinc-700 hover:border-blue-400 dark:hover:border-blue-500'
                    }`}
                  >
                    {/* Selection Checkbox */}
                    <div className="absolute top-2 left-2 z-10">
                      <button
                        onClick={() => handleSelectMedia(file.publicId)}
                        className={`p-1 rounded-full transition-all ${
                          selectedMediaIds.includes(file.publicId)
                            ? 'bg-blue-500 text-white'
                            : 'bg-white/90 dark:bg-zinc-800/90 text-transparent hover:text-slate-400'
                        }`}
                      >
                        {selectedMediaIds.includes(file.publicId) ? (
                          <CheckSquare className="w-4 h-4" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </div>

                    {/* Delete Button */}
                    <div className="absolute top-2 right-2 z-10">
                      <button
                        onClick={() => handleDeleteSingle(file.publicId, file.originalName)}
                        className="p-1 bg-white/90 dark:bg-zinc-800/90 rounded-full text-slate-400 hover:text-red-500 transition-colors"
                        title="Delete this file"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Media Preview */}
                    <div className="h-40 overflow-hidden bg-slate-100 dark:bg-zinc-900 flex items-center justify-center">
                      {file.type === 'image' ? (
                        <img 
                          src={file.url} 
                          alt={file.originalName}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : file.type === 'video' ? (
                        <div className="relative w-full h-full">
                          <video className="w-full h-full object-cover">
                            <source src={file.url} type="video/mp4" />
                          </video>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <FileVideo className="w-12 h-12 text-white/70" />
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center p-4">
                          <FileIcon className="w-12 h-12 text-blue-400 mb-2" />
                          <span className="text-xs text-slate-500 text-center truncate w-full">
                            {file.originalName}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* File Info */}
                    <div className="p-3">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getMediaIcon(file.type)}
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-slate-800 dark:text-white truncate">
                              {file.originalName}
                            </p>
                            <p className="text-[10px] text-slate-500">
                              {formatBytes(file.size)} • {file.format}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => window.open(file.url, '_blank')}
                          className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                          title="View full size"
                        >
                          <Eye className="w-3 h-3" />
                          View
                        </button>
                        <a
                          href={file.url}
                          download
                          className="text-xs text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 flex items-center gap-1"
                          title="Download"
                        >
                          <Download className="w-3 h-3" />
                          Download
                        </a>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <span className="text-xs text-slate-500">
                Showing {filteredMedia.length} of {mediaFiles.length} files
              </span>
              {selectedMediaIds.length > 0 && (
                <span className="text-xs font-medium text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded">
                  {selectedMediaIds.length} selected
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg transition-all"
            >
              Close Gallery
            </button>
          </div>
        </motion.div>
      </motion.div>
    </>
  );
};

// --- SUB-COMPONENT: ADVANCED MEDIA UPLOAD MODAL ---
const MediaUploadModal = ({ isOpen, onClose, eventId, eventName, onUploadComplete }: any) => {
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResults, setUploadResults] = useState<any[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  // Reset state on open
  useEffect(() => {
    if (isOpen) {
      setFiles([]);
      setUploadProgress(0);
      setIsUploading(false);
      setUploadResults([]);
    }
  }, [isOpen]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const traverseFileTree = async (item: any, path = ""): Promise<File[]> => {
    if (item.isFile) {
      return new Promise((resolve) => {
        item.file((file: File) => {
          const fileWithPath = new File([file], path + file.name, { type: file.type });
          resolve([fileWithPath]);
        });
      });
    } else if (item.isDirectory) {
      const dirReader = item.createReader();
      const entries = await new Promise<any[]>((resolve) => {
        dirReader.readEntries((entries: any[]) => resolve(entries));
      });
      let fileList: File[] = [];
      for (const entry of entries) {
        fileList = [...fileList, ...await traverseFileTree(entry, path + item.name + "/")];
      }
      return fileList;
    }
    return [];
  };

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    setIsScanning(true);

    try {
      const items = e.dataTransfer.items;
      let newFiles: File[] = [];

      if (items && items[0]?.webkitGetAsEntry) {
        for (let i = 0; i < items.length; i++) {
          const item = items[i].webkitGetAsEntry();
          if (item) {
            const extractedFiles = await traverseFileTree(item);
            newFiles = [...newFiles, ...extractedFiles];
          }
        }
      } else {
        newFiles = Array.from(e.dataTransfer.files);
      }

      setFiles((prev) => [...prev, ...newFiles]);
    } catch (error) {
      console.error("Error parsing dropped items:", error);
      toast.error("Failed to read some folders.");
    } finally {
      setIsScanning(false);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const startUpload = async () => {
    if (files.length === 0) return;
    
    setIsUploading(true);
    setUploadProgress(0);
    
    const formData = new FormData();
    
    files.forEach((file, index) => {
      const fileName = (file as any).webkitRelativePath || file.name;
      formData.append(`files`, file, fileName);
    });
    
    formData.append('eventId', eventId);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "https://photography-server-1.onrender.com/api"}/events/${eventId}/upload-media`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        }
      );

      // Simulate progress updates
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 95) {
            clearInterval(interval);
            return 95;
          }
          return prev + 5;
        });
      }, 200);

      const data = await response.json();
      clearInterval(interval);
      setUploadProgress(100);
      
      if (data.success) {
        setUploadResults(data.uploadedFiles || []);
        toast.success(`Successfully uploaded ${data.uploadedFiles?.length || files.length} files!`);
        onUploadComplete(data.uploadedFiles || []);
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        toast.error(data.message || "Upload failed");
        setIsUploading(false);
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Network error during upload');
      setIsUploading(false);
    }
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith("video/")) return <FileVideo className="w-5 h-5 text-rose-500" />;
    if (file.type.startsWith("image/")) return <FileImage className="w-5 h-5 text-emerald-500" />;
    return <FileIcon className="w-5 h-5 text-blue-500" />;
  };

  if (!isOpen) return null;

  const totalSize = files.reduce((acc, file) => acc + file.size, 0);

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md"
      onClick={(e) => { if(e.target === e.currentTarget && !isUploading) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }} 
        animate={{ opacity: 1, scale: 1, y: 0 }} 
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="bg-white dark:bg-zinc-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-zinc-800 flex flex-col overflow-hidden max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-zinc-800 bg-slate-50/80 dark:bg-zinc-900/80 backdrop-blur-sm z-10">
          <div>
            <h3 className="font-bold text-xl text-slate-800 dark:text-white flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-blue-600" />
                Upload Media to Event
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
              Event: <span className="font-semibold text-blue-600">{eventName}</span>
            </p>
          </div>
          {!isUploading && (
            <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-zinc-800 rounded-full transition-colors">
                <X className="w-5 h-5 text-slate-500" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto custom-scrollbar relative">
          {!isUploading ? (
            <>
              {/* Upload Area */}
              <div 
                className={`
                  relative flex flex-col items-center justify-center w-full h-40 rounded-2xl border-2 border-dashed transition-all duration-300 ease-in-out
                  ${dragActive 
                    ? "border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 scale-[1.02]" 
                    : "border-slate-300 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800/50 hover:bg-slate-100 dark:hover:bg-zinc-800"
                  }
                `}
                onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
              >
                {isScanning ? (
                  <div className="flex flex-col items-center animate-pulse">
                    <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-3" />
                    <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">Scanning folder structure...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-center pointer-events-none">
                    <div className={`p-4 rounded-full bg-white dark:bg-zinc-700 shadow-sm mb-3 transition-transform duration-300 ${dragActive ? 'scale-110' : ''}`}>
                      <FolderUp className={`w-8 h-8 ${dragActive ? 'text-blue-600' : 'text-slate-400'}`} />
                    </div>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                      Drag & Drop <span className="text-blue-500">Files</span> or <span className="text-purple-500">Folders</span> here
                    </p>
                    <p className="text-xs text-slate-400 mt-1">Supports JPG, PNG, GIF, MP4, MOV, PDF (Max 100MB each)</p>
                  </div>
                )}
              </div>

              {/* Button Controls */}
              <div className="grid grid-cols-2 gap-4 mt-4">
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors border border-blue-200 dark:border-blue-800/30 font-semibold text-sm"
                >
                  <FileUp className="w-4 h-4" /> Select Files
                </button>
                <button 
                  onClick={() => folderInputRef.current?.click()}
                  className="flex items-center justify-center gap-2 py-2.5 px-4 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-xl hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors border border-purple-200 dark:border-purple-800/30 font-semibold text-sm"
                >
                  <FolderUp className="w-4 h-4" /> Select Folder
                </button>

                {/* Hidden Inputs */}
                <input 
                  ref={fileInputRef} 
                  type="file" 
                  multiple 
                  className="hidden" 
                  onChange={handleFileSelect}
                  accept="image/*,video/*,.pdf"
                />
                <input 
                  ref={folderInputRef} 
                  type="file" 
                  {...({ webkitdirectory: "", directory: "" } as any)} 
                  className="hidden" 
                  onChange={handleFileSelect}
                  accept="image/*,video/*,.pdf"
                />
              </div>
            </>
          ) : (
            // Uploading State
            <div className="flex flex-col items-center justify-center h-56 space-y-6">
              <div className="relative w-24 h-24">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-200 dark:text-zinc-700" />
                  <circle 
                    cx="48" cy="48" r="40" 
                    stroke="currentColor" strokeWidth="8" fill="transparent" 
                    strokeDasharray={251.2} 
                    strokeDashoffset={251.2 - (251.2 * uploadProgress / 100)} 
                    className="text-blue-500 transition-all duration-300 ease-out" 
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xl font-bold text-slate-700 dark:text-white">
                    {uploadProgress}%
                  </span>
                </div>
              </div>
              <p className="text-sm text-slate-500 animate-pulse">
                Uploading {files.length} items to Cloudinary...
              </p>
            </div>
          )}

          {/* File List */}
          {!isUploading && files.length > 0 && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider">
                  Queue ({files.length})
                </h4>
                <span className="text-xs font-medium text-slate-500 bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">
                  {formatBytes(totalSize)}
                </span>
              </div>
              
              <motion.div layout className="max-h-48 overflow-y-auto custom-scrollbar space-y-2 pr-1">
                <AnimatePresence>
                  {files.map((file, index) => (
                    <motion.div
                      layout
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ delay: index * 0.03 }}
                      key={`${file.name}-${index}`}
                      className="flex items-center justify-between p-3 bg-white dark:bg-zinc-800/50 rounded-xl border border-slate-100 dark:border-zinc-700/50 group hover:border-blue-200 dark:hover:border-blue-800 transition-colors shadow-sm"
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="p-2 bg-slate-50 dark:bg-zinc-700 rounded-lg shrink-0">
                          {getFileIcon(file)}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate max-w-[200px] sm:max-w-[280px]">
                            {(file as any).webkitRelativePath || file.name}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {formatBytes(file.size)} • {file.type.split('/')[1] || 'file'}
                          </span>
                        </div>
                      </div>
                      <button 
                        onClick={() => removeFile(index)} 
                        className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            </div>
          )}

          {/* Upload Results */}
          {uploadResults.length > 0 && (
            <div className="mt-6">
              <h4 className="text-xs font-bold uppercase text-emerald-400 tracking-wider mb-3">
                Upload Successful ({uploadResults.length} files)
              </h4>
              <div className="space-y-2">
                {uploadResults.slice(0, 3).map((result, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span className="text-xs text-emerald-700 dark:text-emerald-300 truncate">
                      {result.originalName}
                    </span>
                  </div>
                ))}
                {uploadResults.length > 3 && (
                  <p className="text-xs text-slate-500 text-center">
                    +{uploadResults.length - 3} more files uploaded
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {!isUploading && (
          <div className="p-5 border-t border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 flex justify-end gap-3 z-20">
            <button 
              onClick={onClose} 
              className="px-5 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-zinc-800 border border-transparent hover:border-slate-200 dark:hover:border-zinc-700 rounded-xl transition-all"
            >
              Cancel
            </button>
            <button 
              onClick={startUpload}
              disabled={files.length === 0}
              className={`
                relative overflow-hidden flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white rounded-xl shadow-lg transition-all
                ${files.length === 0 
                  ? "bg-slate-300 dark:bg-zinc-700 cursor-not-allowed shadow-none" 
                  : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-blue-500/25 hover:shadow-blue-500/40 hover:-translate-y-0.5"
                }
              `}
            >
              <UploadCloud className="w-4 h-4" /> 
              Upload to Cloudinary
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

// --- COMPACT STAT CARD ---
const StatCard = ({ title, value, icon: Icon, trend, trendLabel, colorClass }: any) => (
  <motion.div
    whileHover={{ y: -2 }}
    className="relative bg-white dark:bg-zinc-900 px-4 py-3 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm flex items-center justify-between hover:border-blue-300 dark:hover:border-blue-700 transition-all group overflow-hidden"
  >
    {/* Background Effect */}
    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-500 mb-0.5">{title}</p>
      <div className="flex items-baseline gap-2">
        <h3 className="text-xl font-bold text-slate-900 dark:text-white leading-none">{value}</h3>
        <span className={`text-[10px] font-bold ${trend.startsWith('+') ? 'text-emerald-600' : 'text-slate-400'}`}>
          {trend} <span className="text-slate-400 font-normal ml-0.5">{trendLabel}</span>
        </span>
      </div>
    </div>
    <div className={`p-2 rounded-lg ${colorClass}`}>
      <Icon className="w-4 h-4" />
    </div>
  </motion.div>
);

export default function EventPage() {
  // --- State ---
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal States
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  
  // Upload States
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showMediaPreviewModal, setShowMediaPreviewModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  // Delete Confirmation State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<Event | null>(null);

  const [user, setUser] = useState<User | null>(null);
  const [clientId, setClientId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeTab, setActiveTab] = useState("all");

  // --- Effects ---
  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
      let storedClientId = localStorage.getItem("clientId");
      if (!storedClientId) {
        storedClientId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem("clientId", storedClientId);
      }
      setClientId(storedClientId || "");
    }
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "https://photography-server-1.onrender.com/api"}/events/my-events`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await response.json();
      if (data.success) {
        setEvents(data.events || []);
        setFilteredEvents(data.events || []);
      } else {
        toast.error(data.message || "Unable to retrieve event data.");
      }
    } catch (error) {
      toast.error("Connection failed.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    let result = events;
    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      result = result.filter(
        (e) =>
          e.eventName?.toLowerCase().includes(lowerTerm) ||
          e.eventPlace?.toLowerCase().includes(lowerTerm) ||
          e.description?.toLowerCase().includes(lowerTerm)
      );
    }
    const now = new Date();
    if (activeTab === 'upcoming') {
      result = result.filter(e => new Date(e.eventDate) >= now);
    } else if (activeTab === 'past') {
      result = result.filter(e => new Date(e.eventDate) < now);
    }
    setFilteredEvents(result);
  }, [searchTerm, events, activeTab]);

  // --- Delete Handler ---
  const handleDeleteEvent = async (eventId: string) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "https://photography-server-1.onrender.com/api"}/events/${eventId}`,
        { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await response.json();
      if (data.success) {
        toast.success("Event and all media deleted.");
        setShowDeleteModal(false);
        setEventToDelete(null);
        fetchEvents();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error("Error deleting event");
    }
  };

  // --- Confirm Delete ---
  const confirmDeleteEvent = (event: Event) => {
    setEventToDelete(event);
    setShowDeleteModal(true);
  };

  // --- Other Handlers ---
  const handleSubmitEvent = async (eventData: any) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const url = editingEvent
        ? `${process.env.NEXT_PUBLIC_API_URL || "https://photography-server-1.onrender.com/api"}/events/${editingEvent._id}`
        : `${process.env.NEXT_PUBLIC_API_URL || "https://photography-server-1.onrender.com/api"}/events/create`;
      const method = editingEvent ? "PUT" : "POST";
      const payload = { ...eventData, clientId };

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (data.success) {
        toast.success(editingEvent ? "Event updated." : "Event scheduled.");
        setShowForm(false);
        setEditingEvent(null);
        fetchEvents();
      } else {
        toast.error(data.message || "Operation failed.");
      }
    } catch (error) {
      toast.error("Network error.");
    }
  };

  const handleOpenUpload = (event: Event) => {
    setSelectedEvent(event);
    setShowUploadModal(true);
  };

  const handleUploadComplete = (uploadedFiles: any[]) => {
    if (selectedEvent) {
      setEvents(prev => prev.map(event => 
        event._id === selectedEvent._id 
          ? { 
              ...event, 
              mediaFiles: [...(event.mediaFiles || []), ...uploadedFiles] 
            }
          : event
      ));
      fetchEvents();
    }
  };

  const handleOpenMediaPreview = (event: Event) => {
    setSelectedEvent(event);
    setShowMediaPreviewModal(true);
  };

  const handleMediaUpdate = () => {
    fetchEvents(); // Refresh events after media changes
  };

  const handleDownloadQR = (qrCodeUrl: string, eventName?: string) => {
    if (!qrCodeUrl) return;
    const toastId = toast.loading("Generating asset...");
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = qrCodeUrl;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const padding = 40;
      const size = Math.max(img.width, 500);
      canvas.width = size + (padding * 2);
      canvas.height = size + (padding * 2) + 60;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, padding, padding, size, size);
      if (eventName) {
        ctx.font = "bold 24px Arial";
        ctx.fillStyle = "#333333";
        ctx.textAlign = "center";
        ctx.fillText(eventName, canvas.width / 2, canvas.height - 25);
      }
      const link = document.createElement("a");
      link.download = `QR_${(eventName || "event").replace(/\s+/g, "_")}.png`;
      link.href = canvas.toDataURL("image/png", 1.0);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.update(toastId, { render: "Downloaded!", type: "success", isLoading: false, autoClose: 2000 });
    };
  };

  // --- Date Helper ---
  const safeDate = (dateString: string) => {
    if (!dateString) return { day: "--", month: "N/A", full: "No Date", time: "--:--" };
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return { day: "--", month: "N/A", full: "Invalid Date", time: "--:--" };
    }
    return {
      day: date.getDate(),
      month: date.toLocaleString('default', { month: 'short' }),
      full: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };

  // --- Components ---
  const GridView = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-1">
      <AnimatePresence>
        {filteredEvents.map((event) => {
          const { day, month, time } = safeDate(event.eventDate);
          const mediaCount = event.mediaFiles?.length || 0;
          
          return (
            <motion.div
              key={event._id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={`
                group relative bg-white dark:bg-zinc-900 rounded-xl p-4
                border border-slate-200 dark:border-zinc-800 
                transition-all duration-300 ease-in-out
                hover:border-blue-400 dark:hover:border-blue-500
                hover:shadow-[0_0_20px_rgba(59,130,246,0.15)] dark:hover:shadow-[0_0_20px_rgba(59,130,246,0.25)]
                hover:-translate-y-1
                overflow-hidden
              `}
            >
              {/* Background Gradient on Hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 via-blue-500/0 to-blue-500/0 group-hover:from-blue-500/5 group-hover:via-blue-500/2 group-hover:to-transparent transition-all duration-500" />

              {/* Header: Date Badge & Actions */}
              <div className="flex justify-between items-start mb-3 relative z-10">
                <div className="flex items-center gap-3">
                   <div className="flex flex-col items-center justify-center w-10 h-10 bg-blue-50 dark:bg-zinc-800 rounded-lg border border-blue-100 dark:border-zinc-700 text-blue-600 dark:text-blue-400 group-hover:scale-105 transition-transform">
                      <span className="text-[8px] font-bold uppercase">{month}</span>
                      <span className="text-sm font-bold leading-none">{day}</span>
                   </div>
                   <div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-sm line-clamp-1 group-hover:text-blue-600 transition-colors" title={event.eventName}>
                        {event.eventName}
                      </h3>
                      <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-0.5">
                        <Clock className="w-3 h-3" />
                        <span>{time}</span>
                      </div>
                   </div>
                </div>

                {/* Hover Actions */}
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                   <button onClick={() => { setEditingEvent(event); setShowForm(true); }} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors" title="Edit"><Edit2 className="w-3.5 h-3.5"/></button>
                   <button onClick={() => confirmDeleteEvent(event)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Delete"><Trash2 className="w-3.5 h-3.5"/></button>
                </div>
              </div>

              {/* Content */}
              <div className="space-y-2 mb-4 min-h-[32px] relative z-10">
                <div className="flex items-start gap-1.5 text-xs text-slate-500 dark:text-zinc-400">
                  <MapPin className="w-3.5 h-3.5 mt-0.5 text-slate-400 shrink-0" />
                  <span className="line-clamp-2 leading-relaxed">{event.eventPlace || "Venue Pending"}</span>
                </div>
                {mediaCount > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-1 text-xs text-purple-600 bg-purple-50 dark:bg-purple-900/20 px-2 py-1 rounded-md w-fit"
                  >
                    <FileImage className="w-3 h-3" />
                    <span>{mediaCount} media file{mediaCount !== 1 ? 's' : ''}</span>
                  </motion.div>
                )}
              </div>

              {/* Footer */}
              <div className="pt-3 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between relative z-10">
                <div className="flex items-center gap-2">
                   {/* Media Preview Button */}
                   {mediaCount > 0 && (
                     <button onClick={() => handleOpenMediaPreview(event)} className="p-1.5 text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-md transition-colors" title="View Media">
                       <Eye className="w-4 h-4" />
                     </button>
                   )}
                   
                   {/* Upload Button */}
                   <button onClick={() => handleOpenUpload(event)} className="p-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors" title="Upload Media">
                     <UploadCloud className="w-4 h-4" />
                   </button>
                   
                   {/* QR Code Button */}
                   {event.qrCode && (
                     <button onClick={() => handleDownloadQR(event.qrCode!, event.eventName)} className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-md transition-colors" title="Download QR">
                       <QrCode className="w-4 h-4" />
                     </button>
                   )}
                </div>

                {event.status === 'active' ? (
                   <span className="flex items-center gap-1 text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-medium">
                     <CheckCircle2 className="w-3 h-3"/> Active
                   </span>
                ) : (
                   <span className="flex items-center gap-1 text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full font-medium">
                     Inactive
                   </span>
                )}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );

  const ListView = () => (
    <div className="flex flex-col w-full">
      {/* Grid Header */}
      <div className="hidden md:grid grid-cols-[60px_90px_1fr_120px_120px_180px] px-4 py-2 bg-slate-50/80 dark:bg-zinc-900/50 border-y border-slate-200 dark:border-zinc-800 text-[10px] font-bold uppercase tracking-wider text-slate-500 sticky top-0 z-10">
        <div className="text-center">S.No</div>
        <div className="text-center">Date</div>
        <div>Event Details</div>
        <div>Location</div>
        <div className="text-center">Media</div>
        <div className="text-right">Actions</div>
      </div>
      
      <div className="divide-y divide-slate-100 dark:divide-zinc-800">
        <AnimatePresence>
          {filteredEvents.map((event, index) => {
            const { day, month } = safeDate(event.eventDate);
            const mediaCount = event.mediaFiles?.length || 0;
            
            return (
              <motion.div 
                key={event._id} 
                layout
                initial={{ opacity: 0, x: -20 }} 
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="group md:grid md:grid-cols-[60px_90px_1fr_120px_120px_180px] flex flex-col gap-3 md:gap-0 p-3 md:px-4 md:py-3 items-center hover:bg-blue-50/40 dark:hover:bg-blue-900/10 transition-colors border-l-2 border-transparent hover:border-blue-500"
              >
                {/* S.No */}
                <div className="hidden md:flex justify-center items-center">
                    <span className="text-xs font-semibold text-slate-400 dark:text-zinc-600">
                        {index + 1 < 10 ? `0${index + 1}` : index + 1}
                    </span>
                </div>

                {/* Date */}
                <div className="flex md:justify-center w-full md:w-auto">
                   <div className="flex flex-row md:flex-col items-center justify-center gap-2 md:gap-0 bg-slate-50 dark:bg-zinc-800 md:bg-transparent px-2 py-1 rounded md:p-0">
                      <span className="text-[9px] uppercase font-bold text-slate-400 md:mb-0.5">{month}</span>
                      <span className="text-sm font-bold text-slate-700 dark:text-white leading-none">{day}</span>
                   </div>
                </div>

                {/* Details */}
                <div className="w-full text-center md:text-left overflow-hidden px-2">
                   <h3 className="font-bold text-slate-800 dark:text-white text-sm truncate group-hover:text-blue-600 transition-colors">
                     {event.eventName}
                   </h3>
                   <p className="text-[11px] text-slate-400 truncate mt-0.5">{event.description || "No description."}</p>
                </div>

                {/* Location */}
                <div className="w-full md:w-auto flex items-center justify-center md:justify-start gap-1.5 text-xs text-slate-500 overflow-hidden px-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                  <span className="truncate">{event.eventPlace || "Pending"}</span>
                </div>

                {/* Media Count */}
                <div className="w-full md:w-auto flex items-center justify-center">
                  {mediaCount > 0 ? (
                    <button 
                      onClick={() => handleOpenMediaPreview(event)}
                      className="flex items-center gap-1 text-xs text-purple-600 bg-purple-50 dark:bg-purple-900/20 px-2 py-1 rounded-md hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors group"
                    >
                      <FileImage className="w-3 h-3 group-hover:scale-110 transition-transform" />
                      <span>{mediaCount}</span>
                    </button>
                  ) : (
                    <span className="text-xs text-slate-400">No media</span>
                  )}
                </div>

                {/* Actions */}
                <div className="w-full md:w-auto flex items-center justify-end gap-1">
                  {/* Media Preview Button */}
                  {mediaCount > 0 && (
                    <button 
                      onClick={() => handleOpenMediaPreview(event)}
                      className="p-1.5 text-purple-600 bg-purple-50 dark:bg-purple-900/10 rounded-md hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors hover:scale-110"
                      title="View Media"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  )}
                  
                  {/* Upload Button */}
                  <button 
                    onClick={() => handleOpenUpload(event)}
                    className="p-1.5 text-blue-600 bg-blue-50 dark:bg-blue-900/10 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors hover:scale-110"
                    title="Upload Media"
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                  </button>
                  
                  {/* QR Code Button */}
                  {event.qrCode && (
                    <button 
                      onClick={() => handleDownloadQR(event.qrCode!, event.eventName)}
                      className="p-1.5 text-emerald-600 bg-emerald-50 dark:bg-emerald-900/10 rounded-md hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors hover:scale-110"
                      title="QR Code"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                    </button>
                  )}
                  
                  {/* Edit Button */}
                  <button 
                    onClick={() => { setEditingEvent(event); setShowForm(true); }}
                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-white rounded-md transition-colors hover:scale-110"
                    title="Edit"
                  >
                    <Edit2 className="w-3.5 h-3.5"/>
                  </button>
                  
                  {/* Delete Button */}
                  <button 
                    onClick={() => confirmDeleteEvent(event)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-white rounded-md transition-colors hover:scale-110"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5"/>
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );

  return (
    <AdminLayout>
      <ToastContainer 
        position="top-right" 
        theme="colored" 
        hideProgressBar={false}
        autoClose={3000}
        newestOnTop={true}
        closeOnClick
        pauseOnHover
      />
      
      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal 
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setEventToDelete(null);
        }}
        onConfirm={() => eventToDelete && handleDeleteEvent(eventToDelete._id)}
        eventName={eventToDelete?.eventName || ""}
        mediaCount={eventToDelete?.mediaFiles?.length || 0}
      />
      
      <div className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-slate-50 to-blue-50/20 dark:from-black dark:to-zinc-900/50 font-sans">
        
        {/* --- Breadcrumbs --- */}
        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-6">
          <span className="flex items-center gap-1 hover:text-blue-600 cursor-pointer transition-colors">
            <Home className="w-3 h-3" /> Dashboard
          </span>
          <ChevronRight className="w-3 h-3" />
          <span className="text-blue-600 dark:text-blue-400">Events</span>
        </div>

        {/* --- Header --- */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                Events Management
              </h1>
            </div>
            <p className="text-slate-500 dark:text-zinc-400 mt-1 text-sm max-w-2xl">
              Oversee event lifecycles, schedules, logistics, and media uploads with enterprise-grade security.
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => { setEditingEvent(null); setShowForm(true); }}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-5 py-3 rounded-xl font-bold shadow-lg shadow-blue-600/20 hover:shadow-blue-600/40 transition-all text-sm group"
          >
            <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" /> 
            Schedule New Event
          </motion.button>
        </div>

        {/* --- Compact Stats --- */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <StatCard 
            title="Total Events" 
            value={events.length} 
            icon={Calendar} 
            trend="+12%" 
            trendLabel="vs prev" 
            colorClass="bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" 
          />
          <StatCard 
            title="Upcoming" 
            value={events.filter(e => new Date(e.eventDate) > new Date()).length} 
            icon={Clock} 
            trend="+3" 
            trendLabel="new" 
            colorClass="bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400" 
          />
          <StatCard 
            title="Venues" 
            value={[...new Set(events.map(e => e.eventPlace))].length} 
            icon={MapPin} 
            trend="Stable" 
            trendLabel="" 
            colorClass="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" 
          />
          <StatCard 
            title="Total Media" 
            value={events.reduce((acc, e) => acc + (e.mediaFiles?.length || 0), 0)} 
            icon={FileImage} 
            trend="+45" 
            trendLabel="files" 
            colorClass="bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400" 
          />
        </div>

        {/* --- Main Card --- */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-xl overflow-hidden"
        >
          
          {/* Toolbar */}
          <div className="p-4 border-b border-slate-200 dark:border-zinc-800 flex flex-col md:flex-row gap-4 justify-between items-center bg-white dark:bg-zinc-900">
            <div className="flex gap-1 bg-slate-100 dark:bg-zinc-800 p-0.5 rounded-lg">
              {['all', 'upcoming', 'past'].map((tab) => (
                 <motion.button
                   key={tab} 
                   whileTap={{ scale: 0.95 }}
                   onClick={() => setActiveTab(tab)} 
                   className={`px-3 py-1.5 text-[10px] font-bold uppercase rounded-md transition-all ${activeTab === tab ? 'bg-white dark:bg-zinc-700 text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                 >
                   {tab}
                 </motion.button>
              ))}
            </div>

            <div className="flex gap-3 w-full md:w-auto items-center">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search events..." 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div className="flex gap-1 border border-slate-200 dark:border-zinc-700 rounded-lg p-0.5">
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setViewMode('list')} 
                  className={`p-2 rounded ${viewMode === 'list' ? 'bg-slate-100 dark:bg-zinc-700 text-blue-600' : 'text-slate-400'}`}
                >
                  <List className="w-4 h-4" />
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setViewMode('grid')} 
                  className={`p-2 rounded ${viewMode === 'grid' ? 'bg-slate-100 dark:bg-zinc-700 text-blue-600' : 'text-slate-400'}`}
                >
                  <LayoutGrid className="w-4 h-4" />
                </motion.button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="bg-gradient-to-b from-slate-50/50 to-transparent dark:from-black/20 dark:to-transparent min-h-[400px]">
             {loading ? (
                <div className="flex flex-col justify-center items-center h-64">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Loader2 className="w-8 h-8 text-blue-600" />
                  </motion.div>
                  <p className="text-slate-400 text-[10px] uppercase font-bold mt-4 tracking-wider">Loading events...</p>
                </div>
             ) : filteredEvents.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center py-20"
                >
                  <div className="bg-gradient-to-br from-slate-100 to-slate-200 dark:from-zinc-800 dark:to-zinc-900 p-4 rounded-full mb-4 shadow-lg">
                    <Filter className="w-8 h-8 text-slate-300" />
                  </div>
                  <p className="text-lg font-bold text-slate-900 dark:text-white mb-1">No events found</p>
                  <p className="text-sm text-slate-500 mb-3">Try adjusting your search or filters</p>
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {setSearchTerm(''); setActiveTab('all')}} 
                    className="text-blue-600 text-sm hover:underline px-4 py-2 bg-blue-50 rounded-lg"
                  >
                    Clear all filters
                  </motion.button>
                </motion.div>
             ) : (
                viewMode === 'grid' ? <GridView /> : <ListView />
             )}
          </div>

          {/* Pagination */}
          <div className="px-6 py-3 border-t border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex justify-between items-center">
            <span className="text-xs text-slate-400">
              Showing <b className="text-slate-700 dark:text-white">{filteredEvents.length}</b> of <b className="text-slate-700 dark:text-white">{events.length}</b> events
            </span>
            <div className="flex gap-2">
              <motion.button 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                disabled 
                className="p-2 border border-slate-200 rounded-lg text-slate-300 disabled:cursor-not-allowed"
              >
                <ArrowLeft className="w-4 h-4"/>
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                disabled 
                className="p-2 border border-slate-200 rounded-lg text-slate-300 disabled:cursor-not-allowed"
              >
                <ArrowRight className="w-4 h-4"/>
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* --- Create/Edit Modal --- */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
              onClick={(e) => { if(e.target === e.currentTarget) setShowForm(false); }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-slate-200 dark:border-zinc-800 max-h-[90vh]"
              >
                {/* Header with Gradient */}
                <div className="relative bg-gradient-to-r from-blue-600 to-indigo-600 p-6">
                  <div className="absolute top-3 right-3 z-20">
                    <button 
                      onClick={() => { setShowForm(false); setEditingEvent(null); }} 
                      className="p-1.5 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
                  </div>
                  <div className="relative z-10">
                    <h3 className="text-xl font-bold text-white">
                      {editingEvent ? 'Edit Event' : 'Create New Event'}
                    </h3>
                    <p className="text-blue-100 text-sm mt-1">
                      {editingEvent ? 'Update event details' : 'Schedule a new event'}
                    </p>
                  </div>
                </div>
                
                {/* Form Content */}
                <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                  <EventForm 
                    onSubmit={handleSubmitEvent} 
                    onCancel={() => { setShowForm(false); setEditingEvent(null); }} 
                    initialData={editingEvent} 
                  />
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* --- Media Upload Modal --- */}
        <AnimatePresence>
          {showUploadModal && selectedEvent && (
            <MediaUploadModal 
              isOpen={showUploadModal}
              onClose={() => { setShowUploadModal(false); setSelectedEvent(null); }}
              eventId={selectedEvent._id}
              eventName={selectedEvent.eventName}
              onUploadComplete={handleUploadComplete}
            />
          )}
        </AnimatePresence>

        {/* --- Media Preview Modal --- */}
        <AnimatePresence>
          {showMediaPreviewModal && selectedEvent && selectedEvent.mediaFiles && (
            <MediaPreviewModal 
              isOpen={showMediaPreviewModal}
              onClose={() => { setShowMediaPreviewModal(false); setSelectedEvent(null); }}
              mediaFiles={selectedEvent.mediaFiles}
              eventName={selectedEvent.eventName}
              eventId={selectedEvent._id}
              onMediaUpdate={handleMediaUpdate}
            />
          )}
        </AnimatePresence>

      </div>
    </AdminLayout>
  );
}