import { Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { IonFab } from '@ionic/angular/standalone';

@Component({
  selector: 'app-floatingBall',
  standalone: true,

  imports: [
    CommonModule,
    RouterModule,
    IonFab
  ],

  templateUrl: './floatingBall.component.html',
  styleUrls: ['./floatingBall.component.scss']
})
export class FloatingBallComponent {
    @Input() route!: string;
    @Input() image!: string;
    @Input() alt!: string;
    @Input() type!: 'ticket' | 'forum' | 'adminPanel';
}