import { Injectable, NgZone } from '@angular/core';

export interface DateRange {
  start: Date;
  end: Date;
}

interface HealthDataAuthorizationType {
  type: HealthDataTypeIdentifier;
}

interface HealthDataSumOptions {
  dataType: HealthDataTypeIdentifier;
  unit?: HealthDataUnitIdentifier;
  startDate: Date;
  endDate: Date;
}

interface HealthDataMonitorOptions {
  dataType: HealthDataTypeIdentifier;
  enableBackgroundUpdates?: boolean;
}

interface HealthDataUpdate {
  startDate: Date;
  endDate: Date;
  value: number;
}

interface NativeHealthData {
  isAvailable(): Promise<boolean>;
  requestAuthorization(types: HealthDataAuthorizationType[]): Promise<void>;
  sum(options: HealthDataSumOptions): Promise<number>;
  startMonitoring(
    options: HealthDataMonitorOptions,
    onUpdate: (update: HealthDataUpdate) => void,
    onError: (error: unknown) => void,
  ): Promise<void>;
}

interface HealthDataModule {
  HealthData: new () => NativeHealthData;
  HealthDataType: Record<HealthDataTypeLiteral, HealthDataTypeIdentifier>;
  HealthDataUnit: Record<HealthDataUnitLiteral, HealthDataUnitIdentifier>;
}

type HealthDataTypeLiteral =
  | 'STEPS'
  | 'DISTANCE'
  | 'ACTIVE_ENERGY_BURNED'
  | 'HEART_RATE';

type HealthDataTypeIdentifier =
  | 'steps'
  | 'distance'
  | 'activeEnergyBurned'
  | 'heartRate';

type HealthDataUnitLiteral = 'COUNT' | 'KILOMETER' | 'KILOCALORIE';

type HealthDataUnitIdentifier = 'count' | 'km' | 'kcal';

export interface TodayMetrics {
  steps: number;
  distanceKm: number;
  activeKcal: number;
}

export type StepMonitoringHandler = () => void;

@Injectable()
export class HealthDataPluginDataSource {
  private readonly module =
    require('nativescript-health-data') as HealthDataModule;
  private readonly healthData: NativeHealthData;
  private readonly types: Record<HealthDataTypeLiteral, HealthDataTypeIdentifier>;
  private readonly units: Record<HealthDataUnitLiteral, HealthDataUnitIdentifier>;

  private monitoring = false;

  constructor(private readonly zone: NgZone) {
    this.healthData = new this.module.HealthData();
    this.types = {
      STEPS: this.module.HealthDataType?.STEPS ?? 'steps',
      DISTANCE: this.module.HealthDataType?.DISTANCE ?? 'distance',
      ACTIVE_ENERGY_BURNED:
        this.module.HealthDataType?.ACTIVE_ENERGY_BURNED ?? 'activeEnergyBurned',
      HEART_RATE: this.module.HealthDataType?.HEART_RATE ?? 'heartRate',
    };
    this.units = {
      COUNT: this.module.HealthDataUnit?.COUNT ?? 'count',
      KILOMETER: this.module.HealthDataUnit?.KILOMETER ?? 'km',
      KILOCALORIE: this.module.HealthDataUnit?.KILOCALORIE ?? 'kcal',
    };
  }

  isAvailable(): Promise<boolean> {
    return this.healthData.isAvailable();
  }

  async requestAuthorization(): Promise<void> {
    const types: HealthDataAuthorizationType[] = [
      { type: this.types.STEPS },
      { type: this.types.DISTANCE },
      { type: this.types.ACTIVE_ENERGY_BURNED },
      { type: this.types.HEART_RATE },
    ];

    await this.healthData.requestAuthorization(types);
  }

  async readTodayMetrics(range: DateRange): Promise<TodayMetrics> {
    const [steps, distance, active] = await Promise.all([
      this.healthData.sum({
        dataType: this.types.STEPS,
        startDate: range.start,
        endDate: range.end,
      }),
      this.healthData.sum({
        dataType: this.types.DISTANCE,
        unit: this.units.KILOMETER,
        startDate: range.start,
        endDate: range.end,
      }),
      this.healthData.sum({
        dataType: this.types.ACTIVE_ENERGY_BURNED,
        unit: this.units.KILOCALORIE,
        startDate: range.start,
        endDate: range.end,
      }),
    ]);

    return {
      steps: Math.max(0, Math.round(steps)),
      distanceKm: Math.max(0, Number(distance)),
      activeKcal: Math.max(0, Math.round(active)),
    };
  }

  async startStepMonitoring(onUpdate: StepMonitoringHandler, onError: (message: string) => void): Promise<void> {
    if (this.monitoring) {
      return;
    }

    await this.healthData.startMonitoring(
      {
        dataType: this.types.STEPS,
        enableBackgroundUpdates: true,
      },
      () => {
        this.zone.run(() => onUpdate());
      },
      (error) => {
        console.error('HealthData monitoring error', error);
        const message =
          error instanceof Error
            ? error.message
            : 'Aktualisierung der Schritte fehlgeschlagen';
        this.zone.run(() => onError(message));
      },
    );

    this.monitoring = true;
  }
}
