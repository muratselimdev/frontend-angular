import {
  Component, EventEmitter, Input, OnChanges,
  OnInit, Output, SimpleChanges
} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Lead } from '../leads.component';

export interface LeadTransitionPayload {
  newState: string;
}

@Component({
  selector: 'app-lead-transition',
  templateUrl: './lead-transition.component.html',
  styleUrl: './lead-transition.component.css',
  standalone: false
})
export class LeadTransitionComponent implements OnInit, OnChanges {
  @Input() visible = false;
  @Input() lead?: Lead;

  @Output() save   = new EventEmitter<LeadTransitionPayload>();
  @Output() cancel = new EventEmitter<void>();

  form!: FormGroup;

  readonly stateOptions = [
    'No Answer',
    'Contacted',
    'Not Interested',
    'Applied By Mistake',
    'Invalid Number',
    'WhatsApp Block',
    'Not Qualified'
  ];

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      newState: ['', Validators.required]
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible'] && this.visible && this.form) {
      this.form.reset({ newState: '' });
    }
  }

  onSave(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.save.emit({ newState: this.form.value.newState });
  }

  onCancel(): void {
    this.cancel.emit();
  }

  hasError(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl && ctrl.invalid && ctrl.touched);
  }
}
