import { Component, OnInit } from '@angular/core';
import { Inventory } from '../../../models/inventory.model';
import { InventoryService } from '../../../services/inventory.service';

@Component({
  selector: 'app-inventory-list',
  templateUrl: './inventory-list.component.html',
  styleUrls: ['./inventory-list.component.scss'],
  standalone: false
})
export class InventoryListComponent implements OnInit {
  inventories: Inventory[] = [];
  isLoading = false;
  error = '';

  constructor(private inventoryService: InventoryService) {}

  ngOnInit(): void {
    this.loadInventories();
  }

  loadInventories(): void {
    this.isLoading = true;
    this.inventoryService.getAll().subscribe({
      next: (data) => {
        this.inventories = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error fetching inventories', err);
        this.error = 'Envanter listesi yüklenirken bir hata oluştu.';
        this.isLoading = false;
      }
    });
  }
}
