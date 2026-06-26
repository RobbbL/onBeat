import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonButton } from '@ionic/angular/standalone';
import { Router } from '@angular/router';

@Component({
  selector: 'app-not-found',
  templateUrl: './not-found.page.html',
  styleUrls: ['./not-found.page.scss'],
  standalone: true,
  imports: [IonContent, 
    CommonModule, 
    FormsModule,
    IonButton
  ]
})
export class NotFoundPage implements OnInit {

  constructor() { }

  ngOnInit() {
  }

  private router = inject(Router);

  goToHome() {
    this.router.navigate(['/home']);
  }

}
