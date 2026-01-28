import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../auth/auth.service';

interface MenuItem {
  label: string;
  path: string;
  icon: string;
  subItems?: MenuItem[];
  isOpen?: boolean;
}

interface MenuGroup {
  label: string;
  icon?: string;
  items: MenuItem[];
  isOpen?: boolean;
}

@Component({
  selector: 'app-admin-layout',
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.css',
  standalone: false
})
export class AdminLayoutComponent implements OnInit {
  collapsed = false;   // desktop collapse
  mobileOpen = false;  // mobile offcanvas
  isExpanded = true;   // sidebar expanded state
  isHovered = false;   // sidebar hover state
  isDarkMode = false;  // dark mode toggle
  contentMenuOpen = false; // content menu toggle
  sidebarCollapsed = false; // sidebar icon-only mode
  languageMenuOpen = false; // language dropdown menu
  currentLanguage = 'tr'; // current language
  userMenuOpen = false; // user dropdown menu

  constructor(
    private router: Router,
    private translate: TranslateService,
    private authService: AuthService
  ) {}

  menuGroups: MenuGroup[] = [
    {
      label: 'MENU',
      icon: 'dashboard',
      isOpen: true,
      items: [
        { label: 'Dashboard', path: '/admin/dashboard', icon: '📊' }
      ]
    },
    {
      label: 'Tanımlar',
      icon: 'definitions',
      isOpen: false,
      items: [
        { label: 'Şubeler', path: '/admin/branches', icon: '🏢' },
        { label: 'Klinikler', path: '/admin/clinics', icon: '🏥' },
        { label: 'Hastaneler', path: '/admin/hospitals', icon: '🏨' },
        { label: 'Dil Grupları', path: '/admin/language-groups', icon: '🌐' },
        { label: 'Tedavi Grupları', path: '/admin/treatment-groups', icon: '🩹' },
        { label: 'Tedaviler', path: '/admin/treatments', icon: '💊' },
        { label: 'Oteller', path: '/admin/hotels', icon: '🏨' },
        { label: 'Hasta Transferleri', path: '/admin/patient-transfers', icon: '🚐' }
      ]
    },
    {
      label: 'Mobil',
      icon: 'mobile',
      isOpen: true,
      items: [
        { label: 'Kategoriler', path: '/admin/categories', icon: '🚐' },
        { label: 'Kampanyalar', path: '/admin/campaigns', icon: '🚐' }
      ]
    },
    {
      label: 'Klinik Personeli',
      icon: 'clinic-staff',
      isOpen: true,
      items: [
        { label: 'Klinik Yöneticileri', path: '/admin/clinic-managers', icon: '👨‍⚕️' },
        { label: 'Doktorlar', path: '/admin/doctors', icon: '🩺' },
        { label: 'Dental Asistanlar', path: '/admin/dental-assistants', icon: '🦷' }
      ]
    },
    {
      label: 'Hastane Personeli',
      icon: 'hospital-staff',
      isOpen: true,
      items: [
        { label: 'Hastane Yöneticileri', path: '/admin/hospital-managers', icon: '🏥' },
        { label: 'Doktorlar', path: '/admin/doctors', icon: '🩺' },
        { label: 'Hemşireler', path: '/admin/hospital-assistants', icon: '🧑‍⚕️' }
      ]
    },
    {
      label: 'Satış & Operasyon',
      icon: 'sales',
      isOpen: true,
      items: [
        { label: 'Supervisorlar', path: '/admin/supervisors', icon: '🧑‍💼' },
        { label: 'Temsilciler', path: '/admin/agents', icon: '👩‍💻' }
      ]
    },
    {
      label: 'Tercümanlar',
      icon: 'translators',
      isOpen: true,
      items: [
        { label: 'Tercüman Liderleri', path: '/admin/translator-leads', icon: '🗣️' },
        { label: 'Tercümanlar', path: '/admin/translators', icon: '💬' }
      ]
    }
  ];

  toggleSidebar() { 
    this.collapsed = !this.collapsed;
    this.isExpanded = !this.isExpanded;
  }
  
  toggleMobileSidebar() { 
    this.mobileOpen = !this.mobileOpen;
    // Prevent body scroll when mobile menu is open
    if (this.mobileOpen) {
      document.body.classList.add('mobile-menu-open');
    } else {
      document.body.classList.remove('mobile-menu-open');
    }
  }
  
  closeMobileSidebar() { 
    this.mobileOpen = false;
    document.body.classList.remove('mobile-menu-open');
  }

  toggleGroup(groupIndex: number) {
    const group = this.menuGroups[groupIndex];
    group.isOpen = !group.isOpen;
  }

  toggleSubmenu(groupIndex: number, itemIndex: number) {
    const item = this.menuGroups[groupIndex].items[itemIndex];
    if (item.subItems) {
      item.isOpen = !item.isOpen;
    }
  }

  toggleDarkMode() {
    this.isDarkMode = !this.isDarkMode;
    document.documentElement.classList.toggle('dark', this.isDarkMode);
    localStorage.setItem('darkMode', this.isDarkMode.toString());
  }

  toggleContentMenu() {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  onMouseEnter() {
    if (!this.isExpanded) {
      this.isHovered = true;
    }
  }

  onMouseLeave() {
    this.isHovered = false;
  }

  ngOnInit() {
    // Initialize dark mode from localStorage if previously set
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode === 'true') {
      this.isDarkMode = true;
      document.documentElement.classList.add('dark');
    }
    
    // Set Turkish as default language
    this.currentLanguage = 'tr';
    this.translate.use('tr');
  }

  toggleLanguageMenu(event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    this.languageMenuOpen = !this.languageMenuOpen;
  }

  switchLanguage(lang: string) {
    this.currentLanguage = lang;
    this.translate.use(lang);
    localStorage.setItem('language', lang);
    this.languageMenuOpen = false;
  }

  getCurrentYear(): number {
    return new Date().getFullYear();
  }

  navigateToProfile() {
    this.userMenuOpen = false;
    this.router.navigate(['/admin/profile']);
  }

  navigateToSettings() {
    this.userMenuOpen = false;
    this.router.navigate(['/admin/settings']);
  }

  navigateToSupport() {
    this.userMenuOpen = false;
    this.router.navigate(['/admin/support']);
  }

  logout() {
    this.userMenuOpen = false;
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  getUserName(): string {
    const profile = this.authService.profile;
    if (profile?.firstName && profile?.lastName) {
      return `${profile.firstName} ${profile.lastName}`;
    }
    return profile?.firstName || profile?.email || 'Admin';
  }

  getUserEmail(): string {
    return this.authService.profile?.email || 'admin@example.com';
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

  getGroupIconPath(iconName: string): string {
    const icons: { [key: string]: string } = {
      'menu': 'M4 6h16M4 12h16M4 18h16',
      'dashboard': 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
      'definitions': 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
      'mobile': 'M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z',
      'clinic-staff': 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
      'hospital-staff': 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
      'sales': 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
      'translators': 'M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129'
    };
    return icons[iconName] || icons['menu'];
  }
}
