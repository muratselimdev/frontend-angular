import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { CustomerRoutingModule } from './customer-routing.module';

// COMPONENTS
import { CustomerLayoutComponent } from './layouts/customer-layout.component';
import { CustomerLoginComponent } from './components/customer-login/customer-login.component';
import { CustomerDashboardComponent } from './components/customer-dashboard/customer-dashboard.component';
import { CustomerRequestsComponent } from './components/customer-requests/customer-requests.component';
import { CustomerRequestFormComponent } from './components/customer-request-form/customer-request-form.component';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { CustomerAuthInterceptor } from './interceptors/customer-auth.interceptor';
import { SharedModule } from "../shared/shared.module";
import { CustomerRegisterComponent } from './components/customer-register/customer-register.component';

@NgModule({
  declarations: [
    CustomerLayoutComponent,
    CustomerLoginComponent,
    CustomerDashboardComponent,
    CustomerRequestsComponent,
    CustomerRequestFormComponent,
    CustomerRegisterComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    CustomerRoutingModule,
    SharedModule
],
    providers: [
    { provide: HTTP_INTERCEPTORS, useClass: CustomerAuthInterceptor, multi: true }
  ]
})
export class CustomerModule {}
