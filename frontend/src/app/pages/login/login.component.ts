import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { fadeInUp } from '../../core/animations';
import { ICONS } from '../../core/icons';

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

  protected readonly ICONS = ICONS;

  email = '';
  password = '';
  error = '';
  loading = false;

  login() {
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
