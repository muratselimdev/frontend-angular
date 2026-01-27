import { Component, OnInit } from '@angular/core';
import { SalesManagerService } from '../../services/sales-manager.service';
import { AgentCall } from '../../models/agent-call.model';

@Component({
  selector: 'app-sales-manager-dashboard',
  templateUrl: './sales-manager-dashboard.component.html',
  styleUrl: './sales-manager-dashboard.component.css',
  standalone: false
})
export class SalesManagerDashboardComponent implements OnInit {
  pendingCalls: AgentCall[] = [];
  stats: any = {};
  selectedLangGroupId?: number;

  constructor(private smService: SalesManagerService) {}

  ngOnInit(): void {
    this.loadStats();
    this.loadPending();
  }

  loadStats(): void {
    this.smService.getCallStats().subscribe(stats => this.stats = stats);
  }

  loadPending(): void {
    this.smService.getPendingCalls().subscribe(data => this.pendingCalls = data);
  }

  filterByLangGroup(id: number): void {
    this.smService.getCallsByLangGroup(id).subscribe(data => this.pendingCalls = data);
  }
}
