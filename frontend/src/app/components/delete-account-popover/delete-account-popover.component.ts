import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent, IonButton } from '@ionic/angular/standalone';
import { PopoverController } from '@ionic/angular';

@Component({
  selector: 'app-delete-account-popover',
  templateUrl: './delete-account-popover.component.html',
  styleUrls: ['./delete-account-popover.component.scss'],
  standalone: true,
  imports: [IonContent, IonButton, CommonModule]
})
export class DeleteAccountPopoverComponent {

  constructor(private popoverController: PopoverController) {}

  annulla() {
    this.popoverController.dismiss(false);
  }

  conferma() {
    this.popoverController.dismiss(true);
  }
}