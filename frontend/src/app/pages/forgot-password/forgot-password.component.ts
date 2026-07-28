import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.css',
})
export class ForgotPasswordComponent {
  private http = inject(HttpClient);
  private router = inject(Router);

  step: 1 | 2 | 3 = 1;

  email = '';
  code = '';
  newPassword = '';

  message = '';
  error = '';
  loading = false;

  private storedEmail = '';

  get codeArray(): string[] {
    return this.code.split('');
  }

  requestReset() {
    this.error = '';
    this.message = '';
    this.loading = true;
    this.http.post<any>('/api/auth/demander-reset', { email: this.email }).subscribe({
      next: (res) => {
        this.message = res.message;
        this.storedEmail = this.email;
        this.step = 2;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.error || 'Une erreur est survenue.';
        this.loading = false;
      },
    });
  }

  verifyCode() {
    this.error = '';
    this.message = '';
    this.loading = true;
    this.http.post<any>('/api/auth/verifier-code', { email: this.storedEmail, code: this.code }).subscribe({
      next: (res) => {
        this.message = res.message;
        this.step = 3;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.error || 'Code invalide.';
        this.loading = false;
      },
    });
  }

  resetPassword() {
    this.error = '';
    this.message = '';
    this.loading = true;
    this.http.post<any>('/api/auth/reinitialiser-mot-de-passe', { email: this.storedEmail, code: this.code, motDePasse: this.newPassword }).subscribe({
      next: (res) => {
        this.message = res.message;
        this.loading = false;
        setTimeout(() => this.router.navigate(['/login']), 2000);
      },
      error: (err) => {
        this.error = err.error?.error || 'Une erreur est survenue.';
        this.loading = false;
      },
    });
  }
}
