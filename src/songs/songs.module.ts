import { Module } from '@nestjs/common';
import { SongsController } from './songs.controller';
import { SongsService } from './songs.service';
import { CMLogger } from 'src/common/logger';

@Module({
  controllers: [SongsController],
  providers: [SongsService, CMLogger],
})
export class SongsModule {}
