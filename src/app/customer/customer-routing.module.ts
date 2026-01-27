import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { CustomerLayoutComponent } from './layouts/customer-layout.component';
import { CustomerDashboardComponent } from './components/customer-dashboard/customer-dashboard.component';
import { CustomerRequestsComponent } from './components/customer-requests/customer-requests.component';
import { CustomerRequestFormComponent } from './components/customer-request-form/customer-request-form.component';

import { CustomerLoginComponent } from './components/customer-login/customer-login.component';
import { CustomerRegisterComponent } from './components/customer-register/customer-register.component';
//import { CustomerForgotPasswordComponent } from './components/customer-forgot-password/customer-forgot-password.component';

import { CustomerAuthGuard } from './guards/customer-auth.guard';

const routes: Routes = [

  // -----------------------------------------------------
  // 🔹 Login — Layout dışında
  // -----------------------------------------------------
  { path: 'login', component: CustomerLoginComponent },

  // -----------------------------------------------------
  // 🔹 Register — Layout dışında
  // -----------------------------------------------------
  { path: 'register', component: CustomerRegisterComponent },

  // -----------------------------------------------------
  // 🔹 Forgot Password — Layout dışında
  // -----------------------------------------------------
  //{ path: 'forgot-password', component: CustomerForgotPasswordComponent },

  // -----------------------------------------------------
  // 🔹 Auth gerektiren layout bölgesi
  // -----------------------------------------------------
  {
    path: '',
    component: CustomerLayoutComponent,
    canActivate: [CustomerAuthGuard],
    children: [
      { path: 'dashboard', component: CustomerDashboardComponent },
      { path: 'requests', component: CustomerRequestsComponent },
      { path: 'requests/new', component: CustomerRequestFormComponent },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },

  // -----------------------------------------------------
  // 🔹 Her şey login sayfasına düşsün
  // -----------------------------------------------------
  { path: '**', redirectTo: 'login' }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CustomerRoutingModule {}
