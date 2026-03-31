"use client";

import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverDescription,
} from "@/components/ui/popover";

interface HelpTipProps {
  title: string;
  children: React.ReactNode;
}

export function HelpTip({ title, children }: HelpTipProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-500 hover:text-gray-700 text-xs font-bold cursor-pointer transition-colors"
          aria-label={`Help: ${title}`}
        >
          ?
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72">
        <PopoverHeader>
          <PopoverTitle>{title}</PopoverTitle>
          <PopoverDescription>{children}</PopoverDescription>
        </PopoverHeader>
      </PopoverContent>
    </Popover>
  );
}
