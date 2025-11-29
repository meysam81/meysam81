/**
 * Cron Expression Utilities
 *
 * Provides validation, parsing, and conversion for cron expressions.
 * Supports standard 5-field cron format: minute hour day-of-month month day-of-week
 */

// Standard cron field constraints
var CRON_FIELDS = {
  minute: { min: 0, max: 59, name: 'minute' },
  hour: { min: 0, max: 23, name: 'hour' },
  dayOfMonth: { min: 1, max: 31, name: 'day of month' },
  month: { min: 1, max: 12, name: 'month' },
  dayOfWeek: { min: 0, max: 6, name: 'day of week' }
};

// Month name mappings
var MONTH_NAMES = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12
};

// Day name mappings
var DAY_NAMES = {
  sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6
};

/**
 * Validate a single cron field value
 */
function validateField(value, field) {
  var constraints = CRON_FIELDS[field];

  // Handle wildcard
  if (value === '*') {
    return { valid: true };
  }

  // Handle step values (*/5, 1-10/2)
  if (value.includes('/')) {
    var parts = value.split('/');
    if (parts.length !== 2) {
      return { valid: false, error: 'Invalid step syntax' };
    }
    var step = parseInt(parts[1], 10);
    if (isNaN(step) || step < 1) {
      return { valid: false, error: 'Step value must be a positive number' };
    }
    // Validate the base part
    if (parts[0] !== '*') {
      return validateField(parts[0], field);
    }
    return { valid: true };
  }

  // Handle ranges (1-5)
  if (value.includes('-')) {
    var rangeParts = value.split('-');
    if (rangeParts.length !== 2) {
      return { valid: false, error: 'Invalid range syntax' };
    }
    var start = parseInt(rangeParts[0], 10);
    var end = parseInt(rangeParts[1], 10);
    if (isNaN(start) || isNaN(end)) {
      return { valid: false, error: 'Range values must be numbers' };
    }
    if (start > end) {
      return { valid: false, error: 'Range start must be less than end' };
    }
    if (start < constraints.min || end > constraints.max) {
      return { valid: false, error: `Values must be between ${constraints.min} and ${constraints.max}` };
    }
    return { valid: true };
  }

  // Handle lists (1,2,3)
  if (value.includes(',')) {
    var listParts = value.split(',');
    for (var i = 0; i < listParts.length; i++) {
      var result = validateField(listParts[i].trim(), field);
      if (!result.valid) {
        return result;
      }
    }
    return { valid: true };
  }

  // Handle single value
  var num = parseInt(value, 10);
  if (isNaN(num)) {
    return { valid: false, error: `Invalid ${constraints.name} value: ${value}` };
  }
  if (num < constraints.min || num > constraints.max) {
    return { valid: false, error: `${constraints.name} must be between ${constraints.min} and ${constraints.max}` };
  }

  return { valid: true };
}

/**
 * Validate a complete cron expression
 */
function validateCronExpression(expression) {
  if (!expression || typeof expression !== 'string') {
    return { valid: false, error: 'Cron expression is required' };
  }

  var trimmed = expression.trim();
  var parts = trimmed.split(/\s+/);

  if (parts.length !== 5) {
    return {
      valid: false,
      error: `Expected 5 fields, got ${parts.length}. Format: minute hour day-of-month month day-of-week`
    };
  }

  var fieldNames = ['minute', 'hour', 'dayOfMonth', 'month', 'dayOfWeek'];

  for (var i = 0; i < 5; i++) {
    var result = validateField(parts[i], fieldNames[i]);
    if (!result.valid) {
      return { valid: false, error: `Field ${i + 1} (${fieldNames[i]}): ${result.error}`, field: i };
    }
  }

  return { valid: true, parts: parts };
}

/**
 * Parse a cron field and return all matching values
 */
function parseFieldValues(value, min, max) {
  var values = [];

  if (value === '*') {
    for (var i = min; i <= max; i++) {
      values.push(i);
    }
    return values;
  }

  // Handle step
  if (value.includes('/')) {
    var stepParts = value.split('/');
    var step = parseInt(stepParts[1], 10);
    var baseValues = stepParts[0] === '*'
      ? parseFieldValues('*', min, max)
      : parseFieldValues(stepParts[0], min, max);

    for (var j = 0; j < baseValues.length; j += step) {
      values.push(baseValues[j]);
    }
    return values;
  }

  // Handle range
  if (value.includes('-')) {
    var rangeParts = value.split('-');
    var start = parseInt(rangeParts[0], 10);
    var end = parseInt(rangeParts[1], 10);
    for (var k = start; k <= end; k++) {
      values.push(k);
    }
    return values;
  }

  // Handle list
  if (value.includes(',')) {
    var listParts = value.split(',');
    for (var l = 0; l < listParts.length; l++) {
      var subValues = parseFieldValues(listParts[l].trim(), min, max);
      values = values.concat(subValues);
    }
    return [...new Set(values)].sort(function(a, b) { return a - b; });
  }

  // Single value
  values.push(parseInt(value, 10));
  return values;
}

/**
 * Calculate the next N run times for a cron expression
 */
function getNextRuns(expression, count) {
  count = count || 10;
  var validation = validateCronExpression(expression);
  if (!validation.valid) {
    return [];
  }

  var parts = validation.parts;
  var minutes = parseFieldValues(parts[0], 0, 59);
  var hours = parseFieldValues(parts[1], 0, 23);
  var daysOfMonth = parseFieldValues(parts[2], 1, 31);
  var months = parseFieldValues(parts[3], 1, 12);
  var daysOfWeek = parseFieldValues(parts[4], 0, 6);

  var runs = [];
  var now = new Date();
  var current = new Date(now);
  current.setSeconds(0);
  current.setMilliseconds(0);

  // Start from next minute
  current.setMinutes(current.getMinutes() + 1);

  var maxIterations = 366 * 24 * 60; // One year of minutes
  var iterations = 0;

  while (runs.length < count && iterations < maxIterations) {
    iterations++;

    var month = current.getMonth() + 1;
    var dayOfMonth = current.getDate();
    var dayOfWeek = current.getDay();
    var hour = current.getHours();
    var minute = current.getMinutes();

    // Check if current time matches the cron expression
    var monthMatch = months.includes(month);
    var dayOfMonthMatch = daysOfMonth.includes(dayOfMonth);
    var dayOfWeekMatch = daysOfWeek.includes(dayOfWeek);
    var hourMatch = hours.includes(hour);
    var minuteMatch = minutes.includes(minute);

    // Day matching: if both day-of-month and day-of-week are specified (not *),
    // the job runs if EITHER matches. If only one is specified, that one must match.
    var dayMatch;
    if (parts[2] === '*' && parts[4] === '*') {
      dayMatch = true;
    } else if (parts[2] === '*') {
      dayMatch = dayOfWeekMatch;
    } else if (parts[4] === '*') {
      dayMatch = dayOfMonthMatch;
    } else {
      dayMatch = dayOfMonthMatch || dayOfWeekMatch;
    }

    if (monthMatch && dayMatch && hourMatch && minuteMatch) {
      runs.push(new Date(current));
    }

    // Advance to next minute
    current.setMinutes(current.getMinutes() + 1);
  }

  return runs;
}

/**
 * Common English patterns and their cron equivalents
 */
var ENGLISH_PATTERNS = [
  // Every X minutes/hours
  { pattern: /^every\s+minute$/i, cron: '* * * * *' },
  { pattern: /^every\s+(\d+)\s+minutes?$/i, handler: function(m) { return '*/' + m[1] + ' * * * *'; } },
  { pattern: /^every\s+hour$/i, cron: '0 * * * *' },
  { pattern: /^every\s+(\d+)\s+hours?$/i, handler: function(m) { return '0 */' + m[1] + ' * * *'; } },

  // Every day at specific time
  { pattern: /^every\s+day\s+at\s+(\d{1,2}):(\d{2})$/i, handler: function(m) { return m[2] + ' ' + m[1] + ' * * *'; } },
  { pattern: /^every\s+day\s+at\s+(\d{1,2})\s*(am|pm)?$/i, handler: function(m) {
    var hour = parseInt(m[1], 10);
    if (m[2] && m[2].toLowerCase() === 'pm' && hour < 12) { hour += 12; }
    if (m[2] && m[2].toLowerCase() === 'am' && hour === 12) { hour = 0; }
    return '0 ' + hour + ' * * *';
  }},
  { pattern: /^daily\s+at\s+(\d{1,2}):(\d{2})$/i, handler: function(m) { return m[2] + ' ' + m[1] + ' * * *'; } },

  // Specific days
  { pattern: /^every\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\s+at\s+(\d{1,2}):(\d{2})$/i, handler: function(m) {
    var days = { monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6, sunday: 0 };
    return m[3] + ' ' + m[2] + ' * * ' + days[m[1].toLowerCase()];
  }},
  { pattern: /^every\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)$/i, handler: function(m) {
    var days = { monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6, sunday: 0 };
    return '0 0 * * ' + days[m[1].toLowerCase()];
  }},

  // Weekdays/Weekends
  { pattern: /^every\s+weekday\s+at\s+(\d{1,2}):(\d{2})$/i, handler: function(m) { return m[2] + ' ' + m[1] + ' * * 1-5'; } },
  { pattern: /^every\s+weekday$/i, cron: '0 9 * * 1-5' },
  { pattern: /^weekdays\s+at\s+(\d{1,2}):(\d{2})$/i, handler: function(m) { return m[2] + ' ' + m[1] + ' * * 1-5'; } },

  // Monthly
  { pattern: /^every\s+month$/i, cron: '0 0 1 * *' },
  { pattern: /^monthly\s+on\s+day\s+(\d{1,2})\s+at\s+(\d{1,2}):(\d{2})$/i, handler: function(m) {
    return m[3] + ' ' + m[2] + ' ' + m[1] + ' * *';
  }},
  { pattern: /^first\s+day\s+of\s+every\s+month$/i, cron: '0 0 1 * *' },

  // Yearly
  { pattern: /^every\s+year$/i, cron: '0 0 1 1 *' },
  { pattern: /^yearly$/i, cron: '0 0 1 1 *' },
  { pattern: /^annually$/i, cron: '0 0 1 1 *' },

  // Midnight/Noon
  { pattern: /^every\s+day\s+at\s+midnight$/i, cron: '0 0 * * *' },
  { pattern: /^every\s+day\s+at\s+noon$/i, cron: '0 12 * * *' },
  { pattern: /^at\s+midnight$/i, cron: '0 0 * * *' },
  { pattern: /^at\s+noon$/i, cron: '0 12 * * *' },

  // Every X at time
  { pattern: /^every\s+(\d+)\s+minutes?\s+from\s+(\d{1,2})\s+to\s+(\d{1,2})$/i, handler: function(m) {
    return '*/' + m[1] + ' ' + m[2] + '-' + m[3] + ' * * *';
  }},
];

/**
 * Try to convert English description to cron expression
 */
function englishToCron(english) {
  if (!english || typeof english !== 'string') {
    return { success: false, error: 'Please enter a schedule description' };
  }

  var trimmed = english.trim().toLowerCase();

  // First check if it's already a valid cron expression
  if (validateCronExpression(trimmed).valid) {
    return { success: true, expression: trimmed, note: 'Input is already a valid cron expression' };
  }

  // Try to match against known patterns
  for (var i = 0; i < ENGLISH_PATTERNS.length; i++) {
    var p = ENGLISH_PATTERNS[i];
    var match = trimmed.match(p.pattern);
    if (match) {
      var expression = p.cron || p.handler(match);
      return { success: true, expression: expression };
    }
  }

  return {
    success: false,
    error: 'Could not parse schedule. Try formats like "every day at 9:00", "every monday at 14:30", or "every 5 minutes"'
  };
}

/**
 * Get common cron expression examples
 */
function getCommonExamples() {
  return [
    { expression: '* * * * *', description: 'Every minute' },
    { expression: '*/5 * * * *', description: 'Every 5 minutes' },
    { expression: '*/15 * * * *', description: 'Every 15 minutes' },
    { expression: '0 * * * *', description: 'Every hour' },
    { expression: '0 */2 * * *', description: 'Every 2 hours' },
    { expression: '0 0 * * *', description: 'Every day at midnight' },
    { expression: '0 9 * * *', description: 'Every day at 9:00 AM' },
    { expression: '0 9 * * 1-5', description: 'Weekdays at 9:00 AM' },
    { expression: '0 9 * * 1', description: 'Every Monday at 9:00 AM' },
    { expression: '0 0 1 * *', description: 'First day of every month at midnight' },
    { expression: '0 0 * * 0', description: 'Every Sunday at midnight' },
    { expression: '30 4 1,15 * *', description: '4:30 AM on 1st and 15th of month' },
  ];
}

/**
 * Convert cron expression to human-readable string
 */
function cronToHuman(expression) {
  var validation = validateCronExpression(expression);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  var parts = validation.parts;
  var minute = parts[0];
  var hour = parts[1];
  var dayOfMonth = parts[2];
  var month = parts[3];
  var dayOfWeek = parts[4];

  var result = [];

  // Handle special cases first
  if (minute === '*' && hour === '*' && dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
    return { success: true, description: 'Every minute' };
  }

  if (minute === '0' && hour === '*' && dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
    return { success: true, description: 'Every hour, at minute 0' };
  }

  if (minute === '0' && hour === '0' && dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
    return { success: true, description: 'Every day at midnight' };
  }

  // Build description for minute
  if (minute === '*') {
    result.push('Every minute');
  } else if (minute.startsWith('*/')) {
    result.push('Every ' + minute.slice(2) + ' minutes');
  } else if (minute.includes(',')) {
    result.push('At minutes ' + minute);
  } else if (minute.includes('-')) {
    result.push('Every minute from ' + minute.replace('-', ' through '));
  } else {
    result.push('At minute ' + minute);
  }

  // Build description for hour
  if (hour === '*') {
    // Already covered by minute description
  } else if (hour.startsWith('*/')) {
    result.push('every ' + hour.slice(2) + ' hours');
  } else if (hour.includes(',')) {
    result.push('at hours ' + hour);
  } else if (hour.includes('-')) {
    result.push('during hours ' + hour.replace('-', ' through '));
  } else {
    var hourNum = parseInt(hour, 10);
    var ampm = hourNum >= 12 ? 'PM' : 'AM';
    var displayHour = hourNum === 0 ? 12 : (hourNum > 12 ? hourNum - 12 : hourNum);
    result.push('at ' + displayHour + ':' + (minute === '*' ? '00' : minute.padStart(2, '0')) + ' ' + ampm);
  }

  // Build description for day of month
  if (dayOfMonth !== '*') {
    if (dayOfMonth.includes(',')) {
      result.push('on days ' + dayOfMonth + ' of the month');
    } else if (dayOfMonth.includes('-')) {
      result.push('on days ' + dayOfMonth.replace('-', ' through ') + ' of the month');
    } else if (dayOfMonth.startsWith('*/')) {
      result.push('every ' + dayOfMonth.slice(2) + ' days');
    } else {
      result.push('on day ' + dayOfMonth + ' of the month');
    }
  }

  // Build description for month
  var monthNames = ['', 'January', 'February', 'March', 'April', 'May', 'June',
                    'July', 'August', 'September', 'October', 'November', 'December'];
  if (month !== '*') {
    if (month.includes(',')) {
      var monthList = month.split(',').map(function(m) {
        var num = parseInt(m, 10);
        return monthNames[num] || m;
      }).join(', ');
      result.push('in ' + monthList);
    } else if (month.includes('-')) {
      var monthRange = month.split('-');
      result.push('from ' + (monthNames[parseInt(monthRange[0], 10)] || monthRange[0]) +
                  ' through ' + (monthNames[parseInt(monthRange[1], 10)] || monthRange[1]));
    } else {
      var monthNum = parseInt(month, 10);
      result.push('in ' + (monthNames[monthNum] || month));
    }
  }

  // Build description for day of week
  var dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  if (dayOfWeek !== '*') {
    if (dayOfWeek === '1-5') {
      result.push('on weekdays');
    } else if (dayOfWeek === '0,6' || dayOfWeek === '6,0') {
      result.push('on weekends');
    } else if (dayOfWeek.includes(',')) {
      var dayList = dayOfWeek.split(',').map(function(d) {
        var num = parseInt(d, 10);
        return dayNames[num] || d;
      }).join(', ');
      result.push('on ' + dayList);
    } else if (dayOfWeek.includes('-')) {
      var dayRange = dayOfWeek.split('-');
      result.push('from ' + (dayNames[parseInt(dayRange[0], 10)] || dayRange[0]) +
                  ' through ' + (dayNames[parseInt(dayRange[1], 10)] || dayRange[1]));
    } else {
      var dayNum = parseInt(dayOfWeek, 10);
      result.push('on ' + (dayNames[dayNum] || dayOfWeek));
    }
  }

  // Clean up the description
  var description = result.join(', ').replace(/^At minute (\d+), at /, 'At ');

  // Special formatting for common patterns
  if (minute !== '*' && hour !== '*' && dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
    var h = parseInt(hour, 10);
    var m = parseInt(minute, 10);
    var ap = h >= 12 ? 'PM' : 'AM';
    var dh = h === 0 ? 12 : (h > 12 ? h - 12 : h);
    description = 'Every day at ' + dh + ':' + String(m).padStart(2, '0') + ' ' + ap;
  }

  return { success: true, description: description };
}

/**
 * Format a date for display
 */
function formatRunDate(date) {
  var options = {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  };
  return date.toLocaleDateString('en-US', options);
}

export {
  validateCronExpression,
  validateField,
  parseFieldValues,
  getNextRuns,
  englishToCron,
  cronToHuman,
  formatRunDate,
  getCommonExamples,
  CRON_FIELDS
};
