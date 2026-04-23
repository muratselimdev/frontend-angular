import {
  Component, EventEmitter, Input, OnChanges,
  OnInit, Output, SimpleChanges
} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Deal } from '../deals.component';

export type DealEditPayload = Pick<Deal,
  'dealName' | 'serviceCategory' | 'amount' | 'stage' |
  'leadSource' | 'language' | 'dealOwner'
>;

@Component({
  selector: 'app-deal-edit',
  templateUrl: './deal-edit.component.html',
  styleUrl: './deal-edit.component.css',
  standalone: false
})
export class DealEditComponent implements OnInit, OnChanges {
  @Input() visible = false;
  @Input() deal?: Deal;

  @Output() save   = new EventEmitter<DealEditPayload>();
  @Output() cancel = new EventEmitter<void>();

  form!: FormGroup;

  readonly stageOptions = [
    'Prospect', 'Qualification', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'
  ];

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      dealName:        ['', Validators.required],
      serviceCategory: ['', Validators.required],
      amount:          [null, [Validators.required, Validators.min(0)]],
      stage:           ['', Validators.required],
      leadSource:      ['', Validators.required],
      language:        ['', Validators.required],
      dealOwner:       ['', Validators.required]
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible'] && this.visible && this.form && this.deal) {
      this.form.patchValue({
        dealName:        this.deal.dealName,
        serviceCategory: this.deal.serviceCategory,
        amount:          this.deal.amount,
        stage:           this.deal.stage,
        leadSource:      this.deal.leadSource,
        language:        this.deal.language,
        dealOwner:       this.deal.dealOwner
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
      dealName:        v.dealName.trim(),
      serviceCategory: v.serviceCategory.trim(),
      amount:          Number(v.amount),
      stage:           v.stage,
      leadSource:      v.leadSource.trim(),
      language:        v.language.trim(),
      dealOwner:       v.dealOwner.trim()
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
