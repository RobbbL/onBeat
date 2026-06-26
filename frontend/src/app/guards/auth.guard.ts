import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { UserService } from '../services/user.service';
import { AuthService } from '../services/auth.service';

export const AuthGuard: CanActivateFn = () => {
  const userService = inject(UserService);
  const authService = inject(AuthService);
  const router = inject(Router);

  const token = authService.getToken(); 
  const currentUser = userService.getCurrentUser();

  if (currentUser || token) {
    return true;
  }

  router.navigate(['/home']);
  return false;
};