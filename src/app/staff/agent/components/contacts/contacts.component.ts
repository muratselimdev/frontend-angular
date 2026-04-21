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

  ngOnInit(): void {
    // Data will be loaded from API when backend is ready
  }

  getStatusClass(status: string): string {
    const s = (status || '').toLowerCase();
    if (s.includes('active') || s.includes('open')) return 'badge-active';
    if (s.includes('closed') || s.includes('done')) return 'badge-closed';
    if (s.includes('pending')) return 'badge-pending';
    return 'badge-default';
  }
}
