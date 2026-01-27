import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { CategoryService } from '../../services/category.service';

@Component({
  standalone: false,
  selector: 'app-category-form',
  //imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './category-form.component.html',
})
export class CategoryFormComponent implements OnInit {

  form!: FormGroup;
  categoryId?: number;
  loading = false;
    selectedFile?: File;
    previewUrl?: string;
    private baseUrl = `${environment.apiUrl}/api/admin/categories`;

    constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private categoryService: CategoryService,
    private http: HttpClient,
  ) {}

  ngOnInit(): void {
    this.categoryId = Number(this.route.snapshot.paramMap.get('id'));
    
    this.form = this.fb.group({
      id: this.categoryId,
      name: [''],
      description: [''],
      icon: [''],
      isActive: [true]
    });
    
     if (this.categoryId) {
      this.loadCategory(this.categoryId);
    }
  }

  onFileSelected(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;

  this.selectedFile = file;

  // 🔍 Preview
  const reader = new FileReader();
  reader.onload = () => this.previewUrl = reader.result as string;
  reader.readAsDataURL(file);
}

  loadCategory(id: number) {
    this.categoryService.getById(id).subscribe(res => {
    this.form.patchValue({
        name: res.name,
        description: res.description,
        icon: res.icon,
        isActive: res.isActive
    });
    });
  }

submit() {

  if (this.form.invalid) {
    this.form.markAllAsTouched();
    return;
  }

  const formData = new FormData();

  formData.append('id', this.categoryId?.toString() ?? '0');
  formData.append('name', this.form.value.name);
  formData.append('description', this.form.value.description);
  formData.append('isActive', this.form.value.isActive);
  formData.append('icon', this.form.value.icon);

  const req$ = this.categoryId
    ? this.categoryService.update(this.categoryId, formData)
    : this.http.post(`${this.baseUrl}/create`, formData);

  formData.forEach((v, k) => console.log(k, v));

  req$.subscribe({
    next: () => this.router.navigate(['/admin/categories']),
    error: () => this.loading = false,
  });
}

  cancel() {
    this.router.navigate(['/admin/categories']);
  }
}
