import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// Agent modülü
import { AgentLayoutComponent } from './agent/agent-layout/agent-layout.component';
import { CallsListComponent } from './agent/components/calls-list/calls-list.component';
import { CallDetailComponent } from './agent/components/call-detail/call-detail.component';
import { ChatComponent } from './agent/components/chat/chat.component';
import { VoiceComponent } from './agent/components/voice/voice.component';

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
      { path: 'calls/:id', component: CallDetailComponent },
      { path: 'chat', component: ChatComponent },
      { path: 'voice', component: VoiceComponent },
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
