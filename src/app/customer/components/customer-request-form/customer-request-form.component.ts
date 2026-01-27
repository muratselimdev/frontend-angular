import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TreatmentService } from '../../services/treatment.service';
import { CustomerRequestService } from '../../services/customer-request.service';
import { ToastrService } from 'ngx-toastr';
import { AttachmentType } from '../../../../models/attachment-type';

@Component({
  selector: 'app-customer-request-form',
  templateUrl: './customer-request-form.component.html',
  styleUrl: './customer-request-form.component.css',
  standalone: false
})
export class CustomerRequestFormComponent implements OnInit, OnDestroy {
  form!: FormGroup;
  treatmentGroups: any[] = [];
  treatments: any[] = [];
  documentFiles: File[] = [];
  imageFiles: File[] = [];
  previewUrls: string[] = [];
  loading = false;

  constructor(
    private fb: FormBuilder,
    private treatmentService: TreatmentService,
    private requestService: CustomerRequestService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      treatmentGroupId: ['', Validators.required],
      treatmentId: ['', Validators.required],
      notes: [''],
      hasDocuments: [false],
      hasImages: [false]
    });
    this.loadTreatmentGroups();
  }

  ngOnDestroy(): void {
    this.cleanupPreviews();
  }

  loadTreatmentGroups() {
    this.treatmentService.getGroups().subscribe({
      next: res => (this.treatmentGroups = res),
      error: err => console.error('Tedavi grupları alınamadı:', err)
    });
  }

  onGroupChange(event: any) {
    const groupId = event.target.value;
    if (!groupId) {
      this.treatments = [];
      return;
    }
    this.treatmentService.getByGroup(groupId).subscribe({
      next: res => (this.treatments = res),
      error: err => console.error('Tedaviler alınamadı:', err)
    });
  }

  onDocumentsSelected(event: any) {
    this.documentFiles = Array.from(event.target.files);
  }

  onImagesSelected(event: any) {
    this.cleanupPreviews();
    this.imageFiles = Array.from(event.target.files);
    this.previewUrls = this.imageFiles.map(file => URL.createObjectURL(file));
  }

  getPreviewUrl(file: File): string {
    return URL.createObjectURL(file);
  }

  cleanupPreviews() {
    this.previewUrls.forEach(url => URL.revokeObjectURL(url));
    this.previewUrls = [];
  }

submit() {
  if (this.form.invalid || this.loading) return; // 👈 ikinci güvenlik katmanı

  this.loading = true;
  const formData = new FormData();
  formData.append('treatmentId', this.form.value.treatmentId);
  formData.append('notes', this.form.value.notes || '');

  // ✅ 1. Önce sadece 1 kez request oluştur
  this.requestService.createRequest(formData).subscribe({
    next: res => {
      const requestId = res.id;
      if (!requestId) {
        this.toastr.error('Talep ID alınamadı.');
        this.loading = false;
        return;
      }

      const uploads: Promise<any>[] = [];

      // ✅ Belgeler
      if (this.form.value.hasDocuments && this.documentFiles.length > 0) {
        uploads.push(
          this.requestService
            .uploadFiles(requestId, this.documentFiles, AttachmentType.Document)
            .toPromise()
        );
      }

      // ✅ Resimler
      if (this.form.value.hasImages && this.imageFiles.length > 0) {
        uploads.push(
          this.requestService
            .uploadFiles(requestId, this.imageFiles, AttachmentType.Image)
            .toPromise()
        );
      }

      // ✅ Promise.all sadece uploadlar için
      Promise.all(uploads)
        .then(() => {
          this.toastr.success('Talebiniz ve dosyalar başarıyla gönderildi.');
          this.form.reset();
          this.documentFiles = [];
          this.imageFiles = [];
          this.cleanupPreviews();
        })
        .catch(err => {
          console.error('Dosya yükleme hatası:', err);
          this.toastr.error('Dosya yükleme başarısız.');
        })
        .finally(() => (this.loading = false)); // 🔒 loading en son sıfırlanır
    },
    error: err => {
      console.error('Talep oluşturulamadı:', err);
      this.toastr.error('Talep oluşturulamadı.');
      this.loading = false;
    }
  });
}
}
