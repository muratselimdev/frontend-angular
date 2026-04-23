import { Component, Input, Output, EventEmitter, OnInit, SimpleChanges, OnChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';

export interface LeadNote {
  id?: string;
  title: string;
  content: string;
  createdDate?: Date;
  modifiedDate?: Date;
}

@Component({
  selector: 'app-lead-note',
  templateUrl: './lead-note.component.html',
  styleUrl: './lead-note.component.css',
  standalone: false
})
export class LeadNoteComponent implements OnInit, OnChanges {
  @Input() visible: boolean = false;
  @Input() leadId?: number;
  @Input() note?: LeadNote;

  @Output() save = new EventEmitter<LeadNote>();
  @Output() cancel = new EventEmitter<void>();

  noteForm!: FormGroup;
  public Editor: any = ClassicEditor;
  ckEditorConfig = {
    toolbar: {
      items: ['heading', '|', 'bold', 'italic', 'link', 'bulletedList', 'numberedList', 'blockQuote', 'undo', 'redo']
    }
  };

  constructor(private formBuilder: FormBuilder) {}

  ngOnInit(): void {
    this.initForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible'] && this.visible && this.noteForm) {
      if (this.note) {
        this.noteForm.patchValue({
          title: this.note.title,
          content: this.note.content
        });
      } else {
        this.noteForm.reset();
      }
    }
  }

  onContentDom(event: any): void {
    // CKEditor DOM event handler
  }

  private initForm(): void {
    this.noteForm = this.formBuilder.group({
      title: [''],
      content: ['', Validators.required]
    });
  }

  onSave(): void {
    if (this.noteForm.valid) {
      const noteData: LeadNote = {
        ...this.note,
        id: this.note?.id || Date.now().toString(),
        ...this.noteForm.value,
        modifiedDate: new Date()
      };
      this.save.emit(noteData);
      this.noteForm.reset();
    }
  }

  onCancel(): void {
    this.noteForm.reset();
    this.cancel.emit();
  }
}
