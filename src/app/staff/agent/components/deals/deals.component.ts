import { Component, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';

export interface Deal {
  activityBadge: string;
  noteBadge: string;
  dealName: string;
  serviceCategory: string;
  amount: number | null;
  stage: string;
  leadSource: string;
  language: string;
  dealOwner: string;
  createdTime: string | null;
  modifiedTime: string | null;
  lastActivityTime: string | null;
}

interface ColumnDef {
  key: keyof Deal;
  label: string;
}

const ALL_COLUMNS: ColumnDef[] = [
  { key: 'activityBadge',   label: 'Activity Badge' },
  { key: 'noteBadge',       label: 'Note Badge' },
  { key: 'dealName',        label: 'Deal Name' },
  { key: 'serviceCategory', label: 'D.Service Category' },
  { key: 'amount',          label: 'Amount' },
  { key: 'stage',           label: 'Stage' },
  { key: 'leadSource',      label: 'Lead Source' },
  { key: 'language',        label: 'Language' },
  { key: 'dealOwner',       label: 'Deal Owner' },
  { key: 'createdTime',     label: 'Created Time' },
  { key: 'modifiedTime',    label: 'Modified Time' },
  { key: 'lastActivityTime',label: 'Last Activity Time' },
];

const PINNED_COL_WIDTH = 140;

@Component({
  selector: 'app-deals',
  templateUrl: './deals.component.html',
  styleUrl: './deals.component.css',
  standalone: false,
  providers: [DatePipe]
})
export class DealsComponent implements OnInit {
  deals: Deal[] = [];
  loading = false;

  sortColumn: keyof Deal | '' = '';
  sortDirection: 'asc' | 'desc' = 'asc';
  pinnedColumns: (keyof Deal)[] = [];

  constructor(private datePipe: DatePipe) {}

  ngOnInit(): void {
    // Data will be loaded from API when backend is ready
  }

  get orderedColumns(): ColumnDef[] {
    const pinned   = ALL_COLUMNS.filter(c =>  this.pinnedColumns.includes(c.key));
    const unpinned = ALL_COLUMNS.filter(c => !this.pinnedColumns.includes(c.key));
    return [...pinned, ...unpinned];
  }

  get sortedDeals(): Deal[] {
    if (!this.sortColumn) return this.deals;
    const col = this.sortColumn;
    const dir = this.sortDirection === 'asc' ? 1 : -1;
    return [...this.deals].sort((a, b) => {
      const av = a[col] ?? '';
      const bv = b[col] ?? '';
      if (av < bv) return -1 * dir;
      if (av > bv) return  1 * dir;
      return 0;
    });
  }

  sortBy(col: keyof Deal): void {
    if (this.sortColumn === col) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = col;
      this.sortDirection = 'asc';
    }
  }

  getSortIcon(col: keyof Deal): string {
    if (this.sortColumn !== col) return '⇅';
    return this.sortDirection === 'asc' ? '↑' : '↓';
  }

  isPinned(col: keyof Deal): boolean {
    return this.pinnedColumns.includes(col);
  }

  canPin(col: keyof Deal): boolean {
    return this.isPinned(col) || this.pinnedColumns.length < 3;
  }

  togglePin(col: keyof Deal, event: Event): void {
    event.stopPropagation();
    if (this.isPinned(col)) {
      this.pinnedColumns = this.pinnedColumns.filter(c => c !== col);
    } else if (this.pinnedColumns.length < 3) {
      this.pinnedColumns = [...this.pinnedColumns, col];
    }
  }

  getPinnedLeft(col: keyof Deal): string {
    const idx = this.pinnedColumns.indexOf(col);
    return `${idx * PINNED_COL_WIDTH}px`;
  }

  getCellValue(deal: Deal, key: keyof Deal): string {
    const val = deal[key];
    if (key === 'createdTime' || key === 'modifiedTime' || key === 'lastActivityTime') {
      return this.datePipe.transform(val as string, 'dd/MM/yyyy HH:mm') ?? '';
    }
    if (key === 'amount' && val != null) {
      return Number(val).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
    }
    return val != null ? String(val) : '';
  }

  getStageClass(stage: string): string {
    const s = (stage || '').toLowerCase();
    if (s.includes('prospect') || s.includes('new'))       return 'badge-prospect';
    if (s.includes('qualification'))                       return 'badge-qualification';
    if (s.includes('proposal'))                            return 'badge-proposal';
    if (s.includes('negotiation'))                         return 'badge-negotiation';
    if (s.includes('won') || s.includes('closed'))        return 'badge-won';
    if (s.includes('lost'))                               return 'badge-lost';
    return 'badge-default';
  }

  getActivityBadgeClass(val: string): string {
    const v = (val || '').toLowerCase();
    if (v.includes('call'))    return 'act-call';
    if (v.includes('email'))   return 'act-email';
    if (v.includes('meeting')) return 'act-meeting';
    if (v.includes('task'))    return 'act-task';
    return 'act-default';
  }
}
