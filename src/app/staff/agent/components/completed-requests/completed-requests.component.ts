import { Component } from '@angular/core';

@Component({
  selector: 'app-completed-requests',
  template: `
    <app-calls-list
      [title]="'Tamamlanmış Talepler'"
      [statusFilter]="completedStatuses"
      [emptyMessage]="'Tamamlanmış talep bulunmamaktadır.'">
    </app-calls-list>
  `,
  standalone: false
})
export class CompletedRequestsComponent {
  readonly completedStatuses = ['completed', 'tamam', 'closed', 'done'];
}
