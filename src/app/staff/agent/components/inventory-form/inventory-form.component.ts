import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, of, Subject, takeUntil } from 'rxjs';
import {
  CreateInventoryLineRequest,
  CreateInventoryRequest,
  Inventory,
  InventoryItem,
  InventoryLine,
  RequestInfo,
  UpdateInventoryLineRequest,
  UpdateInventoryRequest
} from '../../../models/inventory.model';
import { InventoryService } from '../../../services/inventory.service';
import { AuthService } from '../../../../auth/auth.service';

interface SelectOption<TValue extends number> {
  label: string;
  value: TValue;
}

interface InventoryLineFormControls {
  inventoryItemId: FormControl<number | null>;
  quantity: FormControl<number>;
  amount: FormControl<number | null>;
  cancel: FormControl<boolean>;
  cancelReason: FormControl<string | null>;
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

@Component({
  selector: 'app-inventory-form',
  templateUrl: './inventory-form.component.html',
  styleUrls: ['./inventory-form.component.scss'],
  standalone: false
})
export class InventoryFormComponent implements OnInit, OnDestroy {
  inventoryForm: InventoryFormGroup;
  isEditMode = false;
  inventoryId: number | null = null;
  isLoading = false;
  isSaving = false;
  error = '';

  requests: RequestInfo[] = [];
  selectedRequest: RequestInfo | null = null;
  availableItems: InventoryItem[] = [];

  readonly typeOptions: SelectOption<number>[] = [
    { label: 'Standard Slip', value: 1 },
    { label: 'Clinical Usage', value: 2 },
    { label: 'Transfer / Other', value: 3 }
  ];
  readonly statusOptions: SelectOption<number>[] = [
    { label: 'Pending', value: 0 },
    { label: 'Approved', value: 1 },
    { label: 'Cancelled', value: 2 }
  ];

  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly fb: FormBuilder,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly inventoryService: InventoryService,
    private readonly authService: AuthService
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

    this.availableItems = this.inventoryService.getFallbackInventoryItems();
  }

  ngOnInit(): void {
    this.inventoryForm.controls.requestId.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((requestId) => {
      this.applySelectedRequest(requestId);
    });

    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      const routeId = params.get('id');
      const parsedId = Number(routeId);

      this.isEditMode = routeId !== null && routeId !== 'new' && Number.isFinite(parsedId);
      this.inventoryId = this.isEditMode ? parsedId : null;
      this.loadInitialData();
    });
  }

  ngOnDestroy(): void {
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

  createLineFormGroup(line?: InventoryLine): InventoryLineFormGroup {
    return this.fb.group<InventoryLineFormControls>({
      inventoryItemId: this.fb.control<number | null>(line?.inventoryItemId ?? null, {
        validators: [Validators.required]
      }),
      quantity: this.fb.nonNullable.control(this.toNumber(line?.quantity, 1), {
        validators: [Validators.required, Validators.min(1)]
      }),
      amount: this.fb.control<number | null>(line?.amount ?? null, {
        validators: [Validators.min(0)]
      }),
      cancel: this.fb.nonNullable.control(line?.cancel ?? false),
      cancelReason: this.fb.control<string | null>(line?.cancelReason ?? null)
    });
  }

  addLine(): void {
    this.lines.push(this.createLineFormGroup());
  }

  removeLine(index: number): void {
    this.lines.removeAt(index);
  }

  onItemChange(index: number): void {
    const lineGroup = this.lines.at(index);
    const itemId = lineGroup.controls.inventoryItemId.value;
    const selectedItem = this.availableItems.find((item) => item.id === itemId);

    if (selectedItem?.sellingPrice !== undefined && selectedItem.sellingPrice !== null) {
      lineGroup.controls.amount.setValue(selectedItem.sellingPrice);
    }
  }

  onQuantityChange(index: number): void {
    const quantityControl = this.lines.at(index).controls.quantity;
    const normalizedQuantity = this.toNumber(quantityControl.value, 1);

    if (normalizedQuantity < 1) {
      quantityControl.setValue(1);
    }
  }

  getLineTotal(index: number): number {
    const lineGroup = this.lines.at(index);
    return this.toNumber(lineGroup.controls.quantity.value) * this.toNumber(lineGroup.controls.amount.value);
  }

  getSelectedItemLabel(itemId: number | null): string {
    if (itemId === null) {
      return 'Inventory item';
    }

    return this.availableItems.find((item) => item.id === itemId)?.name ?? `Inventory Item #${itemId}`;
  }

  trackByIndex(index: number): number {
    return index;
  }

  onSubmit(): void {
    const currentStaffId = this.authService.getCurrentStaffId();
    if (currentStaffId === null) {
      this.inventoryForm.controls.staffId.setValue(null, { emitEvent: false });
      this.inventoryForm.controls.staffId.markAsTouched();
      this.error = 'Oturum staff bilgisi bulunamadı. Lütfen tekrar giriş yapın.';
      return;
    }

    this.inventoryForm.controls.staffId.setValue(currentStaffId, { emitEvent: false });

    if (this.inventoryForm.invalid || this.lines.length === 0) {
      this.inventoryForm.markAllAsTouched();
      this.error = this.lines.length === 0 ? 'En az bir envanter satırı ekleyin.' : '';
      return;
    }

    this.isSaving = true;
    this.error = '';

    if (this.isEditMode && this.inventoryId !== null) {
      this.inventoryService.update(this.inventoryId, this.buildUpdatePayload(currentStaffId)).subscribe({
        next: () => this.handleSaveSuccess(),
        error: (err: unknown) => this.handleSaveError(err, 'Güncelleme sırasında hata oluştu.')
      });
      return;
    }

    this.inventoryService.create(this.buildCreatePayload(currentStaffId)).subscribe({
      next: () => this.handleSaveSuccess(),
      error: (err: unknown) => this.handleSaveError(err, 'Oluşturma sırasında hata oluştu.')
    });
  }

  private loadInitialData(): void {
    this.isLoading = true;
    this.error = '';

    const inventory$ =
      this.isEditMode && this.inventoryId !== null ? this.inventoryService.getById(this.inventoryId) : of(null);

    forkJoin({
      requests: this.inventoryService.getInfo(),
      inventory: inventory$
    }).subscribe({
      next: ({ requests, inventory }) => {
        this.requests = requests;

        if (inventory) {
          this.patchInventory(inventory);
        } else {
          this.resetForCreate();
        }

        this.isLoading = false;
      },
      error: (err: unknown) => {
        console.error('Error loading inventory form data', err);
        this.error = this.isEditMode
          ? 'Fiş detayları yüklenirken hata oluştu.'
          : 'Talep/hasta seçim datası yüklenirken hata oluştu.';
        this.isLoading = false;
      }
    });
  }

  private patchInventory(inventory: Inventory): void {
    this.clearLines();

    this.inventoryForm.reset({
      customerId: inventory.customerId,
      staffId: this.authService.getCurrentStaffId(),
      requestId: inventory.requestId,
      ficheNo: inventory.ficheNo,
      status: inventory.status,
      type: inventory.type
    });

    inventory.lines.forEach((line) => this.lines.push(this.createLineFormGroup(line)));
    this.applySelectedRequest(inventory.requestId);
  }

  private resetForCreate(): void {
    this.clearLines();
    this.inventoryForm.reset({
      customerId: null,
      staffId: this.authService.getCurrentStaffId(),
      requestId: null,
      ficheNo: this.generateFicheNo(),
      status: 0,
      type: 1
    });
    this.selectedRequest = null;
    this.addLine();
  }

  private clearLines(): void {
    while (this.lines.length > 0) {
      this.lines.removeAt(0);
    }
  }

  private applySelectedRequest(requestId: number | null): void {
    this.selectedRequest = this.requests.find((request) => request.requestId === requestId) ?? null;

    if (this.selectedRequest) {
      this.inventoryForm.controls.customerId.setValue(this.selectedRequest.customerId, { emitEvent: false });
    }
  }

  private buildCreatePayload(currentStaffId: number): CreateInventoryRequest {
    const rawValue = this.inventoryForm.getRawValue();

    return {
      customerId: this.requireNumber(rawValue.customerId),
      staffId: currentStaffId,
      requestId: this.requireNumber(rawValue.requestId),
      ficheNo: rawValue.ficheNo.trim(),
      type: rawValue.type,
      lines: this.buildCreateLines()
    };
  }

  private buildUpdatePayload(currentStaffId: number): UpdateInventoryRequest {
    const rawValue = this.inventoryForm.getRawValue();

    return {
      customerId: this.requireNumber(rawValue.customerId),
      staffId: currentStaffId,
      requestId: this.requireNumber(rawValue.requestId),
      status: rawValue.status,
      type: rawValue.type,
      lines: this.buildUpdateLines()
    };
  }

  private buildCreateLines(): CreateInventoryLineRequest[] {
    return this.lines.getRawValue().map((line) => ({
      inventoryItemId: this.requireNumber(line.inventoryItemId),
      quantity: this.toNumber(line.quantity),
      amount: this.nullableAmount(line.amount)
    }));
  }

  private buildUpdateLines(): UpdateInventoryLineRequest[] {
    return this.lines.getRawValue().map((line) => ({
      inventoryItemId: this.requireNumber(line.inventoryItemId),
      quantity: this.toNumber(line.quantity),
      amount: this.nullableAmount(line.amount),
      cancel: line.cancel,
      cancelReason: line.cancel ? this.normalizeText(line.cancelReason) : null
    }));
  }

  private handleSaveSuccess(): void {
    this.isSaving = false;
    void this.router.navigate(['/staff/inventory']);
  }

  private handleSaveError(err: unknown, message: string): void {
    console.error('Error saving inventory', err);
    this.error = message;
    this.isSaving = false;
  }

  private generateFicheNo(): string {
    const now = new Date();
    const datePart = now.toISOString().slice(0, 10).replace(/-/g, '');
    const timePart = now.getTime().toString().slice(-5);
    return `INV-${datePart}-${timePart}`;
  }

  private normalizeText(value: string | null): string | null {
    const normalizedValue = value?.trim() ?? '';
    return normalizedValue.length > 0 ? normalizedValue : null;
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
}
