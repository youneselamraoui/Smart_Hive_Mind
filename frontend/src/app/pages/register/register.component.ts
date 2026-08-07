import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { fadeInUp } from '../../core/animations';
import { ICONS } from '../../core/icons';
import { SafeHtmlPipe } from '../../core/safe-html.pipe';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterLink, SafeHtmlPipe],
  templateUrl: './register.html',
  styleUrl: './register.css',
  animations: [fadeInUp],
})
export class RegisterComponent {
  private http = inject(HttpClient);
  private router = inject(Router);

  protected readonly ICONS = ICONS;

  prenom = '';
  nom = '';
  email = '';
  password = '';
  error = '';
  success = '';
  loading = false;

  register() {
    this.error = '';
    this.success = '';
    this.loading = true;
    this.http.post<any>('/api/auth/inscription', {
      prenom: this.prenom,
      nom: this.nom,
      email: this.email,
      motDePasse: this.password,
      role: 'etudiant',
    }).subscribe({
      next: () => {
        this.success = 'Compte créé. Redirection…';
        this.loading = false;
        setTimeout(() => this.router.navigate(['/login']), 1500);
      },
      error: (err) => {
        this.error = err.error?.error || 'Échec de l\'inscription.';
        this.loading = false;
      },
    });
  }
}
