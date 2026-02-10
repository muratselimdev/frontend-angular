import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HospitalService } from '../../services/hospital.service';
import { BranchService } from '../../services/branch.service';
import { Branch } from '../../models/branch.model';

@Component({
  selector: 'app-hospital-form',
  templateUrl: './hospital-form.component.html',
  styleUrl: './hospital-form.component.css',
  standalone: false
})
export class HospitalFormComponent implements OnInit {
  form!: FormGroup;
  branches: Branch[] = [];
  id?: number;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    public router: Router,
    private hospitalSvc: HospitalService,
    private branchSvc: BranchService
  ) {}

  ngOnInit(): void {
    this.id = this.route.snapshot.params['id'];

    this.form = this.fb.group({
      name: ['', Validators.required],
      branchId: [null, Validators.required]
    });

    this.branchSvc.list().subscribe(b => this.branches = b);

    if (this.id) {
      this.hospitalSvc.list().subscribe(list => {
        const h = list.find(x => x.id == this.id);
        if (h) {
          this.form.patchValue(h);
        }
      });
    }
  }

  save() {
    if (this.form.invalid) return;
    this.loading = true;
    const dto = this.form.value;

    if (this.id) {
      this.hospitalSvc.update(this.id, dto).subscribe({
        next: () => this.router.navigate(['/admin/hospitals']),
        error: () => (this.loading = false)
      });
    } else {
      this.hospitalSvc.create(dto).subscribe({
        next: () => this.router.navigate(['/admin/hospitals']),
        error: () => (this.loading = false)
      });
    }
  }

    cancel() {
    this.router.navigate(['/admin/hospitals']);
  }
}
