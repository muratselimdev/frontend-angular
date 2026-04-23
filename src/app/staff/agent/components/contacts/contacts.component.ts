import { Component, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import seedData from './contacts-seed.json';

export interface ContactNote {
  id?: string;
  title: string;
  content: string;
  createdDate?: Date;
  modifiedDate?: Date;
}

export interface Contact {
  statusId: string;
  contactId: number;
  contactName: string;
  phone: string;
  email: string;
  leadSource: string;
  campaignName: string;
  language: string;
  contactOwner: string;
  createdTime: string | null;
  modifiedTime: string | null;
  lastActivityTime: string | null;
  taskDueDate?: string;
  notes?: ContactNote[];
}

interface ColumnDef {
  key: keyof Contact;
  label: string;
}

const ALL_COLUMNS: ColumnDef[] = [
  { key: 'statusId',        label: 'Status-Id' },
  { key: 'contactId',       label: 'Contact-Id' },
  { key: 'contactName',     label: 'Contact Name' },
  { key: 'phone',           label: 'Phone' },
  { key: 'email',           label: 'Email' },
  { key: 'leadSource',      label: 'Lead Source' },
  { key: 'campaignName',    label: 'Campaign Name' },
  { key: 'language',        label: 'Language' },
  { key: 'contactOwner',    label: 'Contact Owner' },
  { key: 'createdTime',     label: 'Created Time' },
  { key: 'modifiedTime',    label: 'Modified Time' },
  { key: 'lastActivityTime',label: 'Last Activity Time' },
];

const PINNED_COL_WIDTH = 130;

@Component({
  selector: 'app-contacts',
  templateUrl: './contacts.component.html',
  styleUrl: './contacts.component.css',
  standalone: false,
  providers: [DatePipe]
})
export class ContactsComponent implements OnInit {
  contacts: Contact[] = [];
  loading = false;

  sortColumn: keyof Contact | '' = '';
  sortDirection: 'asc' | 'desc' = 'asc';
  pinnedColumns: (keyof Contact)[] = [];
  selectedContacts: Set<number> = new Set();

  constructor(private datePipe: DatePipe) {}

  ngOnInit(): void {
    this.contacts = seedData as Contact[];
  }

  get allSelected(): boolean {
    return this.contacts.length > 0 && this.selectedContacts.size === this.contacts.length;
  }

  get someSelected(): boolean {
    return this.selectedContacts.size > 0 && this.selectedContacts.size < this.contacts.length;
  }

  toggleSelectAll(event: any): void {
    if (event.target.checked) {
      this.contacts.forEach(c => this.selectedContacts.add(c.contactId));
    } else {
      this.selectedContacts.clear();
    }
  }

  toggleSelectContact(contactId: number): void {
    if (this.selectedContacts.has(contactId)) {
      this.selectedContacts.delete(contactId);
    } else {
      this.selectedContacts.add(contactId);
    }
  }

  isSelected(contactId: number): boolean {
    return this.selectedContacts.has(contactId);
  }

  getTaskFlagClass(contact: Contact): string {
    if (!contact.taskDueDate) return '';
    const dueDate = new Date(contact.taskDueDate);
    const today = new Date();
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'flag-pending';
    if (diffDays <= 3) return 'flag-in-progress';
    return 'flag-completed';
  }

  getTaskFlagMonth(contact: Contact): string {
    if (!contact.taskDueDate) return '';
    const date = new Date(contact.taskDueDate);
    return date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
  }

  getTaskFlagDay(contact: Contact): string {
    if (!contact.taskDueDate) return '';
    const date = new Date(contact.taskDueDate);
    return String(date.getDate());
  }

  hasNotes(contact: Contact): boolean {
    return !!(contact.notes && contact.notes.length > 0);
  }

  getNotesCount(contact: Contact): number {
    return contact.notes?.length ?? 0;
  }

  startCall(contact: Contact): void {
    console.log('Initiating call with:', contact.contactName, contact.phone);
  }

  get orderedColumns(): ColumnDef[] {
    const pinned   = ALL_COLUMNS.filter(c =>  this.pinnedColumns.includes(c.key));
    const unpinned = ALL_COLUMNS.filter(c => !this.pinnedColumns.includes(c.key));
    return [...pinned, ...unpinned];
  }

  get sortedContacts(): Contact[] {
    if (!this.sortColumn) return this.contacts;
    const col = this.sortColumn;
    const dir = this.sortDirection === 'asc' ? 1 : -1;
    return [...this.contacts].sort((a, b) => {
      const av = a[col] ?? '';
      const bv = b[col] ?? '';
      if (av < bv) return -1 * dir;
      if (av > bv) return  1 * dir;
      return 0;
    });
  }

  sortBy(col: keyof Contact): void {
    if (this.sortColumn === col) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = col;
      this.sortDirection = 'asc';
    }
  }

  getSortIcon(col: keyof Contact): string {
    if (this.sortColumn !== col) return '⇅';
    return this.sortDirection === 'asc' ? '↑' : '↓';
  }

  isPinned(col: keyof Contact): boolean {
    return this.pinnedColumns.includes(col);
  }

  canPin(col: keyof Contact): boolean {
    return this.isPinned(col) || this.pinnedColumns.length < 3;
  }

  togglePin(col: keyof Contact, event: Event): void {
    event.stopPropagation();
    if (this.isPinned(col)) {
      this.pinnedColumns = this.pinnedColumns.filter(c => c !== col);
    } else if (this.pinnedColumns.length < 3) {
      this.pinnedColumns = [...this.pinnedColumns, col];
    }
  }

  getPinnedLeft(col: keyof Contact): string {
    const idx = this.pinnedColumns.indexOf(col);
    return `${idx * PINNED_COL_WIDTH}px`;
  }

  getCellValue(contact: Contact, key: keyof Contact): string {
    const val = contact[key];
    if (key === 'createdTime' || key === 'modifiedTime' || key === 'lastActivityTime') {
      return this.datePipe.transform(val as string, 'dd/MM/yyyy HH:mm') ?? '';
    }
    return val != null ? String(val) : '';
  }

  getStatusClass(status: string): string {
    const s = (status || '').toLowerCase();
    if (s.includes('active') || s.includes('open')) return 'badge-active';
    if (s.includes('closed') || s.includes('done')) return 'badge-closed';
    if (s.includes('pending')) return 'badge-pending';
    return 'badge-default';
  }
}
