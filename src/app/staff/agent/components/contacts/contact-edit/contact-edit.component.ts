import {
  Component, EventEmitter, Input, OnChanges,
  OnInit, Output, SimpleChanges
} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Contact } from '../contacts.component';

export type ContactEditPayload = Pick<Contact,
  'contactName' | 'phone' | 'email' | 'leadSource' |
  'campaignName' | 'language' | 'contactOwner'
>;

@Component({
  selector: 'app-contact-edit',
  templateUrl: './contact-edit.component.html',
  styleUrl: './contact-edit.component.css',
  standalone: false
})
export class ContactEditComponent implements OnInit, OnChanges {
  @Input() visible = false;
  @Input() contact?: Contact;

  @Output() save   = new EventEmitter<ContactEditPayload>();
  @Output() cancel = new EventEmitter<void>();

  form!: FormGroup;

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      contactName:   ['', Validators.required],
      phone:         ['', Validators.required],
      email:         ['', [Validators.required, Validators.email]],
      leadSource:    ['', Validators.required],
      campaignName:  ['', Validators.required],
      language:      ['', Validators.required],
      contactOwner:  ['', Validators.required]
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible'] && this.visible && this.form && this.contact) {
      this.form.patchValue({
        contactName:   this.contact.contactName,
        phone:         this.contact.phone,
        email:         this.contact.email,
        leadSource:    this.contact.leadSource,
        campaignName:  this.contact.campaignName,
        language:      this.contact.language,
        contactOwner:  this.contact.contactOwner
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
      contactName:   v.contactName.trim(),
      phone:         v.phone.trim(),
      email:         v.email.trim(),
      leadSource:    v.leadSource.trim(),
      campaignName:  v.campaignName.trim(),
      language:      v.language.trim(),
      contactOwner:  v.contactOwner.trim()
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
