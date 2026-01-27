import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CustomerAuthService } from '../../services/customer-auth.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import countryData from '../../../../../public/country-phone-codes.json';

@Component({
  selector: 'app-customer-register',
  templateUrl: './customer-register.component.html',
  styleUrl: './customer-register.component.css',
  standalone: false
})
export class CustomerRegisterComponent implements OnInit {

  form!: FormGroup;
  loading = false;

  languages: any[] = [];
  countries: any[] = [];
    regions: any[] = [];
    areaCodes: string[] = []; // bölgeye göre alt kodlar
    selectedDialCode = "";
    selectedAreaCode = "";


  passwordStrength: 'weak' | 'medium' | 'strong' | '' = '';
  selectedPhoneCode: any;
  selectedCountry: any;

  constructor(
    private fb: FormBuilder,
    private auth: CustomerAuthService,
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit() {
    this.form = this.fb.group(
      {
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      country: ['', Validators.required],
      region: [''],
      phone: ['', Validators.required],
      languageGroupId: ['', Validators.required],
      password: ['', Validators.required],
      confirmPassword: ['', Validators.required],
      },
      { validators: this.passwordMatchValidator }
    );

    this.countries = countryData;
    this.loadLanguages();
    this.detectCountryByIP();

    // PAROLA güç kontrolü
    this.form.get('password')?.valueChanges.subscribe(value => {
      this.passwordStrength = this.checkPasswordStrength(value);
    });
  }

  // =====================================
  // 🌍 Dil Grupları
  // =====================================
  loadLanguages() {
    this.http.get<any[]>(`${environment.apiUrl}/api/admin/language-groups`).subscribe({
      next: res => {
        this.languages = res;
      },
      error: err => {
        console.error("❌ Dil listesi yüklenemedi:", err);
      }
    });
  }

  // =====================================
  // 🔐 Parola eşleşme kontrolü
  // =====================================
  passwordMatchValidator(form: FormGroup) {
    const pass = form.get('password')?.value;
    const confirm = form.get('confirmPassword')?.value;
    return pass === confirm ? null : { mismatch: true };
  }

  // =====================================
  // 🔥 Şifre Güç Analizi
  // =====================================
  checkPasswordStrength(password: string): 'weak' | 'medium' | 'strong' | '' {
    if (!password) return '';

    let strength = 0;

    if (password.length >= 6) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    if (strength <= 1) return 'weak';
    if (strength === 2) return 'medium';
    return 'strong';
  }

  // =====================================
  // 📌 Kayıt gönder
  // =====================================
  submit() {
    if (this.form.invalid) return;
    this.loading = true;

    let countryCode = this.selectedPhoneCode;    // +1, +90, +49
    let areaCode = this.selectedAreaCode;        // +1-209 gibi, örn: ABD eyaletleri
    let phoneRaw = this.form.value.phone;        // Kullanıcının yazdığı numara

    let finalPhone = '';

    // Eğer eyalet alan kodu varsa kullan
    if (areaCode) {
      finalPhone = areaCode.replace('-', '') + phoneRaw.replace(/\D/g, '');
      // Örnek: +1-209 + 5551234 → +12095551234
    } else {
      finalPhone = countryCode + phoneRaw.replace(/\D/g, '');
      // Örnek: +90 + 5551234567 → +905551234567
    }

    const payload = {
      ...this.form.value,
      phone: finalPhone,
      country: this.selectedCountry?.name ?? this.form.value.country
    };
    console.log("📤 Backend'e giden kayıt payload:", payload);

    this.auth.register(payload).subscribe({
      next: res => {
        this.router.navigate(['/customer/login'], {
          queryParams: { registered: 'true' }
        });
      },
      error: err => {
        console.error(err);
        this.loading = false;
      }
    });
}


  // =====================================
  // 🌍 IP ile ülke tespiti
  // =====================================
  detectCountryByIP() {
    fetch('https://ipapi.co/json/')
      .then(res => res.json())
      .then(data => {
        if (data.country_name) {
          this.form.patchValue({ country: data.country_name });
        }
      })
      .catch(err => console.warn("IP ülke tespiti yapılamadı:", err));
  }

onCountryChange(countryName: string) {
  const c = this.countries.find(x => x.name === countryName);
  if (!c) return;

  this.selectedCountry = c;

  // 📌 TELEFON PREFIX BURADA SET EDİLMELİ!
  this.selectedPhoneCode = c.phoneCode;     // ← ZORUNLU
  this.selectedDialCode = c.phoneCode;      // opsiyonel (ister tut ister sil)

  this.regions = c.regions ?? [];
  this.areaCodes = [];
  this.selectedAreaCode = "";

  this.form.patchValue({ region: "", phone: "" });
}

onRegionChange(regionName: string) {
  const country = this.countries.find(x => x.name === this.form.value.country);
  if (!country) return;

  const region = country.regions?.find((r: any) => r.name === regionName);

  this.areaCodes = region?.areaCodes ?? [];
  this.selectedAreaCode = ""; // seçilmediği sürece normal prefix kullanılır

  this.form.patchValue({
    region: regionName,
    phone: ""
  });
}

}
