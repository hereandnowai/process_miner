import { ProcessEvent } from '../types';

export interface ProcessMetrics {
  totalCases: number;
  totalEvents: number;
  averageCaseDurationMs?: number; // in milliseconds
  activityFrequencies: Map<string, number>;
  variants: Map<string, number>; // variant string -> count
  dfg: {
    nodes: { id: string; count: number }[];
    edges: { source: string; target: string; count: number }[];
  };
}

// Helper to parse timestamp safely
const parseTimestamp = (timestamp: string): number => {
  const date = new Date(timestamp);
  return isNaN(date.getTime()) ? 0 : date.getTime();
};

export function calculateProcessMetrics(processData: ProcessEvent[]): ProcessMetrics {
  if (!processData || processData.length === 0) {
    return {
      totalCases: 0,
      totalEvents: 0,
      activityFrequencies: new Map(),
      variants: new Map(),
      dfg: { nodes: [], edges: [] },
    };
  }

  const eventsByCase = new Map<string, ProcessEvent[]>();
  const activityFrequencies = new Map<string, number>();

  for (const event of processData) {
    // Populate eventsByCase
    if (!eventsByCase.has(event.caseId)) {
      eventsByCase.set(event.caseId, []);
    }
    eventsByCase.get(event.caseId)!.push(event);

    // Populate activityFrequencies
    activityFrequencies.set(event.activity, (activityFrequencies.get(event.activity) || 0) + 1);
  }

  let totalCaseDurationMs = 0;
  let validCasesForDuration = 0;
  const variants = new Map<string, number>();
  const dfgEdges = new Map<string, { source: string; target: string; count: number }>();

  for (const caseId of eventsByCase.keys()) {
    const caseEvents = eventsByCase.get(caseId)!;
    // Sort events by timestamp
    caseEvents.sort((a, b) => parseTimestamp(a.timestamp) - parseTimestamp(b.timestamp));

    // Calculate case duration
    if (caseEvents.length > 0) {
      const startTime = parseTimestamp(caseEvents[0].timestamp);
      const endTime = parseTimestamp(caseEvents[caseEvents.length - 1].timestamp);
      if (startTime > 0 && endTime > 0 && endTime >= startTime) {
        totalCaseDurationMs += (endTime - startTime);
        validCasesForDuration++;
      }
    }

    // Extract variants
    const variantString = caseEvents.map(e => e.activity).join(' -> ');
    variants.set(variantString, (variants.get(variantString) || 0) + 1);

    // Build DFG edges
    for (let i = 0; i < caseEvents.length - 1; i++) {
      const sourceActivity = caseEvents[i].activity;
      const targetActivity = caseEvents[i+1].activity;
      const edgeKey = `${sourceActivity}#${targetActivity}`;
      const currentEdge = dfgEdges.get(edgeKey);
      if (currentEdge) {
        currentEdge.count++;
      } else {
        dfgEdges.set(edgeKey, { source: sourceActivity, target: targetActivity, count: 1 });
      }
    }
  }

  const averageCaseDurationMs = validCasesForDuration > 0 ? totalCaseDurationMs / validCasesForDuration : undefined;

  const dfgNodes = Array.from(activityFrequencies.keys()).map(activity => ({
    id: activity,
    count: activityFrequencies.get(activity) || 0,
  }));

  return {
    totalCases: eventsByCase.size,
    totalEvents: processData.length,
    averageCaseDurationMs,
    activityFrequencies,
    variants,
    dfg: {
      nodes: dfgNodes,
      edges: Array.from(dfgEdges.values()),
    },
  };
}

export function formatDuration(milliseconds?: number): string {
  if (milliseconds === undefined || isNaN(milliseconds) || milliseconds < 0) {
    return 'N/A';
  }
  if (milliseconds === 0) return '0 ms';

  const seconds = milliseconds / 1000;
  const minutes = seconds / 60;
  const hours = minutes / 60;
  const days = hours / 24;

  if (days >= 1) return `${days.toFixed(1)} days`;
  if (hours >= 1) return `${hours.toFixed(1)} hours`;
  if (minutes >= 1) return `${minutes.toFixed(1)} minutes`;
  if (seconds >= 1) return `${seconds.toFixed(1)} seconds`;
  return `${milliseconds.toFixed(0)} ms`;
}
