import { Component, OnInit } from '@angular/core';

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
}

@Component({
  selector: 'app-contacts',
  templateUrl: './contacts.component.html',
  styleUrl: './contacts.component.css',
  standalone: false
})
export class ContactsComponent implements OnInit {
  contacts: Contact[] = [];
  loading = false;

  sortColumn: keyof Contact | '' = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  ngOnInit(): void {
    // Data will be loaded from API when backend is ready
  }

  get sortedContacts(): Contact[] {
    if (!this.sortColumn) return this.contacts;
    const col = this.sortColumn;
    const dir = this.sortDirection === 'asc' ? 1 : -1;
    return [...this.contacts].sort((a, b) => {
      const av = a[col] ?? '';
      const bv = b[col] ?? '';
      if (av < bv) return -1 * dir;
      if (av > bv) return 1 * dir;
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

  getStatusClass(status: string): string {
    const s = (status || '').toLowerCase();
    if (s.includes('active') || s.includes('open')) return 'badge-active';
    if (s.includes('closed') || s.includes('done')) return 'badge-closed';
    if (s.includes('pending')) return 'badge-pending';
    return 'badge-default';
  }
}
