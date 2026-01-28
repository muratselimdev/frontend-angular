import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CallIncomingModalComponent } from './components/call-incoming-modal/call-incoming-modal.component';
import { DataTableComponent } from './components/data-table/data-table.component';

@NgModule({
  declarations: [
    CallIncomingModalComponent,
    DataTableComponent
  ],
  imports: [
    CommonModule
  ],
  exports: [
    CallIncomingModalComponent,
    DataTableComponent
  ]
})
export class SharedModule {}
