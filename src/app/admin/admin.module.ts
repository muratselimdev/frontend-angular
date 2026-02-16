import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { AdminRoutingModule } from './admin-routing.module';
import { AdminLayoutComponent } from './layout/admin-layout.component';
import { UserMenuComponent } from './layout/user-menu/user-menu.component';
import { ClickOutsideDirective } from './layout/click-outside.directive';

import { BranchesListComponent } from './components/branches-list/branches-list.component';
import { BranchFormComponent } from './components/branch-form/branch-form.component';
import { AgentsListComponent } from './components/agents-list/agents-list.component';

import { SupervisorsListComponent } from './components/supervisors-list/supervisors-list.component';
import { SupervisorFormComponent } from './components/supervisor-form/supervisor-form.component';
import { ClinicsListComponent } from './components/clinics-list/clinics-list.component';
import { HospitalsListComponent } from './components/hospitals-list/hospitals-list.component';
import { DoctorsListComponent } from './components/doctors-list/doctors-list.component';
import { ClinicFormComponent } from './components/clinic-form/clinic-form.component';
import { HospitalFormComponent } from './components/hospital-form/hospital-form.component';
import { DoctorFormComponent } from './components/doctor-form/doctor-form.component';
import { StaffsListComponent } from './components/staffs-list/staffs-list.component';
import { StaffFormComponent } from './components/staff-form/staff-form.component';
import { LanguageGroupsListComponent } from './components/language-groups-list/language-groups-list.component';
import { LanguageGroupFormComponent } from './components/language-group-form/language-group-form.component';
import { ClinicManagersListComponent } from './components/clinic-managers-list/clinic-managers-list.component';
import { ClinicManagerFormComponent } from './components/clinic-manager-form/clinic-manager-form.component';
import { HospitalManagersListComponent } from './components/hospital-managers-list/hospital-managers-list.component';
import { HospitalManagerFormComponent } from './components/hospital-managers-form/hospital-manager-form.component';
import { DentalAssistantsListComponent } from './components/dental-assistants-list/dental-assistants-list.component';
import { DentalAssistantFormComponent } from './components/dental-assistant-form/dental-assistant-form.component';
import { HospitalAssistantsListComponent } from './components/hospital-assistants-list/hospital-assistants-list.component';
import { HospitalAssistantFormComponent } from './components/hospital-assistant-form/hospital-assistant-form.component';
import { AgentFormComponent } from './components/agent-form/agent-form.component';
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
import { CampaignListComponent } from './components/campaing-list/campaing-list.component';
import { CampaignFormComponent } from './components/campaign-form/campaign-form.component';
import { CategoryListComponent } from './components/category-list/category-list.component';
import { CategoryFormComponent } from './components/category-form/category-form.component';
import { CategoryItemListComponent } from './components/category-item-list/category-item-list.component';
import { CategoryItemFormComponent } from './components/category-item-form/category-item-form.component';
import { CategoryItemDetailListComponent } from './components/category-item-detail-list/category-item-detail-list.component';
import { CategoryItemDetailFormComponent } from './components/category-item-detail-form/category-item-detail-form.component';
import { AdminPanel } from './components/admin-panel/admin-panel';
import { PopulersListComponent } from './components/populers-list/populers-list.component';
import { PopulersFormComponent } from './components/populers-form/populers-form.component';

@NgModule({
  declarations: [
    AdminLayoutComponent,
    UserMenuComponent,
    ClickOutsideDirective,
    BranchesListComponent,
    BranchFormComponent,
    AgentsListComponent,
    AgentFormComponent,
    SupervisorsListComponent,
    SupervisorFormComponent,
    ClinicsListComponent,
    ClinicFormComponent,
    HospitalsListComponent,
    HospitalFormComponent,
    DoctorsListComponent,
    DoctorFormComponent,
    StaffsListComponent,
    StaffFormComponent,
    LanguageGroupsListComponent,
    LanguageGroupFormComponent,
    ClinicManagersListComponent,
    ClinicManagerFormComponent,
    HospitalManagersListComponent,
    HospitalManagerFormComponent,
    DentalAssistantsListComponent,
    DentalAssistantFormComponent,
    HospitalAssistantsListComponent,
    HospitalAssistantFormComponent,
    TranslatorLeadsListComponent,
    TranslatorLeadFormComponent,
    TranslatorsListComponent,
    TranslatorFormComponent,
    HotelsListComponent,
    HotelFormComponent,
    PatientTransfersListComponent,
    PatientTransferFormComponent,
    TreatmentGroupsListComponent,
    TreatmentGroupFormComponent,
    TreatmentsListComponent,
    TreatmentFormComponent,
    CategoryListComponent,
    CategoryFormComponent,
    CategoryItemListComponent,
    CategoryItemFormComponent,
    CategoryItemDetailListComponent,
    CategoryItemDetailFormComponent,
    CampaignListComponent,
    CampaignFormComponent,
    AdminPanel,
    PopulersListComponent,
    PopulersFormComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    AdminRoutingModule,
    TranslateModule
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AdminModule {}
