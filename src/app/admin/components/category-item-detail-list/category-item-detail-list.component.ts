import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { forkJoin, of, Subject } from 'rxjs';
import { timeout, catchError, retry, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { CategoryItemDetailService } from '../../services/category-item-detail.service';
import { CategoryItemService } from '../../services/category-item.service';
import { CategoryItemDetail } from '../../models/category-item-detail.model';

@Component({
  selector: 'admin-category-item-detail-list',
  templateUrl: './category-item-detail-list.component.html',
  styleUrl: './category-item-detail-list.component.css',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CategoryItemDetailListComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  categoryItemDetails: CategoryItemDetail[] = [];
  categoryItems: any[] = [];
  categoryItemsMap: Map<number, any> = new Map();
  loading = false;
  categoryItemId?: number;
  categoryItemName?: string;

  constructor(
    private service: CategoryItemDetailService,
    private categoryItemService: CategoryItemService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.route.queryParams.pipe(
      debounceTime(100),
      distinctUntilChanged((prev, curr) => prev['categoryItemId'] === curr['categoryItemId']),
      takeUntil(this.destroy$)
    ).subscribe(params => {
      this.categoryItemId = params['categoryItemId'] ? Number(params['categoryItemId']) : undefined;
      this.loadData();
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadData() {
    const startTime = performance.now();
    console.log('[CategoryItemDetails] Loading started...');
    this.loading = true;

    // Optimize: Load details with timeout and retry
    const detailsRequest = this.categoryItemId
      ? this.service.getByCategoryItemId(this.categoryItemId).pipe(
          timeout(10000),
          retry(2),
          catchError(err => {
            console.error('[CategoryItemDetails] Error loading details:', err);
            alert('Detaylar yüklenirken hata oluştu. Lütfen tekrar deneyin.');
            return of([]);
          })
        )
      : this.service.getAll().pipe(
          timeout(10000),
          retry(2),
          catchError(err => {
            console.error('[CategoryItemDetails] Error loading details:', err);
            alert('Detaylar yüklenirken hata oluştu. Lütfen tekrar deneyin.');
            return of([]);
          })
        );

    // Always load category items for filter dropdown (but with timeout/retry)
    const categoryItemsRequest = this.categoryItemService.getAll().pipe(
      timeout(10000),
      retry(2),
      catchError(err => {
        console.error('[CategoryItemDetails] Error loading category items:', err);
        return of([]);
      })
    );

    // Load both requests in parallel
    forkJoin({
      categoryItems: categoryItemsRequest,
      details: detailsRequest
    }).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (result) => {
        const endTime = performance.now();
        console.log(`[CategoryItemDetails] Data loaded in ${(endTime - startTime).toFixed(0)}ms`);
        console.log(`[CategoryItemDetails] Received ${result.details?.length || 0} details, ${result.categoryItems?.length || 0} items`);

        this.categoryItems = result.categoryItems || [];
        this.categoryItemDetails = result.details || [];
        this.categoryItemsMap = new Map(this.categoryItems.map(i => [i.id, i]));
        if (this.categoryItemId) {
          this.categoryItemName = this.categoryItemsMap.get(this.categoryItemId)?.name;
        }
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        const endTime = performance.now();
        console.error(`[CategoryItemDetails] Critical error after ${(endTime - startTime).toFixed(0)}ms:`, err);
        alert('Veri yüklenirken kritik bir hata oluştu. Sayfa yenilenecek.');
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  load() {
    this.loadData();
  }

  getCategoryItemName(categoryItemId: number): string {
    return this.categoryItemsMap.get(categoryItemId)?.name || 'N/A';
  }

  trackByDetailId(index: number, detail: CategoryItemDetail): number {
    return detail.id;
  }

  trackByItemId(index: number, item: any): number {
    return item.id;
  }

  toggle(item: CategoryItemDetail) {
    const originalState = item.isActive;
    // Optimistic update
    item.isActive = !item.isActive;
    this.cdr.markForCheck();

    this.service.toggle(item.id).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        console.log('[CategoryItemDetails] Toggle successful');
      },
      error: (err) => {
        // Revert on error
        item.isActive = originalState;
        this.cdr.markForCheck();
        console.error('[CategoryItemDetails] Toggle failed:', err);
        alert('Durum değiştirilemedi. Lütfen tekrar deneyin.');
      }
    });
  }

  edit(item: CategoryItemDetail) {
    this.router.navigate(['/admin/category-item-details', item.id]);
  }

  newCategoryItemDetail() {
    if (this.categoryItemId) {
      this.router.navigate(['/admin/category-item-details/new'], {
        queryParams: { categoryItemId: this.categoryItemId }
      });
    } else {
      this.router.navigate(['/admin/category-item-details/new']);
    }
  }

  filterByCategoryItem(categoryItemId: number | null) {
    if (categoryItemId) {
      this.router.navigate(['/admin/category-item-details'], {
        queryParams: { categoryItemId }
      });
    } else {
      this.router.navigate(['/admin/category-item-details']);
    }
  }
}
