import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CategoryService } from '../../services/category.service';
import { Category } from '../../models/category.model';

@Component({
  selector: 'admin-category-list',
  templateUrl: './category-list.component.html',
  styleUrl: './category-list.component.css',
  standalone: false
})
export class CategoryListComponent implements OnInit {

  categories: any[] = [];
  loading = false;
  private baseUrl = `/admin/categories/`;

  constructor(private service: CategoryService, private router: Router) {}

  ngOnInit() {
    this.load();
  }

  load() {
    this.service.getAll().subscribe(res => this.categories = res);
  }

  toggle(item: any) {
    this.service.toggle(item.id).subscribe(() => this.load());
  }

  edit(c: Category) {
    this.router.navigate([this.baseUrl, c.id]);
  }
}
