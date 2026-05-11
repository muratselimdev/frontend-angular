import { AfterViewInit, Component, ElementRef, NgZone, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, forkJoin, of, Subject, takeUntil } from 'rxjs';
import {
  CreateInventoryLineRequest,
  CreateInventoryRequest,
  Inventory,
  InventoryItem,
  InventoryLine,
  InventoryStatusApi,
  InventoryTypeApi,
  RequestInfo,
  UpdateInventoryLineRequest,
  UpdateInventoryRequest
} from '../../../models/inventory.model';
import { InventoryService } from '../../../services/inventory.service';
import { InventoryItemService } from '../../../services/inventory-item.service';
import { AuthService } from '../../../../auth/auth.service';

interface SelectOption<TValue extends number> {
  label: string;
  value: TValue;
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

interface InventoryLineFormControls {
  id: FormControl<number>;
  inventoryId: FormControl<number>;
  inventoryItemId: FormControl<number | null>;
  quantity: FormControl<number>;
  amount: FormControl<number | null>;
  cancel: FormControl<boolean>;
  cancelReason: FormControl<string | null>;
  createdAt: FormControl<string | null>;
  updatedAt: FormControl<string | null>;
}

interface InventoryFormControls {
  customerId: FormControl<number | null>;
  staffId: FormControl<number | null>;
  requestId: FormControl<number | null>;
  ficheNo: FormControl<string>;
  status: FormControl<number>;
  type: FormControl<number>;
  lines: FormArray<InventoryLineFormGroup>;
}

type InventoryLineFormGroup = FormGroup<InventoryLineFormControls>;
type InventoryFormGroup = FormGroup<InventoryFormControls>;
type InventoryStatusValue = number | string | null | undefined;
type InventoryTypeValue = number | string | null | undefined;
type RequestStatusValue = number | string | null | undefined;

@Component({
  selector: 'app-inventory-form',
  templateUrl: './inventory-form.component.html',
  styleUrls: ['./inventory-form.component.scss'],
  standalone: false
})
export class InventoryFormComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('inventoryScale') private readonly inventoryScaleRef?: ElementRef<HTMLDivElement>;
  @ViewChild('inventoryBoard') private readonly inventoryBoardRef?: ElementRef<HTMLElement>;
  @ViewChild('holoCanvas') private readonly holoCanvasRef?: ElementRef<HTMLCanvasElement>;
  @ViewChild('documentInput') private readonly documentInputRef?: ElementRef<HTMLInputElement>;

  inventoryForm: InventoryFormGroup;
  isEditMode = false;
  inventoryId: number | null = null;
  isLoading = false;
  isSaving = false;
  error = '';
  itemLoadError = '';
  selectedDocumentFile: File | null = null;

  requests: RequestInfo[] = [];
  selectedRequest: RequestInfo | null = null;
  allInventoryItems: InventoryItem[] = [];
  availableItems: InventoryItem[] = [];

  readonly typeOptions: SelectOption<number>[] = [
    { label: 'Satınalma', value: 0 },
    { label: 'Satış', value: 1 }
  ];
  readonly statusOptions: SelectOption<number>[] = [
    { label: 'Devam Ediyor', value: 0 },
    { label: 'Tamamlandı', value: 1 },
    { label: 'İptal Edildi', value: 2 }
  ];

  private readonly destroy$ = new Subject<void>();
  private currentInventory: Inventory | null = null;
  private inventoryHeroViewReady = false;
  private inventoryHeroAnimationFrame = 0;
  private inventoryHeroRunId = 0;
  private inventoryHeroParticles: InventoryHeaderParticle[] = [];
  private editingAmountIndex: number | null = null;
  private readonly inventoryHeroResizeObservers: ResizeObserver[] = [];
  private readonly moneyFormatter = new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  private readonly quantityFormatter = new Intl.NumberFormat('tr-TR', {
    maximumFractionDigits: 2
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly inventoryService: InventoryService,
    private readonly inventoryItemService: InventoryItemService,
    private readonly authService: AuthService,
    private readonly ngZone: NgZone
  ) {
    this.inventoryForm = this.fb.group<InventoryFormControls>({
      customerId: this.fb.control<number | null>(null, { validators: [Validators.required] }),
      staffId: this.fb.control<number | null>(this.authService.getCurrentStaffId(), {
        validators: [Validators.required]
      }),
      requestId: this.fb.control<number | null>(null, { validators: [Validators.required] }),
      ficheNo: this.fb.nonNullable.control('', { validators: [Validators.required, Validators.maxLength(64)] }),
      status: this.fb.nonNullable.control(0, { validators: [Validators.required] }),
      type: this.fb.nonNullable.control(1, { validators: [Validators.required] }),
      lines: this.fb.array<InventoryLineFormGroup>([])
    });
    this.inventoryForm.controls.ficheNo.disable({ emitEvent: false });
  }

  ngOnInit(): void {
    this.inventoryForm.controls.requestId.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((requestId) => {
      this.applySelectedRequest(requestId);
    });

    this.inventoryForm.controls.type.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.applyDefaultAmountsToLines();
    });

    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      const routeId = params.get('id');
      const parsedId = Number(routeId);

      this.isEditMode = routeId !== null && routeId !== 'new' && Number.isFinite(parsedId);
      this.inventoryId = this.isEditMode ? parsedId : null;
      this.loadInitialData();
    });
  }

  ngAfterViewInit(): void {
    this.inventoryHeroViewReady = true;
    this.queueInventoryHeroSetup();
  }

  ngOnDestroy(): void {
    this.destroyInventoryHero();
    this.destroy$.next();
    this.destroy$.complete();
  }

  get lines(): FormArray<InventoryLineFormGroup> {
    return this.inventoryForm.controls.lines;
  }

  get totalQuantity(): number {
    return this.lines.controls.reduce((total, line) => total + this.toNumber(line.controls.quantity.value), 0);
  }

  get totalAmount(): number {
    return this.lines.controls.reduce((total, _line, index) => total + this.getLineTotal(index), 0);
  }

  get cancelledLineCount(): number {
    return this.lines.controls.filter((line) => line.controls.cancel.value === true).length;
  }

  get isLocked(): boolean {
    if (!this.isEditMode || !this.currentInventory) {
      return false;
    }

    const status = this.normalizeStatus(this.currentInventory.status);
    return status === 1 || status === 2;
  }

  get isTerminalStatusSelected(): boolean {
    if (!this.isEditMode) {
      return false;
    }

    const status = this.normalizeStatus(this.inventoryForm.controls.status.value);
    return status === 1 || status === 2;
  }

  get isSelectedRequestLocked(): boolean {
    return this.isRequestLocked(this.selectedRequest);
  }

  get isSaveBlocked(): boolean {
    return this.isLocked || this.isTerminalStatusSelected || this.isSelectedRequestLocked;
  }

  get lockedMessage(): string {
    return 'Durumu tamamlanan veya iptal edilen sipariş fişlerinde değişiklik yapılamaz.';
  }

  get saveBlockedMessage(): string {
    if (this.isSelectedRequestLocked) {
      return 'Durumu tamamlanan veya iptal edilen siparişlerde değişiklik yapılamaz.';
    }

    return this.lockedMessage;
  }

  get currentDocumentUrl(): string | null {
    return this.normalizeText(this.currentInventory?.imageUrl ?? null);
  }

  get currentDocumentFileName(): string | null {
    return this.selectedDocumentFile?.name ?? this.extractDocumentFileName(this.currentDocumentUrl);
  }

  get documentDisplayName(): string {
    if (this.selectedDocumentFile) {
      return this.selectedDocumentFile.name;
    }

    return this.currentDocumentUrl ? 'Mevcut PDF dosyası' : 'PDF dosyası eklenmedi';
  }

  get documentActionLabel(): string {
    return this.selectedDocumentFile || this.currentDocumentUrl ? 'Değiştir' : 'PDF Seç';
  }

  createLineFormGroup(line?: InventoryLine): InventoryLineFormGroup {
    return this.fb.group<InventoryLineFormControls>({
      id: this.fb.nonNullable.control(line?.id ?? 0),
      inventoryId: this.fb.nonNullable.control(line?.inventoryId ?? this.inventoryId ?? 0),
      inventoryItemId: this.fb.control<number | null>(line?.inventoryItemId ?? null, {
        validators: [Validators.required]
      }),
      quantity: this.fb.nonNullable.control(this.toNumber(line?.quantity, 1), {
        validators: [Validators.required, Validators.min(1)]
      }),
      amount: this.fb.control<number | null>(line?.amount ?? null, {
        validators: [Validators.required, Validators.min(0)]
      }),
      cancel: this.fb.nonNullable.control(line?.cancel ?? false),
      cancelReason: this.fb.control<string | null>(line?.cancelReason ?? null),
      createdAt: this.fb.control<string | null>(line?.createdAt ?? null),
      updatedAt: this.fb.control<string | null>(line?.updatedAt ?? null)
    });
  }

  addLine(): void {
    if (this.isLocked) {
      return;
    }

    this.lines.push(this.createLineFormGroup());
  }

  removeLine(index: number): void {
    if (this.isLocked) {
      return;
    }

    this.lines.removeAt(index);
  }

  onItemChange(index: number): void {
    if (this.isLocked) {
      return;
    }

    const lineGroup = this.lines.at(index);
    const itemId = lineGroup.controls.inventoryItemId.value;
    const selectedItem = this.availableItems.find((item) => item.id === itemId);
    const defaultAmount = selectedItem ? this.getDefaultAmount(selectedItem) : null;

    if (defaultAmount !== null) {
      lineGroup.controls.amount.setValue(defaultAmount);
    }
  }

  private applyDefaultAmountsToLines(): void {
    this.lines.controls.forEach((lineGroup) => {
      const itemId = lineGroup.controls.inventoryItemId.value;
      const selectedItem = this.availableItems.find((item) => item.id === itemId);
      const defaultAmount = selectedItem ? this.getDefaultAmount(selectedItem) : null;

      if (defaultAmount !== null) {
        lineGroup.controls.amount.setValue(defaultAmount);
      }
    });
  }

  private getDefaultAmount(item: InventoryItem): number | null {
    const type = this.inventoryForm.controls.type.value;
    const preferredAmount = type === 0 ? item.costPrice : item.sellingPrice;
    const fallbackAmount = type === 0 ? item.sellingPrice : item.costPrice;
    const amount = preferredAmount ?? fallbackAmount ?? null;

    return amount !== null && Number.isFinite(amount) ? amount : null;
  }

  onQuantityChange(index: number): void {
    if (this.isLocked) {
      return;
    }

    const quantityControl = this.lines.at(index).controls.quantity;
    const normalizedQuantity = this.toNumber(quantityControl.value, 1);

    if (normalizedQuantity < 1) {
      quantityControl.setValue(1);
    }
  }

  onAmountFocus(index: number): void {
    this.editingAmountIndex = index;
  }

  onAmountInput(index: number, event: Event): void {
    if (this.isLocked) {
      return;
    }

    const input = event.target as HTMLInputElement;
    const amountControl = this.lines.at(index).controls.amount;
    const parsedAmount = this.parseMoneyInput(input.value);

    amountControl.setValue(parsedAmount);
    amountControl.markAsDirty();
  }

  onAmountBlur(index: number): void {
    this.lines.at(index).controls.amount.markAsTouched();
    this.editingAmountIndex = null;
  }

  getAmountDisplay(index: number): string {
    const amount = this.lines.at(index).controls.amount.value;
    if (amount === null) {
      return '';
    }

    return this.editingAmountIndex === index ? String(amount).replace('.', ',') : this.moneyFormatter.format(amount);
  }

  getLineTotal(index: number): number {
    const lineGroup = this.lines.at(index);
    return this.toNumber(lineGroup.controls.quantity.value) * this.toNumber(lineGroup.controls.amount.value);
  }

  formatMoney(value: number | null | undefined): string {
    return value === null || value === undefined ? '-' : `${this.moneyFormatter.format(value)} TL`;
  }

  formatQuantity(value: number | null | undefined): string {
    return value === null || value === undefined ? '-' : this.quantityFormatter.format(value);
  }

  getSelectedItemLabel(itemId: number | null): string {
    if (itemId === null) {
      return 'Sipariş kalemi';
    }

    const item = this.availableItems.find((currentItem) => currentItem.id === itemId);
    return item ? this.getItemNameWithCode(item) : `Sipariş Kalemi #${itemId}`;
  }

  getItemOptionLabel(item: InventoryItem): string {
    const codePrefix = item.code ? `${item.code} - ` : '';
    const passiveSuffix = item.isActive === false ? ' (Pasif)' : '';
    return `${codePrefix}${item.name}${passiveSuffix} | Satış: ${this.formatCurrency(item.sellingPrice)} | Maliyet: ${this.formatCurrency(item.costPrice)}`;
  }

  isItemOptionDisabled(item: InventoryItem, selectedItemId: number | null): boolean {
    return item.isActive === false && item.id !== selectedItemId;
  }

  trackByIndex(index: number): number {
    return index;
  }

  onDocumentSelected(event: Event): void {
    if (this.isSaveBlocked) {
      return;
    }

    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;

    if (!file) {
      return;
    }

    if (!this.isPdfFile(file)) {
      this.selectedDocumentFile = null;
      input.value = '';
      this.error = 'Sadece PDF dosyası yükleyebilirsiniz.';
      return;
    }

    this.selectedDocumentFile = file;
    this.error = '';
  }

  clearSelectedDocument(): void {
    if (this.isSaveBlocked) {
      return;
    }

    this.clearDocumentInput();
  }

  onSubmit(): void {
    if (this.isSaveBlocked) {
      this.error = this.saveBlockedMessage;
      return;
    }

    const currentStaffId = this.authService.getCurrentStaffId();
    if (currentStaffId === null) {
      this.inventoryForm.controls.staffId.setValue(null, { emitEvent: false });
      this.inventoryForm.controls.staffId.markAsTouched();
      this.error = 'Oturum personel bilgisi bulunamadı. Lütfen tekrar giriş yapın.';
      return;
    }

    this.inventoryForm.controls.staffId.setValue(currentStaffId, { emitEvent: false });

    if (this.inventoryForm.invalid || this.lines.length === 0) {
      this.inventoryForm.markAllAsTouched();
      this.error = this.lines.length === 0 ? 'En az bir sipariş kalemi ekleyin.' : '';
      return;
    }

    this.isSaving = true;
    this.error = '';

    if (this.isEditMode && this.inventoryId !== null) {
      this.inventoryService.update(this.inventoryId, this.buildUpdatePayload(currentStaffId), this.selectedDocumentFile).subscribe({
        next: () => this.handleSaveSuccess(),
        error: () => this.handleSaveError('Güncelleme sırasında hata oluştu.')
      });
      return;
    }

    this.inventoryService.create(this.buildCreatePayload(currentStaffId), this.selectedDocumentFile).subscribe({
      next: () => this.handleSaveSuccess(),
      error: () => this.handleSaveError('Oluşturma sırasında hata oluştu.')
    });
  }

  private loadInitialData(): void {
    this.isLoading = true;
    this.error = '';
    this.itemLoadError = '';

    const inventory$ =
      this.isEditMode && this.inventoryId !== null ? this.inventoryService.getById(this.inventoryId) : of(null);
    const ficheNo$ = !this.isEditMode
      ? this.inventoryService.getNewFicheNo().pipe(catchError(() => of(this.generateFicheNo())))
      : of(null);

    forkJoin({
      requests: this.inventoryService.getInfo(),
      inventory: inventory$,
      ficheNo: ficheNo$,
      inventoryItems: this.inventoryItemService.getAll().pipe(
        catchError(() => {
          this.itemLoadError = 'Sipariş kalemleri alınamadı. Lütfen daha sonra tekrar deneyin.';
          return of([] as InventoryItem[]);
        })
      )
    }).subscribe({
      next: ({ requests, inventory, ficheNo, inventoryItems }) => {
        this.requests = requests;
        this.allInventoryItems = inventoryItems;
        this.rebuildAvailableItems(inventory);

        if (inventory) {
          this.patchInventory(inventory);
        } else {
          this.resetForCreate(ficheNo || this.generateFicheNo());
        }

        this.isLoading = false;
      },
      error: () => {
        this.error = this.isEditMode
          ? 'Fiş detayları yüklenirken bir hata oluştu.'
          : 'Talep/hasta bilgileri yüklenirken bir hata oluştu.';
        this.isLoading = false;
      }
    });
  }

  private patchInventory(inventory: Inventory): void {
    this.currentInventory = inventory;
    this.clearDocumentInput();
    this.inventoryForm.enable({ emitEvent: false });
    this.clearLines();

    this.inventoryForm.reset({
      customerId: inventory.customerId,
      staffId: this.authService.getCurrentStaffId(),
      requestId: inventory.requestId,
      ficheNo: inventory.ficheNo,
      status: this.normalizeStatus(inventory.status),
      type: this.normalizeType(inventory.type)
    });

    inventory.lines.forEach((line) => this.lines.push(this.createLineFormGroup(line)));
    this.applySelectedRequest(inventory.requestId);
    this.applyFormLockState();
  }

  private resetForCreate(ficheNo: string): void {
    this.currentInventory = null;
    this.clearDocumentInput();
    this.inventoryForm.enable({ emitEvent: false });
    this.clearLines();
    this.inventoryForm.reset({
      customerId: null,
      staffId: this.authService.getCurrentStaffId(),
      requestId: null,
      ficheNo,
      status: 0,
      type: 1
    });
    this.selectedRequest = null;
    this.addLine();
    this.applyFormLockState();
  }

  private clearLines(): void {
    while (this.lines.length > 0) {
      this.lines.removeAt(0);
    }
  }

  private rebuildAvailableItems(inventory: Inventory | null): void {
    const selectedItemIds = new Set((inventory?.lines ?? []).map((line) => line.inventoryItemId));
    this.availableItems = this.allInventoryItems.filter(
      (item) => item.isActive !== false || selectedItemIds.has(item.id)
    );
  }

  private applySelectedRequest(requestId: number | null): void {
    this.selectedRequest = this.requests.find((request) => request.requestId === requestId) ?? null;

    if (this.selectedRequest) {
      this.inventoryForm.controls.customerId.setValue(this.selectedRequest.customerId, { emitEvent: false });
    }
  }

  private isRequestLocked(request: RequestInfo | null): boolean {
    if (!request) {
      return false;
    }

    if ((request.isCancelled ?? request.IsCancelled) === true) {
      return true;
    }

    const status =
      request.statusId ??
      request.StatusId ??
      request.status ??
      request.Status ??
      request.statusName ??
      request.StatusName;
    const normalizedStatus = this.normalizeRequestStatus(status);

    return normalizedStatus === 6 || normalizedStatus === 7;
  }

  private buildCreatePayload(currentStaffId: number): CreateInventoryRequest {
    const rawValue = this.inventoryForm.getRawValue();
    const createdAt = new Date().toISOString();

    return {
      customerId: this.requireNumber(rawValue.customerId),
      staffId: currentStaffId,
      requestId: this.requireNumber(rawValue.requestId),
      ficheNo: rawValue.ficheNo.trim(),
      status: this.toApiStatus(rawValue.status),
      type: this.toApiType(rawValue.type),
      createdAt,
      updatedAt: null,
      lines: this.buildCreateLines(createdAt)
    };
  }

  private buildUpdatePayload(currentStaffId: number): UpdateInventoryRequest {
    const rawValue = this.inventoryForm.getRawValue();
    const updatedAt = new Date().toISOString();

    return {
      id: this.requireNumber(this.inventoryId),
      customerId: this.requireNumber(rawValue.customerId),
      staffId: currentStaffId,
      requestId: this.requireNumber(rawValue.requestId),
      status: this.toApiStatus(rawValue.status),
      type: this.toApiType(rawValue.type),
      createdAt: this.currentInventory?.createdAt ?? updatedAt,
      updatedAt,
      lines: this.buildUpdateLines(updatedAt)
    };
  }

  private buildCreateLines(createdAt: string): CreateInventoryLineRequest[] {
    return this.lines.getRawValue().map((line) => ({
      inventoryId: 0,
      inventoryItemId: this.requireNumber(line.inventoryItemId),
      quantity: this.toNumber(line.quantity),
      amount: this.nullableAmount(line.amount),
      cancel: false,
      cancelReason: null,
      createdAt,
      updatedAt: null
    }));
  }

  private buildUpdateLines(updatedAt: string): UpdateInventoryLineRequest[] {
    return this.lines.getRawValue().map((line) => ({
      id: line.id ?? 0,
      inventoryId: line.inventoryId || this.requireNumber(this.inventoryId),
      inventoryItemId: this.requireNumber(line.inventoryItemId),
      quantity: this.toNumber(line.quantity),
      amount: this.nullableAmount(line.amount),
      cancel: line.cancel,
      cancelReason: line.cancel ? this.normalizeText(line.cancelReason) : null,
      createdAt: line.createdAt ?? updatedAt,
      updatedAt
    }));
  }

  private handleSaveSuccess(): void {
    this.isSaving = false;
    void this.router.navigate(['/staff/inventory']);
  }

  private handleSaveError(message: string): void {
    this.error = message;
    this.isSaving = false;
  }

  private applyFormLockState(): void {
    if (this.isLocked) {
      this.inventoryForm.disable({ emitEvent: false });
    } else {
      this.inventoryForm.enable({ emitEvent: false });
    }

    this.inventoryForm.controls.ficheNo.disable({ emitEvent: false });
  }

  private generateFicheNo(): string {
    const now = new Date();
    const datePart = now.toISOString().slice(0, 10).replace(/-/g, '');
    const timePart = now.getTime().toString().slice(-5);
    return `SIP-${datePart}-${timePart}`;
  }

  private normalizeText(value: string | null): string | null {
    const normalizedValue = value?.trim() ?? '';
    return normalizedValue.length > 0 ? normalizedValue : null;
  }

  private extractDocumentFileName(url: string | null): string | null {
    if (!url) {
      return null;
    }

    const path = this.getUrlPath(url);
    const fileName = path.split('/').filter(Boolean).pop() ?? '';
    const normalizedFileName = this.normalizeText(decodeURIComponent(fileName).replace(/^[0-9a-f-]{36}_/i, ''));

    return normalizedFileName?.toLowerCase().endsWith('.pdf') ? normalizedFileName : null;
  }

  private getUrlPath(url: string): string {
    try {
      return new URL(url).pathname;
    } catch {
      return url.split('?')[0] ?? '';
    }
  }

  private isPdfFile(file: File): boolean {
    return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
  }

  private clearDocumentInput(): void {
    this.selectedDocumentFile = null;

    if (this.documentInputRef?.nativeElement) {
      this.documentInputRef.nativeElement.value = '';
    }
  }

  private nullableAmount(value: number | null): number | null {
    if (value === null) {
      return null;
    }

    return this.toNumber(value);
  }

  private requireNumber(value: number | null): number {
    if (value === null || !Number.isFinite(value)) {
      throw new Error('Required numeric form value is missing.');
    }

    return value;
  }

  private toNumber(value: number | string | null | undefined, fallback = 0): number {
    const parsedValue = Number(value ?? fallback);
    return Number.isFinite(parsedValue) ? parsedValue : fallback;
  }

  private parseMoneyInput(value: string): number | null {
    const cleanedValue = value.replace(/[^\d,.-]/g, '').trim();

    if (!cleanedValue) {
      return null;
    }

    const normalizedValue = this.normalizeMoneyInput(cleanedValue);
    const parsedValue = Number(normalizedValue);

    return Number.isFinite(parsedValue) ? parsedValue : null;
  }

  private normalizeMoneyInput(value: string): string {
    if (value.includes(',')) {
      return value.replace(/\./g, '').replace(',', '.');
    }

    if (value.includes('.')) {
      const parts = value.split('.');
      const lastPart = parts[parts.length - 1] ?? '';

      if (lastPart.length === 3 && parts.length > 1) {
        return parts.join('');
      }
    }

    return value.replace(/,/g, '');
  }

  private getItemNameWithCode(item: InventoryItem): string {
    return item.code ? `${item.code} - ${item.name}` : item.name;
  }

  private formatCurrency(value: number | null | undefined): string {
    return this.formatMoney(value);
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

  private normalizeStatus(status: InventoryStatusValue): number {
    if (status === 1 || status === '1' || status === 'Tamamlandi' || status === 'Tamamlandı') {
      return 1;
    }

    if (status === 2 || status === '2' || status === 'IptalEdildi' || status === 'İptalEdildi') {
      return 2;
    }

    return 0;
  }

  private normalizeType(type: InventoryTypeValue): number {
    if (type === 0 || type === '0' || type === 'Satinalma' || type === 'Satınalma') {
      return 0;
    }

    if (type === 1 || type === '1' || type === 'Satis' || type === 'Satış') {
      return 1;
    }

    return 1;
  }

  private normalizeRequestStatus(status: RequestStatusValue): number | null {
    if (
      status === 6 ||
      status === '6' ||
      status === 'Completed' ||
      status === 'Tamamlandi' ||
      status === 'Tamamlandı'
    ) {
      return 6;
    }

    if (
      status === 7 ||
      status === '7' ||
      status === 'Cancelled' ||
      status === 'Canceled' ||
      status === 'IptalEdildi' ||
      status === 'İptalEdildi'
    ) {
      return 7;
    }

    return null;
  }

  private toApiStatus(status: number): InventoryStatusApi {
    switch (status) {
      case 1:
        return 'Tamamlandi';
      case 2:
        return 'IptalEdildi';
      default:
        return 'DevamEdiyor';
    }
  }

  private toApiType(type: number): InventoryTypeApi {
    return type === 0 ? 'Satinalma' : 'Satis';
  }
}
