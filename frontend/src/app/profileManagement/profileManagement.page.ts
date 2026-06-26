import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent, IonButton, IonIcon, IonInput } from '@ionic/angular/standalone';
import { UserService } from '../services/user.service';
import { UpdateRequest } from '../models/updateRequest.model';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { User } from '../models/user.model';
import { PopoverController } from '@ionic/angular';
import { DeleteAccountPopoverComponent } from '../components/delete-account-popover/delete-account-popover.component';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';

@Component({
  selector: 'app-profile-management',
  templateUrl: './profileManagement.page.html',
  styleUrls: ['./profileManagement.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonButton,
    IonIcon,
    IonInput,
    FormsModule
  ]
})
export class ProfileManagementPage {

  form!: UpdateRequest;
  originalUser!: User;
  originalUserForm!: UpdateRequest;

  profileImageUrl: string = 'assets/default.png';
  selectedFile: File | null = null;
  previewImage: string | null = null;

  originalProfileImage!: string;
  isDefaultProfileImage = true;

  imgState: 'unchanged' | 'updated' | 'removed' = 'unchanged';
  errorMessage = '';

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private router: Router,
    private popoverController: PopoverController
  ) {}

  ngOnInit() {
    const user = this.userService.getCurrentUser();

    if (!user) return;

    this.isDefaultProfileImage =
      user.profileImage === '/uploads/default.png';

    this.form = structuredClone(user);
    this.originalUser = structuredClone(user);
    this.originalUserForm = structuredClone(user);

    this.originalProfileImage = user.profileImage;
    this.profileImageUrl = this.userService.getProfileImageUrl(user);
  }

  getChangedFields(): Partial<UpdateRequest> {
    const changes: Partial<UpdateRequest> = {};
    const keys = Object.keys(this.form) as (keyof UpdateRequest)[];

    for (const key of keys) {
      if (key === 'shippingAddress') 
        continue;

      if (this.form[key] !== this.originalUserForm[key]) {
        changes[key] = this.form[key];
      }
    }

    const addressKeys = Object.keys(this.form.shippingAddress) as (keyof UpdateRequest['shippingAddress'])[];
    const addressChanges: Partial<typeof this.form.shippingAddress> = {};

    for (const key of addressKeys) {
      if (this.form.shippingAddress[key] !== this.originalUserForm.shippingAddress[key]) {
        (addressChanges as any)[key] = this.form.shippingAddress[key];
      }
    }

    if (Object.keys(addressChanges).length > 0) {
      changes.shippingAddress = addressChanges as any;
    }

    return changes;
  }

  async selectOrCaptureImage() {
    if (Capacitor.isNativePlatform()) {
      try {
        const image = await Camera.getPhoto({
          quality: 90,
          allowEditing: false,
          resultType: CameraResultType.Uri,
          source: CameraSource.Prompt
        });

        if (!image || !image.webPath) 
          return;

        if (!['jpeg', 'jpg', 'png', 'webp'].includes(image.format)) {
          this.errorMessage = 'Formato immagine non supportato.';
          return;
        }

        this.imgState = 'updated';
        this.previewImage = image.webPath;
        this.profileImageUrl = image.webPath;

        const response = await fetch(image.webPath);
        const blob = await response.blob(); 
        const ext = image.format; 
        
        this.selectedFile = new File([blob], `profile_picture.${ext}`, {
          type: `image/${ext}`,
        });

      } catch (error) {
        console.log('Selezione immagine mobile annullata o fallita:', error);
      }
    } 
    else {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';

      input.onchange = async (event: any) => {
        const file = event.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
          this.errorMessage = 'File non supportato, seleziona solo file immagine.';
          return;
        }

        this.imgState = 'updated';
        this.selectedFile = file;

        const objectUrl = URL.createObjectURL(file);
        this.previewImage = objectUrl;
        this.profileImageUrl = objectUrl;
      };

      input.click();
    }
  }

  validateForm(): boolean {
    if (!this.form.firstName.trim() || 
        !this.form.lastName.trim() || 
        !this.form.username.trim() || 
        !this.form.email.trim() || 
        !this.form.phone.trim()) {
      this.errorMessage = 'I campi del profilo principale non possono essere vuoti.';
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.form.email.trim())) {
      this.errorMessage = 'Inserisci un indirizzo email valido.';
      return false;
    }

    if (this.form.shippingAddress) {
      const addr = this.form.shippingAddress;
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

  save() {
    this.errorMessage = '';
    
    if (!this.validateForm()) {
      return;
    }

    const changes = this.getChangedFields();
    const hasDataChanges = Object.keys(changes).length > 0;
    const hasImageChanges = this.imgState !== 'unchanged';

    if (!hasDataChanges && !hasImageChanges) {
      this.errorMessage = 'Nessuna modifica effettuata.';
      return;
    }

    if (hasDataChanges) {
      this.userService.updateUser(changes).subscribe({
        next: () => {
          const current = this.userService.getCurrentUser();
          if (!current) return;

          this.userService.setCurrentUser({
            ...current,
            ...this.form,
            id: current.id
          });

          this.handleImageChanges();
        },
        error: (err) => {
          switch (err.status) {
            case 400: this.errorMessage = err.error?.message || 'I campi non sono validi.'; 
            break;
            case 409: this.errorMessage = err.error?.message || 'Username o email già in uso.'; 
            break;
            case 500: this.errorMessage = 'Errore del server.'; 
            break;
            default: this.errorMessage = 'Impossibile connettersi al server.'; 
            break;
          }
        }
      });
    } else {
      this.handleImageChanges();
    }
  }

  removeProfileImage() {
    this.imgState = 'removed';
    this.selectedFile = null;

    const user = this.userService.getCurrentUser();
    if(!user)
      return;

    user.profileImage = '/uploads/default.png';
    this.userService.setCurrentUser(user);

    this.previewImage = '/uploads/default.png';
    this.profileImageUrl = this.userService.getProfileImageUrl(user);
    this.isDefaultProfileImage = true;
  }

  back(){
    this.userService.setCurrentUser(this.originalUser);
    this.router.navigate(["/profile"])
  }

  private handleImageChanges() {
    if (this.imgState === 'updated' && this.selectedFile) {
      const formData = new FormData();
      formData.append('image', this.selectedFile);

      this.userService.uploadProfileImage(formData)
        .subscribe((res: any) => {
          const current = this.userService.getCurrentUser();
          if (!current) return;

          current.profileImage = res.profileImage;
          this.userService.setCurrentUser(current);

          this.router.navigate(['/profile']);
        });
    }
    else if (this.imgState === 'removed') {
      this.userService.removeProfileImage()
        .subscribe(() => {
          const user = this.userService.getCurrentUser();
          if (!user) return;

          user.profileImage = '/uploads/default.png';
          this.userService.setCurrentUser(user);

          this.router.navigate(['/profile']);
        });
    }
    else {
      this.router.navigate(['/profile']);
    }
  }

  async openDeletePopover(ev: any) {
    const popover = await this.popoverController.create({
      component: DeleteAccountPopoverComponent,
      cssClass: 'popover-center',
      translucent: true,
      animated: true
    });

    await popover.present();

    const { data } = await popover.onDidDismiss();

    if (data === true) {
      this.executeDeleteAccount();
    }
  }

  executeDeleteAccount() {
    this.userService.deleteCurrentAccount().subscribe({
      next: () => {
        this.authService.getToken();
        this.userService.setCurrentUser(null); 

        this.router.navigate(['/home']);
      },
      error: (err) => {
        console.error("Errore durante l'eliminazione dell'account:", err);
        this.errorMessage = "Impossibile eliminare l'account. Riprova più tardi.";
      }
    });
  }
}