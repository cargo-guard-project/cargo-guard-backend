import { Incident } from '../../entities/incident/incident.entity';
import { IncidentSeverity } from '../../declarations';

export interface NotificationProvider {
  name: string;
  send(notification: NotificationPayload): Promise<void>;
}

export interface NotificationPayload {
  type: 'incident_created' | 'incident_resolved';
  incident: Incident;
  shipmentId: number;
  severity: IncidentSeverity;
  message: string;
  timestamp: Date;
}

class ConsoleNotificationProvider implements NotificationProvider {
  name = 'console';

  async send(notification: NotificationPayload): Promise<void> {
    const severityIcon = this.getSeverityIcon(notification.severity);
    console.log(`\n${severityIcon} [NOTIFICATION] ${notification.type.toUpperCase()}`);
    console.log(`   Shipment: #${notification.shipmentId}`);
    console.log(`   Severity: ${notification.severity}`);
    console.log(`   Message: ${notification.message}`);
    console.log(`   Time: ${notification.timestamp.toISOString()}\n`);
  }

  private getSeverityIcon(severity: IncidentSeverity): string {
    switch (severity) {
      case 'critical': return '🔴';
      case 'high': return '🟠';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return '⚪';
    }
  }
}

class NotificationService {
  private providers: NotificationProvider[] = [];

  constructor() {
    this.registerProvider(new ConsoleNotificationProvider());
  }

  registerProvider(provider: NotificationProvider): void {
    this.providers.push(provider);
  }

  unregisterProvider(name: string): void {
    this.providers = this.providers.filter(p => p.name !== name);
  }

  getProviders(): string[] {
    return this.providers.map(p => p.name);
  }

  async notifyIncidentCreated(incident: Incident, shipmentId: number): Promise<void> {
    const payload: NotificationPayload = {
      type: 'incident_created',
      incident,
      shipmentId,
      severity: incident.severity,
      message: incident.description,
      timestamp: new Date(),
    };

    await this.broadcast(payload);
  }

  async notifyIncidentResolved(incident: Incident, shipmentId: number): Promise<void> {
    const payload: NotificationPayload = {
      type: 'incident_resolved',
      incident,
      shipmentId,
      severity: incident.severity,
      message: `Incident resolved: ${incident.description}`,
      timestamp: new Date(),
    };

    await this.broadcast(payload);
  }

  private async broadcast(payload: NotificationPayload): Promise<void> {
    const results = await Promise.allSettled(
      this.providers.map(provider => provider.send(payload))
    );

    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.error(`Notification provider "${this.providers[index].name}" failed:`, result.reason);
      }
    });
  }
}

export const notificationService = new NotificationService();
