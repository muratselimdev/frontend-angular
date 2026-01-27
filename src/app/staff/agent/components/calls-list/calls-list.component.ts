import { Component, OnInit } from '@angular/core';
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
  calls: AgentCallVm[] = [];
  loading = false;

  constructor(private api: AgentCallsService, private router: Router) {}

  ngOnInit(): void {
    this.load();
  }

  load() {
    this.loading = true;
    this.api.getMyCalls().subscribe({
      next: res => { this.calls = res; this.loading = false; },
      error: _ => { this.loading = false; }
    });
  }

  openDetail(id: number) {
    this.router.navigate(['/agent/calls', id]);
  }
}
