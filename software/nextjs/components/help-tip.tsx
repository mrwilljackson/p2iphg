"use client";

import { useMemo } from "react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverDescription,
} from "@/components/ui/popover";
import { helpTips } from "@/lib/help-tips";

// P2I logo brand colours
const p2iColours = [
  { border: "border-purple-500",  bg: "bg-purple-50",  iconBg: "bg-purple-100",  iconHover: "hover:bg-purple-200", iconText: "text-purple-600",  iconTextHover: "hover:text-purple-800", iconBorder: "border-purple-400" },
  { border: "border-blue-500",    bg: "bg-blue-50",    iconBg: "bg-blue-100",    iconHover: "hover:bg-blue-200",   iconText: "text-blue-600",    iconTextHover: "hover:text-blue-800",   iconBorder: "border-blue-400" },
  { border: "border-orange-500",  bg: "bg-orange-50",  iconBg: "bg-orange-100",  iconHover: "hover:bg-orange-200", iconText: "text-orange-600",  iconTextHover: "hover:text-orange-800", iconBorder: "border-orange-400" },
  { border: "border-green-500",   bg: "bg-green-50",   iconBg: "bg-green-100",   iconHover: "hover:bg-green-200",  iconText: "text-green-600",   iconTextHover: "hover:text-green-800",  iconBorder: "border-green-400" },
  { border: "border-pink-500",    bg: "bg-pink-50",    iconBg: "bg-pink-100",    iconHover: "hover:bg-pink-200",   iconText: "text-pink-600",    iconTextHover: "hover:text-pink-800",   iconBorder: "border-pink-400" },
  { border: "border-red-500",     bg: "bg-red-50",     iconBg: "bg-red-100",     iconHover: "hover:bg-red-200",    iconText: "text-red-600",     iconTextHover: "hover:text-red-800",    iconBorder: "border-red-400" },
];

interface HelpTipProps {
  tipKey: string;
}

export function HelpTip({ tipKey }: HelpTipProps) {
  const tip = helpTips[tipKey];
  const colour = useMemo(
    () => p2iColours[Math.floor(Math.random() * p2iColours.length)],
    []
  );

  if (!tip) {
    if (process.env.NODE_ENV === "development") {
      console.warn(`HelpTip: unknown key "${tipKey}"`);
    }
    return null;
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={`inline-flex items-center justify-center w-5 h-5 rounded-full border text-xs font-bold cursor-pointer transition-colors ${colour.iconBg} ${colour.iconHover} ${colour.iconText} ${colour.iconTextHover} ${colour.iconBorder}`}
          aria-label={`Help: ${tip.title}`}
        >
          ?
        </button>
      </PopoverTrigger>
      <PopoverContent className={`w-72 border-2 ${colour.border} ${colour.bg}`}>
        <PopoverHeader>
          <PopoverTitle>{tip.title}</PopoverTitle>
          <PopoverDescription>{tip.text}</PopoverDescription>
        </PopoverHeader>
      </PopoverContent>
    </Popover>
  );
}
