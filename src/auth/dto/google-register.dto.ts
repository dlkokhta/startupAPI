export class GoogleRegisterDto {
  email: string;
  firstName?: string;
  lastName?: string;
  provider?: string; // 'google'
  googleId?: string;
  avatar?: string;
}
