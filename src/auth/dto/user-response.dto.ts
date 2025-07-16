import { ObjectType, Field, ID } from '@nestjs/graphql';
import { Exclude, Expose } from 'class-transformer';

@ObjectType()
export class UserResponse {
  @Field(() => ID)
  @Expose()
  id: string;

  @Field(() => String)
  @Expose()
  firstname: string;

  @Field(() => String)
  @Expose()
  lastname: string;

  @Field(() => String)
  @Expose()
  email: string;

  @Field(() => String, { nullable: true })
  @Expose()
  avatar?: string;

  @Field(() => String, { nullable: true })
  @Expose()
  phone?: string;

  @Field(() => Date)
  @Expose()
  createdAt: Date;

  @Field(() => Date)
  @Expose()
  updatedAt: Date;

  @Field(() => Boolean, { defaultValue: true })
  @Expose()
  isActive: boolean;

  @Field(() => Boolean, { defaultValue: false })
  @Expose()
  isEmailVerified: boolean;

  // Exclude sensitive fields from response
  @Exclude()
  password: string;

  @Exclude()
  passwordResetToken?: string;

  @Exclude()
  passwordResetExpires?: Date;

  @Exclude()
  emailVerificationToken?: string;

  @Exclude()
  refreshToken?: string;

  constructor(partial: Partial<UserResponse>) {
    Object.assign(this, partial);
  }
}
