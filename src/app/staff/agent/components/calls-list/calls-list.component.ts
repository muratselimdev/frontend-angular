import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AgentCallsService } from '../../../services/agent-calls.service';

interface AgentCallVm {
  id: number;
  customerName: string;
  subject: string;
  status: string;
  createdAt: string;
}

@Component({
  selector: 'app-calls-list',
  templateUrl: './calls-list.component.html',
  styleUrl: './calls-list.component.css',
  standalone: false
})
export class CallsListComponent implements OnInit {
  @Input() title = 'Talepler';
  @Input() emptyMessage = 'Henüz size atanmış müşteri talebi bulunmamaktadır.';
  @Input() statusFilter: string[] = [];

  calls: AgentCallVm[] = [];
  loading = false;

  constructor(private api: AgentCallsService, private router: Router) {}

  ngOnInit(): void {
    this.load();
  }

  get filteredCalls(): AgentCallVm[] {
    if (!this.statusFilter?.length) {
      return this.calls;
    }

    return this.calls.filter(call => this.matchesStatus(call.status));
  }

  load() {
    this.loading = true;
    this.api.getMyCalls().subscribe({
      next: res => {
        this.calls = res;
        this.loading = false;
      },
      error: _ => {
        this.loading = false;
      }
    });
  }

  openDetail(id: number) {
    this.router.navigate(['/agent/calls', id]);
  }

  getCustomerInitial(name: string): string {
    return name ? name.charAt(0).toUpperCase() : 'M';
  }

  getStatusBadgeClass(status: string): string {
    const value = (status || '').toLowerCase();

    if (value.includes('completed') || value.includes('tamam') || value.includes('closed') || value.includes('done')) {
      return 'status-success';
    }

    if (value.includes('cancel') || value.includes('iptal') || value.includes('reject')) {
      return 'status-danger';
    }

    if (value.includes('pending') || value.includes('new') || value.includes('open')) {
      return 'status-warning';
    }

    return 'status-info';
  }

  private matchesStatus(status: string): boolean {
    const value = (status || '').toLowerCase();
    return this.statusFilter.some(filter => value.includes(filter.toLowerCase()));
  }
}
