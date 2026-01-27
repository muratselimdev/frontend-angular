import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CustomerAuthService } from '../../../customer/services/customer-auth.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-mobile-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  standalone: false
})
export class MobileLoginComponent {

  email = '';
  password = '';

  constructor(
    private auth: CustomerAuthService,
    private router: Router,
    private toastr: ToastrService
  ) {}

  login() {
    this.auth.login(this.email, this.password).subscribe({
      next: (res) => {
        this.toastr.success('Giriş başarılı');
        this.router.navigate(['/mobile/home']);
      },
      error: () => this.toastr.error('Giriş başarısız')
    });
  }

  goToRegister() {
    this.router.navigate(['/mobile/register']);
  }
}
