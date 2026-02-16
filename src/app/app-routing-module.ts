import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { MobileLoginComponent } from './mobile/pages/login/login.component';

const routes: Routes = [
  { path: 'login', component: LoginComponent },

  {
    path: 'admin',
    loadChildren: () =>
      import('./admin/admin.module').then(m => m.AdminModule)
  },

  {
    path: 'agent',
    loadChildren: () =>
      import('./staff/staff.module').then(m => m.StaffModule)
  },

  {
    path: 'staff',
    loadChildren: () =>
      import('./staff/staff.module').then(m => m.StaffModule)
  },

  {
    path: 'customer',
    loadChildren: () =>
      import('./customer/customer.module').then(m => m.CustomerModule)
  },

{
  path: 'mobile/login',
  loadComponent: () =>
    import('./mobile/pages/login/login.component')
      .then(m => m.MobileLoginComponent)
},

  // 🔹 Varsayılan yönlendirme
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  // 🔹 404 veya yanlış rota
  { path: '**', redirectTo: 'login' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true })],
  exports: [RouterModule]
})
export class AppRoutingModule {}
