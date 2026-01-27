import { Component, OnInit } from '@angular/core';
import { HotelsService } from '../../services/hotels.service';
import { HotelVm } from '../../models/hotel.models';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-hotel-form',
  templateUrl: './hotel-form.component.html',
  standalone: false
})
export class HotelFormComponent implements OnInit {
  model: HotelVm = { id: 0, hotelName: '', address: '', phone: '', star: 3, isActive: true, price: 0, cost:0 };
  loading!: boolean;
  hotels!: HotelVm;
  
  constructor(
    private hotelsService: HotelsService,
    private route: ActivatedRoute,
    public router: Router
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.hotelsService.get(+id).subscribe(data => {
        this.model = data;
      });
    }
  }

  save() {
    if (this.model.id === 0) {
      this.hotelsService.create(this.model).subscribe(() => alert('Otel eklendi'));
      this.router.navigate(['/admin/hotels']);
    } else {
      this.hotelsService.update(this.model.id, this.model).subscribe(() => alert('Otel güncellendi'));
      this.router.navigate(['/admin/hotels']);
    }
  }

    cancel() {
    this.router.navigate(['/admin/hotels']);
  }
}
