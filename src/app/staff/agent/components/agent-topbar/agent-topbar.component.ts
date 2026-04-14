import { Component, ElementRef, HostListener, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../../../auth/auth.service';

interface NotificationItem {
  title: string;
  description: string;
  time: string;
  unread: boolean;
}

interface QuickLink {
  path: string;
  keywords: string[];
}

@Component({
  selector: 'app-agent-topbar',
  templateUrl: './agent-topbar.component.html',
  styleUrl: './agent-topbar.component.css',
  standalone: false
})
export class AgentTopbarComponent implements OnInit {
  searchTerm = '';
  isDarkMode = false;
  notificationsOpen = false;
  languageMenuOpen = false;
  userMenuOpen = false;
  currentLanguage = 'tr';

  notifications: NotificationItem[] = [
    {
      title: 'Yeni talep atandı',
      description: 'Açık talepler listenize yeni bir kayıt düştü.',
      time: 'Az önce',
      unread: true
    },
    {
      title: 'Mesaj bildirimi',
      description: 'Müşteriden yeni bir mesaj aldınız.',
      time: '5 dk önce',
      unread: true
    },
    {
      title: 'Sistem hatırlatması',
      description: 'Hesap bilgilerinizi güncel tutmayı unutmayın.',
      time: 'Bugün',
      unread: false
    }
  ];

  private quickLinks: QuickLink[] = [
    { path: '/agent/calls', keywords: ['talep', 'talepler', 'istek'] },
    { path: '/agent/calls/open', keywords: ['acik', 'açık', 'open', 'bekleyen'] },
    { path: '/agent/calls/completed', keywords: ['tamam', 'tamamlanan', 'completed', 'kapali'] },
    { path: '/agent/calls/cancelled', keywords: ['iptal', 'cancel', 'cancelled', 'reddedilen'] },
    { path: '/agent/chat', keywords: ['mesaj', 'chat', 'sohbet'] },
    { path: '/agent/voice', keywords: ['ses', 'arama', 'voice'] },
    { path: '/agent/profile', keywords: ['profil', 'user', 'kullanici'] },
    { path: '/agent/settings', keywords: ['ayar', 'settings', 'sifre', 'şifre', 'password'] },
    { path: '/agent/support', keywords: ['destek', 'yardim', 'help'] }
  ];

  constructor(
    private router: Router,
    private authService: AuthService,
    private translate: TranslateService,
    private toastr: ToastrService,
    private elementRef: ElementRef
  ) {}

  ngOnInit(): void {
    const savedDarkMode = localStorage.getItem('darkMode');
    this.isDarkMode = savedDarkMode === 'true';
    document.documentElement.classList.toggle('dark', this.isDarkMode);
    document.body.classList.toggle('dark-theme', this.isDarkMode);

    const savedLanguage = localStorage.getItem('language') || 'tr';
    this.currentLanguage = savedLanguage;
    this.translate.use(savedLanguage);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const clickedInside = this.elementRef.nativeElement.contains(event.target);
    if (!clickedInside) {
      this.closeMenus();
    }
  }

  get unreadCount(): number {
    return this.notifications.filter(item => item.unread).length;
  }

  performSearch(): void {
    const query = this.normalize(this.searchTerm);

    if (!query) {
      this.toastr.info('Aramak istediğiniz bölümü yazın.');
      return;
    }

    const match = this.quickLinks.find(link => link.keywords.some(keyword => query.includes(this.normalize(keyword))));

    if (match) {
      this.router.navigate([match.path]);
      this.searchTerm = '';
      return;
    }

    this.toastr.warning('Eşleşen bir ekran bulunamadı.');
  }

  toggleDarkMode(): void {
    this.isDarkMode = !this.isDarkMode;
    document.documentElement.classList.toggle('dark', this.isDarkMode);
    document.body.classList.toggle('dark-theme', this.isDarkMode);
    localStorage.setItem('darkMode', this.isDarkMode.toString());
  }

  toggleNotifications(event: Event): void {
    event.stopPropagation();
    this.notificationsOpen = !this.notificationsOpen;
    this.languageMenuOpen = false;
    this.userMenuOpen = false;

    if (this.notificationsOpen) {
      this.notifications = this.notifications.map(item => ({ ...item, unread: false }));
    }
  }

  toggleLanguageMenu(event: Event): void {
    event.stopPropagation();
    this.languageMenuOpen = !this.languageMenuOpen;
    this.notificationsOpen = false;
    this.userMenuOpen = false;
  }

  switchLanguage(lang: string): void {
    this.currentLanguage = lang;
    this.translate.use(lang);
    localStorage.setItem('language', lang);
    this.languageMenuOpen = false;
    this.toastr.success(lang === 'tr' ? 'Dil Türkçe olarak güncellendi.' : 'Language changed to English.');
  }

  toggleUserMenu(event: Event): void {
    event.stopPropagation();
    this.userMenuOpen = !this.userMenuOpen;
    this.languageMenuOpen = false;
    this.notificationsOpen = false;
  }

  getUserName(): string {
    const profile = this.authService.profile;
    if (profile?.firstName && profile?.lastName) {
      return `${profile.firstName} ${profile.lastName}`;
    }
    return profile?.firstName || profile?.email || 'Agent User';
  }

  getUserEmail(): string {
    return this.authService.profile?.email || 'agent@example.com';
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

  navigateToProfile(): void {
    this.closeMenus();
    this.router.navigate(['/agent/profile']);
  }

  navigateToSettings(section?: string): void {
    this.closeMenus();
    if (section) {
      this.router.navigate(['/agent/settings'], { fragment: section });
      return;
    }
    this.router.navigate(['/agent/settings']);
  }

  navigateToSupport(): void {
    this.closeMenus();
    this.router.navigate(['/agent/support']);
  }

  logout(): void {
    this.closeMenus();
    this.authService.logout().subscribe(() => this.router.navigate(['/login']));
  }

  private closeMenus(): void {
    this.notificationsOpen = false;
    this.languageMenuOpen = false;
    this.userMenuOpen = false;
  }

  private normalize(value: string): string {
    return (value || '')
      .toLocaleLowerCase('tr-TR')
      .replace(/ç/g, 'c')
      .replace(/ğ/g, 'g')
      .replace(/ı/g, 'i')
      .replace(/ö/g, 'o')
      .replace(/ş/g, 's')
      .replace(/ü/g, 'u')
      .trim();
  }
}
