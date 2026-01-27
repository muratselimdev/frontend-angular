import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CustomerAuthService } from '../services/customer-auth.service';

@Component({
  selector: 'app-customer-layout',
  templateUrl: './customer-layout.component.html',
  styleUrl: './customer-layout.component.css',
  standalone: false
})
export class CustomerLayoutComponent implements OnInit {
  customerName: string | null = null;

  constructor(
    private auth: CustomerAuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const profile = localStorage.getItem('customerProfile');
    if (profile) {
      const data = JSON.parse(profile);
      this.customerName = `${data.firstName} ${data.lastName}`;
    }
  }

  logout() {
    this.auth.logout().subscribe({
      next: () => {
        localStorage.removeItem('customerProfile');
        this.router.navigate(['/customer/login'], { queryParams: { loggedOut: 'true' } });
      },
      error: err => console.error('Logout hatası', err)
    });
  }
}
