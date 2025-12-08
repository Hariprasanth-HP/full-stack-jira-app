// components/ViewModeDropdown.tsx
import React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Check, Columns, List } from 'lucide-react';
import { ViewMode } from '@/types/type';

export type ViewModeDropdownProps = {
  value: ViewMode;
  onChange: (v: ViewMode) => void;
  className?: string;
  /* optional label to display on trigger */
  label?: string;
};

const VIEW_ITEMS: {
  value: ViewMode;
  label: string;
  Icon: React.ComponentType<any>;
}[] = [
  { value: ViewMode.LIST, label: 'List', Icon: List },
  { value: ViewMode.KANBAN, label: 'Kanban', Icon: Columns },
  //   { value: ViewMode.CALENDAR, label: "Calendar", Icon: Calendar },
  //   { value: ViewMode.SWIMLANE, label: "Swimlane", Icon: Grid },
  //   { value: ViewMode.TIMELINE, label: "Timeline", Icon: Clock },
  //   { value: ViewMode.REPORT, label: "Report", Icon: Box },
];

export default function ViewModeDropdown({
  value,
  onChange,
  className,
  label = 'Kanban',
}: ViewModeDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant='secondary'
          size='sm'
          className={className}
          aria-label='Change view'
        >
          {/* trigger shows the label and caret; adjust styles to match your app */}
          <span className='flex items-center gap-2'>
            {/* Optional icon: find the icon for the current value */}
            {VIEW_ITEMS.find((i) => i.value === value)?.Icon &&
              React.createElement(
                VIEW_ITEMS.find((i) => i.value === value)!.Icon,
                {
                  className: 'h-4 w-4',
                }
              )}
            <span className='hidden sm:inline'>{label}</span>
            <svg
              width='14'
              height='14'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
              strokeLinecap='round'
              strokeLinejoin='round'
              className='ml-1 h-4 w-4'
            >
              <path d='M6 9l6 6 6-6' />
            </svg>
          </span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align='start'
        side='bottom'
        className='w-48 bg-popover text-popover-foreground'
      >
        <DropdownMenuLabel>View</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {VIEW_ITEMS.map(({ value: v, label: l, Icon }) => (
          <DropdownMenuItem
            key={v}
            onSelect={(event) => {
              // onSelect provides event.key in some Radix setups; prevent default to avoid unexpected behavior
              event.preventDefault();
              onChange(v);
            }}
            className='flex items-center justify-between gap-2'
          >
            <div className='flex items-center gap-2'>
              <Icon className='h-4 w-4 opacity-90' />
              <span className='text-sm'>{l}</span>
            </div>

            {/* Indicator / check when selected */}
            {value === v && <Check className='h-4 w-4' />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
