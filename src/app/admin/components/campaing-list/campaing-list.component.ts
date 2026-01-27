import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CampaignService } from '../../services/campaign.service';
import { environment } from '../../../../environments/environment';
import { Campaing } from '../../models/campaing.model';

@Component({
  selector: 'admin-campaign-list',
  templateUrl: './campaign-list.component.html',
  styleUrl: './campaing-list.component.css',
  standalone: false
})
export class CampaignListComponent implements OnInit {

  campaigns: any[] = [];
  loading = false;
  private baseUrl = `/admin/campaigns/`;

  constructor(private service: CampaignService, private router: Router) {}

  ngOnInit() {
    this.load();
  }

  load() {
    this.service.getAll().subscribe(res => this.campaigns = res);
  }

  toggle(item: any) {
    this.service.toggle(item.id).subscribe(() => this.load());
  }

  edit(c: Campaing) {
    this.router.navigate([this.baseUrl, c.id]);
  }
}
