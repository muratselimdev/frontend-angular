import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { PopulerService } from '../../services/populer.service';
import { environment } from '../../../../environments/environment';
import { catchError, finalize, of } from 'rxjs';
import { Populer } from '../../models/populer.model';

@Component({
  selector: 'admin-populers-list',
  templateUrl: './populers-list.component.html',
  styleUrls: ['./populers-list.component.css'],
  standalone: false
})
export class PopulersListComponent implements OnInit {
  populers: Populer[] = [];
  loading = false;
  private baseUrl = `/admin/populers/`;
  private cacheKey = 'populers-cache';

  constructor(private service: PopulerService, private router: Router) {}

  ngOnInit() {
    this.load();
  }

  load() {
    const cached = this.getCachedPopulers();
    if (cached.length) {
      this.populers = cached;
    }

    this.loading = this.populers.length === 0;
    this.service.getAll()
      .pipe(
        catchError(() => of([])),
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe(res => {
        const data: any = res as any;
        this.populers = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
            ? data.data
            : [];
        this.setCachedPopulers(this.populers);
      });
  }

  private getCachedPopulers(): Populer[] {
    try {
      const raw = sessionStorage.getItem(this.cacheKey);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private setCachedPopulers(items: Populer[]) {
    try {
      sessionStorage.setItem(this.cacheKey, JSON.stringify(items));
    } catch {
      // ignore cache errors
    }
  }

  toggle(item: Populer) {
    this.service.toggle(item.id).subscribe(() => this.load());
  }

  edit(item: Populer) {
    this.router.navigate([this.baseUrl, item.id]);
  }

  getImageSrc(item: Populer): string {
    if (item.imageUrl) {
      return item.imageUrl.startsWith('http')
        ? item.imageUrl
        : `${environment.apiUrl}/${item.imageUrl}`;
    }
    if (item.image) {
      return `data:image/*;base64,${item.image}`;
    }
    return '';
  }
}
