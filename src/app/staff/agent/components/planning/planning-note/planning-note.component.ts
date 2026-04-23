import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';

export interface PlanningNote {
  id?: string;
  title: string;
  content: string;
  createdDate?: Date;
  modifiedDate?: Date;
}

@Component({
  selector: 'app-planning-note',
  templateUrl: './planning-note.component.html',
  styleUrl: './planning-note.component.css',
  standalone: false
})
export class PlanningNoteComponent implements OnInit, OnChanges {
  @Input() visible = false;
  @Input() planningName?: string;
  @Input() note?: PlanningNote;

  @Output() save   = new EventEmitter<PlanningNote>();
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
      const noteData: PlanningNote = {
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
