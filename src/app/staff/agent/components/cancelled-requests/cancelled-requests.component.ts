import { Component } from '@angular/core';

@Component({
  selector: 'app-cancelled-requests',
  template: `
    <app-calls-list
      [title]="'İptal Talepler'"
      [statusFilter]="cancelledStatuses"
      [emptyMessage]="'İptal edilmiş talep bulunmamaktadır.'">
    </app-calls-list>
  `,
  standalone: false
})
export class CancelledRequestsComponent {
  readonly cancelledStatuses = ['cancelled', 'canceled', 'iptal', 'rejected'];
}
