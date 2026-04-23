import { Component, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import seedData from './leads-seed.json';
import { LeadNote } from './lead-note/lead-note.component';

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
  notes?: LeadNote[];
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
  selectedLeads = new Set<number>();

  // Note management
  showNoteModal = false;
  selectedLeadForNote?: Lead;
  selectedNoteForEdit?: LeadNote;

  // Call management
  showCallModal = false;
  selectedLeadForCall?: Lead;

  constructor(private datePipe: DatePipe) {}

  ngOnInit(): void {
    // TODO: replace with real API call when backend is ready
    this.leads = seedData as Lead[];
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

  get allSelected(): boolean {
    return this.leads.length > 0 && this.selectedLeads.size === this.leads.length;
  }

  get someSelected(): boolean {
    return this.selectedLeads.size > 0 && !this.allSelected;
  }

  toggleSelectAll(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      this.leads.forEach(l => this.selectedLeads.add(l.leadId));
    } else {
      this.selectedLeads.clear();
    }
  }

  toggleSelectLead(leadId: number): void {
    if (this.selectedLeads.has(leadId)) {
      this.selectedLeads.delete(leadId);
    } else {
      this.selectedLeads.add(leadId);
    }
  }

  isSelected(leadId: number): boolean {
    return this.selectedLeads.has(leadId);
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

  getTaskFlagClass(lead: Lead): string {
    const status = (lead.leadStatus || '').toLowerCase();
    if (status.includes('converted')) return 'flag-completed';
    if (status.includes('qualified'))  return 'flag-in-progress';
    return 'flag-pending';
  }

  getTaskFlagMonth(lead: Lead): string {
    const dateStr = lead.lastActivityTime || lead.createdTime;
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
  }

  getTaskFlagDay(lead: Lead): string {
    const dateStr = lead.lastActivityTime || lead.createdTime;
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return String(date.getDate());
  }

  // ===== Note Management Methods =====

  openNoteModal(lead: Lead, note?: LeadNote): void {
    this.selectedLeadForNote = lead;
    this.selectedNoteForEdit = note;
    this.showNoteModal = true;
  }

  onNoteSave(note: LeadNote): void {
    if (!this.selectedLeadForNote) return;

    // Initialize notes array if it doesn't exist
    if (!this.selectedLeadForNote.notes) {
      this.selectedLeadForNote.notes = [];
    }

    // Check if editing existing note
    const existingIndex = this.selectedLeadForNote.notes.findIndex(n => n.id === note.id);
    if (existingIndex > -1) {
      this.selectedLeadForNote.notes[existingIndex] = note;
    } else {
      // Add new note
      this.selectedLeadForNote.notes.push({
        ...note,
        createdDate: new Date()
      });
    }

    this.closeNoteModal();
  }

  closeNoteModal(): void {
    this.showNoteModal = false;
    this.selectedLeadForNote = undefined;
    this.selectedNoteForEdit = undefined;
  }

  getNotesCount(lead: Lead): number {
    return lead.notes ? lead.notes.length : 0;
  }

  hasNotes(lead: Lead): boolean {
    return this.getNotesCount(lead) > 0;
  }

  // ===== Call Management Methods =====

  startCall(lead: Lead): void {
    this.selectedLeadForCall = lead;
    this.showCallModal = true;
  }

  acceptCall(): void {
    // Handle accept call - can integrate with actual voice call service
    console.log('Call accepted for lead:', this.selectedLeadForCall?.leadName, this.selectedLeadForCall?.phone);
    this.closeCallModal();
  }

  rejectCall(): void {
    // Handle reject call
    console.log('Call rejected');
    this.closeCallModal();
  }

  endCall(): void {
    this.closeCallModal();
  }

  closeCallModal(): void {
    this.showCallModal = false;
    this.selectedLeadForCall = undefined;
  }
}
