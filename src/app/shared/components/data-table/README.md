# Data Table Component Usage Guide

## Basic Implementation

### 1. Import the component in your module (if not already in SharedModule)

```typescript
import { DataTableComponent } from './shared/components/data-table/data-table.component';

@NgModule({
  declarations: [
    DataTableComponent,
    // ... other components
  ],
  exports: [
    DataTableComponent
  ]
})
export class SharedModule { }
```

### 2. Use in your component template

```html
<app-data-table
  [columns]="columns"
  [data]="records"
  [actions]="actions"
  [currentPage]="currentPage"
  [totalPages]="totalPages"
  [totalRecords]="totalRecords"
  (actionClick)="onActionClick($event)"
  (pageChange)="onPageChange($event)">
</app-data-table>
```

### 3. Component TypeScript

```typescript
import { Component, OnInit } from '@angular/core';
import { TableColumn, TableAction } from '@app/shared/components/data-table/data-table.component';

export interface Record {
  id: number;
  name: string;
  status: string;
  createdAt: Date;
}

@Component({
  selector: 'app-branches-list',
  templateUrl: './branches-list.component.html'
})
export class BranchesListComponent implements OnInit {
  columns: TableColumn[] = [
    { key: 'name', label: 'Şube Adı', type: 'text' },
    { key: 'status', label: 'Durum', type: 'status' },
    { key: 'createdAt', label: 'Oluşturma Tarihi', type: 'date' },
    { key: 'actions', label: 'İşlemler', type: 'actions' }
  ];

  actions: TableAction[] = [
    { label: 'Aktif/Pasif', type: 'toggle', class: 'bg-yellow-400 hover:bg-yellow-500 text-gray-900' },
    { label: 'Düzenle', type: 'edit', class: 'bg-cyan-500 hover:bg-cyan-600 text-white' },
    { label: 'Sil', type: 'delete', class: 'bg-red-500 hover:bg-red-600 text-white' }
  ];

  records: Record[] = [];
  currentPage = 1;
  totalPages = 1;
  totalRecords = 0;
  pageSize = 10;

  ngOnInit() {
    this.loadRecords();
  }

  loadRecords() {
    // Load your data here
    this.records = [
      { id: 1, name: 'Merkez Şube', status: 'Aktif', createdAt: new Date() },
      { id: 2, name: 'Kadıköy Şube', status: 'Aktif', createdAt: new Date() },
      { id: 3, name: 'Beyoğlu Şube', status: 'Pasif', createdAt: new Date() }
    ];
    this.totalRecords = this.records.length;
    this.totalPages = Math.ceil(this.totalRecords / this.pageSize);
  }

  onActionClick(event: { action: TableAction, row: any }) {
    const { action, row } = event;
    
    switch (action.type) {
      case 'toggle':
        this.toggleStatus(row);
        break;
      case 'edit':
        this.editRecord(row);
        break;
      case 'delete':
        this.deleteRecord(row);
        break;
    }
  }

  toggleStatus(row: Record) {
    row.status = row.status === 'Aktif' ? 'Pasif' : 'Aktif';
    // Call your API to update status
    console.log('Toggle status for:', row);
  }

  editRecord(row: Record) {
    // Navigate to edit page or open modal
    console.log('Edit record:', row);
  }

  deleteRecord(row: Record) {
    if (confirm('Bu kaydı silmek istediğinizden emin misiniz?')) {
      // Call your API to delete
      console.log('Delete record:', row);
    }
  }

  onPageChange(page: number) {
    this.currentPage = page;
    this.loadRecords();
  }
}
```

## Styling Options

### Status Badge Colors
- **Aktif (Active)**: Green background (`bg-green-100 text-green-800`)
- **Pasif (Inactive)**: Red background (`bg-red-100 text-red-800`)

### Action Button Colors
- **Aktif/Pasif Toggle**: Yellow/Amber (`bg-yellow-400 hover:bg-yellow-500`)
- **Düzenle (Edit)**: Cyan (`bg-cyan-500 hover:bg-cyan-600`)
- **Sil (Delete)**: Red (`bg-red-500 hover:bg-red-600`)
- **Görüntüle (View)**: Blue (`bg-blue-500 hover:bg-blue-600`)

## Customization

### Custom Column Types
You can add more column types in the component:
- `text`: Regular text
- `status`: Status badge (Aktif/Pasif)
- `actions`: Action buttons
- `date`: Formatted date
- `number`: Formatted number

### Custom Actions
Add custom actions with specific styling:

```typescript
actions: TableAction[] = [
  { 
    label: 'Özel İşlem', 
    type: 'custom', 
    class: 'bg-purple-500 hover:bg-purple-600 text-white',
    icon: 'custom-icon'
  }
];
```

## Dark Mode Support
The table automatically supports dark mode using Tailwind's dark mode classes.
