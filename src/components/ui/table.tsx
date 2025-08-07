import * as React from 'react';

import { cn } from '@/lib/utils';

const Table = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
  <div className="relative w-full overflow-auto">
    <table
      ref={ref}
      className={cn('w-full caption-bottom text-sm', className)}
      {...props}
    />
  </div>
));
Table.displayName = 'Table';

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn('[&_tr]:border-b', className)} {...props} />
));
TableHeader.displayName = 'TableHeader';

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn('[&_tr:last-child]:border-0', className)}
    {...props}
  />
));
TableBody.displayName = 'TableBody';

const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn(
      'border-t bg-neutral-100/50 font-medium [&>tr]:last:border-b-0 dark:bg-neutral-800/50',
      className
    )}
    {...props}
  />
));
TableFooter.displayName = 'TableFooter';

const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      'border-b transition-colors hover:bg-neutral-100/50 data-[state=selected]:bg-neutral-100 dark:hover:bg-neutral-800/50 dark:data-[state=selected]:bg-neutral-800',
      className
    )}
    {...props}
  />
));
TableRow.displayName = 'TableRow';

interface SortableTableHeadProps
  extends React.ThHTMLAttributes<HTMLTableCellElement> {
  sorted?: 'asc' | 'desc' | null;
  onSort?: () => void;
}

const SortableTableHead = React.forwardRef<
  HTMLTableCellElement,
  SortableTableHeadProps
>(({ className, children, sorted, onSort, ...props }, ref) => {
  return (
    <th
      ref={ref}
      className={cn(
        'h-12 px-2 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0',
        className,
        onSort && 'cursor-pointer hover:bg-gray-100'
      )}
      onClick={onSort}
      {...props}
    >
      <div className="flex items-center">
        {children}
        {onSort && (
          <span className="ml-2">
            {sorted === null && '↕'}
            {sorted === 'asc' && '↑'}
            {sorted === 'desc' && '↓'}
          </span>
        )}
      </div>
    </th>
  );
});
SortableTableHead.displayName = 'SortableTableHead';

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn(
      'p-2 align-middle [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]',
      className
    )}
    {...props}
  />
));
TableCell.displayName = 'TableCell';

const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn('mt-4 text-sm text-neutral-500 dark:text-neutral-400', className)}
    {...props}
  />
));
TableCaption.displayName = 'TableCaption';

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  SortableTableHead,
  TableRow,
  TableCell,
  TableCaption,
};
