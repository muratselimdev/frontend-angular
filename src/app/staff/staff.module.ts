import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { AgentLayoutComponent } from '../staff/agent/agent-layout/agent-layout.component';
import { StaffRoutingModule } from './staff-routing.module';

import { ChatComponent } from './agent/components/chat/chat.component';
import { VoiceComponent } from './agent/components/voice/voice.component';
import { CallsListComponent } from '../staff/agent/components/calls-list/calls-list.component';
import { CallDetailComponent } from '../staff/agent/components/call-detail/call-detail.component';
import { SupervisorDashboardComponent } from '../staff/supervisor/supervisor-dashboard/supervisor-dashboard.component';
import { SalesManagerDashboardComponent } from '../staff/management/sales-manager-dashboard/sales-manager-dashboard.component';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { AuthInterceptor } from '../auth/auth.interceptor';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { SharedModule } from '../shared/shared.module';
import { CallIncomingModalComponent } from '../shared/components/call-incoming-modal/call-incoming-modal.component';

@NgModule({
  declarations: [
    AgentLayoutComponent,
    ChatComponent,
    VoiceComponent,
    CallsListComponent,
    CallDetailComponent,
    SupervisorDashboardComponent,
    SalesManagerDashboardComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    StaffRoutingModule,
    MatTabsModule,
    MatIconModule,
    SharedModule
    ],
    providers: [
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true } // 🔹 Sadece staff için aktif
  ]
})
export class StaffModule {}
