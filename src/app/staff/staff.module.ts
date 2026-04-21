import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { AgentLayoutComponent } from './agent/agent-layout/agent-layout.component';
import { StaffRoutingModule } from './staff-routing.module';

import { ChatComponent } from './agent/components/chat/chat.component';
import { VoiceComponent } from './agent/components/voice/voice.component';
import { AgentTopbarComponent } from './agent/components/agent-topbar/agent-topbar.component';
import { CallsListComponent } from './agent/components/calls-list/calls-list.component';
import { OpenRequestsComponent } from './agent/components/open-requests/open-requests.component';
import { CompletedRequestsComponent } from './agent/components/completed-requests/completed-requests.component';
import { CancelledRequestsComponent } from './agent/components/cancelled-requests/cancelled-requests.component';
import { ProfileComponent } from './agent/components/profile/profile.component';
import { SettingsComponent } from './agent/components/settings/settings.component';
import { SupportComponent } from './agent/components/support/support.component';
import { LogoutComponent } from './agent/components/logout/logout.component';
import { CallDetailComponent } from './agent/components/call-detail/call-detail.component';
import { ContactsComponent } from './agent/components/contacts/contacts.component';
import { LeadsComponent } from './agent/components/leads/leads.component';
import { SupervisorDashboardComponent } from './supervisor/supervisor-dashboard/supervisor-dashboard.component';
import { SalesManagerDashboardComponent } from './management/sales-manager-dashboard/sales-manager-dashboard.component';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { SharedModule } from '../shared/shared.module';

@NgModule({
  declarations: [
    AgentLayoutComponent,
    ChatComponent,
    VoiceComponent,
    AgentTopbarComponent,
    CallsListComponent,
    OpenRequestsComponent,
    CompletedRequestsComponent,
    CancelledRequestsComponent,
    ProfileComponent,
    SettingsComponent,
    SupportComponent,
    LogoutComponent,
    CallDetailComponent,
    ContactsComponent,
    LeadsComponent,
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
    ]
})
export class StaffModule {}
