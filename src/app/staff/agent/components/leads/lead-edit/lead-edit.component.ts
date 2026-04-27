import {
  Component, EventEmitter, Input, OnChanges,
  OnInit, Output, SimpleChanges
} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Lead } from '../leads.component';

export type LeadEditPayload = Pick<Lead,
  'leadName' | 'phone' | 'serviceCategory' | 'service' | 'language' |
  'leadSource' | 'campaignName' | 'leadStatus' | 'leadOwner'
>;

@Component({
  selector: 'app-lead-edit',
  templateUrl: './lead-edit.component.html',
  styleUrl: './lead-edit.component.css',
  standalone: false
})
export class LeadEditComponent implements OnInit, OnChanges {
  @Input() visible = false;
  @Input() lead?: Lead;

  @Output() save   = new EventEmitter<LeadEditPayload>();
  @Output() cancel = new EventEmitter<void>();

  form!: FormGroup;

  readonly statusOptions = ['New', 'Open', 'Qualified', 'Converted', 'Lost', 'Dead'];

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      leadName:        ['', Validators.required],
      phone:           ['', Validators.required],
      serviceCategory: ['', Validators.required],
      service:         ['', Validators.required],
      language:        ['', Validators.required],
      leadSource:      ['', Validators.required],
      campaignName:    ['', Validators.required],
      leadStatus:      ['', Validators.required],
      leadOwner:       ['', Validators.required]
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible'] && this.visible && this.form && this.lead) {
      this.form.patchValue({
        leadName:        this.lead.leadName,
        phone:           this.lead.phone,
        serviceCategory: this.lead.serviceCategory,
        service:         this.lead.service,
        language:        this.lead.language,
        leadSource:      this.lead.leadSource,
        campaignName:    this.lead.campaignName,
        leadStatus:      this.lead.leadStatus,
        leadOwner:       this.lead.leadOwner
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
      leadName:        v.leadName.trim(),
      phone:           v.phone.trim(),
      serviceCategory: v.serviceCategory.trim(),
      service:         v.service.trim(),
      language:        v.language.trim(),
      leadSource:      v.leadSource.trim(),
      campaignName:    v.campaignName.trim(),
      leadStatus:      v.leadStatus,
      leadOwner:       v.leadOwner.trim()
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
