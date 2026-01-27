import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { CustomerAuthService } from '../../services/customer-auth.service';
import { Router } from '@angular/router';

interface TreatmentGroup {
  id: number;
  name: string;
}

interface Treatment {
  id: number;
  name: string;
  treatmentGroupId: number;
}

@Component({
  selector: 'app-customer-dashboard',
  templateUrl: './customer-dashboard.component.html',
  styleUrl: './customer-dashboard.component.css',
  standalone: false
})
export class CustomerDashboardComponent implements OnInit {
  treatmentGroups: TreatmentGroup[] = [];
  treatments: Treatment[] = [];
  selectedGroupId?: number;
  selectedTreatmentId?: number;
  loading = false;
  customerName: string | null = null;

  constructor(private http: HttpClient, private auth: CustomerAuthService, private router: Router) {}

  ngOnInit(): void {
      this.loadCustomerProfile();
    this.loadTreatmentGroups();
  }

  loadTreatmentGroups() {
    this.http.get<TreatmentGroup[]>(`${environment.apiUrl}/api/treatments/groups`)
      .subscribe({
        next: res => this.treatmentGroups = res,
        error: err => console.error('Tedavi grupları alınamadı', err)
      });
  }

  loadCustomerProfile() {
  const profile = localStorage.getItem('customerProfile');
  if (profile) {
    const data = JSON.parse(profile);
    this.customerName = `${data.firstName} ${data.lastName}`;
  }
}

  onGroupChange() {
    if (!this.selectedGroupId) return;
    this.http.get<Treatment[]>(`${environment.apiUrl}/api/treatments/group/${this.selectedGroupId}`)
      .subscribe({
        next: res => this.treatments = res,
        error: err => console.error('Tedaviler alınamadı', err)
      });
  }

  submitSelection() {
    if (!this.selectedTreatmentId) {
      alert('Lütfen bir tedavi seçiniz.');
      return;
    }
    console.log('Seçilen grup:', this.selectedGroupId, 'tedavi:', this.selectedTreatmentId);
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
