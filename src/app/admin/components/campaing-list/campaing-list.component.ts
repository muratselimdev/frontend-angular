import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CampaignService } from '../../services/campaign.service';
import { Campaing } from '../../models/campaing.model';

@Component({
  selector: 'admin-campaign-list',
  templateUrl: './campaign-list.component.html',
  styleUrl: './campaing-list.component.css',
  standalone: false
})
export class CampaignListComponent implements OnInit {

  campaigns: Campaing[] = [];
  loading = false;
  private baseUrl = `/admin/campaigns/`;
  private cacheKey = 'campaigns-cache';

  constructor(private service: CampaignService, private router: Router) {}

  ngOnInit() {
    const cached = this.getCachedCampaigns();
    if (cached.length) {
      this.campaigns = cached;
    }
    this.load();
  }

  load() {
    this.loading = this.campaigns.length === 0;
    this.service.getAll().subscribe({
      next: res => {
        this.campaigns = res;
        this.setCachedCampaigns(res);
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  toggle(item: Campaing) {
    this.service.toggle(item.id).subscribe(() => this.load());
  }

  edit(c: Campaing) {
    this.router.navigate([this.baseUrl, c.id]);
  }

  trackById(_: number, item: Campaing) {
    return item.id;
  }

  private getCachedCampaigns(): Campaing[] {
    try {
      const raw = sessionStorage.getItem(this.cacheKey);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private setCachedCampaigns(items: Campaing[]) {
    try {
      sessionStorage.setItem(this.cacheKey, JSON.stringify(items));
    } catch {
      // ignore cache errors
    }
  }
}
