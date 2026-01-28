import { Component, Input, Output, EventEmitter } from '@angular/core';

export interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  type?: 'text' | 'status' | 'actions' | 'date' | 'number';
}

export interface TableAction {
  label: string;
  type: 'toggle' | 'edit' | 'delete' | 'view' | 'custom';
  class?: string;
  icon?: string;
}

@Component({
  selector: 'app-data-table',
  templateUrl: './data-table.component.html',
  standalone: false
})
export class DataTableComponent {
  @Input() columns: TableColumn[] = [];
  @Input() data: any[] = [];
  @Input() actions: TableAction[] = [
    { label: 'Aktif/Pasif', type: 'toggle', class: 'bootstrap-warning' },
    { label: 'Düzenle', type: 'edit', class: 'bootstrap-info' }
  ];
  
  @Input() currentPage: number = 1;
  @Input() totalPages: number = 1;
  @Input() totalRecords: number = 0;
  @Input() pageSize: number = 10;
  
  @Output() actionClick = new EventEmitter<{ action: TableAction, row: any }>();
  @Output() pageChange = new EventEmitter<number>();
  @Output() sortChange = new EventEmitter<{ column: string, direction: 'asc' | 'desc' }>();

  onActionClick(action: TableAction, row: any) {
    this.actionClick.emit({ action, row });
  }

  onPageChange(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.pageChange.emit(page);
    }
  }

  getStatusClass(status: string): string {
    const statusLower = status?.toLowerCase();
    if (statusLower === 'aktif' || statusLower === 'active') {
      // Bootstrap success color
      return 'bootstrap-success';
    } else if (statusLower === 'pasif' || statusLower === 'passive' || statusLower === 'inactive') {
      // Bootstrap danger color
      return 'bootstrap-danger';
    }
    return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
  }

  getStatusStyle(status: string): any {
    const statusLower = status?.toLowerCase();
    if (statusLower === 'aktif' || statusLower === 'active') {
      return { 'background-color': '#d4edda', 'color': '#155724' };
    } else if (statusLower === 'pasif' || statusLower === 'passive' || statusLower === 'inactive') {
      return { 'background-color': '#f8d7da', 'color': '#721c24' };
    }
    return {};
  }

  getPaginationRange(): number[] {
    const range: number[] = [];
    const delta = 2;
    const left = this.currentPage - delta;
    const right = this.currentPage + delta + 1;
    
    for (let i = 1; i <= this.totalPages; i++) {
      if (i === 1 || i === this.totalPages || (i >= left && i < right)) {
        range.push(i);
      }
    }
    
    return range;
  }
}
