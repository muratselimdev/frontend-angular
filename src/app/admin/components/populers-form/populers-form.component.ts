import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { PopulerService } from '../../services/populer.service';

@Component({
  standalone: false,
  selector: 'app-populers-form',
  templateUrl: './populers-form.component.html',
  styleUrls: ['./populers-form.component.css']
})
export class PopulersFormComponent implements OnInit {
  form!: FormGroup;
  populerId?: number;
  loading = false;
  selectedFile?: File;
  previewUrl?: string;
  private baseUrl = `${environment.apiUrl}/api/admin/populers`;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private populerService: PopulerService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.populerId = Number(this.route.snapshot.paramMap.get('id'));

    this.form = this.fb.group({
      id: this.populerId,
      title: [''],
      rating: [0],
      price: [0],
      reviews: [0],
      imageUrl: [''],
      isActive: [true]
    });

    if (this.populerId) {
      this.loadPopuler(this.populerId);
    }
  }

  onFileSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    this.selectedFile = file;

    const reader = new FileReader();
    reader.onload = () => (this.previewUrl = reader.result as string);
    reader.readAsDataURL(file);
  }

  loadPopuler(id: number) {
    this.populerService.getById(id).subscribe(res => {
      this.form.patchValue({
        title: res.title,
        rating: res.rating,
        price: res.price,
        reviews: res.reviews,
        imageUrl: res.imageUrl,
        isActive: res.isActive
      });

      if (res.imageUrl) {
        this.previewUrl = res.imageUrl;
      }
    });
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const formData = new FormData();

    formData.append('id', this.populerId?.toString() ?? '0');
    formData.append('title', this.form.value.title);
    formData.append('rating', this.form.value.rating?.toString() ?? '0');
    formData.append('price', this.form.value.price?.toString() ?? '0');
    formData.append('reviews', this.form.value.reviews?.toString() ?? '0');
    formData.append('imageUrl', this.form.value.imageUrl ?? '');
    formData.append('isActive', this.form.value.isActive);

    if (this.selectedFile) {
      formData.append('image', this.selectedFile);
    }

    const req$ = this.populerId
      ? this.populerService.update(this.populerId, formData)
      : this.http.post(`${this.baseUrl}/create`, formData);

    req$.subscribe({
      next: () => this.router.navigate(['/admin/populers']),
      error: () => (this.loading = false)
    });
  }

  cancel() {
    this.router.navigate(['/admin/populers']);
  }
}
