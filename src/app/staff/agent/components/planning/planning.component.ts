import { Component, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import seedData from './planning-seed.json';
import { PlanningEditPayload } from './planning-edit/planning-edit.component';
import { PlanningNote } from './planning-note/planning-note.component';

export interface Planning {
  planningName: string;
  contactName: string;
  dealName: string;
  visitType: string;
  serviceCategory: string;
  language: string;
  arrival: string | null;
  operationStatus: string;
  planningOwner: string;
  createdTime: string | null;
  modifiedTime: string | null;
  lastActivityTime: string | null;
  taskDueDate?: string;
  notes?: PlanningNote[];
}

interface ColumnDef {
  key: keyof Planning;
  label: string;
}

const ALL_COLUMNS: ColumnDef[] = [
  { key: 'planningName',    label: 'Planning Name' },
  { key: 'contactName',     label: 'Contact Name' },
  { key: 'dealName',        label: 'Deal Name' },
  { key: 'visitType',       label: 'Visit Type' },
  { key: 'serviceCategory', label: 'Service Category' },
  { key: 'language',        label: 'Language' },
  { key: 'arrival',         label: 'Arrival' },
  { key: 'operationStatus', label: 'Operation Status' },
  { key: 'planningOwner',   label: 'Planning Owner' },
  { key: 'createdTime',     label: 'Created Time' },
  { key: 'modifiedTime',    label: 'Modified Time' },
  { key: 'lastActivityTime',label: 'Last Activity Time' },
];

const PINNED_COL_WIDTH = 140;

@Component({
  selector: 'app-planning',
  templateUrl: './planning.component.html',
  styleUrl: './planning.component.css',
  standalone: false,
  providers: [DatePipe]
})
export class PlanningComponent implements OnInit {
  plannings: Planning[] = [];
  loading = false;

  showPlanningEditModal = false;
  selectedPlanningForEdit?: Planning;

  showNoteModal = false;
  selectedPlanningForNote?: Planning;
  selectedNoteForEdit?: PlanningNote;

  sortColumn: keyof Planning | '' = '';
  sortDirection: 'asc' | 'desc' = 'asc';
  pinnedColumns: (keyof Planning)[] = [];
  selectedPlannings: Set<number> = new Set();

  constructor(private datePipe: DatePipe) {}

  ngOnInit(): void {
    this.plannings = seedData as Planning[];
  }

  get allSelected(): boolean {
    return this.plannings.length > 0 && this.selectedPlannings.size === this.plannings.length;
  }

  get someSelected(): boolean {
    return this.selectedPlannings.size > 0 && this.selectedPlannings.size < this.plannings.length;
  }

  toggleSelectAll(event: any): void {
    if (event.target.checked) {
      this.plannings.forEach((_, idx) => this.selectedPlannings.add(idx));
    } else {
      this.selectedPlannings.clear();
    }
  }

  toggleSelectPlanning(planningIndex: number): void {
    if (this.selectedPlannings.has(planningIndex)) {
      this.selectedPlannings.delete(planningIndex);
    } else {
      this.selectedPlannings.add(planningIndex);
    }
  }

  isSelected(planningIndex: number): boolean {
    return this.selectedPlannings.has(planningIndex);
  }

  openPlanningEditModal(planning: Planning): void {
    this.selectedPlanningForEdit = planning;
    this.showPlanningEditModal = true;
  }

  onPlanningEditSave(payload: PlanningEditPayload): void {
    if (!this.selectedPlanningForEdit) return;
    const idx = this.plannings.indexOf(this.selectedPlanningForEdit);
    if (idx > -1) {
      const now = new Date().toISOString();
      const updated = [...this.plannings];
      updated[idx] = { ...this.plannings[idx], ...payload, modifiedTime: now, lastActivityTime: now };
      this.plannings = updated;
    }
    this.closePlanningEditModal();
  }

  closePlanningEditModal(): void {
    this.showPlanningEditModal = false;
    this.selectedPlanningForEdit = undefined;
  }

  openNoteModal(planning: Planning, note?: PlanningNote): void {
    this.selectedPlanningForNote = planning;
    this.selectedNoteForEdit = note;
    this.showNoteModal = true;
  }

  onNoteSave(note: PlanningNote): void {
    if (!this.selectedPlanningForNote) return;
    if (!this.selectedPlanningForNote.notes) {
      this.selectedPlanningForNote.notes = [];
    }
    const existingIndex = this.selectedPlanningForNote.notes.findIndex(n => n.id === note.id);
    if (existingIndex > -1) {
      this.selectedPlanningForNote.notes[existingIndex] = note;
    } else {
      this.selectedPlanningForNote.notes.push({ ...note, createdDate: new Date() });
    }
    this.closeNoteModal();
  }

  closeNoteModal(): void {
    this.showNoteModal = false;
    this.selectedPlanningForNote = undefined;
    this.selectedNoteForEdit = undefined;
  }

  getTaskFlagClass(planning: Planning): string {
    if (!planning.taskDueDate) return '';
    const dueDate = new Date(planning.taskDueDate);
    const today = new Date();
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'flag-pending';
    if (diffDays <= 3) return 'flag-in-progress';
    return 'flag-completed';
  }

  getTaskFlagMonth(planning: Planning): string {
    if (!planning.taskDueDate) return '';
    const date = new Date(planning.taskDueDate);
    return date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
  }

  getTaskFlagDay(planning: Planning): string {
    if (!planning.taskDueDate) return '';
    const date = new Date(planning.taskDueDate);
    return String(date.getDate());
  }

  hasNotes(planning: Planning): boolean {
    return !!(planning.notes && planning.notes.length > 0);
  }

  getNotesCount(planning: Planning): number {
    return planning.notes?.length ?? 0;
  }

  get orderedColumns(): ColumnDef[] {
    const pinned   = ALL_COLUMNS.filter(c =>  this.pinnedColumns.includes(c.key));
    const unpinned = ALL_COLUMNS.filter(c => !this.pinnedColumns.includes(c.key));
    return [...pinned, ...unpinned];
  }

  get sortedPlannings(): Planning[] {
    if (!this.sortColumn) return this.plannings;
    const col = this.sortColumn;
    const dir = this.sortDirection === 'asc' ? 1 : -1;
    return [...this.plannings].sort((a, b) => {
      const av = a[col] ?? '';
      const bv = b[col] ?? '';
      if (av < bv) return -1 * dir;
      if (av > bv) return  1 * dir;
      return 0;
    });
  }

  sortBy(col: keyof Planning): void {
    if (this.sortColumn === col) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = col;
      this.sortDirection = 'asc';
    }
  }

  getSortIcon(col: keyof Planning): string {
    if (this.sortColumn !== col) return '⇅';
    return this.sortDirection === 'asc' ? '↑' : '↓';
  }

  isPinned(col: keyof Planning): boolean {
    return this.pinnedColumns.includes(col);
  }

  canPin(col: keyof Planning): boolean {
    return this.isPinned(col) || this.pinnedColumns.length < 3;
  }

  togglePin(col: keyof Planning, event: Event): void {
    event.stopPropagation();
    if (this.isPinned(col)) {
      this.pinnedColumns = this.pinnedColumns.filter(c => c !== col);
    } else if (this.pinnedColumns.length < 3) {
      this.pinnedColumns = [...this.pinnedColumns, col];
    }
  }

  getPinnedLeft(col: keyof Planning): string {
    const idx = this.pinnedColumns.indexOf(col);
    return `${idx * PINNED_COL_WIDTH}px`;
  }

  getCellValue(planning: Planning, key: keyof Planning): string {
    const val = planning[key];
    if (key === 'createdTime' || key === 'modifiedTime' || key === 'lastActivityTime' || key === 'arrival') {
      return this.datePipe.transform(val as string, 'dd/MM/yyyy HH:mm') ?? '';
    }
    return val != null ? String(val) : '';
  }

  getStatusClass(status: string): string {
    const s = (status || '').toLowerCase();
    if (s.includes('planned') || s.includes('scheduled')) return 'badge-planned';
    if (s.includes('confirmed'))                          return 'badge-confirmed';
    if (s.includes('completed') || s.includes('done'))   return 'badge-completed';
    if (s.includes('cancelled') || s.includes('cancel')) return 'badge-cancelled';
    if (s.includes('pending'))                            return 'badge-pending';
    return 'badge-default';
  }

  getVisitTypeClass(type: string): string {
    const t = (type || '').toLowerCase();
    if (t.includes('online'))   return 'visit-online';
    if (t.includes('in-person') || t.includes('onsite')) return 'visit-onsite';
    if (t.includes('phone'))    return 'visit-phone';
    return 'visit-default';
  }
}
