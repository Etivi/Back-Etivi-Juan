import { Module } from '@nestjs/common';
import { GoogleGroupsController } from './google-groups.controller';
import { GoogleGroupsService } from './google-groups.service';
import { SharedModule } from '../shared/shared.module';

@Module({
  providers: [GoogleGroupsService],
  controllers: [GoogleGroupsController],
  imports: [SharedModule],
})
  
export class GoogleGroupsModule {}
