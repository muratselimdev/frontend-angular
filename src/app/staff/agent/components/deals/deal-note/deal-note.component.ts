import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';

export interface DealNote {
  id?: string;
  title: string;
  content: string;
  createdDate?: Date;
  modifiedDate?: Date;
}

@Component({
  selector: 'app-deal-note',
  templateUrl: './deal-note.component.html',
  styleUrl: './deal-note.component.css',
  standalone: false
})
export class DealNoteComponent implements OnInit, OnChanges {
  @Input() visible = false;
  @Input() dealName?: string;
  @Input() note?: DealNote;

  @Output() save   = new EventEmitter<DealNote>();
  @Output() cancel = new EventEmitter<void>();

  noteForm!: FormGroup;
  public Editor: any = ClassicEditor;
  ckEditorConfig = {
    toolbar: {
      items: ['heading', '|', 'bold', 'italic', 'link', 'bulletedList', 'numberedList', 'blockQuote', 'undo', 'redo']
    }
  };

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.noteForm = this.fb.group({
      title:   [''],
      content: ['', Validators.required]
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible'] && this.visible && this.noteForm) {
      if (this.note) {
        this.noteForm.patchValue({ title: this.note.title, content: this.note.content });
      } else {
        this.noteForm.reset();
      }
    }
  }

  onSave(): void {
    if (this.noteForm.valid) {
      const noteData: DealNote = {
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
