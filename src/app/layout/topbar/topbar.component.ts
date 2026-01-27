import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-topbar',
  templateUrl: './topbar.component.html',
  styleUrl: './topbar.component.css',
  standalone: false
})
export class TopbarComponent {
  constructor(public auth: AuthService, private router: Router) {}

  roleText(): string {
    const r: any = this.auth.profile?.role;
    return typeof r === 'string' ? r : String(r);
  }

  logout() {
    this.auth.logout().subscribe(() => this.router.navigate(['/login']));
  }
}
