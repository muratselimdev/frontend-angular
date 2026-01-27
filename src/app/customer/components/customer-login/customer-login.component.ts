import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { CustomerAuthService } from '../../services/customer-auth.service';

@Component({
  selector: 'app-customer-login',
  templateUrl: './customer-login.component.html',
  styleUrl: './customer-login.component.css',
  standalone: false
})
export class CustomerLoginComponent implements OnInit {

  form: FormGroup;
  loading = false;
  error?: string;
  logoutMessage?: string;

  constructor(
    private fb: FormBuilder,
    private auth: CustomerAuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false]   // ✅ Beni hatırla eklendi
    });
  }

  ngOnInit(): void {
    // 🔹 Kullanıcı çıkış yaptıysa mesaj göster
    this.route.queryParams.subscribe(params => {
      if (params['loggedOut'] === 'true') {
        this.logoutMessage = 'Başarıyla çıkış yaptınız 👋';
      }
    });

    // 🔹 Eğer daha önce “rememberMe” kullanıldıysa email alanını doldur
    const savedEmail = localStorage.getItem('rememberCustomerEmail');
    if (savedEmail) {
      this.form.patchValue({
        email: savedEmail,
        rememberMe: true
      });
    }
  }

  // ============================================================
  // 🔹 Giriş
  // ============================================================
  submit(): void {
    if (this.form.invalid) return;
    this.loading = true;

    const { email, password, rememberMe } = this.form.value;

    // Beni hatırla → email kaydet
    if (rememberMe) {
      localStorage.setItem('rememberCustomerEmail', email);
    } else {
      localStorage.removeItem('rememberCustomerEmail');
    }

    this.auth.login(email, password).subscribe({
      next: res => {
        localStorage.setItem('customerProfile', JSON.stringify(res.profile));
        this.router.navigate(['/customer/dashboard']);
      },
      error: err => {
        console.error(err);
        this.error = err?.error?.message ?? 'Giriş başarısız.';
        this.loading = false;
      },
      complete: () => {
        this.loading = false;
      }
    });
  }
}
