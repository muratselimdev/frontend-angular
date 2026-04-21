import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// Agent modülü
import { AgentLayoutComponent } from './agent/agent-layout/agent-layout.component';
import { CallsListComponent } from './agent/components/calls-list/calls-list.component';
import { OpenRequestsComponent } from './agent/components/open-requests/open-requests.component';
import { CompletedRequestsComponent } from './agent/components/completed-requests/completed-requests.component';
import { CancelledRequestsComponent } from './agent/components/cancelled-requests/cancelled-requests.component';
import { ProfileComponent } from './agent/components/profile/profile.component';
import { SettingsComponent } from './agent/components/settings/settings.component';
import { SupportComponent } from './agent/components/support/support.component';
import { LogoutComponent } from './agent/components/logout/logout.component';
import { CallDetailComponent } from './agent/components/call-detail/call-detail.component';
import { ChatComponent } from './agent/components/chat/chat.component';
import { VoiceComponent } from './agent/components/voice/voice.component';
import { ContactsComponent } from './agent/components/contacts/contacts.component';
import { LeadsComponent } from './agent/components/leads/leads.component';
import { DealsComponent } from './agent/components/deals/deals.component';

// Supervisor modülü
import { SupervisorDashboardComponent } from './supervisor/supervisor-dashboard/supervisor-dashboard.component';

// Sales Manager modülü
import { SalesManagerDashboardComponent } from './management/sales-manager-dashboard/sales-manager-dashboard.component';

const routes: Routes = [
  // === AGENT ===
  {
    path: '',
    component: AgentLayoutComponent,
    children: [
      { path: 'calls', component: CallsListComponent },
      { path: 'calls/open', component: OpenRequestsComponent },
      { path: 'calls/completed', component: CompletedRequestsComponent },
      { path: 'calls/cancelled', component: CancelledRequestsComponent },
      { path: 'calls/:id', component: CallDetailComponent },
      { path: 'chat', component: ChatComponent },
      { path: 'contacts', component: ContactsComponent },
      { path: 'leads', component: LeadsComponent },
      { path: 'deals', component: DealsComponent },
      { path: 'voice', component: VoiceComponent },
      { path: 'profile', component: ProfileComponent },
      { path: 'settings', component: SettingsComponent },
      { path: 'support', component: SupportComponent },
      { path: 'logout', component: LogoutComponent },
      { path: 'supervisor', component: SupervisorDashboardComponent},
      { path: '', redirectTo: 'calls', pathMatch: 'full' }
    ]
  },

  // === SUPERVISOR ===
  {
    path: 'supervisor',
    component: SupervisorDashboardComponent
  },

  // === SALES MANAGER ===
  {
    path: 'management',
    component: SalesManagerDashboardComponent
  },

  // === DEFAULT redirect ===
  { path: '', redirectTo: 'agent', pathMatch: 'full' },
  { path: '**', redirectTo: 'agent' }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class StaffRoutingModule {}
