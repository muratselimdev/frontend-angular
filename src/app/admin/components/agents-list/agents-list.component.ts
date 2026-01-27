import { Component, OnInit } from '@angular/core';
import { StaffService } from '../../services/staff.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-agents-list',
  templateUrl: './agents-list.component.html',
  styleUrl: './agents-list.component.css',
  standalone: false
})
export class AgentsListComponent implements OnInit {
  agents: any[] = [];
  loading = false;

  constructor(private staffService: StaffService, private router: Router) {}

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading = true;
    this.staffService.listByRole('Agent').subscribe({
      next: res => {
        this.agents = res;
        this.loading = false;
      },
      error: _ => {
        this.loading = false;
      }
    });
  }

  toggleActive(agent: any) {
    this.staffService.update(agent.id, { isActive: !agent.isActive }).subscribe(() => this.load());
  }

  edit(agent: any) {
    this.router.navigate(['/admin/agents', agent.id]);
  }

  addNew() {
    this.router.navigate(['/admin/agents/new']);
  }
}
