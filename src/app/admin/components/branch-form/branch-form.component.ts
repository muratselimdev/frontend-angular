import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BranchService } from '../../services/branch.service';

@Component({
  selector: 'app-branch-form',
  templateUrl: './branch-form.component.html',
  styleUrl: './branch-form.component.css',
  standalone: false
})
export class BranchFormComponent implements OnInit {
  form!: FormGroup;
  id?: number;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private svc: BranchService,
    private route: ActivatedRoute,
    public router: Router
  ) {}

  ngOnInit() {
    this.id = this.route.snapshot.params['id'];
    this.form = this.fb.group({
      name: ['', Validators.required],
      isActive: [true]
    });
    if (this.id) {
      this.svc.get(this.id).subscribe(b => this.form.patchValue(b));
    }
  }

  save() {
    if (this.form.invalid) return;
    this.loading = true;
    if (this.id) {
      this.svc.update(this.id, this.form.value).subscribe(() => {
        this.loading = false;
        this.router.navigate(['/admin/branches']);
      });
    } else {
      this.svc.create(this.form.value).subscribe(() => {
        this.loading = false;
        this.router.navigate(['/admin/branches']);
      });
    }
  }

    cancel() {
    this.router.navigate(['/admin/branches']);
  }
}
