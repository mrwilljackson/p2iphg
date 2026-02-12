"use client";

import Image from "next/image";
import { Calendar, MapPin } from "lucide-react";

interface EventHeaderProps {
  eventName: string;
  eventDate: string;
  eventLocation: string;
}

export function EventHeader({ eventName, eventDate, eventLocation }: EventHeaderProps) {
  return (
    <header className="w-full bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4 sm:gap-6">
          {/* Logo - Left Side */}
          <div className="flex-shrink-0">
            <Image
              src="/p2i-logo.png"
              alt="Power2Inspire"
              width={120}
              height={120}
              className="w-24 h-24 sm:w-28 sm:h-28 object-contain"
              priority
            />
          </div>

          {/* Event Details - Right Side */}
          <div className="flex-1 text-center sm:text-right space-y-1 sm:space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">
              {eventName}
            </h1>
            <div className="flex flex-col sm:flex-col items-center sm:items-end gap-1 sm:gap-1.5 text-sm sm:text-base text-gray-600">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span>{eventDate}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-500" />
                <span>{eventLocation}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

