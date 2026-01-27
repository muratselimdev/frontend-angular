import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HomeService } from '../../services/home.service';
import { MobileRealtimeService } from '../../services/mobile-realtime.service';
import { MobileCampaignService } from '../../services/mobile-campaign.service';

@Component({
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.component.html'
})
export class HomeComponent implements OnInit {

  campaigns: any[] = [];
  categories: any[] = [];

  constructor(
    private home: HomeService,
    private campaignService: MobileCampaignService,
    private realtime: MobileRealtimeService
  ) {}

  ngOnInit() {
    this.realtime.connect();
    this.loadCampaigns();

    this.realtime.homeInvalidated$.subscribe(() => {
      this.loadCampaigns();
    });
  }

    loadCampaigns() {
    this.campaignService.getActiveCampaigns()
      .subscribe({
        next: res => this.campaigns = res,
        error: err => console.error('Campaign error', err)
      });
  }

  load() {
    this.home.getHome().subscribe(res => {
      this.campaigns = res.campaigns;
      this.categories = res.categories;
    });
  }
}
