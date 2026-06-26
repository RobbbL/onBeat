import { Injectable, inject, Injector } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment';
import { registrationRequest } from '../models/registrationRequest.model';
import { User } from '../models/user.model' 
import { UserService } from './user.service';
import { PushNotifications } from '@capacitor/push-notifications';

@Injectable({
  providedIn: 'root',
})
export class AuthService {

  constructor(private http: HttpClient,
              private injector: Injector) {}

  private readonly api = `${environment.apiUrl}/auth`;

  register(user: registrationRequest) {
    return this.http.post(`${this.api}/register`, user);
  }

  login(username: string, password: string) {
    return this.http.post<{
      message: string;
      token: string;
      user: User;
    }>(`${this.api}/login`, {
      username,
      password
    });
  }

  async getPushToken(): Promise<string> {
  let permStatus = await PushNotifications.checkPermissions();
  if (permStatus.receive === 'prompt') {
    permStatus = await PushNotifications.requestPermissions();
  }

  if (permStatus.receive !== 'granted') throw new Error('Permessi negati');

  await PushNotifications.register();

  return new Promise((resolve, reject) => {
    const handler = PushNotifications.addListener('registration', (token) => {
      handler.then(h => h.remove());
      resolve(token.value);
    });
  });
}

  async updatePushToken(userId: number, pushToken: string): Promise<any> {
  return this.http.put(`${this.api}/update-push-token`, {
    userId,
    pushToken
  }).toPromise();
}

  saveToken(token: string | null | undefined) {
    if (!token || token === 'null' || token === 'undefined') {
      localStorage.removeItem('token');
    } else {
      localStorage.setItem('token', token);
    }
  }

  getToken(): string | null {
    const token = localStorage.getItem('token');
    if (!token || token === 'null' || token === 'undefined') {
      localStorage.removeItem('token');
      return null;
    }
    return token;
  }

  isLogged(): boolean {
    return this.getToken() !== null;
  }

  logout() {
    localStorage.removeItem('token');

    const userService = this.injector.get(UserService);
    userService.setCurrentUser(null);
  }

  sendEmail(email: string) {
    return this.http.post(`${this.api}/recover-password`, { email });
  }

  verifyCode(email: string, code: string) {
    return this.http.post(`${this.api}/verify-code`, {
      email,
      code
    });
  }

  changePassword(email: string, password: string, recoverToken: string) {
    return this.http.post(`${this.api}/change-password`, {
      email,
      password,
      recoverToken
    });
  }
}