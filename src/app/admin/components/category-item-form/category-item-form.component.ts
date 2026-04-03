import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { catchError, retry, timeout } from 'rxjs/operators';
import { of } from 'rxjs';
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
  loadingCategories = false;
  selectedFile?: File;
  previewUrl?: string;
  categories: any[] = [];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private categoryItemService: CategoryItemService,
    private categoryService: CategoryService,
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
    this.loadingCategories = true;
    this.form.get('categoryId')?.disable({ emitEvent: false });
    this.categoryService.getAllCached().pipe(
      timeout(10000),
      retry(1),
      catchError((err) => {
        console.error('Error loading categories:', err);
        return of([]);
      })
    ).subscribe((res) => {
      this.categories = res;
      this.loadingCategories = false;
      this.form.get('categoryId')?.enable({ emitEvent: false });

      const currentValue = this.form.get('categoryId')?.value;
      if (currentValue !== null && currentValue !== undefined) {
        const normalized = Number(currentValue);
        this.form.patchValue({ categoryId: Number.isNaN(normalized) ? null : normalized }, { emitEvent: false });
      }
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

  onSubmit() {
    if (this.form.invalid) return;

    this.loading = true;
    const data = {
      categoryId: Number(this.form.value.categoryId),
      name: (this.form.value.name || '').trim(),
      description: this.form.value.description || '',
      icon: this.form.value.icon || '',
      image: this.form.value.image || '',
      isActive: !!this.form.value.isActive,
      imageFile: this.selectedFile,
    };

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
