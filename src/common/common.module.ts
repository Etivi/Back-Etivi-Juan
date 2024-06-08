import { Module } from '@nestjs/common';
import { CommonService } from './common.service';
import { GraphqlModule } from './graphql/graphql.module';

@Module({
  providers: [CommonService],
  imports: [GraphqlModule]
})
export class CommonModule {}
