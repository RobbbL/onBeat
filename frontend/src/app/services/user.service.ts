import { Injectable, Injector } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment';
import { User } from '../models/user.model';
import { AuthService } from './auth.service';
 
@Injectable({
  providedIn: 'root',
})
export class UserService {

  constructor(private http: HttpClient,
              private injector: Injector
  ) {}

  private serverBase = `${environment.apiUrl}`;
  private api = `${environment.apiUrl}/users`;

  private currentUserSubject = new BehaviorSubject<User | null>(null);

  currentUser$ = this.currentUserSubject.asObservable();

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  getProfile(): Observable<User> {
    const authService = this.injector.get(AuthService);
    const token = authService.getToken();

    return this.http.get<User>(`${this.api}/me`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }).pipe(
      tap((user: User) => this.setCurrentUser(user))
    );
  }

  isAdmin(): boolean
  {
    return this.getCurrentUser()?.role === 'admin';
  }

  setCurrentUser(user: User | null): void {
    this.currentUserSubject.next(user);
  }

  updateUser(body: any) {
    const authService = this.injector.get(AuthService);
    const token = authService.getToken();

    return this.http.patch(`
      ${this.api}/me`, 
      body,
      {
        headers:{
          Authorization: `Bearer ${token}`
        }
      }
    );
  }

  uploadProfileImage(formData: FormData) {
    const authService = this.injector.get(AuthService);
    const token = authService.getToken();

    return this.http.post(
      `${this.api}/profile-image`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
  }

  removeProfileImage() {
    const authService = this.injector.get(AuthService);
    const token = authService.getToken();

    return this.http.delete(
      `${this.api}/profile-image`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
  }

  deleteCurrentAccount() {
    const authService = this.injector.get(AuthService);
    const token = authService.getToken();

    return this.http.delete(
      `${this.api}/me`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
  }

  getProfileImageUrl(user: User | null): string {
    if (!user?.profileImage) {
      return 'assets/default.png';
    }

    return `${this.serverBase}${user.profileImage}`;
  }
}