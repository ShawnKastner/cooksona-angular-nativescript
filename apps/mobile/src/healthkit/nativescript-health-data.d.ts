declare module 'nativescript-health-data' {
  export interface HealthDataAuthorizationType {
    type: string;
  }

  export interface HealthDataSumOptions {
    dataType: string;
    startDate: Date;
    endDate: Date;
    unit?: string;
  }

  export interface HealthDataMonitorOptions {
    dataType: string;
    enableBackgroundUpdates?: boolean;
  }

  export interface HealthDataUpdate {
    startDate: Date;
    endDate: Date;
    value: number;
  }

  export class HealthData {
    isAvailable(): Promise<boolean>;
    requestAuthorization(types: HealthDataAuthorizationType[]): Promise<void>;
    sum(options: HealthDataSumOptions): Promise<number>;
    startMonitoring(
      options: HealthDataMonitorOptions,
      onUpdate: (update: HealthDataUpdate) => void,
      onError: (error: unknown) => void,
    ): Promise<void>;
  }

  export const HealthDataType: Record<string, string>;
  export const HealthDataUnit: Record<string, string>;
}
