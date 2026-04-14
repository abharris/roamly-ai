import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';
import { Colors, Fonts } from '../../theme';

const MINUTES = ['00', '15', '30', '45'];
const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAY_NAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

interface CalendarTimePickerProps {
  label: string;
  onChange: (iso: string | undefined) => void;
  initialDate?: string;
  timezone?: string;
}

export function CalendarTimePicker({ label, onChange, initialDate, timezone }: CalendarTimePickerProps) {
  // "today" in the trip's timezone (for highlighting today's date)
  const today = timezone ? toZonedTime(new Date(), timezone) : new Date();
  // initialDate can be 'YYYY-MM-DD' (trip date) or full ISO UTC string (existing item time)
  const isFullIso = !!initialDate && initialDate.includes('T');
  const initD = (() => {
    if (!initialDate) return today;
    if (isFullIso) {
      // Convert UTC timestamp to the trip's local time for display
      return timezone ? toZonedTime(new Date(initialDate), timezone) : new Date(initialDate);
    }
    return new Date(initialDate + 'T12:00:00');
  })();
  const initSelectedDay = isFullIso
    ? { year: initD.getFullYear(), month: initD.getMonth(), day: initD.getDate() }
    : null;
  const initH = isFullIso ? (initD.getHours() % 12 || 12) : 12;
  const initMin = isFullIso
    ? MINUTES.reduce((c, m) => Math.abs(parseInt(m) - initD.getMinutes()) < Math.abs(parseInt(c) - initD.getMinutes()) ? m : c)
    : '00';
  const initAmpm: 'AM' | 'PM' = isFullIso ? (initD.getHours() >= 12 ? 'PM' : 'AM') : 'AM';

  const [viewYear, setViewYear] = useState(initD.getFullYear());
  const [viewMonth, setViewMonth] = useState(initD.getMonth());
  const [selectedDay, setSelectedDay] = useState<{ year: number; month: number; day: number } | null>(initSelectedDay);
  const [hour, setHour] = useState(String(initH));
  const [minute, setMinute] = useState(initMin);
  const [ampm, setAmpm] = useState<'AM' | 'PM'>(initAmpm);

  const notify = (sd: typeof selectedDay, h: string, m: string, ap: 'AM' | 'PM') => {
    if (!sd) { onChange(undefined); return; }
    let hNum = parseInt(h) || 12;
    if (ap === 'PM' && hNum !== 12) hNum += 12;
    if (ap === 'AM' && hNum === 12) hNum = 0;
    // Build a local-time string and convert to UTC using the trip's timezone if available,
    // otherwise fall back to the device's local timezone.
    const localStr = `${sd.year}-${String(sd.month + 1).padStart(2, '0')}-${String(sd.day).padStart(2, '0')}T${String(hNum).padStart(2, '0')}:${m}:00`;
    const utc = timezone ? fromZonedTime(localStr, timezone) : new Date(sd.year, sd.month, sd.day, hNum, parseInt(m), 0);
    onChange(utc.toISOString());
  };

  const prevMonth = () => viewMonth === 0 ? (setViewMonth(11), setViewYear(y => y - 1)) : setViewMonth(m => m - 1);
  const nextMonth = () => viewMonth === 11 ? (setViewMonth(0), setViewYear(y => y + 1)) : setViewMonth(m => m + 1);

  const firstDow = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells: (number | null)[] = [...Array(firstDow).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  while (cells.length % 7 !== 0) cells.push(null);
  const rows: (number | null)[][] = Array.from({ length: cells.length / 7 }, (_, i) => cells.slice(i * 7, i * 7 + 7));

  const isSel = (d: number) => selectedDay?.year === viewYear && selectedDay?.month === viewMonth && selectedDay?.day === d;
  const isToday = (d: number) => today.getFullYear() === viewYear && today.getMonth() === viewMonth && today.getDate() === d;

  return (
    <View style={styles.calWrap}>
      {!!label && <Text style={styles.fieldLabel}>{label}</Text>}
      <View style={styles.calBox}>
        {/* Header */}
        <View style={styles.calHeader}>
          <TouchableOpacity onPress={prevMonth} style={styles.calNav} accessibilityLabel="Previous month" accessibilityRole="button"><Text style={styles.calNavText}>‹</Text></TouchableOpacity>
          <Text style={styles.calMonthYear}>{MONTH_NAMES[viewMonth]} {viewYear}</Text>
          <TouchableOpacity onPress={nextMonth} style={styles.calNav} accessibilityLabel="Next month" accessibilityRole="button"><Text style={styles.calNavText}>›</Text></TouchableOpacity>
        </View>
        {/* Day headers */}
        <View style={styles.calDayRow}>
          {DAY_NAMES.map(d => <Text key={d} style={styles.calDayName}>{d}</Text>)}
        </View>
        {/* Grid */}
        {rows.map((row, ri) => (
          <View key={ri} style={styles.calDayRow}>
            {row.map((day, ci) => (
              <TouchableOpacity
                key={ci}
                style={[styles.calCell, day && isSel(day) ? styles.calCellSel : day && isToday(day) ? styles.calCellToday : null]}
                onPress={() => { if (!day) return; const sd = { year: viewYear, month: viewMonth, day }; setSelectedDay(sd); notify(sd, hour, minute, ampm); }}
                disabled={!day}
                activeOpacity={day ? 0.7 : 1}
                accessibilityLabel={day ? `${MONTH_NAMES[viewMonth]} ${day}, ${viewYear}` : undefined}
                accessibilityRole={day ? 'button' : undefined}
                accessibilityState={day ? { selected: isSel(day) } : undefined}
              >
                <Text style={[styles.calCellText, day && isSel(day) ? styles.calCellTextSel : day && isToday(day) ? styles.calCellTextToday : !day ? { opacity: 0 } : null]}>
                  {day ?? 0}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
        {/* Time */}
        <View style={styles.calTimeRow}>
          <TextInput
            style={styles.calHourInput}
            value={hour}
            onChangeText={t => { const v = t.replace(/\D/g,'').slice(0,2); setHour(v); notify(selectedDay, v, minute, ampm); }}
            keyboardType="number-pad"
            maxLength={2}
            selectTextOnFocus
          />
          <Text style={styles.calColon}>:</Text>
          {MINUTES.map(m => (
            <TouchableOpacity key={m} style={[styles.calMinChip, minute === m && styles.calMinChipActive]}
              onPress={() => { setMinute(m); notify(selectedDay, hour, m, ampm); }}
              accessibilityLabel={`${m} minutes`}
              accessibilityRole="button"
              accessibilityState={{ selected: minute === m }}>
              <Text style={[styles.calMinText, minute === m && styles.calMinTextActive]}>{m}</Text>
            </TouchableOpacity>
          ))}
          <View style={styles.calAmpmWrap}>
            {(['AM','PM'] as const).map(ap => (
              <TouchableOpacity key={ap} style={[styles.calAmpmBtn, ampm === ap && styles.calAmpmBtnActive]}
                onPress={() => { setAmpm(ap); notify(selectedDay, hour, minute, ap); }}
                accessibilityLabel={ap}
                accessibilityRole="button"
                accessibilityState={{ selected: ampm === ap }}>
                <Text style={[styles.calAmpmText, ampm === ap && styles.calAmpmTextActive]}>{ap}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fieldLabel: { fontSize: 14, fontFamily: Fonts.bodyMedium, color: Colors.textSecondary, marginBottom: 8 },
  calWrap: { marginBottom: 16 },
  calBox: {
    borderWidth: 1, borderColor: Colors.border, borderRadius: 12,
    backgroundColor: Colors.white,
  },
  calHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 10, paddingHorizontal: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
  },
  calNav: { padding: 6 },
  calNavText: { fontSize: 22, color: Colors.textSecondary, lineHeight: 24 },
  calMonthYear: { fontSize: 15, fontFamily: Fonts.displaySemiBold, color: Colors.textPrimary },
  calDayRow: { flexDirection: 'row' },
  calDayName: {
    flex: 1, textAlign: 'center', fontSize: 11, fontFamily: Fonts.bodyMedium,
    color: Colors.textMuted, paddingVertical: 6,
  },
  calCell: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingVertical: 7,
  },
  calCellSel: {
    backgroundColor: Colors.primary, borderRadius: 999, marginHorizontal: 2, marginVertical: 1,
  },
  calCellToday: {
    borderWidth: 1, borderColor: Colors.primary, borderRadius: 999, marginHorizontal: 2, marginVertical: 1,
  },
  calCellText: { fontSize: 13, fontFamily: Fonts.body, color: Colors.textPrimary },
  calCellTextSel: { color: Colors.white, fontFamily: Fonts.bodySemiBold },
  calCellTextToday: { color: Colors.primary, fontFamily: Fonts.bodySemiBold },
  calTimeRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 10,
    borderTopWidth: 1, borderTopColor: Colors.borderLight,
  },
  calHourInput: {
    width: 44, textAlign: 'center', fontSize: 16, fontFamily: Fonts.bodySemiBold,
    color: Colors.textPrimary, borderWidth: 1, borderColor: Colors.border,
    borderRadius: 8, paddingVertical: 6,
  },
  calColon: { fontSize: 18, fontFamily: Fonts.bodySemiBold, color: Colors.textSecondary },
  calMinChip: {
    paddingHorizontal: 8, paddingVertical: 5, borderRadius: 6,
    backgroundColor: Colors.bgAlt, borderWidth: 1, borderColor: Colors.border,
  },
  calMinChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  calMinText: { fontSize: 12, fontFamily: Fonts.bodyMedium, color: Colors.textSecondary },
  calMinTextActive: { color: Colors.white },
  calAmpmWrap: { flexDirection: 'row', marginLeft: 4, gap: 4 },
  calAmpmBtn: {
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6,
    backgroundColor: Colors.bgAlt, borderWidth: 1, borderColor: Colors.border,
  },
  calAmpmBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  calAmpmText: { fontSize: 12, fontFamily: Fonts.bodyMedium, color: Colors.textSecondary },
  calAmpmTextActive: { color: Colors.white },
});
