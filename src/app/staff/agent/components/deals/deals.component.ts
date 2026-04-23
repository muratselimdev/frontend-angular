import { Component, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import seedData from './deals-seed.json';
import { DealEditPayload } from './deal-edit/deal-edit.component';
import { DealNote } from './deal-note/deal-note.component';

export interface Deal {
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
  taskDueDate?: string;
  notes?: DealNote[];
}

interface ColumnDef {
  key: keyof Deal;
  label: string;
}

const ALL_COLUMNS: ColumnDef[] = [
  { key: 'dealName',        label: 'Deal Name' },
  { key: 'serviceCategory', label: 'Service Category' },
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

  showDealEditModal = false;
  selectedDealForEdit?: Deal;

  showNoteModal = false;
  selectedDealForNote?: Deal;
  selectedNoteForEdit?: DealNote;

  sortColumn: keyof Deal | '' = '';
  sortDirection: 'asc' | 'desc' = 'asc';
  pinnedColumns: (keyof Deal)[] = [];
  selectedDeals: Set<number> = new Set();

  constructor(private datePipe: DatePipe) {}

  ngOnInit(): void {
    this.deals = seedData as Deal[];
  }

  get allSelected(): boolean {
    return this.deals.length > 0 && this.selectedDeals.size === this.deals.length;
  }

  get someSelected(): boolean {
    return this.selectedDeals.size > 0 && this.selectedDeals.size < this.deals.length;
  }

  toggleSelectAll(event: any): void {
    if (event.target.checked) {
      this.deals.forEach((_, idx) => this.selectedDeals.add(idx));
    } else {
      this.selectedDeals.clear();
    }
  }

  toggleSelectDeal(dealIndex: number): void {
    if (this.selectedDeals.has(dealIndex)) {
      this.selectedDeals.delete(dealIndex);
    } else {
      this.selectedDeals.add(dealIndex);
    }
  }

  isSelected(dealIndex: number): boolean {
    return this.selectedDeals.has(dealIndex);
  }

  openDealEditModal(deal: Deal): void {
    this.selectedDealForEdit = deal;
    this.showDealEditModal = true;
  }

  onDealEditSave(payload: DealEditPayload): void {
    if (!this.selectedDealForEdit) return;
    const idx = this.deals.indexOf(this.selectedDealForEdit);
    if (idx > -1) {
      const now = new Date().toISOString();
      const updated = [...this.deals];
      updated[idx] = { ...this.deals[idx], ...payload, modifiedTime: now, lastActivityTime: now };
      this.deals = updated;
    }
    this.closeDealEditModal();
  }

  closeDealEditModal(): void {
    this.showDealEditModal = false;
    this.selectedDealForEdit = undefined;
  }

  openNoteModal(deal: Deal, note?: DealNote): void {
    this.selectedDealForNote = deal;
    this.selectedNoteForEdit = note;
    this.showNoteModal = true;
  }

  onNoteSave(note: DealNote): void {
    if (!this.selectedDealForNote) return;
    if (!this.selectedDealForNote.notes) {
      this.selectedDealForNote.notes = [];
    }
    const existingIndex = this.selectedDealForNote.notes.findIndex(n => n.id === note.id);
    if (existingIndex > -1) {
      this.selectedDealForNote.notes[existingIndex] = note;
    } else {
      this.selectedDealForNote.notes.push({ ...note, createdDate: new Date() });
    }
    this.closeNoteModal();
  }

  closeNoteModal(): void {
    this.showNoteModal = false;
    this.selectedDealForNote = undefined;
    this.selectedNoteForEdit = undefined;
  }

  getTaskFlagClass(deal: Deal): string {
    if (!deal.taskDueDate) return '';
    const dueDate = new Date(deal.taskDueDate);
    const today = new Date();
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'flag-pending';
    if (diffDays <= 3) return 'flag-in-progress';
    return 'flag-completed';
  }

  getTaskFlagMonth(deal: Deal): string {
    if (!deal.taskDueDate) return '';
    const date = new Date(deal.taskDueDate);
    return date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
  }

  getTaskFlagDay(deal: Deal): string {
    if (!deal.taskDueDate) return '';
    const date = new Date(deal.taskDueDate);
    return String(date.getDate());
  }

  hasNotes(deal: Deal): boolean {
    return !!(deal.notes && deal.notes.length > 0);
  }

  getNotesCount(deal: Deal): number {
    return deal.notes?.length ?? 0;
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
}
