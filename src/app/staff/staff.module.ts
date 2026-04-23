import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CKEditorModule } from '@ckeditor/ckeditor5-angular';

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
import { LeadNoteComponent } from './agent/components/leads/lead-note/lead-note.component';
import { LeadEditComponent } from './agent/components/leads/lead-edit/lead-edit.component';
import { LeadTransitionComponent } from './agent/components/leads/lead-transition/lead-transition.component';
import { ContactEditComponent } from './agent/components/contacts/contact-edit/contact-edit.component';
import { ContactNoteComponent } from './agent/components/contacts/contact-note/contact-note.component';
import { DealsComponent } from './agent/components/deals/deals.component';
import { DealEditComponent } from './agent/components/deals/deal-edit/deal-edit.component';
import { DealNoteComponent } from './agent/components/deals/deal-note/deal-note.component';
import { PlanningComponent } from './agent/components/planning/planning.component';
import { PlanningEditComponent } from './agent/components/planning/planning-edit/planning-edit.component';
import { PlanningNoteComponent } from './agent/components/planning/planning-note/planning-note.component';
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
    LeadNoteComponent,
    LeadEditComponent,
    LeadTransitionComponent,
    ContactEditComponent,
    ContactNoteComponent,
    DealsComponent,
    DealEditComponent,
    DealNoteComponent,
    PlanningComponent,
    PlanningEditComponent,
    PlanningNoteComponent,
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
    SharedModule,
    CKEditorModule
    ]
})
export class StaffModule {}
