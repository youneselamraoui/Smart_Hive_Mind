import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { fadeInUp } from '../../core/animations';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
  animations: [fadeInUp],
})
export class LoginComponent {
  private http = inject(HttpClient);
  private router = inject(Router);

  email = '';
  password = '';
  error = '';
  loading = false;
  submitted = false;

  get emailInvalid(): boolean {
    if (!this.submitted) return false;
    return !this.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email);
  }

  get passwordInvalid(): boolean {
    if (!this.submitted) return false;
    return !this.password || this.password.length < 6;
  }

  login() {
    this.submitted = true;
    if (this.emailInvalid || this.passwordInvalid) return;
    this.error = '';
    this.loading = true;
    this.http.post<any>('/api/auth/connexion', { email: this.email, motDePasse: this.password })
      .subscribe({
        next: (res) => {
          localStorage.setItem('membreId', res.id || '');
          this.router.navigate(['/app/dashboard']);
        },
        error: (err) => {
          this.error = err.error?.error || 'Échec de connexion.';
          this.loading = false;
        },
      });
  }
}
