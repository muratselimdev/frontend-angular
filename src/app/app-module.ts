import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AppRoutingModule } from './app-routing-module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ToastrModule } from 'ngx-toastr';
import { RouterModule } from "@angular/router";
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { AuthInterceptor } from './auth/auth.interceptor';
import { CustomerAuthInterceptor } from './customer/interceptors/customer-auth.interceptor';

// Translation
import { TranslateModule } from '@ngx-translate/core';

// Auth
import { LoginComponent } from './login/login.component';

// Layout
import { TopbarComponent } from './layout/topbar/topbar.component';
import { AdminModule } from './admin/admin.module';
import { MobileLoginComponent } from './mobile/pages/login/login.component';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    TopbarComponent,
    MobileLoginComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    BrowserAnimationsModule,
    RouterModule,
    AppRoutingModule,
    AdminModule,
    TranslateModule.forRoot({
      defaultLanguage: 'tr'
    }),
    ToastrModule.forRoot({
      positionClass: 'toast-top-right',
      preventDuplicates: true,
      newestOnTop: true,
      progressBar: true,
      timeOut: 2500,
    })
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: CustomerAuthInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
