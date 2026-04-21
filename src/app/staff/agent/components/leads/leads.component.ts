import { Component, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';

export interface Lead {
  leadId: number;
  leadName: string;
  phone: string;
  serviceCategory: string;
  language: string;
  leadSource: string;
  campaignName: string;
  leadStatus: string;
  leadOwner: string;
  createdTime: string | null;
  modifiedTime: string | null;
  lastActivityTime: string | null;
}

interface ColumnDef {
  key: keyof Lead;
  label: string;
}

const ALL_COLUMNS: ColumnDef[] = [
  { key: 'leadId',           label: 'Lead_ID' },
  { key: 'leadName',         label: 'Lead Name' },
  { key: 'phone',            label: 'Phone' },
  { key: 'serviceCategory',  label: 'Service Category' },
  { key: 'language',         label: 'Language' },
  { key: 'leadSource',       label: 'Lead Source' },
  { key: 'campaignName',     label: 'Campaign Name' },
  { key: 'leadStatus',       label: 'Lead Status' },
  { key: 'leadOwner',        label: 'Lead Owner' },
  { key: 'createdTime',      label: 'Created Time' },
  { key: 'modifiedTime',     label: 'Modified Time' },
  { key: 'lastActivityTime', label: 'Last Activity Time' },
];

const PINNED_COL_WIDTH = 130;

@Component({
  selector: 'app-leads',
  templateUrl: './leads.component.html',
  styleUrl: './leads.component.css',
  standalone: false,
  providers: [DatePipe]
})
export class LeadsComponent implements OnInit {
  leads: Lead[] = [];
  loading = false;

  sortColumn: keyof Lead | '' = '';
  sortDirection: 'asc' | 'desc' = 'asc';
  pinnedColumns: (keyof Lead)[] = [];

  constructor(private datePipe: DatePipe) {}

  ngOnInit(): void {
    // Data will be loaded from API when backend is ready
  }

  get orderedColumns(): ColumnDef[] {
    const pinned   = ALL_COLUMNS.filter(c =>  this.pinnedColumns.includes(c.key));
    const unpinned = ALL_COLUMNS.filter(c => !this.pinnedColumns.includes(c.key));
    return [...pinned, ...unpinned];
  }

  get sortedLeads(): Lead[] {
    if (!this.sortColumn) return this.leads;
    const col = this.sortColumn;
    const dir = this.sortDirection === 'asc' ? 1 : -1;
    return [...this.leads].sort((a, b) => {
      const av = a[col] ?? '';
      const bv = b[col] ?? '';
      if (av < bv) return -1 * dir;
      if (av > bv) return  1 * dir;
      return 0;
    });
  }

  sortBy(col: keyof Lead): void {
    if (this.sortColumn === col) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = col;
      this.sortDirection = 'asc';
    }
  }

  getSortIcon(col: keyof Lead): string {
    if (this.sortColumn !== col) return '⇅';
    return this.sortDirection === 'asc' ? '↑' : '↓';
  }

  isPinned(col: keyof Lead): boolean {
    return this.pinnedColumns.includes(col);
  }

  canPin(col: keyof Lead): boolean {
    return this.isPinned(col) || this.pinnedColumns.length < 3;
  }

  togglePin(col: keyof Lead, event: Event): void {
    event.stopPropagation();
    if (this.isPinned(col)) {
      this.pinnedColumns = this.pinnedColumns.filter(c => c !== col);
    } else if (this.pinnedColumns.length < 3) {
      this.pinnedColumns = [...this.pinnedColumns, col];
    }
  }

  getPinnedLeft(col: keyof Lead): string {
    const idx = this.pinnedColumns.indexOf(col);
    return `${idx * PINNED_COL_WIDTH}px`;
  }

  getCellValue(lead: Lead, key: keyof Lead): string {
    const val = lead[key];
    if (key === 'createdTime' || key === 'modifiedTime' || key === 'lastActivityTime') {
      return this.datePipe.transform(val as string, 'dd/MM/yyyy HH:mm') ?? '';
    }
    return val != null ? String(val) : '';
  }

  getStatusClass(status: string): string {
    const s = (status || '').toLowerCase();
    if (s.includes('new') || s.includes('open')) return 'badge-new';
    if (s.includes('qualified'))                  return 'badge-qualified';
    if (s.includes('converted'))                  return 'badge-converted';
    if (s.includes('lost') || s.includes('dead')) return 'badge-lost';
    return 'badge-default';
  }
}
