# 🧪 Testing Guide: Enhanced Water Reminder Notifications

This document provides a comprehensive testing plan for the enhanced water reminder notification features.

## ✅ Prerequisites

- Device or emulator with notification permissions
- App installed and running
- Access to Settings → Push-Benachrichtigungen

## 🔍 Test Scenarios

### 1. Basic Enable/Disable

**Goal**: Verify basic on/off functionality

**Steps**:

1. Navigate to Settings → Push-Benachrichtigungen → Trink-Erinnerung
2. Toggle "Erinnerung aktivieren" ON
3. Verify permission dialog appears (if first time)
4. Grant permissions
5. Verify UI shows enabled state
6. Save settings
7. Go back and verify summary shows as "Konfiguriert"
8. Return to edit screen and toggle OFF
9. Save and verify summary shows "Nicht aktiviert"

**Expected**: Toggle works smoothly, permissions requested appropriately

---

### 2. Fixed Times - Single Reminder

**Goal**: Test single fixed time reminder (legacy compatibility)

**Steps**:

1. Enable water reminder
2. Select "Feste Zeiten" as reminder type
3. Keep the default single time (09:00)
4. Save settings
5. Check device notification settings to verify notification is scheduled
6. Wait for notification at specified time OR set time to 1 minute in future for quick test

**Expected**: Notification appears at scheduled time with proper text

---

### 3. Fixed Times - Multiple Reminders

**Goal**: Test multiple fixed reminder times

**Steps**:

1. Enable water reminder
2. Select "Feste Zeiten"
3. Add 3 different times: 09:00, 12:00, 18:00
4. Save settings
5. Verify summary shows "3 Erinnerungen pro Tag"
6. Set first time to 1 minute in future for quick test
7. Wait for notification

**Expected**: All times scheduled correctly, notification appears at first scheduled time

---

### 4. Interval-Based Reminders

**Goal**: Test interval reminders (every X hours)

**Steps**:

1. Enable water reminder
2. Select "Intervalle"
3. Choose "Alle 2 Stunden"
4. Verify default time window (07:00 - 22:00)
5. Save settings
6. Verify summary shows "Alle 2 Stunden"
7. Check scheduled notifications count (should be ~8 notifications)

**Expected**: Notifications scheduled at 2-hour intervals within time window

---

### 5. Weekday Selection

**Goal**: Test weekday filtering

**Steps**:

1. Enable water reminder
2. Configure any reminder type
3. Expand "Erweiterte Einstellungen"
4. Select only Monday, Wednesday, Friday
5. Save settings
6. Verify summary includes "• 3 Tage"
7. Test on a selected weekday and non-selected weekday

**Expected**: Reminders only trigger on selected weekdays

---

### 6. Quiet Hours

**Goal**: Test do-not-disturb periods

**Steps**:

1. Enable water reminder
2. Configure interval reminder (every 1 hour, 00:00-23:59)
3. Expand "Erweiterte Einstellungen"
4. Enable "Ruhezeiten" (default 22:00-07:00)
5. Save settings
6. Check scheduled notifications

**Expected**: No notifications scheduled between 22:00 and 07:00

---

### 7. Pause/Resume Functionality

**Goal**: Test pausing without losing configuration

**Steps**:

1. Enable and fully configure water reminder
2. Save settings
3. Return to edit screen
4. Toggle "Pausiert" ON
5. Save and go back
6. Verify summary shows "Pausiert"
7. Check device notification settings - notifications should be cancelled
8. Return to edit and toggle "Pausiert" OFF
9. Save

**Expected**: Notifications cancelled when paused, re-scheduled when resumed, configuration preserved

---

### 8. Dynamic Notification Content

**Goal**: Test progress-based notification text

**Steps**:

1. Configure water reminder for next minute
2. In Health Hub, add some water intake (e.g., 500ml)
3. Wait for notification
4. Check notification body

**Expected**: Notification shows "Noch XXX ml bis zum Tagesziel!"

---

### 9. Daily Goal Suppression

**Goal**: Verify reminders stop when goal reached

**Steps**:

1. Configure multiple reminders throughout the day
2. In Health Hub, log water intake to meet/exceed daily goal (2500ml default)
3. Wait for next scheduled reminder time

**Expected**: No more reminders after goal is reached

---

### 10. Offline Functionality

**Goal**: Test notifications work without internet

**Steps**:

1. Configure water reminder with internet connected
2. Enable airplane mode
3. Wait for scheduled notification time

**Expected**: Notifications still trigger offline (local scheduling)

---

### 11. Cross-Device Sync

**Goal**: Test settings sync between devices

**Steps**:

1. Configure water reminder on Device A
2. Save settings
3. Open app on Device B (same account)
4. Navigate to water reminder settings

**Expected**: Configuration is synced and visible on Device B

---

### 12. Permission Denied Flow

**Goal**: Test graceful handling of denied permissions

**Steps**:

1. Enable water reminder
2. When permission dialog appears, select "Don't Allow"
3. Observe app behavior
4. Verify dialog appears offering to open settings

**Expected**: User-friendly error message, option to manually enable in settings

---

### 13. Configuration Validation

**Goal**: Test input validation

**Steps**:

1. Enable water reminder
2. Select "Feste Zeiten"
3. Remove all times
4. Try to save

**Expected**: Validation error shown, cannot save with invalid config

---

### 14. Notification Tap Action

**Goal**: Test navigation on notification tap

**Steps**:

1. Configure and receive a water reminder notification
2. Tap on the notification

**Expected**: App opens to Health Hub (water tracking section)

---

### 15. Legacy Migration

**Goal**: Test upgrade from old single-time format

**Steps**:

1. If possible, set old format in ApplicationSettings:
   - `water_reminder_enabled`: true
   - `water_reminder_time`: "09:00"
2. Open water reminder settings

**Expected**: Old config automatically migrated to new format

---

## 🐛 Common Issues & Solutions

### Issue: Notifications Not Appearing

**Check**:

- Notification permissions granted in system settings
- App is not in battery optimization/restricted mode
- Correct time zone settings
- Notification IDs not conflicting

### Issue: Reminders Continue After Goal Reached

**Check**:

- Water intake is properly synced in HealthStore
- `waterGoalMl` is set correctly in config
- Goal check logic is working in notification service

### Issue: Config Not Syncing

**Check**:

- Network connectivity
- Backend API is responding
- User is logged in
- API endpoints are correct

---

## 📊 Test Coverage Checklist

- [ ] Enable/Disable
- [ ] Single fixed time
- [ ] Multiple fixed times
- [ ] Interval reminders (1h, 2h, 3h, 4h)
- [ ] Weekday selection (all combinations)
- [ ] Quiet hours
- [ ] Pause/Resume
- [ ] Dynamic notification content
- [ ] Daily goal suppression
- [ ] Offline functionality
- [ ] Cross-device sync
- [ ] Permission flows
- [ ] Configuration validation
- [ ] Notification tap action
- [ ] Legacy migration
- [ ] Add/Edit/Delete times
- [ ] Time picker functionality
- [ ] Settings persistence across app restarts
- [ ] Multiple languages (if applicable)

---

## 🎯 Performance Tests

### Memory Usage

- Configure maximum reminders (e.g., 20+ notifications)
- Monitor app memory usage
- Verify no leaks

### Battery Impact

- Configure frequent reminders
- Monitor battery drain over 24 hours
- Should be negligible

### Scheduling Performance

- Time to schedule 20+ notifications
- Should complete in < 1 second

---

## ✨ User Experience Tests

- UI is intuitive and self-explanatory
- All text is properly localized
- Error messages are clear and helpful
- Advanced settings are not overwhelming
- Summary information is accurate
- Visual feedback is immediate
- Loading states are appropriate
- No UI freezes or stutters

---

## 📝 Regression Tests

After any changes, re-test:

1. Basic enable/disable
2. Single fixed time (most common use case)
3. Permission handling
4. Settings persistence
5. Notification tap action

---

## 🔄 Continuous Testing

Set up these scenarios for ongoing validation:

1. **Daily Test**: Single reminder at fixed time
2. **Weekly Test**: All weekdays selected, verify correct days
3. **Monthly Test**: Full feature set with all options enabled
