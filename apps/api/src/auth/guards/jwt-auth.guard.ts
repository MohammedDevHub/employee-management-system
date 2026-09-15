import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// Makes sure there's a valid, non-expired JWT on the request.
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
