import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../auth/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
  standalone: false
})
export class LoginComponent {
  form: FormGroup;
  loading = false;
  error?: string;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  submit(): void {
  if (this.form.invalid) return;

  this.error = undefined;
  this.loading = true;

  const { email, password } = this.form.value;

  this.auth.login(email, password).subscribe({
    next: _ => {
      const target = this.auth.redirectAfterLogin();
      // Token'ın gerçekten yazılmasını bekle
      setTimeout(() => {
        this.router.navigate([target]);
      }, 400); // 400ms bekleme: token + cookie tam yazılsın
    },
    error: err => {
      this.error = err?.error?.message ?? 'Giriş başarısız.';
      this.loading = false;
    },
    complete: () => {
      this.loading = false;
    }
  });
}

}
