#!/usr/bin/env node

/**
 * Generates a crontab file from calendar.json
 *
 * For each week:
 * - Sunday run: on the "end" date at the configured time (preview mode)
 * - Thursday run: 4 days after the "end" date at the configured time (production mode)
 */

const fs = require('fs');
const path = require('path');

const calendarPath = path.join(__dirname, '..', 'config', 'calendar.json');
const calendar = JSON.parse(fs.readFileSync(calendarPath, 'utf8'));

const projectDir = process.env.PROJECT_DIR || '/opt/top-6';
const logDir = process.env.LOG_DIR || '/var/log/top-6';

function parseTime(timeStr) {
  const [hour, minute] = timeStr.split(':').map(Number);
  return { hour, minute };
}

/**
 * Parse a date string (YYYY-MM-DD) as local date to avoid timezone issues.
 * Using new Date("2026-01-18") parses as UTC, which can give wrong day in local time.
 */
function parseLocalDate(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function addDays(dateStr, days) {
  const date = parseLocalDate(dateStr);
  date.setDate(date.getDate() + days);
  return date;
}

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const sundayTime = parseTime(calendar.runTimes.sunday);
const thursdayTime = parseTime(calendar.runTimes.thursday);

let crontab = `# BEGIN TOP-6 CRONTAB
# Generated ${new Date().toISOString()}
# Season ${calendar.season} - ${calendar.description}
#
# Format: minute hour day month dayOfWeek command
#
# Sunday runs: Preview mode (email only, no Facebook/Firebase)
# Thursday runs: Production mode (full run with Facebook + Firebase)

SHELL=/bin/bash
PATH=/usr/local/bin:/usr/bin:/bin
PROJECT_DIR=${projectDir}
LOG_DIR=${logDir}

`;

const now = new Date();
let sundayRuns = [];
let thursdayRuns = [];

for (const week of calendar.weeks) {
  const endDate = parseLocalDate(week.end);
  const thursdayDate = addDays(week.end, 4);

  // Only include future dates
  if (endDate > now) {
    sundayRuns.push({
      week: week.week,
      date: endDate,
      dateStr: week.end
    });
  }

  if (thursdayDate > now) {
    thursdayRuns.push({
      week: week.week,
      date: thursdayDate,
      dateStr: formatDate(thursdayDate)
    });
  }
}

crontab += `# ============================================\n`;
crontab += `# SUNDAY RUNS (Preview Mode)\n`;
crontab += `# ============================================\n\n`;

for (const run of sundayRuns) {
  const day = run.date.getDate();
  const month = run.date.getMonth() + 1;
  crontab += `# Week ${run.week} - ${run.dateStr}\n`;
  crontab += `${sundayTime.minute} ${sundayTime.hour} ${day} ${month} * cd $PROJECT_DIR && WEEK_NAME=${run.week} ./run.sh sunday >> $LOG_DIR/week${run.week}-sunday.log 2>&1\n\n`;
}

crontab += `# ============================================\n`;
crontab += `# THURSDAY RUNS (Production Mode)\n`;
crontab += `# ============================================\n\n`;

for (const run of thursdayRuns) {
  const day = run.date.getDate();
  const month = run.date.getMonth() + 1;
  crontab += `# Week ${run.week} - ${run.dateStr}\n`;
  crontab += `${thursdayTime.minute} ${thursdayTime.hour} ${day} ${month} * cd $PROJECT_DIR && WEEK_NAME=${run.week} ./run.sh thursday >> $LOG_DIR/week${run.week}-thursday.log 2>&1\n\n`;
}

crontab += `# END TOP-6 CRONTAB\n`;

// Output to file and console
const outputPath = path.join(__dirname, '..', 'crontab.generated');
fs.writeFileSync(outputPath, crontab);

console.log(`Generated crontab with ${sundayRuns.length} Sunday runs and ${thursdayRuns.length} Thursday runs`);
console.log(`Output written to: ${outputPath}`);
console.log('\nUpcoming runs:');
console.log('─'.repeat(50));

const allRuns = [
  ...sundayRuns.map(r => ({ ...r, type: 'Sunday (Preview)' })),
  ...thursdayRuns.map(r => ({ ...r, type: 'Thursday (Production)' }))
].sort((a, b) => a.date - b.date);

for (const run of allRuns.slice(0, 10)) {
  console.log(`  Week ${run.week.toString().padStart(2)} | ${run.dateStr} | ${run.type}`);
}

if (allRuns.length > 10) {
  console.log(`  ... and ${allRuns.length - 10} more runs`);
}
