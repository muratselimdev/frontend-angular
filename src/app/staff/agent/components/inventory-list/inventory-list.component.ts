import { AfterViewInit, Component, ElementRef, NgZone, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { catchError, forkJoin, of, Subscription } from 'rxjs';
import { Inventory, InventoryItem, InventoryLine, RequestInfo } from '../../../models/inventory.model';
import { InventoryService } from '../../../services/inventory.service';
import { InventoryItemService } from '../../../services/inventory-item.service';
import { exportRowsToXlsx } from '../../../utils/inventory-excel.util';

type FilterValue = 'all' | string;
type InventoryMetricTone = 'blue' | 'green' | 'amber' | 'red' | 'slate' | 'violet' | 'teal';
type InventoryStatusValue = number | string | null | undefined;
type InventoryTypeValue = number | string | null | undefined;

interface FilterOption {
  label: string;
  value: FilterValue;
}

interface DashboardMetric {
  label: string;
  value: string;
  hint: string;
  icon: string;
  tone: InventoryMetricTone;
}

interface TopInventoryItem {
  itemId: number;
  name: string;
  quantity: number;
  amount: number;
  percentage: number;
}

interface TreatmentDistributionItem {
  treatmentName: string;
  count: number;
  percentage: number;
}

interface PendingAction {
  label: string;
  count: number;
  hint: string;
  tone: InventoryMetricTone;
}

interface InventoryHeaderParticle {
  x: number;
  y: number;
  r: number;
  vx: number;
  vy: number;
  alpha: number;
  phase: number;
  pulse: number;
  link: boolean;
}

@Component({
  selector: 'app-inventory-list',
  templateUrl: './inventory-list.component.html',
  styleUrls: ['./inventory-list.component.scss'],
  standalone: false
})
export class InventoryListComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('inventoryScale') private readonly inventoryScaleRef?: ElementRef<HTMLDivElement>;
  @ViewChild('inventoryBoard') private readonly inventoryBoardRef?: ElementRef<HTMLElement>;
  @ViewChild('holoCanvas') private readonly holoCanvasRef?: ElementRef<HTMLCanvasElement>;

  inventories: Inventory[] = [];
  filteredInventories: Inventory[] = [];
  requestInfo: RequestInfo[] = [];
  inventoryItems: InventoryItem[] = [];
  dashboardMetrics: DashboardMetric[] = [];
  topInventoryItems: TopInventoryItem[] = [];
  treatmentDistribution: TreatmentDistributionItem[] = [];
  recentInventories: Inventory[] = [];
  pendingActions: PendingAction[] = [];
  updateInventories: Inventory[] = [];
  isUpdateQueueMode = false;

  isLoading = false;
  error = '';
  searchTerm = '';
  selectedStatus: FilterValue = 'all';
  selectedType: FilterValue = 'all';
  selectedDate = '';

  readonly skeletonCards = [1, 2, 3, 4, 5, 6];
  readonly statusOptions: FilterOption[] = [
    { label: 'Tüm durumlar', value: 'all' },
    { label: 'Devam Ediyor', value: '0' },
    { label: 'Tamamlandı', value: '1' },
    { label: 'İptal Edildi', value: '2' }
  ];
  readonly typeOptions: FilterOption[] = [
    { label: 'Tüm türler', value: 'all' },
    { label: 'Satınalma', value: '0' },
    { label: 'Satış', value: '1' }
  ];

  private readonly requestInfoByRequestId = new Map<number, RequestInfo>();
  private readonly itemNameById = new Map<number, string>();
  private readonly itemById = new Map<number, InventoryItem>();
  private readonly routeSubscription = new Subscription();
  private inventoryHeroViewReady = false;
  private inventoryHeroAnimationFrame = 0;
  private inventoryHeroRunId = 0;
  private inventoryHeroParticles: InventoryHeaderParticle[] = [];
  private readonly inventoryHeroResizeObservers: ResizeObserver[] = [];
  private readonly moneyFormatter = new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  private readonly quantityFormatter = new Intl.NumberFormat('tr-TR', {
    maximumFractionDigits: 2
  });

  constructor(
    private readonly inventoryService: InventoryService,
    private readonly inventoryItemService: InventoryItemService,
    private readonly route: ActivatedRoute,
    private readonly ngZone: NgZone
  ) {}

  ngOnInit(): void {
    this.routeSubscription.add(
      this.route.data.subscribe((data) => {
        this.isUpdateQueueMode = data['mode'] === 'updates';
        this.destroyInventoryHero();
        this.queueInventoryHeroSetup();
      })
    );

    this.loadInventories();
  }

  ngAfterViewInit(): void {
    this.inventoryHeroViewReady = true;
    this.queueInventoryHeroSetup();
  }

  ngOnDestroy(): void {
    this.destroyInventoryHero();
    this.routeSubscription.unsubscribe();
  }

  private queueInventoryHeroSetup(): void {
    if (!this.inventoryHeroViewReady) {
      return;
    }

    window.setTimeout(() => this.setupInventoryHero());
  }

  private setupInventoryHero(): void {
    if (this.isUpdateQueueMode) {
      return;
    }

    const scaleWrap = this.inventoryScaleRef?.nativeElement;
    const board = this.inventoryBoardRef?.nativeElement;
    const canvas = this.holoCanvasRef?.nativeElement;
    const scene = canvas?.parentElement;
    const ctx = canvas?.getContext('2d');

    if (!scaleWrap || !board || !canvas || !scene || !ctx) {
      return;
    }

    this.destroyInventoryHero();
    const runId = ++this.inventoryHeroRunId;

    const fitInventoryHeader = () => {
      const scale = scaleWrap.clientWidth / 2048;
      scaleWrap.style.height = `${278 * scale}px`;
      board.style.transform = `scale(${scale})`;
    };

    const scaleObserver = new ResizeObserver(fitInventoryHeader);
    scaleObserver.observe(scaleWrap);
    this.inventoryHeroResizeObservers.push(scaleObserver);
    fitInventoryHeader();

    let width = 804;
    let height = 205;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const rand = (min: number, max: number) => Math.random() * (max - min) + min;

    const createParticles = () => {
      const count = 86;

      this.inventoryHeroParticles = Array.from({ length: count }, (_, i) => ({
        x: rand(90, width - 90),
        y: rand(26, height - 36),
        r: rand(0.8, 2.35),
        vx: rand(-0.14, 0.14),
        vy: rand(-0.10, 0.10),
        alpha: rand(0.18, 0.70),
        phase: rand(0, Math.PI * 2),
        pulse: rand(0.010, 0.028),
        link: i % 5 === 0
      }));
    };

    const resizeCanvas = () => {
      width = scene.clientWidth;
      height = scene.clientHeight;

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      createParticles();
    };

    const drawSoftBackground = () => {
      const gradient = ctx.createRadialGradient(
        width / 2,
        height * 0.76,
        0,
        width / 2,
        height * 0.76,
        width * 0.43
      );

      gradient.addColorStop(0, 'rgba(35, 218, 230, .18)');
      gradient.addColorStop(0.34, 'rgba(35, 218, 230, .055)');
      gradient.addColorStop(1, 'rgba(35, 218, 230, 0)');

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
    };

    const drawLinks = () => {
      const cx = width / 2;
      const cy = height * 0.72;

      ctx.save();
      ctx.globalCompositeOperation = 'lighter';

      for (const particle of this.inventoryHeroParticles) {
        if (!particle.link) continue;

        const dx = particle.x - cx;
        const dy = particle.y - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 270) {
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(particle.x, particle.y);
          ctx.strokeStyle = `rgba(43, 219, 230, ${Math.max(0, 0.115 - dist / 2500)})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }

      ctx.restore();
    };

    const draw = (time: number) => {
      if (runId !== this.inventoryHeroRunId) {
        return;
      }

      ctx.clearRect(0, 0, width, height);

      drawSoftBackground();
      drawLinks();

      ctx.save();
      ctx.globalCompositeOperation = 'lighter';

      for (const particle of this.inventoryHeroParticles) {
        particle.x += particle.vx;
        particle.y += particle.vy;

        if (particle.x < 62 || particle.x > width - 62) particle.vx *= -1;
        if (particle.y < 18 || particle.y > height - 22) particle.vy *= -1;

        const alpha = Math.max(0.05, particle.alpha + Math.sin(time * particle.pulse + particle.phase) * 0.20);

        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(42, 226, 236, ${alpha})`;
        ctx.shadowColor = 'rgba(42, 226, 236, .72)';
        ctx.shadowBlur = 10;
        ctx.fill();
      }

      ctx.restore();

      this.inventoryHeroAnimationFrame = window.requestAnimationFrame(draw);
    };

    const canvasObserver = new ResizeObserver(resizeCanvas);
    canvasObserver.observe(scene);
    this.inventoryHeroResizeObservers.push(canvasObserver);

    this.ngZone.runOutsideAngular(() => {
      resizeCanvas();
      this.inventoryHeroAnimationFrame = window.requestAnimationFrame(draw);
    });
  }

  private destroyInventoryHero(): void {
    this.inventoryHeroRunId++;

    if (this.inventoryHeroAnimationFrame) {
      window.cancelAnimationFrame(this.inventoryHeroAnimationFrame);
      this.inventoryHeroAnimationFrame = 0;
    }

    while (this.inventoryHeroResizeObservers.length) {
      this.inventoryHeroResizeObservers.pop()?.disconnect();
    }
  }

  loadInventories(): void {
    this.isLoading = true;
    this.error = '';

    forkJoin({
      inventories: this.inventoryService.getAll(),
      requestInfo: this.inventoryService.getInfo().pipe(catchError(() => of([] as RequestInfo[]))),
      inventoryItems: this.inventoryItemService.getAll().pipe(catchError(() => of([] as InventoryItem[])))
    }).subscribe({
      next: ({ inventories, requestInfo, inventoryItems }) => {
        this.inventories = inventories;
        this.requestInfo = requestInfo;
        this.inventoryItems = inventoryItems;
        this.rebuildRequestMap();
        this.rebuildItemMap();
        this.rebuildDashboard();
        this.applyFilters();
        this.isLoading = false;
      },
      error: () => {
        this.error = 'Sipariş kayıtları alınırken bir hata oluştu.';
        this.isLoading = false;
      }
    });
  }

  applyFilters(): void {
    const normalizedSearch = this.searchTerm.trim().toLowerCase();

    this.filteredInventories = this.inventories.filter((inventory) => {
      const request = this.getRequestInfo(inventory);
      const searchableText = [
        inventory.ficheNo,
        inventory.requestId,
        inventory.customerId,
        request?.customerName,
        request?.treatmentName,
        request?.treatmentGroupName,
        request?.assignedAgentName,
        this.getStatusLabel(inventory.status),
        this.getTypeLabel(inventory.type)
      ]
        .filter((value): value is string | number => value !== undefined && value !== null)
        .join(' ')
        .toLowerCase();

      const normalizedStatus = this.normalizeStatus(inventory.status);
      const normalizedType = this.normalizeType(inventory.type);
      const matchesSearch = !normalizedSearch || searchableText.includes(normalizedSearch);
      const matchesStatus = this.selectedStatus === 'all' || normalizedStatus?.toString() === this.selectedStatus;
      const matchesType = this.selectedType === 'all' || normalizedType?.toString() === this.selectedType;
      const matchesDate = !this.selectedDate || this.getDateInputValue(inventory.createdAt) === this.selectedDate;

      return matchesSearch && matchesStatus && matchesType && matchesDate;
    });
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedStatus = 'all';
    this.selectedType = 'all';
    this.selectedDate = '';
    this.applyFilters();
  }

  getRequestInfo(inventory: Inventory): RequestInfo | undefined {
    return this.requestInfoByRequestId.get(inventory.requestId);
  }

  getPatientLabel(inventory: Inventory): string {
    return this.getRequestInfo(inventory)?.customerName ?? `Hasta #${inventory.customerId}`;
  }

  getTreatmentLabel(inventory: Inventory): string {
    return this.getRequestInfo(inventory)?.treatmentName ?? 'Tedavi eşleşmedi';
  }

  getRequestLabel(inventory: Inventory): string {
    return `Talep #${inventory.requestId}`;
  }

  getLineCount(inventory: Inventory): number {
    return inventory.lines.length;
  }

  getSlipQuantity(inventory: Inventory): number {
    return inventory.lines.reduce((total, line) => total + this.toNumber(line.quantity), 0);
  }

  getSlipAmount(inventory: Inventory): number {
    return inventory.lines.reduce((total, line) => total + this.getLineTotal(line), 0);
  }

  formatMoney(value: number | null | undefined): string {
    return value === null || value === undefined ? '-' : `${this.moneyFormatter.format(value)} TL`;
  }

  formatQuantity(value: number | null | undefined): string {
    return value === null || value === undefined ? '-' : this.quantityFormatter.format(value);
  }

  getStatusLabel(status: InventoryStatusValue): string {
    switch (this.normalizeStatus(status)) {
      case 0:
        return 'Devam Ediyor';
      case 1:
        return 'Tamamlandı';
      case 2:
        return 'İptal Edildi';
      default:
        return 'Bilinmeyen Durum';
    }
  }

  getTypeLabel(type: InventoryTypeValue): string {
    switch (this.normalizeType(type)) {
      case 0:
        return 'Satınalma';
      case 1:
        return 'Satış';
      default:
        return 'Diğer';
    }
  }

  getStatusBadgeClass(status: InventoryStatusValue): string {
    switch (this.normalizeStatus(status)) {
      case 0:
        return 'inventory-badge--status-progress';
      case 1:
        return 'inventory-badge--status-completed';
      case 2:
        return 'inventory-badge--status-cancelled';
      default:
        return 'inventory-badge--neutral';
    }
  }

  getTypeBadgeClass(type: InventoryTypeValue): string {
    switch (this.normalizeType(type)) {
      case 0:
        return 'inventory-badge--type-purchase';
      case 1:
        return 'inventory-badge--type-sale';
      default:
        return 'inventory-badge--neutral';
    }
  }

  getMetricClass(tone: InventoryMetricTone): string {
    switch (tone) {
      case 'blue':
        return 'bg-sky-50 text-sky-700 ring-sky-100';
      case 'green':
        return 'bg-emerald-50 text-emerald-700 ring-emerald-100';
      case 'amber':
        return 'bg-amber-50 text-amber-700 ring-amber-100';
      case 'red':
        return 'bg-rose-50 text-rose-700 ring-rose-100';
      case 'violet':
        return 'bg-violet-50 text-violet-700 ring-violet-100';
      case 'teal':
        return 'bg-teal-50 text-teal-700 ring-teal-100';
      default:
        return 'bg-slate-50 text-slate-700 ring-slate-100';
    }
  }

  trackByInventoryId(_index: number, inventory: Inventory): number {
    return inventory.id;
  }

  trackByMetricLabel(_index: number, metric: DashboardMetric): string {
    return metric.label;
  }

  trackByTopItem(_index: number, item: TopInventoryItem): number {
    return item.itemId;
  }

  trackByTreatment(_index: number, item: TreatmentDistributionItem): string {
    return item.treatmentName;
  }

  trackByAction(_index: number, item: PendingAction): string {
    return item.label;
  }

  exportInventories(): void {
    const rows = this.inventories.flatMap((inventory) => {
      const request = this.getRequestInfo(inventory);
      const lines = inventory.lines.length > 0 ? inventory.lines : [null];

      return lines.map((line) => {
        const inventoryItem = line ? this.itemById.get(line.inventoryItemId) : undefined;

        return {
          date: this.formatDateForExport(inventory.createdAt),
          ficheNo: inventory.ficheNo,
          customerName: request?.customerName ?? 'Hasta eşleşmedi',
          treatmentName: request?.treatmentName ?? 'Tedavi eşleşmedi',
          assignedAgentName: request?.assignedAgentName ?? '-',
          code: inventoryItem?.code ?? '-',
          materialName: inventoryItem?.name ?? (line ? 'Kalem bulunamadı' : '-'),
          quantity: line?.quantity ?? ''
        };
      });
    });

    exportRowsToXlsx(
      `Siparis_Fisleri_${this.getDateSuffix()}.xlsx`,
      'Sipariş Fişleri',
      [
        { key: 'date', label: 'Tarih' },
        { key: 'ficheNo', label: 'Fiş No' },
        { key: 'customerName', label: 'Hasta Adı' },
        { key: 'treatmentName', label: 'Tedavi Adı' },
        { key: 'assignedAgentName', label: 'Temsilci Adı' },
        { key: 'code', label: 'Kod' },
        { key: 'materialName', label: 'Malzeme Adı' },
        { key: 'quantity', label: 'Adet' }
      ],
      rows
    );
  }

  private rebuildRequestMap(): void {
    this.requestInfoByRequestId.clear();
    this.requestInfo.forEach((request) => {
      this.requestInfoByRequestId.set(request.requestId, request);
    });
  }

  private rebuildItemMap(): void {
    this.itemNameById.clear();
    this.itemById.clear();
    this.inventoryItems.forEach((item) => {
      this.itemNameById.set(item.id, item.name);
      this.itemById.set(item.id, item);
    });
  }

  private rebuildDashboard(): void {
    const allLines = this.inventories.flatMap((inventory) => inventory.lines);
    const totalSlips = this.inventories.length;
    const activeSlips = this.inventories.filter((inventory) => this.normalizeStatus(inventory.status) === 0).length;
    const completedSlips = this.inventories.filter((inventory) => this.normalizeStatus(inventory.status) === 1).length;
    const cancelledSlips = this.inventories.filter((inventory) => this.normalizeStatus(inventory.status) === 2).length;
    const totalLineCount = allLines.length;
    const totalAmount = allLines.reduce((total, line) => total + this.getLineTotal(line), 0);

    this.dashboardMetrics = [
      {
        label: 'Toplam Fiş',
        value: totalSlips.toString(),
        hint: 'Tüm sipariş fişleri',
        icon: 'inventory_2',
        tone: 'blue'
      },
      {
        label: 'Devam Eden',
        value: activeSlips.toString(),
        hint: 'İşlemdeki fişler',
        icon: 'pending_actions',
        tone: 'amber'
      },
      {
        label: 'Tamamlanan',
        value: completedSlips.toString(),
        hint: 'Tamamlanan fişler',
        icon: 'task_alt',
        tone: 'green'
      },
      {
        label: 'İptal Edilen',
        value: cancelledSlips.toString(),
        hint: 'İptal edilen fişler',
        icon: 'block',
        tone: 'red'
      },
      {
        label: 'Toplam Kalem',
        value: totalLineCount.toString(),
        hint: 'Fişlerdeki ürün kalemi',
        icon: 'format_list_bulleted',
        tone: 'slate'
      },
      {
        label: 'Toplam Tutar',
        value: this.formatMoney(totalAmount),
        hint: 'Miktar ve tutardan hesaplanır',
        icon: 'payments',
        tone: 'violet'
      }
    ];

    this.topInventoryItems = this.buildTopInventoryItems(allLines);
    this.recentInventories = [...this.inventories]
      .sort((left, right) => this.toTime(right.createdAt) - this.toTime(left.createdAt))
      .slice(0, 5);
    this.updateInventories = [...this.inventories]
      .sort((left, right) => this.toTime(right.updatedAt ?? right.createdAt) - this.toTime(left.updatedAt ?? left.createdAt));
    this.treatmentDistribution = this.buildTreatmentDistribution();
    this.pendingActions = [
      {
        label: 'Devam eden fişler',
        count: activeSlips,
        hint: 'Operasyon takibi bekleyen fişler',
        tone: 'amber'
      },
      {
        label: 'İptal edilen kalemler',
        count: allLines.filter((line) => line.cancel === true).length,
        hint: 'İptal nedeni kontrol edilecek kalemler',
        tone: 'red'
      },
      {
        label: 'Kalemsiz fişler',
        count: this.inventories.filter((inventory) => inventory.lines.length === 0).length,
        hint: 'Ürün kalemi girilmemiş fişler',
        tone: 'slate'
      }
    ];
  }

  private buildTopInventoryItems(lines: InventoryLine[]): TopInventoryItem[] {
    const itemTotals = new Map<number, { quantity: number; amount: number }>();

    lines.forEach((line) => {
      const current = itemTotals.get(line.inventoryItemId) ?? { quantity: 0, amount: 0 };
      current.quantity += this.toNumber(line.quantity);
      current.amount += this.getLineTotal(line);
      itemTotals.set(line.inventoryItemId, current);
    });

    const maxQuantity = Math.max(...Array.from(itemTotals.values()).map((item) => item.quantity), 0);

    return Array.from(itemTotals.entries())
      .map(([itemId, totals]) => ({
        itemId,
        name: this.itemNameById.get(itemId) ?? `Sipariş Kalemi #${itemId}`,
        quantity: totals.quantity,
        amount: totals.amount,
        percentage: maxQuantity > 0 ? Math.round((totals.quantity / maxQuantity) * 100) : 0
      }))
      .sort((left, right) => right.quantity - left.quantity)
      .slice(0, 5);
  }

  private buildTreatmentDistribution(): TreatmentDistributionItem[] {
    const treatmentCounts = new Map<string, number>();

    this.inventories.forEach((inventory) => {
      const treatmentName = this.getRequestInfo(inventory)?.treatmentName ?? 'Tedavi eşleşmedi';
      treatmentCounts.set(treatmentName, (treatmentCounts.get(treatmentName) ?? 0) + 1);
    });

    const maxCount = Math.max(...Array.from(treatmentCounts.values()), 0);

    return Array.from(treatmentCounts.entries())
      .map(([treatmentName, count]) => ({
        treatmentName,
        count,
        percentage: maxCount > 0 ? Math.round((count / maxCount) * 100) : 0
      }))
      .sort((left, right) => right.count - left.count)
      .slice(0, 5);
  }

  private getDateInputValue(value: string): string {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return '';
    }

    return date.toISOString().slice(0, 10);
  }

  private getLineTotal(line: InventoryLine): number {
    return this.toNumber(line.quantity) * this.toNumber(line.amount);
  }

  private toNumber(value: number | string | null | undefined): number {
    const parsedValue = Number(value ?? 0);
    return Number.isFinite(parsedValue) ? parsedValue : 0;
  }

  private normalizeStatus(status: InventoryStatusValue): number | null {
    if (status === 0 || status === '0' || status === 'DevamEdiyor') {
      return 0;
    }

    if (status === 1 || status === '1' || status === 'Tamamlandi' || status === 'Tamamlandı') {
      return 1;
    }

    if (status === 2 || status === '2' || status === 'IptalEdildi' || status === 'İptalEdildi') {
      return 2;
    }

    return null;
  }

  private normalizeType(type: InventoryTypeValue): number | null {
    if (type === 0 || type === '0' || type === 'Satinalma' || type === 'Satınalma') {
      return 0;
    }

    if (type === 1 || type === '1' || type === 'Satis' || type === 'Satış') {
      return 1;
    }

    return null;
  }

  private toTime(value: string): number {
    const time = new Date(value).getTime();
    return Number.isNaN(time) ? 0 : time;
  }

  private formatDateForExport(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '';
    }
    return new Intl.DateTimeFormat('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }

  private getDateSuffix(): string {
    return new Date().toISOString().slice(0, 10).replace(/-/g, '');
  }
}
