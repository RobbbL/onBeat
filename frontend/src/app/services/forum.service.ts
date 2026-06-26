import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { forumPost } from '../models/forumPost.model';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class ForumService {
  private readonly serverBase = `${environment.apiUrl}`;
  private readonly api = `${environment.apiUrl}/forum`;
  private readonly userApi = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient, private authService: AuthService) { }

  getPostsByCategory(category: string): Observable<forumPost[]> {
    return this.http.get<forumPost[]>(`${this.api}/${category}`);
  }

  createPost(category: string, text: string): Observable<forumPost> {
    const token = this.authService.getToken(); 
    return this.http.post<forumPost>(
      this.api, 
      { category, text },
      { headers: { Authorization: `Bearer ${token}`} }
    );
  }

  deletePost(id: number): Observable<any> {
    const token = this.authService.getToken(); 
    return this.http.delete<any>(
      `${this.api}/${id}`, 
      { headers: { Authorization: `Bearer ${token}` } }
    );
  }

  getPublicProfile(userId: number): Observable<User> {
    return this.http.get<any>(`${this.userApi}/${userId}`).pipe(
      map(res => ({
        id: res.id,
        username: res.username,
        email: '',
        profileImage: res.profileImage,
        firstName: res.firstName || '',
        lastName: res.lastName || '',
        phone: '',
        role: '',
        shippingAddress: {} as any
      }))
    );
  }

  getServerBase(): string
  {
    return this.serverBase;
  }
}