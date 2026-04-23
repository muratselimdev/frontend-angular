import {
  Component, EventEmitter, Input, OnChanges,
  OnInit, Output, SimpleChanges
} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Planning } from '../planning.component';

export type PlanningEditPayload = Pick<Planning,
  'planningName' | 'contactName' | 'dealName' | 'visitType' |
  'serviceCategory' | 'language' | 'arrival' | 'operationStatus' | 'planningOwner'
>;

@Component({
  selector: 'app-planning-edit',
  templateUrl: './planning-edit.component.html',
  styleUrl: './planning-edit.component.css',
  standalone: false
})
export class PlanningEditComponent implements OnInit, OnChanges {
  @Input() visible = false;
  @Input() planning?: Planning;

  @Output() save   = new EventEmitter<PlanningEditPayload>();
  @Output() cancel = new EventEmitter<void>();

  form!: FormGroup;

  readonly visitTypeOptions  = ['Online', 'In-Person', 'Phone'];
  readonly statusOptions     = ['Planned', 'Confirmed', 'Completed', 'Cancelled', 'Pending'];

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      planningName:    ['', Validators.required],
      contactName:     ['', Validators.required],
      dealName:        ['', Validators.required],
      visitType:       ['', Validators.required],
      serviceCategory: ['', Validators.required],
      language:        ['', Validators.required],
      arrival:         ['', Validators.required],
      operationStatus: ['', Validators.required],
      planningOwner:   ['', Validators.required]
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible'] && this.visible && this.form && this.planning) {
      // Convert ISO string to datetime-local format (YYYY-MM-DDTHH:mm)
      const arrivalVal = this.planning.arrival
        ? this.planning.arrival.substring(0, 16)
        : '';
      this.form.patchValue({
        planningName:    this.planning.planningName,
        contactName:     this.planning.contactName,
        dealName:        this.planning.dealName,
        visitType:       this.planning.visitType,
        serviceCategory: this.planning.serviceCategory,
        language:        this.planning.language,
        arrival:         arrivalVal,
        operationStatus: this.planning.operationStatus,
        planningOwner:   this.planning.planningOwner
      });
    }
  }

  onSave(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.value;
    this.save.emit({
      planningName:    v.planningName.trim(),
      contactName:     v.contactName.trim(),
      dealName:        v.dealName.trim(),
      visitType:       v.visitType,
      serviceCategory: v.serviceCategory.trim(),
      language:        v.language.trim(),
      arrival:         v.arrival ? new Date(v.arrival).toISOString() : null,
      operationStatus: v.operationStatus,
      planningOwner:   v.planningOwner.trim()
    });
  }

  onCancel(): void {
    this.cancel.emit();
  }

  hasError(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl && ctrl.invalid && ctrl.touched);
  }
}
