"use client";

import { LuChevronLeft } from "react-icons/lu";
import Image from "next/image";
import BookingModal from "./BookingModal";
import { useState } from "react";
import toast from "react-hot-toast";
import { createBookingProposal } from "@/lib/api_/services";
import Skeleton from "react-loading-skeleton";
import { useAuthStore } from "@/store/useAuthStore";
import { Participant } from "@/types/Ticket";
interface ChatHeaderProps {
  participant: Participant | null;
  onBack?: () => void;
  ticketId: string;
  bookingStatus: string;
  isLoading?: boolean;
}
 
export default function ChatHeader({
  participant,
  onBack,
  ticketId,
  bookingStatus,
  isLoading,
}: ChatHeaderProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuthStore();
  const [isMarkingCompleted, setIsMarkingCompleted] = useState(false); // New state for vendor action

  // --- Customer Booking Logic ---
  const isCustomer = user?.role === 'customer';
  const isBooked = bookingStatus === "ongoing";
  const buttonText = isBooked ? "Booked" : "Book now";
  // Customer button is disabled only if it's already booked
  const customerButtonDisabled = isBooked;

  const buttonBaseClass = "text-white text-xs font-bold px-4 py-2 rounded-full transition-all active:scale-95 shadow-sm";
  const buttonActiveStyle = "bg-hub-primary hover:brightness-110 shadow-green-100";
  const buttonBookedStyle = "bg-gray-400 cursor-not-allowed";

  const finalButtonClass = isBooked
    ? `${buttonBaseClass} ${buttonBookedStyle}`
    : `${buttonBaseClass} ${buttonActiveStyle}`;

  // --- Vendor Action Logic ---
  const isVendor = user?.role === 'vendor';
  const showVendorCompleteButton = isVendor && bookingStatus === 'ongoing';

  const handleMarkAsCompleted = async () => {
    setIsMarkingCompleted(true);
    // --- Placeholder for Vendor API Call ---
    try { 
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API delay
      toast.success("Booking marked as completed!");
      // You may need to trigger a parent state update or router refresh here
    } catch (error) {
      toast.error("Failed to mark as completed.");
    } finally {
      setIsMarkingCompleted(false);
    }
  };
  const handleBookingSubmit = async (bookingData: any) => {
    setIsSubmitting(true);
    try {
      const response = await createBookingProposal(bookingData);

      if (response.url) {
        toast.success("Booking proposal sent!", {
          style: { background: "#000", color: "#fff", borderRadius: "12px" },
        });
        setIsModalOpen(false);
        window.location.href = response.url;
      }
    } catch (error: any) {
      const message =
        error.response?.data?.message || "Failed to create booking";
      setIsModalOpen(false);
      toast.error(message);
      console.error("Booking Error:", message);
    } finally {
      setIsSubmitting(false);
    }
  };
 

  if (!participant) return null;
  const displayParticipant = participant && !isLoading;

  return (
    <header className="p-3 md:p-4 border-b border-hub-secondary flex items-center justify-between bg-white sticky top-0 z-10 h-17.5">
      <div className="flex items-center gap-3 overflow-hidden">
        <button
          onClick={onBack}
          aria-label="back"
          className="md:hidden p-1 -ml-1 text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
        >
          <LuChevronLeft size={24} />
        </button>

        <div className="relative shrink-0">
          <div className="h-10 w-10 rounded-full overflow-hidden border border-gray-100">
            {isLoading ? (
              <Skeleton
                circle
                height={40}
                width={40}
                className="leading-none"
              />
            ) : (
              <Image
                src={participant?.profile_photo || "/placeholder.png"}
                alt={participant?.full_name || "User"}
                width={40}
                height={40}
                unoptimized
                className="h-full w-full object-cover"
              />
            )}
          </div>
          {displayParticipant && participant.is_online && (
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-hub-primary border-2 border-white rounded-full" />
          )}
        </div>

        <div className="min-w-0">
          {isLoading ? (
            <div className="space-y-1">
              {/* Name Skeleton */}
              <Skeleton
                height={16}
                width={120}
                className="leading-none"
                baseColor="#f3f4f6"
                highlightColor="#e5e7eb"
              />
              {/* Status Skeleton */}
              <Skeleton
                height={10}
                width={60}
                className="leading-none"
                baseColor="#f9fafb"
                highlightColor="#f3f4f6"
              />
            </div>
          ) : (
            <>
              <h2 className="text-sm font-bold leading-tight truncate">
                {participant?.full_name || "Service Provider"}
              </h2>
              <div className="flex items-center gap-1.5">
                <span
                  className={`text-[10px] font-semibold uppercase tracking-wider ${participant?.is_online ? "text-hub-primary" : "text-gray-400"
                    }`}
                >
                  {participant?.is_online ? "Active Now" : "Offline"}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {isLoading ? (
          <Skeleton
            height={32}
            width={90}
            borderRadius={999}
            baseColor="#f3f4f6"
            highlightColor="#e5e7eb"
          />
        ) : (
          <>
              {isCustomer && (
                <button
                  onClick={() => !customerButtonDisabled && setIsModalOpen(true)}
                  className={finalButtonClass}
                  disabled={customerButtonDisabled}
                >
                  {buttonText}
                </button>
              )}

              {showVendorCompleteButton && (
                <button
                  onClick={handleMarkAsCompleted}
                  disabled={isMarkingCompleted}
                  className="bg-hub-secondary cursor-pointer text-white text-xs font-bold px-4 py-2 rounded-full hover:bg-hub-primary transition-all active:scale-95 shadow-md shadow-blue-200 disabled:bg-hub-primary disabled:cursor-not-allowed"
                >
                  {isMarkingCompleted ? 'Processing...' : 'Mark as Completed'}
                </button>
              )}
              </>
        )}
      </div>

      <BookingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        ticketId={ticketId}
        onSubmit={handleBookingSubmit}
        loading={isSubmitting}
      />
    </header>
  );
}
