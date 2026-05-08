import { Component, OnInit } from '@angular/core';
import { catchError, forkJoin, of } from 'rxjs';
import { Inventory, InventoryLine, RequestInfo } from '../../../models/inventory.model';
import { InventoryService } from '../../../services/inventory.service';

type FilterValue = 'all' | string;
type InventoryMetricTone = 'blue' | 'green' | 'amber' | 'red' | 'slate' | 'violet' | 'teal';

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

@Component({
  selector: 'app-inventory-list',
  templateUrl: './inventory-list.component.html',
  styleUrls: ['./inventory-list.component.scss'],
  standalone: false
})
export class InventoryListComponent implements OnInit {
  inventories: Inventory[] = [];
  filteredInventories: Inventory[] = [];
  requestInfo: RequestInfo[] = [];
  dashboardMetrics: DashboardMetric[] = [];
  topInventoryItems: TopInventoryItem[] = [];
  treatmentDistribution: TreatmentDistributionItem[] = [];
  recentInventories: Inventory[] = [];
  pendingActions: PendingAction[] = [];

  isLoading = false;
  error = '';
  searchTerm = '';
  selectedStatus: FilterValue = 'all';
  selectedType: FilterValue = 'all';
  selectedDate = '';

  readonly skeletonCards = [1, 2, 3, 4, 5, 6, 7];
  readonly statusOptions: FilterOption[] = [
    { label: 'All statuses', value: 'all' },
    { label: 'Pending', value: '0' },
    { label: 'Approved', value: '1' },
    { label: 'Cancelled', value: '2' }
  ];
  readonly typeOptions: FilterOption[] = [
    { label: 'All types', value: 'all' },
    { label: 'Standard Slip', value: '1' },
    { label: 'Clinical Usage', value: '2' },
    { label: 'Transfer / Other', value: '3' }
  ];

  private readonly requestInfoByRequestId = new Map<number, RequestInfo>();
  private readonly itemNameById = new Map<number, string>();

  constructor(private readonly inventoryService: InventoryService) {
    this.inventoryService
      .getFallbackInventoryItems()
      .forEach((item) => this.itemNameById.set(item.id, item.name));
  }

  ngOnInit(): void {
    this.loadInventories();
  }

  loadInventories(): void {
    this.isLoading = true;
    this.error = '';

    forkJoin({
      inventories: this.inventoryService.getAll(),
      requestInfo: this.inventoryService.getInfo().pipe(catchError(() => of([] as RequestInfo[])))
    }).subscribe({
      next: ({ inventories, requestInfo }) => {
        this.inventories = inventories;
        this.requestInfo = requestInfo;
        this.rebuildRequestMap();
        this.rebuildDashboard();
        this.applyFilters();
        this.isLoading = false;
      },
      error: (err: unknown) => {
        console.error('Error fetching inventories', err);
        this.error = 'Envanter fişleri yüklenirken bir hata oluştu.';
        this.isLoading = false;
      }
    });
  }

  applyFilters(): void {
    const normalizedSearch = this.searchTerm.trim().toLowerCase();

    this.filteredInventories = this.inventories.filter((inventory) => {
      const request = this.getRequestInfo(inventory);
      const searchableText = [
        inventory.id,
        inventory.ficheNo,
        inventory.requestId,
        inventory.customerId,
        request?.customerName,
        request?.treatmentName,
        request?.treatmentGroupName,
        request?.assignedAgentName
      ]
        .filter((value): value is string | number => value !== undefined && value !== null)
        .join(' ')
        .toLowerCase();

      const matchesSearch = !normalizedSearch || searchableText.includes(normalizedSearch);
      const matchesStatus =
        this.selectedStatus === 'all' || inventory.status.toString() === this.selectedStatus;
      const matchesType = this.selectedType === 'all' || inventory.type.toString() === this.selectedType;
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
    return this.getRequestInfo(inventory)?.customerName ?? `Patient #${inventory.customerId}`;
  }

  getPatientMeta(inventory: Inventory): string {
    const request = this.getRequestInfo(inventory);
    if (!request) {
      return `Request #${inventory.requestId} • Customer #${inventory.customerId}`;
    }

    const treatmentGroup = request.treatmentGroupName ? ` • ${request.treatmentGroupName}` : '';
    return `Request #${request.requestId} • ${request.treatmentName}${treatmentGroup}`;
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

  getStatusLabel(status: number): string {
    switch (status) {
      case 0:
        return 'Pending';
      case 1:
        return 'Approved';
      case 2:
        return 'Cancelled';
      default:
        return `Status ${status}`;
    }
  }

  getTypeLabel(type: number): string {
    switch (type) {
      case 1:
        return 'Standard Slip';
      case 2:
        return 'Clinical Usage';
      case 3:
        return 'Transfer / Other';
      default:
        return `Type ${type}`;
    }
  }

  getStatusBadgeClass(status: number): string {
    switch (status) {
      case 0:
        return 'bg-amber-50 text-amber-700 ring-amber-200';
      case 1:
        return 'bg-emerald-50 text-emerald-700 ring-emerald-200';
      case 2:
        return 'bg-rose-50 text-rose-700 ring-rose-200';
      default:
        return 'bg-slate-50 text-slate-700 ring-slate-200';
    }
  }

  getTypeBadgeClass(type: number): string {
    switch (type) {
      case 1:
        return 'bg-sky-50 text-sky-700 ring-sky-200';
      case 2:
        return 'bg-teal-50 text-teal-700 ring-teal-200';
      case 3:
        return 'bg-violet-50 text-violet-700 ring-violet-200';
      default:
        return 'bg-slate-50 text-slate-700 ring-slate-200';
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

  getBarClass(tone: InventoryMetricTone): string {
    switch (tone) {
      case 'green':
        return 'bg-emerald-500';
      case 'amber':
        return 'bg-amber-500';
      case 'red':
        return 'bg-rose-500';
      case 'violet':
        return 'bg-violet-500';
      case 'teal':
        return 'bg-teal-500';
      default:
        return 'bg-sky-500';
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

  private rebuildRequestMap(): void {
    this.requestInfoByRequestId.clear();
    this.requestInfo.forEach((request) => {
      this.requestInfoByRequestId.set(request.requestId, request);
    });
  }

  private rebuildDashboard(): void {
    const allLines = this.inventories.flatMap((inventory) => inventory.lines);
    const totalSlips = this.inventories.length;
    const pendingSlips = this.inventories.filter((inventory) => inventory.status === 0).length;
    const approvedSlips = this.inventories.filter((inventory) => inventory.status === 1).length;
    const cancelledLines = allLines.filter((line) => line.cancel === true).length;
    const totalLineCount = allLines.length;
    const totalQuantity = allLines.reduce((total, line) => total + this.toNumber(line.quantity), 0);
    const totalAmount = allLines.reduce((total, line) => total + this.getLineTotal(line), 0);

    this.dashboardMetrics = [
      {
        label: 'Total Inventory Slips',
        value: totalSlips.toString(),
        hint: 'All patient request slips',
        icon: 'inventory_2',
        tone: 'blue'
      },
      {
        label: 'Pending Slips',
        value: pendingSlips.toString(),
        hint: 'Waiting for operation follow-up',
        icon: 'pending_actions',
        tone: 'amber'
      },
      {
        label: 'Approved Slips',
        value: approvedSlips.toString(),
        hint: 'Confirmed inventory slips',
        icon: 'task_alt',
        tone: 'green'
      },
      {
        label: 'Total Line Count',
        value: totalLineCount.toString(),
        hint: 'Inventory item rows',
        icon: 'format_list_bulleted',
        tone: 'slate'
      },
      {
        label: 'Cancelled Lines',
        value: cancelledLines.toString(),
        hint: 'Line-level cancellations',
        icon: 'block',
        tone: 'red'
      },
      {
        label: 'Total Quantity',
        value: totalQuantity.toString(),
        hint: 'Quantity across all lines',
        icon: 'add_shopping_cart',
        tone: 'teal'
      },
      {
        label: 'Total Amount',
        value: this.formatCompactCurrency(totalAmount),
        hint: 'Calculated from quantity and amount',
        icon: 'payments',
        tone: 'violet'
      }
    ];

    this.topInventoryItems = this.buildTopInventoryItems(allLines);
    this.recentInventories = [...this.inventories]
      .sort((left, right) => this.toTime(right.createdAt) - this.toTime(left.createdAt))
      .slice(0, 5);
    this.treatmentDistribution = this.buildTreatmentDistribution();
    this.pendingActions = [
      {
        label: 'Pending slips',
        count: pendingSlips,
        hint: 'Need approval or operational review',
        tone: 'amber'
      },
      {
        label: 'Cancelled lines',
        count: cancelledLines,
        hint: 'Review cancellation reasons',
        tone: 'red'
      },
      {
        label: 'Empty line slips',
        count: this.inventories.filter((inventory) => inventory.lines.length === 0).length,
        hint: 'Slips without inventory rows',
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
        name: this.itemNameById.get(itemId) ?? `Inventory Item #${itemId}`,
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
      const treatmentName = this.getRequestInfo(inventory)?.treatmentName ?? 'Unmapped Treatment';
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

  private toTime(value: string): number {
    const time = new Date(value).getTime();
    return Number.isNaN(time) ? 0 : time;
  }

  private formatCompactCurrency(value: number): string {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      maximumFractionDigits: 0
    }).format(value);
  }
}
