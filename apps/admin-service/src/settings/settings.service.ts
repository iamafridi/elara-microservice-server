import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppSetting } from '../../../../libs/database/src/entities/app-setting.entity';
import { CreateSettingDto } from './dto/create-setting.dto';
import { UpdateSettingDto } from './dto/update-setting.dto';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(AppSetting)
    private settingRepository: Repository<AppSetting>,
  ) {}

  async create(createDto: CreateSettingDto) {
    // Check if key already exists
    const existingSetting = await this.settingRepository.findOne({
      where: { key: createDto.key },
    });

    if (existingSetting) {
      throw new ConflictException(`Setting with key '${createDto.key}' already exists`);
    }

    const setting = this.settingRepository.create({
      key: createDto.key,
      value: createDto.value,
      description: createDto.description,
    });

    await this.settingRepository.save(setting);

    return setting;
  }

  async findAll() {
    const settings = await this.settingRepository.find({
      order: { key: 'ASC' },
    });

    return settings;
  }

  async findByKey(key: string) {
    const setting = await this.settingRepository.findOne({ where: { key } });

    if (!setting) {
      throw new NotFoundException(`Setting with key '${key}' not found`);
    }

    return setting;
  }

  async update(key: string, updateDto: UpdateSettingDto) {
    const setting = await this.settingRepository.findOne({ where: { key } });

    if (!setting) {
      throw new NotFoundException(`Setting with key '${key}' not found`);
    }

    setting.value = updateDto.value;
    if (updateDto.description !== undefined) {
      setting.description = updateDto.description;
    }

    await this.settingRepository.save(setting);

    return setting;
  }

  async delete(key: string) {
    const setting = await this.settingRepository.findOne({ where: { key } });

    if (!setting) {
      throw new NotFoundException(`Setting with key '${key}' not found`);
    }

    await this.settingRepository.remove(setting);

    return { message: 'Setting deleted successfully' };
  }

  // Bulk update settings
  async bulkUpdate(settings: { key: string; value: string }[]) {
    const results = [];

    for (const item of settings) {
      const setting = await this.settingRepository.findOne({
        where: { key: item.key },
      });

      if (setting) {
        setting.value = item.value;
        await this.settingRepository.save(setting);
        results.push(setting);
      }
    }

    return results;
  }

  // Get settings by key prefix
  async findByPrefix(prefix: string) {
    const settings = await this.settingRepository
      .createQueryBuilder('setting')
      .where('setting.key LIKE :prefix', { prefix: `${prefix}%` })
      .orderBy('setting.key', 'ASC')
      .getMany();

    return settings;
  }
}
