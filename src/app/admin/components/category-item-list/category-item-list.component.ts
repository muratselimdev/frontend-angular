import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { forkJoin, of, Subject } from 'rxjs';
import { timeout, catchError, retry, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { CategoryItemService } from '../../services/category-item.service';
import { CategoryService } from '../../services/category.service';
import { CategoryItem } from '../../models/category-item.model';

@Component({
  selector: 'admin-category-item-list',
  templateUrl: './category-item-list.component.html',
  styleUrl: './category-item-list.component.css',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CategoryItemListComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  categoryItems: CategoryItem[] = [];
  categories: any[] = [];
  categoriesMap: Map<number, any> = new Map();
  loading = false;
  categoryId?: number;
  categoryName?: string;

  constructor(
    private service: CategoryItemService,
    private categoryService: CategoryService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.route.queryParams.pipe(
      debounceTime(100),
      distinctUntilChanged((prev, curr) => prev['categoryId'] === curr['categoryId']),
      takeUntil(this.destroy$)
    ).subscribe(params => {
      this.categoryId = params['categoryId'] ? Number(params['categoryId']) : undefined;
      this.loadData();
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadData() {
    const startTime = performance.now();
    console.log('[CategoryItems] Loading started...');
    this.loading = true;

    // Optimize: Load items with timeout and retry
    const itemsRequest = this.categoryId
      ? this.service.getByCategoryId(this.categoryId).pipe(
          timeout(10000),
          retry(2),
          catchError(err => {
            console.error('[CategoryItems] Error loading items:', err);
            alert('Kategori öğeleri yüklenirken hata oluştu. Lütfen tekrar deneyin.');
            return of([]);
          })
        )
      : this.service.getAll().pipe(
          timeout(10000),
          retry(2),
          catchError(err => {
            console.error('[CategoryItems] Error loading items:', err);
            alert('Kategori öğeleri yüklenirken hata oluştu. Lütfen tekrar deneyin.');
            return of([]);
          })
        );

    // Always load categories for filter dropdown (but with timeout/retry)
    const categoriesRequest = this.categoryService.getAll().pipe(
      timeout(10000),
      retry(2),
      catchError(err => {
        console.error('[CategoryItems] Error loading categories:', err);
        return of([]);
      })
    );

    // Load both requests in parallel
    forkJoin({
      categories: categoriesRequest,
      items: itemsRequest
    }).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (result) => {
        const endTime = performance.now();
        console.log(`[CategoryItems] Data loaded in ${(endTime - startTime).toFixed(0)}ms`);
        console.log(`[CategoryItems] Received ${result.items?.length || 0} items, ${result.categories?.length || 0} categories`);

        this.categories = result.categories || [];
        this.categoryItems = result.items || [];
        this.categoriesMap = new Map(this.categories.map(c => [c.id, c]));
        if (this.categoryId) {
          this.categoryName = this.categoriesMap.get(this.categoryId)?.name;
        }
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        const endTime = performance.now();
        console.error(`[CategoryItems] Critical error after ${(endTime - startTime).toFixed(0)}ms:`, err);
        alert('Veri yüklenirken kritik bir hata oluştu. Sayfa yenilenecek.');
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  load() {
    this.loadData();
  }

  getCategoryName(categoryId: number): string {
    return this.categoriesMap.get(categoryId)?.name || 'N/A';
  }

  trackByItemId(index: number, item: CategoryItem): number {
    return item.id;
  }

  trackByCategoryId(index: number, cat: any): number {
    return cat.id;
  }

  toggle(item: CategoryItem) {
    const originalState = item.isActive;
    // Optimistic update
    item.isActive = !item.isActive;
    this.cdr.markForCheck();

    this.service.toggle(item.id).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        console.log('[CategoryItems] Toggle successful');
      },
      error: (err) => {
        // Revert on error
        item.isActive = originalState;
        this.cdr.markForCheck();
        console.error('[CategoryItems] Toggle failed:', err);
        alert('Durum değiştirilemedi. Lütfen tekrar deneyin.');
      }
    });
  }

  edit(item: CategoryItem) {
    this.router.navigate(['/admin/category-items', item.id]);
  }

  viewDetails(item: CategoryItem) {
    this.router.navigate(['/admin/category-item-details'], {
      queryParams: { categoryItemId: item.id }
    });
  }

  newCategoryItem() {
    if (this.categoryId) {
      this.router.navigate(['/admin/category-items/new'], {
        queryParams: { categoryId: this.categoryId }
      });
    } else {
      this.router.navigate(['/admin/category-items/new']);
    }
  }

  filterByCategory(categoryId: number | null) {
    if (categoryId) {
      this.router.navigate(['/admin/category-items'], {
        queryParams: { categoryId }
      });
    } else {
      this.router.navigate(['/admin/category-items']);
    }
  }
}
