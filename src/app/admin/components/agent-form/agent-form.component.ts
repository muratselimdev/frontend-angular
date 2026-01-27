import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { BranchService } from '../../services/branch.service';
import { StaffService } from '../../services/staff.service';
import { LanguageGroupService } from '../../services/language-group.service';
import { Branch } from '../../models/branch.model';
import { SupervisorVm } from '../../models/staff.models';
import { LanguageGroup } from '../../models/language-group.model';
import { forkJoin } from 'rxjs';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-agent-form',
  templateUrl: './agent-form.component.html',
  styleUrl: './agent-form.component.scss',
  standalone: false
})
export class AgentFormComponent implements OnInit {
  form!: FormGroup;
  loading = false;
  branches: Branch[] = [];
  supervisors: SupervisorVm[] = [];
  languageGroups: LanguageGroup[] = [];
  id?: number;

  agentLevels = [
    { value: 0, label: 'Beginner' },
    { value: 1, label: 'Junior' },
    { value: 2, label: 'Senior' }
  ];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    public router: Router,
    private branchService: BranchService,
    private staffService: StaffService,
    private lgService: LanguageGroupService,
    private toastr: ToastrService
  ) {}

  ngOnInit() {
    this.branchService.list().subscribe(res => (this.branches = res));
    this.staffService.listByRole('Supervisor').subscribe(res => (this.supervisors = res));
    this.lgService.list().subscribe(res => (this.languageGroups = res));

    this.form = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
    password: ['', [Validators.minLength(6)]],
    branchId: [null, Validators.required],
    supervisorId: [null, Validators.required],
    nickname: ['', Validators.required],
    agentLevel: [null, Validators.required],
    languageGroupId: [null, Validators.required]
    });

    this.id = Number(this.route.snapshot.paramMap.get('id'));

    if (this.id) {
    this.loading = true;

    forkJoin({
      branches: this.branchService.list(),
      supervisors: this.staffService.listByRole('Supervisor'),
      languageGroups: this.lgService.list(),
      agent: this.staffService.get(this.id)
    }).subscribe(({ branches, supervisors, languageGroups, agent }) => {
      this.branches = branches;
      this.supervisors = supervisors;
      this.languageGroups = languageGroups;
      this.form.patchValue(agent); // ✅ dropdown seçenekleri hazır, değerler eşleşir
      this.loading = false;
    });
  } else {
    // yeni kayıt için sadece dropdown listeleri getir
    forkJoin({
      branches: this.branchService.list(),
      supervisors: this.staffService.listByRole('Supervisor'),
      languageGroups: this.lgService.list()
    }).subscribe(({ branches, supervisors, languageGroups }) => {
      this.branches = branches;
      this.supervisors = supervisors;
      this.languageGroups = languageGroups;
    });
  }

    // this.id = Number(this.route.snapshot.paramMap.get('id'));
    // if (this.id) {
    // this.loading = true;
    // this.staffService.get(this.id).subscribe(agent => {
    //   console.log("Backend'ten gelen agent:", agent);
    //   this.form.patchValue(agent);  
    //   this.loading = false;
    // });
  }

  //   this.id = Number(this.route.snapshot.paramMap.get('id'));
  //   if (this.id) {
  //     this.loading = true;
  //     this.staffService.get(this.id).subscribe(agent => {
  //       this.form.patchValue(agent);
  //       this.loading = false;
  //     });
  //   }
  // }

  save() {
    if (this.form.invalid) return;
    this.loading = true;

    const data = { ...this.form.value, role: 'Agent' };

    const req = this.id
      ? this.staffService.update(this.id, data)
      : this.staffService.create(data);

  req.subscribe({
    next: _ => {
      this.toastr.success('Temsilci başarıyla kaydedildi ✅');
      this.router.navigate(['/admin/agents']);
    },
    error: err => {
      this.toastr.error('Hata oluştu ❌ ' + (err.error || 'Tekrar deneyin'));
      this.loading = false;
    }
    });
  }

    cancel() {
    this.router.navigate(['/admin/agents']);
  }
}
