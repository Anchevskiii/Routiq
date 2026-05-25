import React from 'react'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import { format } from 'date-fns'

import { Itinerary } from '@/types/itinerary.types'
import { getTravelTypeByValue } from '@/constants/travelTypes'

const styles = StyleSheet.create({
  page: {
    padding: 32,
    fontSize: 11,
    fontFamily: 'Helvetica',
    color: '#0f172a',
    lineHeight: 1.4,
    backgroundColor: '#f8fafc',
  },
  header: {
    marginBottom: 18,
  },
  headerCard: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 20,
  },
  kicker: {
    fontSize: 9,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    color: '#cbd5f5',
    marginBottom: 6,
  },
  title: {
    fontSize: 26,
    fontWeight: 700,
    color: '#f8fafc',
  },
  subtitle: {
    fontSize: 10,
    color: '#e2e8f0',
    marginTop: 6,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
  },
  chip: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: '#1e293b',
    borderRadius: 999,
    marginRight: 8,
    marginBottom: 6,
  },
  chipText: {
    fontSize: 9,
    color: '#e2e8f0',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  summaryRow: {
    flexDirection: 'row',
    marginTop: 12,
  },
  summaryItem: {
    marginRight: 24,
  },
  summaryLabel: {
    fontSize: 9,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: '#94a3b8',
  },
  summaryValue: {
    fontSize: 11,
    marginTop: 2,
    color: '#f8fafc',
  },
  section: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: '#64748b',
    marginBottom: 8,
  },
  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  tip: {
    fontSize: 10,
    marginBottom: 3,
    color: '#334155',
  },
  dayCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  dayBadge: {
    backgroundColor: '#0f172a',
    borderRadius: 999,
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  dayBadgeText: {
    fontSize: 9,
    color: '#f8fafc',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  dayTitle: {
    fontSize: 12,
    fontWeight: 700,
  },
  dayDate: {
    fontSize: 10,
    color: '#64748b',
  },
  dayTheme: {
    fontSize: 10,
    color: '#334155',
    marginBottom: 6,
  },
  activity: {
    marginBottom: 8,
    flexDirection: 'row',
  },
  activityTime: {
    width: 52,
    fontSize: 9,
    color: '#64748b',
  },
  activityBody: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 11,
    fontWeight: 600,
  },
  activityMeta: {
    fontSize: 9,
    color: '#64748b',
    marginTop: 1,
  },
})

const formatDateRange = (startDate: string, endDate: string) => {
  const start = format(new Date(startDate), 'MMM d')
  const end = format(new Date(endDate), 'MMM d, yyyy')
  return `${start} - ${end}`
}

export const ItineraryPdfDocument: React.FC<{ itinerary: Itinerary }> = ({ itinerary }) => {
  const travelType = getTravelTypeByValue(itinerary.travelType)
  const dateRange = formatDateRange(itinerary.startDate, itinerary.endDate)

  return (
    <Document title={`Routiq Itinerary - ${itinerary.destination}`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.headerCard}>
            <Text style={styles.kicker}>Routiq Itinerary</Text>
            <Text style={styles.title}>{itinerary.destination}</Text>
            <Text style={styles.subtitle}>
              {dateRange} - {itinerary.totalDays} days
            </Text>
            <View style={styles.chipRow}>
              <View style={styles.chip}>
                <Text style={styles.chipText}>
                  {travelType?.label ?? itinerary.travelType}
                </Text>
              </View>
              <View style={styles.chip}>
                <Text style={styles.chipText}>Personal plan</Text>
              </View>
            </View>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Best season</Text>
                <Text style={styles.summaryValue}>
                  {itinerary.bestSeason ?? 'Spring / Autumn'}
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Budget logic</Text>
                <Text style={styles.summaryValue}>
                  {itinerary.estimatedBudget ?? 'Moderate expenditure'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {itinerary.generalTips?.length ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Expert guidelines</Text>
            <View style={styles.sectionCard}>
              {itinerary.generalTips.map((tip) => (
                <Text key={tip.id} style={styles.tip}>
                  - {tip.content}
                </Text>
              ))}
            </View>
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Daily route</Text>
          {itinerary.days.map((day) => (
            <View key={day.id} style={styles.dayCard}>
              <View style={styles.dayHeader}>
                <View style={styles.dayBadge}>
                  <Text style={styles.dayBadgeText}>Day {day.dayNumber}</Text>
                </View>
                <Text style={styles.dayDate}>
                  {format(new Date(day.date), 'EEE, MMM d')}
                </Text>
              </View>
              {day.theme ? (
                <Text style={styles.dayTheme}>{day.theme}</Text>
              ) : null}
              {day.activities.length ? (
                <View>
                  {day.activities.map((activity, index) => {
                    const activityKey = activity.id || `${day.id}-${index}`
                    const timeLabel = activity.startTime ?? 'Anytime'

                    return (
                      <View key={activityKey} style={styles.activity}>
                        <Text style={styles.activityTime}>{timeLabel}</Text>
                        <View style={styles.activityBody}>
                          <Text style={styles.activityTitle}>{activity.title}</Text>
                          {activity.location ? (
                            <Text style={styles.activityMeta}>{activity.location}</Text>
                          ) : null}
                          {activity.description ? (
                            <Text style={styles.activityMeta}>{activity.description}</Text>
                          ) : null}
                        </View>
                      </View>
                    )
                  })}
                </View>
              ) : (
                <Text style={styles.activityMeta}>No activities planned.</Text>
              )}
            </View>
          ))}
        </View>
      </Page>
    </Document>
  )
}
