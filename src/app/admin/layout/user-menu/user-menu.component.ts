import { Component, Output, EventEmitter, OnInit, HostListener, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../auth/auth.service';

@Component({
  selector: 'app-user-menu',
  templateUrl: './user-menu.component.html',
  styleUrls: ['./user-menu.component.css'],
  standalone: false
})
export class UserMenuComponent implements OnInit {
  @Output() menuClosed = new EventEmitter<void>();
  isOpen = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private elementRef: ElementRef
  ) {
    console.log('UserMenuComponent initialized');
  }

  ngOnInit() {
    console.log('UserMenuComponent ngOnInit called');
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const clickedInside = this.elementRef.nativeElement.contains(event.target);
    if (!clickedInside && this.isOpen) {
      this.isOpen = false;
      this.menuClosed.emit();
    }
  }

  toggle(event: Event) {
    event.stopPropagation();
    this.isOpen = !this.isOpen;
    console.log('User menu toggled to:', this.isOpen);
  }

  close() {
    this.isOpen = false;
    this.menuClosed.emit();
  }

  getUserName(): string {
    const profile = this.authService.profile;
    if (profile?.firstName && profile?.lastName) {
      return `${profile.firstName} ${profile.lastName}`;
    }
    return profile?.firstName || profile?.email || 'Admin';
  }

  getUserEmail(): string {
    return this.authService.profile?.email || '';
  }

  getUserInitial(): string {
    const profile = this.authService.profile;
    if (profile?.firstName) {
      return profile.firstName.charAt(0).toUpperCase();
    }
    if (profile?.email) {
      return profile.email.charAt(0).toUpperCase();
    }
    return 'A';
  }

  navigateToProfile() {
    this.close();
    this.router.navigate(['/admin/profile']);
  }

  navigateToSettings() {
    this.close();
    this.router.navigate(['/admin/settings']);
  }

  navigateToSupport() {
    this.close();
    this.router.navigate(['/admin/support']);
  }

  logout() {
    this.close();
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
