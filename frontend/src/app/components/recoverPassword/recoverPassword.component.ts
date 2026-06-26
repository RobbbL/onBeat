import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PopoverController } from '@ionic/angular';
import { AuthService } from '../../services/auth.service';

@Component({
    standalone: true,
    selector: 'app-recover-password',
    templateUrl: './recoverPassword.component.html',
    styleUrls: ['./recoverPassword.component.scss'],

    imports: [IonicModule, CommonModule, FormsModule],
})
export class RecoverPassword {

    constructor(private popoverController: PopoverController,
                private authService: AuthService
    ) {}

    attempts = 0;
    newPassword: string = '';
    confirmPassword: string = '';

    insertCode: string = '';
    insertEmail: string = '';
    code: string = '';
    email: string = '';

    errorMessage: string = '';
    attemptsLeft: number | null = 3;

    recoverToken: string = '';

    step: 'confirm' | 'insertEmail' | 'insertCode' | 'changePass' | 'success' = 'confirm';

    async close() {
            await this.popoverController.dismiss();
        }

    sendEmail() {
        this.authService.sendEmail(this.email).subscribe({
            next: () => {
                this.step = 'insertCode';
                this.errorMessage = '';
            },
            error: (err) => {
            if (err.error?.error === 'Email non trovata')
                this.errorMessage = 'Nessun account è associato a questa email';
            else
                this.errorMessage = 'Errore generico';
            }
        });
    }

    verifyCode() {
        this.authService.verifyCode(this.email, this.code).subscribe({
            next: (res: any) => {
                this.step = 'changePass';
                this.errorMessage = '';
                this.attemptsLeft = 3;
                this.recoverToken = res.recoverToken;
            },
            error: (err) => {

            if (err.status === 429) {
                this.attemptsLeft = 3;
                this.errorMessage = '';
                this.step = 'confirm';
                return;
            }

            if (err.error?.attemptsLeft !== undefined) {
                this.attemptsLeft = err.error.attemptsLeft;
            }

            this.errorMessage = 'Codice errato';
            }
        });
    }

    changePassword() {
    this.errorMessage = '';

    if (this.newPassword !== this.confirmPassword) {
        this.errorMessage = 'Le password non coincidono';
        return;
    }

    if (this.newPassword.length < 8) {
        this.errorMessage = 'La password deve contenere almeno 8 caratteri';
        return;
    }

    const hasNumber = /\d/.test(this.newPassword);
    if (!hasNumber) {
        this.errorMessage = 'La password deve contenere almeno un numero';
        return;
    }

    const hasUppercase = /[A-Z]/.test(this.newPassword);
    if (!hasUppercase) {
        this.errorMessage = 'La password deve contenere almeno una maiuscola';
        return;
    }

    this.authService.changePassword(this.email, this.newPassword, this.recoverToken).subscribe({
        next: () => {
            this.step = 'success';
            this.errorMessage = '';
        },
            error: err => {
                console.log(err);
                this.errorMessage = 'Errore durante il salvataggio della password. Riprova'
            }
        });
    }
}