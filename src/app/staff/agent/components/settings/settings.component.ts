import { Component } from '@angular/core';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css',
  standalone: false
})
export class SettingsComponent {
  currentPassword = '';
  newPassword = '';
  confirmPassword = '';

  constructor(private toastr: ToastrService) {}

  changePassword(): void {
    if (!this.currentPassword || !this.newPassword || !this.confirmPassword) {
      this.toastr.warning('Lütfen tüm şifre alanlarını doldurun.');
      return;
    }

    if (this.newPassword.length < 6) {
      this.toastr.error('Yeni şifre en az 6 karakter olmalıdır.');
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.toastr.error('Yeni şifreler eşleşmiyor.');
      return;
    }

    this.toastr.success('Şifre değişikliği isteği hazırlandı.');
    this.currentPassword = '';
    this.newPassword = '';
    this.confirmPassword = '';
  }
}
