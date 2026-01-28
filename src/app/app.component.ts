import { Component, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  standalone: false
})

export class AppComponent implements OnInit {

  isAuthRoute = false;

constructor(
  private router: Router,
  private translate: TranslateService
) {
  // Initialize translation - Turkish only
  this.translate.addLangs(['tr']);
  this.translate.setDefaultLang('tr');
  this.translate.use('tr');
  
  if (this.isMobile()) {
    this.router.navigateByUrl('/mobile/login');
  }
}

isMobile() {
  return !!(window as any).Capacitor;
}

 ngOnInit(): void {
   // Initialize visibility based on current URL
   this.updateTopbarVisibility(this.router.url);

   // Update on route changes
   this.router.events
     .pipe(filter((e) => e instanceof NavigationEnd))
     .subscribe((e) => {
       const url = (e as NavigationEnd).urlAfterRedirects || (e as NavigationEnd).url;
       this.updateTopbarVisibility(url);
     });
 }

 private updateTopbarVisibility(url: string) {
   const hideOn = ['/login', '/customer/login', '/mobile/login'];
   this.isAuthRoute = hideOn.some((route) => url.startsWith(route));
 }
}
