import React from 'react';
import { cn } from '@/lib/utils';

interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  children: React.ReactNode;
  /** When false, skip the horizontal scroll wrapper (use with wrapping / responsive layouts). */
  scrollable?: boolean;
}

const Table: React.FC<TableProps> = ({ children, className, scrollable = true, ...props }) => {
  const table = (
    <table className={cn('w-full border-collapse text-left', className)} {...props}>
      {children}
    </table>
  );
  if (!scrollable) {
    return <div className="w-full max-w-full">{table}</div>;
  }
  return (
    <div className="w-full max-w-full overflow-x-auto">
      {table}
    </div>
  );
};

interface TableHeaderProps extends React.HTMLAttributes<HTMLTableSectionElement> {
  children: React.ReactNode;
}

const TableHeader: React.FC<TableHeaderProps> = ({ children, className, ...props }) => {
  return (
    <thead className={cn('bg-slate-100 font-semibold text-slate-700', className)} {...props}>
      {children}
    </thead>
  );
};

interface TableBodyProps extends React.HTMLAttributes<HTMLTableSectionElement> {
  children: React.ReactNode;
}

const TableBody: React.FC<TableBodyProps> = ({ children, className, ...props }) => {
  return (
    <tbody className={cn('divide-y divide-slate-200', className)} {...props}>
      {children}
    </tbody>
  );
};

interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  children: React.ReactNode;
}

const TableRow: React.FC<TableRowProps> = ({ children, className, ...props }) => {
  return (
    <tr className={cn('border-b border-slate-200', className)} {...props}>
      {children}
    </tr>
  );
};

interface TableHeadProps extends React.HTMLAttributes<HTMLTableCellElement> {
  children: React.ReactNode;
}

const TableHead: React.FC<TableHeadProps> = ({ children, className, ...props }) => {
  return (
    <th className={cn('px-3 py-2 sm:px-4 sm:py-3', className)} {...props}>
      {children}
    </th>
  );
};

interface TableCellProps extends React.HTMLAttributes<HTMLTableCellElement> {
  children: React.ReactNode;
  colSpan?: number;
}

const TableCell: React.FC<TableCellProps> = ({ children, className, colSpan, ...props }) => {
  return (
    <td className={cn('px-3 py-2 sm:px-4 sm:py-3', className)} colSpan={colSpan} {...props}>
      {children}
    </td>
  );
};

interface TableCaptionProps extends React.HTMLAttributes<HTMLTableCaptionElement> {
  children: React.ReactNode;
}

const TableCaption: React.FC<TableCaptionProps> = ({ children, className, ...props }) => {
  return (
    <caption className={cn('mt-4 caption-bottom text-sm text-gray-500', className)} {...props}>
      {children}
    </caption>
  );
};

export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableCaption };
