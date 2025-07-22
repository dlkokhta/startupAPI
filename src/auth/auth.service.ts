import { ConflictException, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UserService } from '../user/user.service';

@Injectable()
export class AuthService {
  constructor(private readonly userService: UserService) {}

  async registerUser(createUserDto: CreateUserDto) {
    const userExist = await this.userService.findByEmail(createUserDto.email);
    if (userExist) throw new ConflictException('User already exists');
    const newUser = await this.userService.create(createUserDto);
    return newUser;
  }
}
