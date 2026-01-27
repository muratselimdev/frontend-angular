import { Component, OnInit } from '@angular/core';
import { HotelsService } from '../../services/hotels.service';
import { HotelVm } from '../../models/hotel.models';
import { Router } from '@angular/router';

@Component({
  selector: 'app-hotels-list',
  templateUrl: './hotels-list.component.html',
  styleUrl: './hotels-list.component.css',
  standalone: false
})
export class HotelsListComponent implements OnInit {
  hotels: HotelVm[] = [];

  constructor(private hotelsService: HotelsService, private router: Router) {}

  ngOnInit(): void {
    this.load();
  }

  addNew() {
    this.router.navigate(['/admin/hotels/new']);
  }

  load() {
    this.hotelsService.list().subscribe(data => this.hotels = data);
  }

  edit(h: HotelVm) {
      this.router.navigate(['/admin/hotels', h.id]);
    }

  toggle(h: HotelVm) {
    this.hotelsService.toggle(h.id).subscribe(() => this.load());
  }
}
