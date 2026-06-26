import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonInput, IonButton } from '@ionic/angular/standalone';
import { registrationRequest } from '../models/registrationRequest.model';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-registration',
  templateUrl: './registration.page.html',
  styleUrls: ['./registration.page.scss'],
  standalone: true,
  imports: [IonContent, CommonModule, FormsModule, IonInput, IonButton]
})
export class RegistrationPage {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  user: registrationRequest = {
    username: '',
    email: '',
    profileImage: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    shippingAddress: {
      street: '',
      streetNumber: 0,
      city: '',
      provinceCode: '',
      zipcode: '',
      country: ''
    }
  };

  errorMessage = '';
  confirmPassword = '';

  validateForm(): boolean {
    if (!this.user.firstName.trim() || 
        !this.user.lastName.trim() || 
        !this.user.username.trim() || 
        !this.user.email.trim() || 
        !this.user.phone.trim() ||
        !this.user.password.trim()) {
      this.errorMessage = 'I campi del profilo principale non possono essere vuoti.';
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.user.email.trim())) {
      this.errorMessage = 'Inserisci un indirizzo email valido.';
      return false;
    }

    if (this.user.password !== this.confirmPassword) {
      this.errorMessage = 'Le password non coincidono.';
      return false;
    }

    if (this.user.password.length < 8) {
      this.errorMessage = 'La password deve contenere almeno 8 caratteri.';
      return false;
    }

    const hasNumber = /\d/.test(this.user.password);
    if (!hasNumber) {
      this.errorMessage = 'La password deve contenere almeno un numero.';
      return false;
    }

    const hasUppercase = /[A-Z]/.test(this.user.password);
    if (!hasUppercase) {
      this.errorMessage = 'La password deve contenere almeno una lettera maiuscola.';
      return false;
    }

    if (this.user.shippingAddress) {
      const addr = this.user.shippingAddress;
      if (!addr.street.trim() || 
          !addr.city.trim() || 
          !addr.provinceCode.trim() || 
          !addr.zipcode.trim() || 
          !addr.country.trim() || 
          addr.streetNumber === null || 
          addr.streetNumber === undefined || 
          String(addr.streetNumber).trim() === '') {
        this.errorMessage = 'Tutti i campi dell\'indirizzo di spedizione sono obbligatori.';
        return false;
      }

      if (isNaN(Number(addr.streetNumber)) || Number(addr.streetNumber) <= 0) {
        this.errorMessage = 'Il numero civico deve essere un numero valido maggiore di zero.';
        return false;
      }

      if (addr.zipcode.trim().length !== 5 || isNaN(Number(addr.zipcode))) {
        this.errorMessage = 'Il CAP deve contenere esattamente 5 cifre numeriche.';
        return false;
      }

      if (addr.provinceCode.trim().length !== 2) {
        this.errorMessage = 'La sigla della provincia deve essere composta da esattamente 2 lettere.';
        return false;
      }
    }

    return true;
  }

  onSubmit() {
    this.errorMessage = '';

    if (!this.validateForm()) {
      return;
    }

    this.user.profileImage = '/uploads/default.png';
  
    this.authService.register(this.user).subscribe({
      next: () => {
        this.router.navigate(['/home']);
      },
      error: (err) => {
        console.log(err);

        switch (err.status) {
          case 400:
            this.errorMessage = 'Compila tutti i campi obbligatori o controlla i formati inseriti.';
            break;
            
          case 409:
            this.errorMessage = 'Questo username o questa email sono già in uso.';
            break;
            
          case 500:
            this.errorMessage = 'Errore del server durante la registrazione. Riprova più tardi.';
            break;
            
          default:
            this.errorMessage = 'Impossibile raggiungere il server. Controlla la connessione.';
            break;
        }
      }
    });
  }
}