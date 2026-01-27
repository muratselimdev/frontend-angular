import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { LanguageGroupService } from '../../services/language-group.service';

@Component({
  selector: 'app-language-group-form',
  templateUrl: './language-group-form.component.html',
  styleUrl: './language-group-form.component.css',
  standalone: false
})
export class LanguageGroupFormComponent implements OnInit {
  form!: FormGroup;
  id?: number;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    public router: Router,
    private svc: LanguageGroupService
  ) {}

  ngOnInit() {
    this.form = this.fb.group({
      code: ['', Validators.required],
      name: ['', Validators.required],
      isActive: [true]
    });

    this.id = Number(this.route.snapshot.paramMap.get('id'));
    if (this.id) {
      this.loading = true;
      this.svc.get(this.id).subscribe(res => {
        this.form.patchValue(res);
        this.loading = false;
      });
    }
  }

  save() {
    if (this.form.invalid) return;

    const data = this.form.value;
    if (this.id) {
      this.svc.update(this.id, data).subscribe(() => this.router.navigate(['/admin/language-groups']));
    } else {
      this.svc.create(data).subscribe(() => this.router.navigate(['/admin/language-groups']));
    }
  }
}
