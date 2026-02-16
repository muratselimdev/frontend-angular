import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { CategoryItemDetailService } from '../../services/category-item-detail.service';
import { CategoryItemService } from '../../services/category-item.service';

@Component({
  standalone: false,
  selector: 'app-category-item-detail-form',
  templateUrl: './category-item-detail-form.component.html',
  styleUrl: './category-item-detail-form.component.css'
})
export class CategoryItemDetailFormComponent implements OnInit {
  form!: FormGroup;
  categoryItemDetailId?: number;
  loading = false;
  selectedFile?: File;
  previewUrl?: string;
  categoryItems: any[] = [];
  private baseUrl = `${environment.apiUrl}/api/admin/category-item-details`;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private categoryItemDetailService: CategoryItemDetailService,
    private categoryItemService: CategoryItemService,
    private http: HttpClient,
  ) {}

  ngOnInit(): void {
    this.categoryItemDetailId = Number(this.route.snapshot.paramMap.get('id')) || undefined;

    const categoryItemIdParam = this.route.snapshot.queryParamMap.get('categoryItemId');
    const categoryItemId = categoryItemIdParam ? Number(categoryItemIdParam) : null;

    this.form = this.fb.group({
      id: this.categoryItemDetailId,
      categoryItemId: [categoryItemId, Validators.required],
      title: ['', Validators.required],
      description: [''],
      content: [''],
      image: [''],
      order: [0],
      isActive: [true]
    });

    this.loadCategoryItems();

    if (this.categoryItemDetailId) {
      this.loadCategoryItemDetail(this.categoryItemDetailId);
    }
  }

  loadCategoryItems() {
    this.categoryItemService.getAll().subscribe(res => {
      this.categoryItems = res;
    });
  }

  onFileSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    this.selectedFile = file;
    const reader = new FileReader();
    reader.onload = () => this.previewUrl = reader.result as string;
    reader.readAsDataURL(file);
  }

  loadCategoryItemDetail(id: number) {
    this.loading = true;
    this.categoryItemDetailService.getById(id).subscribe({
      next: (detail) => {
        this.form.patchValue(detail);
        if (detail.image) {
          this.previewUrl = detail.image;
        }
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  async onSubmit() {
    if (this.form.invalid) return;

    this.loading = true;
    let imageUrl = this.form.value.image;

    // Upload image if selected
    if (this.selectedFile) {
      const formData = new FormData();
      formData.append('file', this.selectedFile);

      try {
        const uploadRes: any = await this.http.post(`${environment.apiUrl}/api/upload`, formData).toPromise();
        imageUrl = uploadRes.url || uploadRes.path;
      } catch (error) {
        console.error('Upload error:', error);
        this.loading = false;
        return;
      }
    }

    const data = { ...this.form.value, image: imageUrl };

    const request = this.categoryItemDetailId
      ? this.categoryItemDetailService.update(this.categoryItemDetailId, data)
      : this.categoryItemDetailService.create(data);

    request.subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/admin/category-item-details'], {
          queryParams: { categoryItemId: this.form.value.categoryItemId }
        });
      },
      error: (err) => {
        console.error('Save error:', err);
        this.loading = false;
      }
    });
  }

  cancel() {
    const categoryItemId = this.form.value.categoryItemId;
    this.router.navigate(['/admin/category-item-details'], {
      queryParams: categoryItemId ? { categoryItemId } : {}
    });
  }
}
