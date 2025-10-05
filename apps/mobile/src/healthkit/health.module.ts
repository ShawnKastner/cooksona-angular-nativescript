import { NgModule } from '@angular/core';
import { HealthDataPluginDataSource } from './health-data.plugin.datasource';
import { HealthKitIosDataSource } from './healthkit.ios.datasource';
import { HealthFacade } from './health.facade';
import { HealthStore } from './health.store';

@NgModule({
  providers: [
    HealthDataPluginDataSource,
    HealthKitIosDataSource,
    HealthStore,
    HealthFacade,
  ],
})
export class HealthModule {}
