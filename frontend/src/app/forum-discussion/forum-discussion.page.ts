import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { IonContent, IonButton, IonIcon, ToastController, AlertController, PopoverController } from '@ionic/angular/standalone';
import { ForumService } from '../services/forum.service';
import { UserService } from '../services/user.service';
import { AuthService } from '../services/auth.service';
import { TitleSpaceComponent } from '../components/shared/title-space/title-space.component';
import { forumPost } from '../models/forumPost.model';
import { UserProfilePopoverComponent } from '../components/user-profile-popover/user-profile-popover.component';

@Component({
  selector: 'app-forum-discussion',
  templateUrl: './forum-discussion.page.html',
  styleUrls: ['./forum-discussion.page.scss'],
  standalone: true,
  imports: [IonContent, CommonModule, FormsModule, RouterModule, TitleSpaceComponent]
})
export class ForumDetailPage implements OnInit {

  category: string = '';
  posts: forumPost[] = [];
  newPostText: string = '';
  searchString: string = '';

  constructor(
    private route: ActivatedRoute,
    private forumService: ForumService,
    private userService: UserService,
    private authService: AuthService,
    private toastController: ToastController,
    private alertController: AlertController,
    private popoverController: PopoverController
  ) { }

  ngOnInit() {
    this.category = this.route.snapshot.paramMap.get('category') || '';
    this.loadPosts();
  }

  loadPosts() {
    this.forumService.getPostsByCategory(this.category).subscribe({
      next: (data) => {
        this.posts = data; 
      },
      error: (err) => console.error("Errore nel recupero dei post: ", err)
    });
  }

  async showLoginToast() {
    const toast = await this.toastController.create({
      message: 'Effettua il login per scrivere nel forum',
      duration: 3000,
      position: 'bottom',
      color: 'dark',
      icon: 'log-in-outline'
    });
    await toast.present();
  }

  get filteredPosts(): any[] {
    if (!this.searchString || !this.searchString.trim()) {
      return this.posts;
    }

    const query = this.searchString.toLowerCase().trim();
    
    return this.posts.filter(post => 
      post.text && post.text.toLowerCase().includes(query)
    );
  }

  submitPost() {
    if (!this.authService.getToken()) {
      this.showLoginToast();
      return;
    }
    if (!this.newPostText.trim()) return;

    this.forumService.createPost(this.category, this.newPostText).subscribe({
      next: () => {
        this.newPostText = ''; 
        this.loadPosts();
      },
      error: (err) => {
        console.error("Errore di pubblicazione:", err);
        alert(`Errore del server (${err.status})`);
      }
    });
  }

  async openProfile(ev: Event, userId: number, usernameFallback: string) {
    const popover = await this.popoverController.create({
      component: UserProfilePopoverComponent,
      event: ev,
      componentProps: {
        userId: userId,
        usernameFallback: usernameFallback
      },
      translucent: true
    });
    await popover.present();
  }

  async confirmDelete(post: forumPost) {
    const alert = await this.alertController.create({
      header: 'Elimina Post',
      message: 'Sei sicuro di voler eliminare questo messaggio? L\'azione è irreversibile.',
      buttons: [
        { text: 'Annulla', role: 'cancel', cssClass: 'secondary' },
        {
          text: 'Elimina',
          role: 'destructive',
          handler: () => { this.deletePost(post.id); }
        }
      ]
    });
    await alert.present();
  }

  deletePost(postId: number) {
    this.forumService.deletePost(postId).subscribe({
      next: () => { this.loadPosts(); },
      error: (err) => { console.error("Errore durante l'eliminazione:", err); }
    });
  }

  getPostAvatar(post: any): string {
    return `${this.forumService.getServerBase()}${post.profileImage}`;
  }

  get isAdmin(): boolean {
    return this.userService.isAdmin();
  }
}