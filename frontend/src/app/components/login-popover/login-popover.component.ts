import { Router } from '@angular/router'
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonContent, 
  IonButton,  
  IonInput, 
  IonList
} from '@ionic/angular/standalone';
import { PopoverController } from '@ionic/angular';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';
import { RecoverPassword } from '../recoverPassword/recoverPassword.component';

@Component({
  selector: 'app-login-popover',
  templateUrl: './login-popover.component.html',
  styleUrls: ['./login-popover.component.scss'],
  standalone: true,
  imports: [
    IonContent, 
    IonButton, 
    IonInput, 
    IonList,
    CommonModule, 
    FormsModule
  ]
})
export class LoginPopoverComponent implements OnInit {

  errorMessage: string = '';

  username: string = '';
  password: string = '';

  loading: boolean = false;
  showPassword: boolean = false;
  userProfileImage: any;

  constructor(
    private router: Router,
    private popoverController: PopoverController,
    private authService: AuthService,
    private userService: UserService
  ) {}

  ngOnInit() {}

  async login() {
    if (!this.username || !this.password) {
      this.errorMessage = 'Inserisci le credenziali';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.authService.login(this.username, this.password).subscribe({
      next: (res: any) => {
        this.loading = false;
        this.authService.saveToken(res.token);
        
        this.userService.getProfile().subscribe({
          next: async (fullUser) => {
            
            this.authService.getPushToken()
              .then(token => this.authService.updatePushToken(fullUser.id, token))
              .then(() => console.log('Token aggiornato con successo in background'))
              .catch(err => console.error('Firebase o rete lenti, saltato:', err));

            await this.popoverController.dismiss();
            this.router.navigate(['/home']);
            console.log('USER:', fullUser);
          },
          error: (err) => {
            console.error('Errore nel recupero del profilo:', err);
            this.errorMessage = 'Errore durante il caricamento del profilo';
          }
        });
      },
      error: (err) => {
        this.loading = false;
        console.log('Errore Login:', err);
        
        if (err.status === 429) {
          this.errorMessage = err.error?.message || 'Troppi tentativi. Accesso temporaneamente bloccato.';
        } else {
          this.errorMessage = 'Credenziali errate o problema di connessione sul server';
        }
      }
    });
  }

  async recoverPassword() {
    await this.popoverController.dismiss().then(()=>{
      this.openRecoverPopover();
    });
  }

  async openRecoverPopover()
  {
    const popover = await this.popoverController.create({
      component: RecoverPassword,
      translucent: true,
    })

    await popover.present();
  }

  async goToRegistration() {
    await this.popoverController.dismiss();
    this.router.navigate(['/registration']);
  }
}