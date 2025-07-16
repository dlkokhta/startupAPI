import { Resolver, Mutation, Args } from '@nestjs/graphql';
import { AuthService } from './auth.service';
import { SignupRequest } from './dto/signup.dto';
import { UserResponse } from './dto/user-response.dto'; // you'll create this

@Resolver()
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  @Mutation(() => UserResponse)
  async signup(@Args('input') input: SignupRequest) {
    return this.authService.register(input);
  }
}
