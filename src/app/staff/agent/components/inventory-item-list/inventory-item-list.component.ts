import { HttpErrorResponse } from '@angular/common/http';
import { AfterViewInit, Component, ElementRef, NgZone, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { BulkUpdateInventoryItemCostPriceItem, InventoryItem } from '../../../models/inventory.model';
import { InventoryItemService } from '../../../services/inventory-item.service';
import {
  SpreadsheetCellValue,
  SpreadsheetRow,
  exportRowsToXlsx,
  readSpreadsheetRows
} from '../../../utils/inventory-excel.util';

type ItemStatusFilter = 'all' | 'active' | 'passive';
type BulkPreviewStatus = 'update' | 'not-found' | 'invalid' | 'inactive' | 'unchanged' | 'duplicate';

interface SummaryMetric {
  label: string;
  value: string;
  hint: string;
}

interface BulkPreviewRow {
  rowNumber: number;
  code: string;
  name: string;
  currentCostPrice: number | null;
  newCostPrice: number | null;
  sellingPrice: number | null;
  status: BulkPreviewStatus;
  message: string;
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
  selector: 'app-inventory-item-list',
  templateUrl: './inventory-item-list.component.html',
  styleUrls: ['./inventory-item-list.component.scss'],
  standalone: false
})
export class InventoryItemListComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('inventoryScale') private readonly inventoryScaleRef?: ElementRef<HTMLDivElement>;
  @ViewChild('inventoryBoard') private readonly inventoryBoardRef?: ElementRef<HTMLElement>;
  @ViewChild('holoCanvas') private readonly holoCanvasRef?: ElementRef<HTMLCanvasElement>;
  @ViewChild('fileInput') fileInput?: ElementRef<HTMLInputElement>;

  items: InventoryItem[] = [];
  filteredItems: InventoryItem[] = [];
  summaryMetrics: SummaryMetric[] = [];

  isLoading = false;
  error = '';
  searchTerm = '';
  selectedStatus: ItemStatusFilter = 'all';
  togglingIds = new Set<number>();
  actionMessage = '';
  actionError = '';

  isBulkPanelOpen = false;
  isDraggingFile = false;
  isReadingFile = false;
  isBulkSaving = false;
  selectedFileName = '';
  bulkRows: BulkPreviewRow[] = [];
  bulkError = '';
  bulkSuccess = '';

  private inventoryHeroViewReady = false;
  private inventoryHeroAnimationFrame = 0;
  private inventoryHeroRunId = 0;
  private inventoryHeroParticles: InventoryHeaderParticle[] = [];
  private readonly inventoryHeroResizeObservers: ResizeObserver[] = [];
  private readonly currencyFormatter = new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  constructor(
    private readonly inventoryItemService: InventoryItemService,
    private readonly ngZone: NgZone
  ) {}

  ngOnInit(): void {
    this.loadItems();
  }

  ngAfterViewInit(): void {
    this.inventoryHeroViewReady = true;
    this.queueInventoryHeroSetup();
  }

  ngOnDestroy(): void {
    this.destroyInventoryHero();
  }

  get bulkSummary(): SummaryMetric[] {
    const totalRows = this.bulkRows.length;
    const matchedRows = this.bulkRows.filter((row) =>
      ['update', 'inactive', 'unchanged'].includes(row.status)
    ).length;
    const updateRows = this.bulkRows.filter((row) => row.status === 'update').length;
    const notFoundRows = this.bulkRows.filter((row) => row.status === 'not-found').length;
    const invalidRows = this.bulkRows.filter((row) => row.status === 'invalid').length;
    const duplicateRows = this.bulkRows.filter((row) => row.status === 'duplicate').length;

    return [
      { label: 'Toplam Satır', value: totalRows.toString(), hint: 'Dosyadaki veri satırı' },
      { label: 'Eşleşen', value: matchedRows.toString(), hint: 'Kod ile bulunan kalem' },
      { label: 'Güncellenecek', value: updateRows.toString(), hint: 'Servise gönderilecek satır' },
      { label: 'Bulunamayan Kod', value: notFoundRows.toString(), hint: 'Eşleşmeyen kod' },
      { label: 'Hatalı Satır', value: invalidRows.toString(), hint: 'Eksik veya geçersiz değer' },
      { label: 'Tekrarlı Kod', value: duplicateRows.toString(), hint: 'Güvenlik için engellenir' }
    ];
  }

  get canConfirmBulkUpdate(): boolean {
    return (
      this.bulkRows.some((row) => row.status === 'update') &&
      !this.bulkRows.some((row) => row.status === 'duplicate') &&
      !this.isBulkSaving
    );
  }

  loadItems(): void {
    this.isLoading = true;
    this.error = '';
    this.actionError = '';

    this.inventoryItemService.getAll().subscribe({
      next: (items) => {
        this.items = items;
        this.rebuildSummary();
        this.applyFilters();
        this.isLoading = false;
      },
      error: () => {
        this.error = 'Sipariş kalemleri alınırken bir hata oluştu.';
        this.isLoading = false;
      }
    });
  }

  applyFilters(): void {
    const normalizedSearch = this.normalizeSearch(this.searchTerm);

    this.filteredItems = this.items.filter((item) => {
      const matchesSearch =
        !normalizedSearch ||
        this.normalizeSearch(`${item.code ?? ''} ${item.name}`).includes(normalizedSearch);
      const matchesStatus =
        this.selectedStatus === 'all' ||
        (this.selectedStatus === 'active' && item.isActive !== false) ||
        (this.selectedStatus === 'passive' && item.isActive === false);

      return matchesSearch && matchesStatus;
    });
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedStatus = 'all';
    this.applyFilters();
  }

  toggleItem(item: InventoryItem): void {
    this.actionError = '';
    this.actionMessage = '';
    this.togglingIds.add(item.id);

    this.inventoryItemService.toggle(item.id).subscribe({
      next: (updatedItem) => {
        this.items = this.items.map((currentItem) =>
          currentItem.id === item.id
            ? { ...currentItem, ...updatedItem, isActive: updatedItem.isActive ?? !currentItem.isActive }
            : currentItem
        );
        this.rebuildSummary();
        this.applyFilters();
        this.togglingIds.delete(item.id);
        this.actionMessage = 'Kalem durumu güncellendi.';
      },
      error: () => {
        this.actionError = 'Kalem durumu güncellenirken bir hata oluştu.';
        this.togglingIds.delete(item.id);
      }
    });
  }

  exportItems(): void {
    exportRowsToXlsx(
      `Siparis_Kalemleri_${this.getDateSuffix()}.xlsx`,
      'Sipariş Kalemleri',
      [
        { key: 'code', label: 'Kod' },
        { key: 'name', label: 'Kalem Adı' },
        { key: 'costPrice', label: 'Maliyet Fiyatı' },
        { key: 'salePrice', label: 'Satış Fiyatı' }
      ],
      this.items.map((item) => ({
        code: item.code ?? '',
        name: item.name,
        costPrice: item.costPrice ?? '',
        salePrice: item.sellingPrice ?? ''
      }))
    );
  }

  openBulkPanel(): void {
    this.isBulkPanelOpen = true;
    this.bulkError = '';
    this.bulkSuccess = '';
  }

  closeBulkPanel(): void {
    if (this.isBulkSaving) {
      return;
    }

    this.isBulkPanelOpen = false;
    this.clearBulkFile();
  }

  triggerFilePicker(): void {
    this.fileInput?.nativeElement.click();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      void this.readBulkFile(file);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDraggingFile = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDraggingFile = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDraggingFile = false;
    const file = event.dataTransfer?.files?.[0];
    if (file) {
      void this.readBulkFile(file);
    }
  }

  clearBulkFile(): void {
    this.selectedFileName = '';
    this.bulkRows = [];
    this.bulkError = '';
    this.bulkSuccess = '';
    if (this.fileInput?.nativeElement) {
      this.fileInput.nativeElement.value = '';
    }
  }

  confirmBulkUpdate(): void {
    const payloadItems: BulkUpdateInventoryItemCostPriceItem[] = this.bulkRows
      .filter((row) => row.status === 'update' && row.newCostPrice !== null)
      .map((row) => ({
        code: row.code,
        costPrice: row.newCostPrice as number
      }));

    if (payloadItems.length === 0) {
      this.bulkError = 'Geçerli satır bulunamadı.';
      return;
    }

    this.isBulkSaving = true;
    this.bulkError = '';
    this.bulkSuccess = '';

    this.inventoryItemService.bulkUpdateCostPrice({ items: payloadItems }).subscribe({
      next: (response) => {
        this.isBulkSaving = false;
        const notFoundMessage = response.notFoundCodes?.length ? ' Bazı kodlar bulunamadı.' : '';
        this.bulkSuccess = `Maliyet fiyatları başarıyla güncellendi.${notFoundMessage}`;
        this.loadItems();
      },
      error: (err: unknown) => {
        this.isBulkSaving = false;
        this.bulkError = this.isEndpointUnavailable(err)
          ? 'Toplu maliyet güncelleme servisine ulaşılamadı. Lütfen servis aktif olduktan sonra tekrar deneyin.'
          : 'Maliyet fiyatları güncellenirken bir hata oluştu.';
      }
    });
  }

  getProfit(item: InventoryItem): number | null {
    if (item.costPrice === null || item.costPrice === undefined) {
      return null;
    }
    if (item.sellingPrice === null || item.sellingPrice === undefined) {
      return null;
    }
    return item.sellingPrice - item.costPrice;
  }

  formatCurrency(value: number | null | undefined): string {
    return value === null || value === undefined ? '-' : `${this.currencyFormatter.format(value)} TL`;
  }

  getStatusLabel(item: InventoryItem): string {
    return item.isActive === false ? 'Pasif' : 'Aktif';
  }

  getBulkStatusLabel(status: BulkPreviewStatus): string {
    switch (status) {
      case 'update':
        return 'Güncellenecek';
      case 'not-found':
        return 'Kod bulunamadı';
      case 'invalid':
        return 'Geçersiz maliyet';
      case 'inactive':
        return 'Pasif kalem';
      case 'unchanged':
        return 'Değişiklik yok';
      case 'duplicate':
        return 'Tekrarlı kod';
    }
  }

  getBulkStatusClass(status: BulkPreviewStatus): string {
    switch (status) {
      case 'update':
        return 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-200 dark:ring-emerald-400/30';
      case 'not-found':
        return 'bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-500/15 dark:text-rose-200 dark:ring-rose-400/30';
      case 'invalid':
      case 'duplicate':
        return 'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-500/15 dark:text-amber-200 dark:ring-amber-400/30';
      case 'inactive':
        return 'bg-slate-100 text-slate-700 ring-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-600';
      case 'unchanged':
        return 'bg-sky-50 text-sky-700 ring-sky-200 dark:bg-sky-500/15 dark:text-sky-200 dark:ring-sky-400/30';
    }
  }

  trackByItemId(_index: number, item: InventoryItem): number {
    return item.id;
  }

  trackByMetricLabel(_index: number, metric: SummaryMetric): string {
    return metric.label;
  }

  trackByBulkRow(_index: number, row: BulkPreviewRow): string {
    return `${row.rowNumber}-${row.code}`;
  }

  private async readBulkFile(file: File): Promise<void> {
    if (!/\.(xlsx|xls|csv)$/i.test(file.name)) {
      this.bulkError = 'Desteklenmeyen dosya tipi. Lütfen .xlsx, .xls veya .csv yükleyin.';
      return;
    }

    this.isReadingFile = true;
    this.bulkError = '';
    this.bulkSuccess = '';
    this.selectedFileName = file.name;

    try {
      const rows = await readSpreadsheetRows(file);
      this.bulkRows = this.buildBulkPreview(rows);
      if (this.bulkRows.length === 0) {
        this.bulkError = 'Geçerli satır bulunamadı.';
      }
    } catch (err: unknown) {
      this.bulkRows = [];
      this.bulkError = err instanceof Error ? err.message : 'Excel dosyası okunurken bir hata oluştu.';
    } finally {
      this.isReadingFile = false;
    }
  }

  private buildBulkPreview(rows: SpreadsheetRow[]): BulkPreviewRow[] {
    const itemByCode = new Map<string, InventoryItem>();
    this.items.forEach((item) => {
      const code = this.normalizeCode(item.code);
      if (code) {
        itemByCode.set(code, item);
      }
    });

    const normalizedCodes = rows.map((row) => this.normalizeCode(this.pickColumn(row, ['code', 'Code', 'Kod'])));
    const duplicateCodes = new Set(
      normalizedCodes.filter((code, index) => code && normalizedCodes.indexOf(code) !== index)
    );

    return rows.map((row, index) => {
      const code = this.normalizeCode(this.pickColumn(row, ['code', 'Code', 'Kod']));
      const rawCostPrice = this.pickColumn(row, [
        'costPrice',
        'CostPrice',
        'Maliyet Fiyatı',
        'MaliyetFiyati',
        'Maliyet'
      ]);
      const parsedCostPrice = this.parsePrice(rawCostPrice);
      const previewName = String(
        this.pickColumn(row, ['name', 'Name', 'Kalem Adı', 'KalemAdi']) ?? ''
      ).trim();
      const previewSalePrice = this.parsePrice(
        this.pickColumn(row, [
          'salePrice',
          'SalePrice',
          'sellingPrice',
          'SellingPrice',
          'Satış Fiyatı',
          'SatisFiyati',
          'Satış'
        ])
      );
      const currentItem = code ? itemByCode.get(code) : undefined;
      const baseRow: Omit<BulkPreviewRow, 'status' | 'message'> = {
        rowNumber: index + 2,
        code,
        name: currentItem?.name ?? previewName,
        currentCostPrice: currentItem?.costPrice ?? null,
        newCostPrice: parsedCostPrice,
        sellingPrice: currentItem?.sellingPrice ?? previewSalePrice
      };

      if (!code || parsedCostPrice === null) {
        return { ...baseRow, status: 'invalid', message: 'Kod veya maliyet değeri geçersiz.' };
      }

      if (duplicateCodes.has(code)) {
        return { ...baseRow, status: 'duplicate', message: 'Aynı kod dosyada birden fazla kez geçiyor.' };
      }

      if (!currentItem) {
        return { ...baseRow, status: 'not-found', message: 'Bu kodla eşleşen kalem bulunamadı.' };
      }

      if (currentItem.isActive === false) {
        return { ...baseRow, status: 'inactive', message: 'Pasif kalemler toplu güncellemeye dahil edilmez.' };
      }

      if (this.arePricesEqual(currentItem.costPrice, parsedCostPrice)) {
        return { ...baseRow, status: 'unchanged', message: 'Mevcut maliyet ile aynı.' };
      }

      return { ...baseRow, status: 'update', message: 'Maliyet fiyatı güncellenecek.' };
    });
  }

  private rebuildSummary(): void {
    const totalCount = this.items.length;
    const activeCount = this.items.filter((item) => item.isActive !== false).length;
    const passiveCount = totalCount - activeCount;
    const averageCost = this.average(this.items.map((item) => item.costPrice));
    const averageSale = this.average(this.items.map((item) => item.sellingPrice));
    const averageProfit = this.average(
      this.items
        .map((item) => this.getProfit(item))
        .filter((value): value is number => value !== null && value !== undefined)
    );

    this.summaryMetrics = [
      { label: 'Toplam Kalem', value: totalCount.toString(), hint: 'Tanımlı ürün ve hizmet' },
      { label: 'Aktif Kalem', value: activeCount.toString(), hint: 'Fişlerde seçilebilir' },
      { label: 'Pasif Kalem', value: passiveCount.toString(), hint: 'Kullanımı durdurulan' },
      { label: 'Ortalama Maliyet', value: this.formatCurrency(averageCost), hint: 'Tanımlı maliyet ortalaması' },
      { label: 'Ortalama Satış', value: this.formatCurrency(averageSale), hint: 'Tanımlı satış ortalaması' },
      { label: 'Ortalama Kâr', value: this.formatCurrency(averageProfit), hint: 'Satış ve maliyet farkı' }
    ];
  }

  private pickColumn(row: SpreadsheetRow, aliases: string[]): SpreadsheetCellValue {
    const normalizedAliases = aliases.map((alias) => this.normalizeColumnName(alias));
    const matchedKey = Object.keys(row).find((key) => normalizedAliases.includes(this.normalizeColumnName(key)));
    return matchedKey ? row[matchedKey] : undefined;
  }

  private parsePrice(value: SpreadsheetCellValue): number | null {
    if (typeof value === 'number' && Number.isFinite(value) && value >= 0) {
      return value;
    }

    if (typeof value !== 'string') {
      return null;
    }

    const compactValue = value.trim().replace(/\s/g, '');
    if (!compactValue) {
      return null;
    }

    const normalizedValue =
      compactValue.includes(',') && compactValue.lastIndexOf(',') > compactValue.lastIndexOf('.')
        ? compactValue.replace(/\./g, '').replace(',', '.')
        : compactValue.replace(/,/g, '');
    const parsedValue = Number(normalizedValue);

    return Number.isFinite(parsedValue) && parsedValue >= 0 ? parsedValue : null;
  }

  private normalizeCode(value: SpreadsheetCellValue): string {
    return String(value ?? '').trim().toUpperCase();
  }

  private normalizeSearch(value: string): string {
    return value.trim().toLocaleLowerCase('tr-TR');
  }

  private normalizeColumnName(value: string): string {
    return value
      .trim()
      .toLocaleLowerCase('tr-TR')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/ı/g, 'i')
      .replace(/[^a-z0-9]/g, '');
  }

  private average(values: Array<number | null | undefined>): number | null {
    const validValues = values.filter((value): value is number => value !== null && value !== undefined);
    if (validValues.length === 0) {
      return null;
    }
    return validValues.reduce((total, value) => total + value, 0) / validValues.length;
  }

  private arePricesEqual(left: number | null | undefined, right: number): boolean {
    return Math.abs((left ?? 0) - right) < 0.005;
  }

  private getDateSuffix(): string {
    return new Date().toISOString().slice(0, 10).replace(/-/g, '');
  }

  private isEndpointUnavailable(err: unknown): boolean {
    return err instanceof HttpErrorResponse && (err.status === 0 || err.status === 404 || err.status === 405);
  }

  private queueInventoryHeroSetup(): void {
    if (!this.inventoryHeroViewReady) {
      return;
    }

    window.setTimeout(() => this.setupInventoryHero());
  }

  private setupInventoryHero(): void {
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
}
