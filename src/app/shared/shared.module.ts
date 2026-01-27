import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CallIncomingModalComponent } from './components/call-incoming-modal/call-incoming-modal.component';

@NgModule({
  declarations: [
    CallIncomingModalComponent  // ✅ Tanımlandı
  ],
  imports: [
    CommonModule
  ],
  exports: [
    CallIncomingModalComponent  // ✅ Dışa aktarıldı
  ]
})
export class SharedModule {}
