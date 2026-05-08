import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { InventoryService } from '../../../services/inventory.service';
import { RequestInfo, InventoryItem } from '../../../models/inventory.model';

@Component({
  selector: 'app-inventory-form',
  templateUrl: './inventory-form.component.html',
  styleUrls: ['./inventory-form.component.scss'],
  standalone: false
})
export class InventoryFormComponent implements OnInit {
  inventoryForm: FormGroup;
  isEditMode = false;
  inventoryId: number | null = null;
  isLoading = false;
  isSaving = false;
  error = '';
  
  requests: RequestInfo[] = [];
  // Mock items for now as there's no endpoint for it yet
  availableItems: InventoryItem[] = [
    { id: 1, name: 'Diş Beyazlatma Kiti', costPrice: 50, sellingPrice: 150, isActive: true, createdAt: new Date().toISOString() },
    { id: 2, name: 'Implant Vidası', costPrice: 200, sellingPrice: 500, isActive: true, createdAt: new Date().toISOString() },
    { id: 3, name: 'Porselen Kaplama', costPrice: 100, sellingPrice: 300, isActive: true, createdAt: new Date().toISOString() }
  ];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private inventoryService: InventoryService
  ) {
    this.inventoryForm = this.fb.group({
      customerId: ['', Validators.required],
      staffId: [1, Validators.required], // Hardcoded or get from current user
      requestId: ['', Validators.required],
      ficheNo: ['', Validators.required],
      status: [0, Validators.required],
      type: [1, Validators.required],
      lines: this.fb.formArray([])
    });
  }

  ngOnInit(): void {
    this.loadRequestInfo();

    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id && id !== 'new') {
        this.isEditMode = true;
        this.inventoryId = +id;
        this.loadInventory(this.inventoryId);
      } else {
        this.isEditMode = false;
        this.addLine(); // Add one empty line by default
      }
    });
    
    // Auto fill customerId when requestId changes
    this.inventoryForm.get('requestId')?.valueChanges.subscribe(reqId => {
      if (reqId) {
        const req = this.requests.find(r => r.requestId === +reqId);
        if (req) {
          this.inventoryForm.patchValue({ customerId: req.customerId });
        }
      }
    });
  }

  get lines(): FormArray {
    return this.inventoryForm.get('lines') as FormArray;
  }

  createLineFormGroup(line?: any): FormGroup {
    return this.fb.group({
      inventoryItemId: [line ? line.inventoryItemId : '', Validators.required],
      quantity: [line ? line.quantity : 1, [Validators.required, Validators.min(1)]],
      amount: [line ? line.amount : 0, [Validators.required, Validators.min(0)]],
      cancel: [line ? line.cancel : false],
      cancelReason: [line ? line.cancelReason : '']
    });
  }

  addLine(): void {
    this.lines.push(this.createLineFormGroup());
  }

  removeLine(index: number): void {
    this.lines.removeAt(index);
  }

  onItemChange(index: number): void {
    const lineGroup = this.lines.at(index);
    const itemId = lineGroup.get('inventoryItemId')?.value;
    if (itemId) {
      const item = this.availableItems.find(i => i.id === +itemId);
      if (item && item.sellingPrice) {
        const qty = lineGroup.get('quantity')?.value || 1;
        lineGroup.patchValue({ amount: item.sellingPrice * qty });
      }
    }
  }

  onQuantityChange(index: number): void {
    this.onItemChange(index);
  }

  loadRequestInfo(): void {
    this.inventoryService.getInfo().subscribe({
      next: (data) => {
        this.requests = data;
      },
      error: (err) => {
        console.error('Error fetching requests info', err);
      }
    });
  }

  loadInventory(id: number): void {
    this.isLoading = true;
    this.inventoryService.getById(id).subscribe({
      next: (data) => {
        this.inventoryForm.patchValue({
          customerId: data.customerId,
          staffId: data.staffId,
          requestId: data.requestId,
          ficheNo: data.ficheNo,
          status: data.status,
          type: data.type
        });

        // Clear existing lines
        while (this.lines.length) {
          this.lines.removeAt(0);
        }

        // Add fetched lines
        if (data.lines && data.lines.length > 0) {
          data.lines.forEach(line => {
            this.lines.push(this.createLineFormGroup(line));
          });
        }
        
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error fetching inventory', err);
        this.error = 'Fiş detayları yüklenirken hata oluştu.';
        this.isLoading = false;
      }
    });
  }

  onSubmit(): void {
    if (this.inventoryForm.invalid) {
      this.inventoryForm.markAllAsTouched();
      return;
    }

    this.isSaving = true;
    const formData = this.inventoryForm.value;

    if (this.isEditMode && this.inventoryId) {
      this.inventoryService.update(this.inventoryId, formData).subscribe({
        next: () => {
          this.isSaving = false;
          this.router.navigate(['/staff/inventory']);
        },
        error: (err) => {
          console.error('Error updating inventory', err);
          this.error = 'Güncelleme sırasında hata oluştu.';
          this.isSaving = false;
        }
      });
    } else {
      this.inventoryService.create(formData).subscribe({
        next: () => {
          this.isSaving = false;
          this.router.navigate(['/staff/inventory']);
        },
        error: (err) => {
          console.error('Error creating inventory', err);
          this.error = 'Oluşturma sırasında hata oluştu.';
          this.isSaving = false;
        }
      });
    }
  }
}
