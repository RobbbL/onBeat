import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent } from '@ionic/angular/standalone';
import { ForumService } from '../../services/forum.service';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-user-profile-popover',
  standalone: true,
  imports: [CommonModule, IonContent],
  templateUrl: './user-profile-popover.component.html',
  styleUrls: ['./user-profile-popover.component.scss']
})
export class UserProfilePopoverComponent implements OnInit {
  userId!: number;
  usernameFallback!: string;
  userData: User | null = null;

  constructor(
    private forumService: ForumService
  ) {}

  ngOnInit() {
    this.forumService.getPublicProfile(this.userId).subscribe({
      next: (res) => 
        {
          this.userData = res,
          console.log('Oggetto dentro il popover:', this.userData);
        }
      ,
      error: () => {
        this.userData = {
          id: this.userId,
          username: this.usernameFallback,
          email: '',
          profileImage: '',
          firstName: 'Utente',
          lastName: 'onBeat',
          phone: '',
          role: '',
          shippingAddress: {} as any
        };
      }
    });

    console.log(this.userData?.firstName);
  }

  getAvatarUrl(): string {
    if (this.userData?.profileImage) {
      return `${this.forumService.getServerBase()}${this.userData.profileImage}`;
    }
    return 'assets/default.png';
  }
}