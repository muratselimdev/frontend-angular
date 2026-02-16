import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { CategoryItemService } from '../../services/category-item.service';
import { CategoryService } from '../../services/category.service';

@Component({
  standalone: false,
  selector: 'app-category-item-form',
  templateUrl: './category-item-form.component.html',
  styleUrl: './category-item-form.component.css'
})
export class CategoryItemFormComponent implements OnInit {
  form!: FormGroup;
  categoryItemId?: number;
  loading = false;
  selectedFile?: File;
  previewUrl?: string;
  categories: any[] = [];
  private baseUrl = `${environment.apiUrl}/api/admin/category-items`;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private categoryItemService: CategoryItemService,
    private categoryService: CategoryService,
    private http: HttpClient,
  ) {}

  ngOnInit(): void {
    this.categoryItemId = Number(this.route.snapshot.paramMap.get('id')) || undefined;

    const categoryIdParam = this.route.snapshot.queryParamMap.get('categoryId');
    const categoryId = categoryIdParam ? Number(categoryIdParam) : null;

    this.form = this.fb.group({
      id: this.categoryItemId,
      categoryId: [categoryId, Validators.required],
      name: ['', Validators.required],
      description: [''],
      icon: [''],
      image: [''],
      isActive: [true]
    });

    this.loadCategories();

    if (this.categoryItemId) {
      this.loadCategoryItem(this.categoryItemId);
    }
  }

  loadCategories() {
    this.categoryService.getAll().subscribe(res => {
      this.categories = res;
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

  loadCategoryItem(id: number) {
    this.loading = true;
    this.categoryItemService.getById(id).subscribe({
      next: (item) => {
        this.form.patchValue(item);
        if (item.image) {
          this.previewUrl = item.image;
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

    const request = this.categoryItemId
      ? this.categoryItemService.update(this.categoryItemId, data)
      : this.categoryItemService.create(data);

    request.subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/admin/category-items'], {
          queryParams: { categoryId: this.form.value.categoryId }
        });
      },
      error: (err) => {
        console.error('Save error:', err);
        this.loading = false;
      }
    });
  }

  cancel() {
    const categoryId = this.form.value.categoryId;
    this.router.navigate(['/admin/category-items'], {
      queryParams: categoryId ? { categoryId } : {}
    });
  }
}
