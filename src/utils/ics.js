/**
 * Generates an .ics file content for an alarm/event.
 * @param {Date} date - The date and time for the alarm
 * @param {string} title - The title of the event
 * @param {string} description - The description of the event
 * @returns {string} The .ics file content
 */
export function generateICS(date, title, description = '') {
  // Format date to ICS format: YYYYMMDDTHHmmssZ
  // We should use UTC time
  const dtstamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const dtstart = date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  // Event ends 15 minutes after it starts
  const endDate = new Date(date.getTime() + 15 * 60000);
  const dtend = endDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  
  const uuid = crypto.randomUUID();

  // Create ICS content with a VALARM that triggers AT the event time
  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//BabyTracker//VN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uuid}`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART:${dtstart}`,
    `DTEND:${dtend}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${description}`,
    'BEGIN:VALARM',
    'TRIGGER:-PT0M', // 0 minutes before (at the exact time)
    'ACTION:DISPLAY',
    `DESCRIPTION:${title}`,
    'END:VALARM',
    'BEGIN:VALARM',
    'TRIGGER:-PT0M', // Trigger audio alarm
    'ACTION:AUDIO',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  return icsContent;
}

/**
 * Triggers a download of the .ics file.
 */
export function downloadICS(date, title, description = '') {
  const content = generateICS(date, title, description);
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = 'bao-thuc-bu.ics';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
