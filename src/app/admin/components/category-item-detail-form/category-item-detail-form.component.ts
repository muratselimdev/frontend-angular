import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { CategoryItemDetailService } from '../../services/category-item-detail.service';
import { CategoryItemService } from '../../services/category-item.service';
import { timeout, Subject, of } from 'rxjs';
import { catchError, retry, takeUntil } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

@Component({
  standalone: false,
  selector: 'app-category-item-detail-form',
  templateUrl: './category-item-detail-form.component.html',
  styleUrl: './category-item-detail-form.component.css'
})
export class CategoryItemDetailFormComponent implements OnInit, OnDestroy {
  form!: FormGroup;
  categoryItemDetailId?: number;
  loading = false;
  loadingCategoryItems = false;
  selectedFile?: File;
  previewUrl?: string;
  showPreview = false;
  categoryItems: any[] = [];
  errorMessage = '';
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private categoryItemDetailService: CategoryItemDetailService,
    private categoryItemService: CategoryItemService,
  ) {}

  ngOnInit(): void {
    this.categoryItemDetailId = Number(this.route.snapshot.paramMap.get('id')) || undefined;

    const categoryItemIdParam = this.route.snapshot.queryParamMap.get('categoryItemId');
    const categoryItemId = categoryItemIdParam ? Number(categoryItemIdParam) : null;

    this.form = this.fb.group({
      id: this.categoryItemDetailId,
      categoryItemId: [categoryItemId, Validators.required],
      label: ['', Validators.required],
      detail: [''],
      videoUrl: ['', this.youtubeUrlValidator.bind(this)],
      isActive: [true]
    });

    this.loadCategoryItems();

    if (this.categoryItemDetailId) {
      this.loadCategoryItemDetail(this.categoryItemDetailId);
    }
  }

  loadCategoryItems() {
    this.loadingCategoryItems = true;
    this.form.get('categoryItemId')?.disable({ emitEvent: false });

    this.categoryItemService.getAllCached()
      .pipe(
        timeout(10000), // 10 second timeout
        retry(1),
        catchError((err) => {
          console.error('Failed to load category items:', err);
          return of([]);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (res) => {
          this.categoryItems = res;
          this.loadingCategoryItems = false;
          this.form.get('categoryItemId')?.enable({ emitEvent: false });

          const currentValue = this.form.get('categoryItemId')?.value;
          if (currentValue !== null && currentValue !== undefined) {
            const normalized = Number(currentValue);
            this.form.patchValue({ categoryItemId: Number.isNaN(normalized) ? null : normalized }, { emitEvent: false });
          }
        }
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onFileSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    this.selectedFile = file;
    const reader = new FileReader();
    reader.onload = () => {
      this.previewUrl = reader.result as string;
      this.showPreview = true;
    };
    reader.readAsDataURL(file);
  }

  onPreviewLoadError() {
    this.showPreview = false;
  }

  private canShowPreview(url?: string): boolean {
    if (!url) return false;
    const value = url.trim();
    if (!value) return false;
    if (value.toLowerCase() === 'string') return false;
    return /^https?:\/\//i.test(value) || /^data:image\//i.test(value);
  }

  private youtubeUrlValidator(control: AbstractControl): ValidationErrors | null {
    const value = (control.value || '').trim();
    if (!value) return null;

    const youtubeRegex = /^(https?:\/\/)?((www\.)?youtube\.com\/(watch\?v=|shorts\/|embed\/)[A-Za-z0-9_-]{11}([&?].*)?|youtu\.be\/[A-Za-z0-9_-]{11}([?].*)?|www\.youtube-nocookie\.com\/embed\/[A-Za-z0-9_-]{11}([?].*)?)$/i;
    return youtubeRegex.test(value) ? null : { youtubeUrl: true };
  }

  private extractYoutubeVideoId(rawUrl: string): string | null {
    const input = (rawUrl || '').trim();
    if (!input) return null;

    try {
      const withProtocol = /^https?:\/\//i.test(input) ? input : `https://${input}`;
      const url = new URL(withProtocol);
      const host = url.hostname.replace(/^www\./i, '').toLowerCase();

      if (host === 'youtu.be') {
        const shortId = url.pathname.replace(/^\//, '').split('/')[0];
        return /^[A-Za-z0-9_-]{11}$/.test(shortId) ? shortId : null;
      }

      if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
        const path = url.pathname;

        if (path === '/watch') {
          const watchId = url.searchParams.get('v') || '';
          return /^[A-Za-z0-9_-]{11}$/.test(watchId) ? watchId : null;
        }

        const embedMatch = path.match(/^\/(embed|shorts)\/([A-Za-z0-9_-]{11})/i);
        if (embedMatch) {
          return embedMatch[2];
        }
      }
    } catch {
      return null;
    }

    return null;
  }

  private normalizeYoutubeUrl(rawUrl: string): string {
    const input = (rawUrl || '').trim();
    if (!input) return '';

    const videoId = this.extractYoutubeVideoId(input);
    if (!videoId) return input;

    // Canonicalize to privacy-enhanced embed URL for consistent rendering.
    return `https://www.youtube-nocookie.com/embed/${videoId}`;
  }

  private isPlaceholderValue(value: string): boolean {
    const normalized = value.trim().toLowerCase();
    return ['string', 'test', 'null', 'undefined', 'n/a', '-'].includes(normalized);
  }

  private cleanInputValue(value: unknown): string {
    if (value === null || value === undefined) return '';
    const text = String(value).trim();
    if (!text) return '';
    return this.isPlaceholderValue(text) ? '' : text;
  }



  loadCategoryItemDetail(id: number) {
    this.loading = true;
    this.categoryItemDetailService.getById(id)
      .pipe(
        timeout(10000), // 10 second timeout
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (detail) => {
          const mappedLabel = this.cleanInputValue(detail.label || detail.title || '');
          const mappedDetail = this.cleanInputValue(detail.detail || detail.description || detail.content || '');
          const mappedImageUrl = this.cleanInputValue(detail.imageUrl || detail.image || '');
          const mappedVideoUrl = this.cleanInputValue(detail.videoUrl || '');

          this.form.patchValue({
            id: detail.id,
            categoryItemId: detail.categoryItemId,
            label: mappedLabel,
            detail: mappedDetail,
            videoUrl: mappedVideoUrl,
            isActive: detail.isActive
          });

          this.previewUrl = mappedImageUrl
            ? (mappedImageUrl.startsWith('http') ? mappedImageUrl : `${environment.storageBaseUrl}/${mappedImageUrl}`)
            : undefined;
          this.showPreview = this.canShowPreview(this.previewUrl);
          this.loading = false;
        },
        error: (err) => {
          console.error('Failed to load detail:', err);
          this.errorMessage = 'Kategori oge detayi yuklenemedi.';
          this.loading = false;
        }
      });
  }

  async onSubmit() {
    if (this.form.invalid) return;

    this.loading = true;
    this.errorMessage = '';

    const cleanedLabel = this.cleanInputValue(this.form.value.label);
    if (!cleanedLabel) {
      this.form.get('label')?.setErrors({ required: true });
      this.form.get('label')?.markAsTouched();
      this.loading = false;
      return;
    }

    const cleanedDetail = this.cleanInputValue(this.form.value.detail);
    const cleanedVideoUrl = this.cleanInputValue(this.form.value.videoUrl);
    const normalizedVideoUrl = this.normalizeYoutubeUrl(cleanedVideoUrl);
    if (normalizedVideoUrl !== this.form.value.videoUrl) {
      this.form.patchValue({ videoUrl: normalizedVideoUrl });
    }

    const data = {
      categoryItemId: Number(this.form.value.categoryItemId),
      label: cleanedLabel,
      detail: cleanedDetail,
      videoUrl: normalizedVideoUrl,
      isActive: !!this.form.value.isActive,
      imageFile: this.selectedFile
    };

    const request = this.categoryItemDetailId
      ? this.categoryItemDetailService.update(this.categoryItemDetailId, data)
      : this.categoryItemDetailService.create(data);

    request.pipe(
      timeout(15000), // 15 second timeout for save
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/admin/category-item-details'], {
          queryParams: { categoryItemId: this.form.value.categoryItemId }
        });
      },
      error: (err) => {
        console.error('Save error:', err);
        this.errorMessage = 'Kaydetme islemi basarisiz oldu. Lutfen tekrar deneyin.';
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
