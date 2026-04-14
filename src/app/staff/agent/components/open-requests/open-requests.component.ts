import { Component } from '@angular/core';

@Component({
  selector: 'app-open-requests',
  template: `
    <app-calls-list
      [title]="'Açık Talepler'"
      [statusFilter]="openStatuses"
      [emptyMessage]="'Açık talep bulunmamaktadır.'">
    </app-calls-list>
  `,
  standalone: false
})
export class OpenRequestsComponent {
  readonly openStatuses = ['pending', 'new', 'open', 'assigned', 'inprogress', 'in progress'];
}
