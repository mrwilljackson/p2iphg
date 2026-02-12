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
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4 sm:gap-6">
          {/* Logo - Left Side - 50% width */}
          <div className="w-full sm:w-1/2 flex justify-center sm:justify-start">
            <Image
              src="/p2i-logo.png"
              alt="Power2Inspire"
              width={400}
              height={400}
              className="w-full max-w-50 sm:max-w-none h-auto object-contain"
              priority
            />
          </div>

          {/* Event Details - Right Side - 50% width */}
          <div className="w-full sm:w-1/2 text-center sm:text-right space-y-1 sm:space-y-1.5 flex flex-col justify-center">
            <h1 className="text-lg sm:text-xl font-bold text-gray-900 leading-tight font-(family-name:--font-roboto)">
              {eventName}
            </h1>
            <div className="flex flex-col sm:flex-col items-center sm:items-end gap-0.5 sm:gap-1 text-xs sm:text-sm text-gray-600">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-gray-500" />
                <span>{eventDate}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-gray-500" />
                <span>{eventLocation}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

