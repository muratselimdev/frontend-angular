import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup } from '@angular/forms';
import { CampaignService } from '../../services/campaign.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

@Component({
  standalone: false,
  selector: 'app-campaign-form',
  //imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './campaign-form.component.html',
})
export class CampaignFormComponent implements OnInit {

  form!: FormGroup;
  campaignId?: number;
  loading = false;
    selectedFile?: File;
    previewUrl?: string;
    private baseUrl = `${environment.apiUrl}/api/admin/campaigns/create`;
    private Url = `${environment.apiUrl}/api/admin/campaigns/update`;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private campaignService: CampaignService,
    private http: HttpClient,
  ) {}

  ngOnInit(): void {
    this.campaignId = Number(this.route.snapshot.paramMap.get('id'));

    this.form = this.fb.group({
      id: this.campaignId,
      title: [''],
      description: [''],
      discountRate: [0],
      imageUrl: [''],
      startDate: [''],
      endDate: [''],
      isActive: [true],
      price: [0],
      detail: ['']
    });

     if (this.campaignId) {
      this.loadCampaign(this.campaignId);
    }
  }

  formatDate(date: string): string {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = ('0' + (d.getMonth() + 1)).slice(-2);
  const day = ('0' + d.getDate()).slice(-2);
  return `${year}-${month}-${day}`;
}

  onFileSelected(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;

  this.selectedFile = file;

  // 🔍 Preview
  const reader = new FileReader();
  reader.onload = () => this.previewUrl = reader.result as string;
  reader.readAsDataURL(file);
}

  loadCampaign(id: number) {
    this.campaignService.getById(id).subscribe(res => {
    this.form.patchValue({
        title: res.title,
        description: res.description,
        discountRate: res.discountRate,
        imageUrl: res.imageUrl,
        startDate: this.formatDate(res.startDate.toString()),
        endDate: this.formatDate(res.endDate.toString()),
        isActive: res.isActive
    });
    });
  }

submit() {

  if (this.form.invalid) {
    this.form.markAllAsTouched();
    return;
  }

  const formData = new FormData();

  formData.append('id', this.campaignId?.toString() ?? '0');
  formData.append('title', this.form.value.title);
  formData.append('description', this.form.value.description);
  formData.append('discountRate', this.form.value.discountRate.toString());
  formData.append('startDate', this.form.value.startDate);
  formData.append('endDate', this.form.value.endDate);
  formData.append('price', this.form.value.price.toString());
  formData.append('detail', this.form.value.detail);

  if (this.selectedFile) {
    formData.append('image', this.selectedFile);
  }

  const req$ = this.campaignId
    ? this.campaignService.update(this.campaignId, formData)
    : this.http.post(this.baseUrl, formData);

  //formData.forEach((v, k) => console.log(k, v));

  req$.subscribe({
    next: () => this.router.navigate(['/admin/campaigns']),
    error: () => this.loading = false,
  });
}

  cancel() {
    this.router.navigate(['/admin/campaigns']);
  }
}
