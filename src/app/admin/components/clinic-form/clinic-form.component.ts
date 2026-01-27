import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ClinicService } from '../../services/clinic.service';
import { BranchService } from '../../services/branch.service';
import { Branch } from '../../models/branch.model';

@Component({
  selector: 'app-clinic-form',
  templateUrl: './clinic-form.component.html',
  styleUrl: './clinic-form.component.css',
  standalone: false
})
export class ClinicFormComponent implements OnInit {
  form!: FormGroup;
  branches: Branch[] = [];
  id?: number;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    public router: Router,
    private clinicSvc: ClinicService,
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
      this.clinicSvc.list().subscribe(list => {
        const c = list.find(x => x.id == this.id);
        if (c) this.form.patchValue(c);
      });
    }
  }

  save() {
    if (this.form.invalid) return;
    const dto = this.form.value;

    if (this.id) {
      this.clinicSvc.update(this.id, dto).subscribe(() => this.router.navigate(['/admin/clinics']));
    } else {
      this.clinicSvc.create(dto).subscribe(() => this.router.navigate(['/admin/clinics']));
    }
  }

  cancel() {
    this.router.navigate(['/admin/clinics']);
  }
}
