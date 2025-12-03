"use client";

import { useEffect } from "react";

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  name: string;
  email: string;
  classDate: string;
}

export default function SuccessModal({
  isOpen,
  onClose,
  name,
  email,
  classDate,
}: SuccessModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const formattedDate = new Date(classDate).toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-black border-2 border-red-600 rounded-lg p-8 max-w-md w-full shadow-2xl shadow-red-600/50 animate-in fade-in zoom-in duration-300">
        {/* Success Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full bg-green-600/20 border-2 border-green-600 flex items-center justify-center animate-pulse">
            <svg
              className="w-12 h-12 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-center mb-4 text-red-600">
          Payment Successful!
        </h2>

        {/* Content */}
        <div className="space-y-4 text-white">
          <p className="text-center text-gray-300">
            Thank you, <strong className="text-white">{name}</strong>!
          </p>

          <div className="bg-gray-900/50 border border-red-600/30 rounded-lg p-4 space-y-2">
            <div>
              <p className="text-sm text-gray-400">Email</p>
              <p className="text-white">{email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Class Date</p>
              <p className="text-white">{formattedDate}</p>
            </div>
          </div>

          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
            <p className="text-yellow-400 text-sm text-center">
              <strong>⚠️ Important:</strong> You will receive the class link via
              email <strong>15 minutes before</strong> the scheduled time.
            </p>
          </div>

          <p className="text-sm text-gray-400 text-center">
            A confirmation email has been sent to your email address.
          </p>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="mt-6 w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200"
        >
          Close
        </button>
      </div>
    </div>
  );
}
