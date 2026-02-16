import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminLayoutComponent } from './layout/admin-layout.component';
import { BranchesListComponent } from './components/branches-list/branches-list.component';
import { BranchFormComponent } from './components/branch-form/branch-form.component';
import { RoleGuard } from '../auth/role.guard';
import { SupervisorsListComponent } from './components/supervisors-list/supervisors-list.component';
import { SupervisorFormComponent } from './components/supervisor-form/supervisor-form.component';
import { AgentsListComponent } from './components/agents-list/agents-list.component';
import { AgentFormComponent } from './components/agent-form/agent-form.component';
import { HospitalsListComponent } from './components/hospitals-list/hospitals-list.component';
import { ClinicsListComponent } from './components/clinics-list/clinics-list.component';
import { DoctorsListComponent } from './components/doctors-list/doctors-list.component';
import { ClinicFormComponent } from './components/clinic-form/clinic-form.component';
import { HospitalFormComponent } from './components/hospital-form/hospital-form.component';
import { DoctorFormComponent } from './components/doctor-form/doctor-form.component';
import { StaffFormComponent } from './components/staff-form/staff-form.component';
import { StaffsListComponent } from './components/staffs-list/staffs-list.component';
import { LanguageGroupFormComponent } from './components/language-group-form/language-group-form.component';
import { LanguageGroupsListComponent } from './components/language-groups-list/language-groups-list.component';
import { ClinicManagersListComponent } from './components/clinic-managers-list/clinic-managers-list.component';
import { ClinicManagerFormComponent } from './components/clinic-manager-form/clinic-manager-form.component';
import { HospitalManagersListComponent } from './components/hospital-managers-list/hospital-managers-list.component';
import { HospitalManagerFormComponent } from './components/hospital-managers-form/hospital-manager-form.component';
import { DentalAssistantsListComponent } from './components/dental-assistants-list/dental-assistants-list.component';
import { DentalAssistantFormComponent } from './components/dental-assistant-form/dental-assistant-form.component';
import { HospitalAssistantsListComponent } from './components/hospital-assistants-list/hospital-assistants-list.component';
import { HospitalAssistantFormComponent } from './components/hospital-assistant-form/hospital-assistant-form.component';
import { TranslatorLeadsListComponent } from './components/translator-leads-list/translator-leads-list.component';
import { TranslatorLeadFormComponent } from './components/translator-lead-form/translator-lead-form.component';
import { TranslatorsListComponent } from './components/translators-list/translators-list.component';
import { TranslatorFormComponent } from './components/translator-form/translator-form.component';
import { HotelsListComponent } from './components/hotels-list/hotels-list.component';
import { HotelFormComponent } from './components/hotel-form/hotels-form.component';
import { PatientTransfersListComponent } from './components/patient-transfers-list/patient-transfers-list.component';
import { PatientTransferFormComponent } from './components/patient-transfer-form/patient-transfer-form.component';
import { TreatmentGroupsListComponent } from './components/treatment-groups-list/treatment-groups-list.component';
import { TreatmentGroupFormComponent } from './components/treatment-group-form/treatment-group-form.component';
import { TreatmentsListComponent } from './components/treatments-list/treatments-list.component';
import { TreatmentFormComponent } from './components/treatment-form/treatment-form.component';
import { CategoryListComponent } from './components/category-list/category-list.component';
import { CampaignListComponent } from './components/campaing-list/campaing-list.component';
import { CampaignFormComponent } from './components/campaign-form/campaign-form.component';
import { CategoryFormComponent } from './components/category-form/category-form.component';
import { CategoryItemListComponent } from './components/category-item-list/category-item-list.component';
import { CategoryItemFormComponent } from './components/category-item-form/category-item-form.component';
import { CategoryItemDetailListComponent } from './components/category-item-detail-list/category-item-detail-list.component';
import { CategoryItemDetailFormComponent } from './components/category-item-detail-form/category-item-detail-form.component';
import { AdminPanel } from './components/admin-panel/admin-panel';
import { PopulersListComponent } from './components/populers-list/populers-list.component';
import { PopulersFormComponent } from './components/populers-form/populers-form.component';

const routes: Routes = [
  {
    path: '',
    component: AdminLayoutComponent,
    canActivate: [RoleGuard],
    data: { roles: ['Admin'] },
    children: [
      { path: '', component: AdminPanel },
      { path: 'dashboard', component: AdminPanel },
      { path: 'branches', component: BranchesListComponent },
      { path: 'branches/new', component: BranchFormComponent },
      { path: 'branches/:id', component: BranchFormComponent },

      { path: 'supervisors', component: SupervisorsListComponent },
      { path: 'supervisors/new', component: SupervisorFormComponent },
      { path: 'supervisors/:id', component: SupervisorFormComponent },

      { path: 'agents', component: AgentsListComponent },
      { path: 'agents/new', component: AgentFormComponent },
      { path: 'agents/:id', component: AgentFormComponent },

      { path: 'clinics', component: ClinicsListComponent },
      { path: 'clinics/new', component: ClinicFormComponent },
      { path: 'clinics/:id', component: ClinicFormComponent },

      { path: 'hospitals', component: HospitalsListComponent },
      { path: 'hospitals/new', component: HospitalFormComponent },
      { path: 'hospitals/:id', component: HospitalFormComponent },

      { path: 'language-groups', component: LanguageGroupsListComponent },
      { path: 'language-groups/new', component: LanguageGroupFormComponent },
      { path: 'language-groups/:id', component: LanguageGroupFormComponent },

      { path: 'treatment-groups', component: TreatmentGroupsListComponent },
      { path: 'treatment-groups/new', component: TreatmentGroupFormComponent },
      { path: 'treatment-groups/:id', component: TreatmentGroupFormComponent },

      { path: 'treatments', component: TreatmentsListComponent },
      { path: 'treatments/new', component: TreatmentFormComponent },
      { path: 'treatments/:id', component: TreatmentFormComponent },

      { path: 'categories', component: CategoryListComponent },
      { path: 'categories/new', component: CategoryFormComponent },
      { path: 'categories/:id', component: CategoryFormComponent },

      { path: 'category-items', component: CategoryItemListComponent },
      { path: 'category-items/new', component: CategoryItemFormComponent },
      { path: 'category-items/:id', component: CategoryItemFormComponent },

      { path: 'category-item-details', component: CategoryItemDetailListComponent },
      { path: 'category-item-details/new', component: CategoryItemDetailFormComponent },
      { path: 'category-item-details/:id', component: CategoryItemDetailFormComponent },

      { path: 'campaigns', component: CampaignListComponent },
      { path: 'campaigns/new', component: CampaignFormComponent },
      { path: 'campaigns/:id', component: CampaignFormComponent },

      { path: 'populers', component: PopulersListComponent },
      { path: 'populers/new', component: PopulersFormComponent },
      { path: 'populers/:id', component: PopulersFormComponent },

      // Oteller
      { path: 'hotels', component: HotelsListComponent },
      { path: 'hotels/new', component: HotelFormComponent },
      { path: 'hotels/:id', component: HotelFormComponent },

      // Hasta Transferleri
      { path: 'patient-transfers', component: PatientTransfersListComponent },
      { path: 'patient-transfers/new', component: PatientTransferFormComponent },
      { path: 'patient-transfers/:id', component: PatientTransferFormComponent },

      // Doktor
      { path: 'doctors', component: DoctorsListComponent, data: { role: 'Doctor', title: 'Doktor' } },
      { path: 'doctors/new', component: DoctorFormComponent, data: { role: 'Doctor', title: 'Doktor' } },
      { path: 'doctors/:id', component: DoctorFormComponent, data: { role: 'Doctor', title: 'Doktor' } },

      // Klinik Yöneticisi
      { path: 'clinic-managers', component: ClinicManagersListComponent, data: { role: 'ClinicManager', title: 'Klinik Yöneticisi' } },
      { path: 'clinic-managers/new', component: ClinicManagerFormComponent, data: { role: 'ClinicManager', title: 'Klinik Yöneticisi' } },
      { path: 'clinic-managers/:id', component: ClinicManagerFormComponent, data: { role: 'ClinicManager', title: 'Klinik Yöneticisi' } },

      // Dental Asistan
      { path: 'dental-assistants', component: DentalAssistantsListComponent, data: { role: 'DentalAssistant', title: 'Dental Asistan' } },
      { path: 'dental-assistants/new', component: DentalAssistantFormComponent, data: { role: 'DentalAssistant', title: 'Dental Asistan' } },
      { path: 'dental-assistants/:id', component: DentalAssistantFormComponent, data: { role: 'DentalAssistant', title: 'Dental Asistan' } },

      // Hastane Yöneticisi
      { path: 'hospital-managers', component: HospitalManagersListComponent, data: { role: 'HospitalManager', title: 'Hastane Yöneticisi' } },
      { path: 'hospital-managers/new', component: HospitalManagerFormComponent, data: { role: 'HospitalManager', title: 'Hastane Yöneticisi' } },
      { path: 'hospital-managers/:id', component: HospitalManagerFormComponent, data: { role: 'HospitalManager', title: 'Hastane Yöneticisi' } },

      // Hastane Asistanı
      { path: 'hospital-assistants', component: HospitalAssistantsListComponent, data: { role: 'HospitalAssistant', title: 'Hastane Asistanı' } },
      { path: 'hospital-assistants/new', component: HospitalAssistantFormComponent, data: { role: 'HospitalAssistant', title: 'Hastane Asistanı' } },
      { path: 'hospital-assistants/:id', component: HospitalAssistantFormComponent, data: { role: 'HospitalAssistant', title: 'Hastane Asistanı' } },

      // Translator Lead
      { path: 'translator-leads', component: TranslatorLeadsListComponent, data: { role: 'TranslatorLead', title: 'Tercüman Lideri' } },
      { path: 'translator-leads/new', component: TranslatorLeadFormComponent, data: { role: 'TranslatorLead', title: 'Tercüman Lideri' } },
      { path: 'translator-leads/:id', component: TranslatorLeadFormComponent, data: { role: 'TranslatorLead', title: 'Tercüman Lideri' } },

      // Translator
      { path: 'translators', component: TranslatorsListComponent, data: { role: 'Translator', title: 'Tercüman' } },
      { path: 'translators/new', component: TranslatorFormComponent, data: { role: 'Translator', title: 'Tercüman' } },
      { path: 'translators/:id', component: TranslatorFormComponent, data: { role: 'Translator', title: 'Tercüman' } }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule {}
