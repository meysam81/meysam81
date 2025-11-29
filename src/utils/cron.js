/**
 * Comprehensive Cron Expression Utility
 * Handles bidirectional conversion between natural language and cron expressions
 */

// Day name mappings
var DAYS = {
  sunday: 0, sun: 0,
  monday: 1, mon: 1,
  tuesday: 2, tue: 2, tues: 2,
  wednesday: 3, wed: 3,
  thursday: 4, thu: 4, thur: 4, thurs: 4,
  friday: 5, fri: 5,
  saturday: 6, sat: 6
};

// Month name mappings
var MONTHS = {
  january: 1, jan: 1,
  february: 2, feb: 2,
  march: 3, mar: 3,
  april: 4, apr: 4,
  may: 5,
  june: 6, jun: 6,
  july: 7, jul: 7,
  august: 8, aug: 8,
  september: 9, sep: 9, sept: 9,
  october: 10, oct: 10,
  november: 11, nov: 11,
  december: 12, dec: 12
};

// Ordinal mappings
var ORDINALS = {
  first: 1, '1st': 1,
  second: 2, '2nd': 2,
  third: 3, '3rd': 3,
  fourth: 4, '4th': 4,
  fifth: 5, '5th': 5,
  last: 'L'
};

/**
 * Parse time string to hour and minute
 * Supports: 9am, 9:30am, 9:30 am, 21:30, 9 am, noon, midnight
 */
function parseTime(timeStr) {
  if (!timeStr) {
    return null;
  }

  var str = timeStr.toLowerCase().trim();

  // Handle special times
  if (str === 'midnight') {
    return { hour: 0, minute: 0 };
  }
  if (str === 'noon' || str === 'midday') {
    return { hour: 12, minute: 0 };
  }

  // Pattern: 9am, 9pm, 9 am, 9 pm
  var simpleMatch = str.match(/^(\d{1,2})\s*(am|pm)$/i);
  if (simpleMatch) {
    var hour = parseInt(simpleMatch[1], 10);
    var isPM = simpleMatch[2].toLowerCase() === 'pm';
    if (isPM && hour !== 12) {
      hour += 12;
    }
    if (!isPM && hour === 12) {
      hour = 0;
    }
    return { hour: hour, minute: 0 };
  }

  // Pattern: 9:30am, 9:30 am, 9:30pm, 9:30 pm
  var colonMatch = str.match(/^(\d{1,2}):(\d{2})\s*(am|pm)?$/i);
  if (colonMatch) {
    var parsedHour = parseInt(colonMatch[1], 10);
    var minute = parseInt(colonMatch[2], 10);
    var period = colonMatch[3];

    if (period) {
      var isPMPeriod = period.toLowerCase() === 'pm';
      if (isPMPeriod && parsedHour !== 12) {
        parsedHour += 12;
      }
      if (!isPMPeriod && parsedHour === 12) {
        parsedHour = 0;
      }
    }

    return { hour: parsedHour, minute: minute };
  }

  // Pattern: just a number (assume hour in 24h format)
  var hourOnly = str.match(/^(\d{1,2})$/);
  if (hourOnly) {
    return { hour: parseInt(hourOnly[1], 10), minute: 0 };
  }

  return null;
}

/**
 * Extract day of week from text
 */
function parseDayOfWeek(text) {
  var lower = text.toLowerCase();

  // Check for weekday/weekend patterns first
  if (lower.includes('weekday') || lower.includes('business day') || lower.match(/monday\s*(through|to|-)\s*friday/)) {
    return '1-5';
  }
  if (lower.includes('weekend')) {
    return '0,6';
  }

  // Check for multiple days
  var foundDays = [];
  Object.keys(DAYS).forEach(function(dayName) {
    var regex = new RegExp('\\b' + dayName + '\\b', 'i');
    if (regex.test(lower) && foundDays.indexOf(DAYS[dayName]) === -1) {
      foundDays.push(DAYS[dayName]);
    }
  });

  if (foundDays.length > 0) {
    foundDays.sort(function(a, b) { return a - b; });
    return foundDays.join(',');
  }

  return null;
}

/**
 * Extract month from text
 */
function parseMonth(text) {
  var lower = text.toLowerCase();

  var foundMonths = [];
  Object.keys(MONTHS).forEach(function(monthName) {
    var regex = new RegExp('\\b' + monthName + '\\b', 'i');
    if (regex.test(lower) && foundMonths.indexOf(MONTHS[monthName]) === -1) {
      foundMonths.push(MONTHS[monthName]);
    }
  });

  if (foundMonths.length > 0) {
    foundMonths.sort(function(a, b) { return a - b; });
    return foundMonths.join(',');
  }

  return null;
}

/**
 * Extract day of month from text
 */
function parseDayOfMonth(text) {
  var lower = text.toLowerCase();

  // Last day of month
  if (lower.includes('last day')) {
    return 'L';
  }

  // Specific day numbers: 1st, 2nd, 3rd, 15th, 25th, etc.
  var dayMatches = lower.match(/(\d{1,2})(st|nd|rd|th)/g);
  if (dayMatches) {
    var days = dayMatches.map(function(d) {
      return parseInt(d, 10);
    }).filter(function(d) {
      return d >= 1 && d <= 31;
    });
    if (days.length > 0) {
      return days.join(',');
    }
  }

  // "day X" or "the Xth"
  var dayOfMatch = lower.match(/(?:day|the)\s+(\d{1,2})/);
  if (dayOfMatch) {
    return dayOfMatch[1];
  }

  return null;
}

/**
 * Extract interval from text
 * e.g., "every 5 minutes", "every 2 hours"
 */
function parseInterval(text) {
  var lower = text.toLowerCase();

  // Every X minutes
  var minuteMatch = lower.match(/every\s+(\d+)\s*min(?:ute)?s?/);
  if (minuteMatch) {
    return { type: 'minute', value: parseInt(minuteMatch[1], 10) };
  }

  // Every X hours
  var hourMatch = lower.match(/every\s+(\d+)\s*hours?/);
  if (hourMatch) {
    return { type: 'hour', value: parseInt(hourMatch[1], 10) };
  }

  // Every X days
  var dayMatch = lower.match(/every\s+(\d+)\s*days?/);
  if (dayMatch) {
    return { type: 'day', value: parseInt(dayMatch[1], 10) };
  }

  // Every X weeks
  var weekMatch = lower.match(/every\s+(\d+)\s*weeks?/);
  if (weekMatch) {
    return { type: 'week', value: parseInt(weekMatch[1], 10) };
  }

  // Every X months
  var monthMatch = lower.match(/every\s+(\d+)\s*months?/);
  if (monthMatch) {
    return { type: 'month', value: parseInt(monthMatch[1], 10) };
  }

  return null;
}

/**
 * Comprehensive natural language patterns
 * Returns { expression, confidence, description } or null
 */
var PATTERNS = [
  // === MINUTE PATTERNS ===
  {
    regex: /^every\s*minute$/i,
    handler: function() { return '* * * * *'; }
  },
  {
    regex: /^every\s+(\d+)\s*min(?:ute)?s?$/i,
    handler: function(match) {
      var mins = parseInt(match[1], 10);
      if (mins < 1 || mins > 59) { return null; }
      return '*/' + mins + ' * * * *';
    }
  },
  {
    regex: /^twice\s+(?:an?\s+)?hour$/i,
    handler: function() { return '0,30 * * * *'; }
  },
  {
    regex: /^every\s+half\s*(?:an?\s+)?hour$/i,
    handler: function() { return '*/30 * * * *'; }
  },
  {
    regex: /^every\s+quarter\s*(?:of\s+an?\s+)?hour$/i,
    handler: function() { return '*/15 * * * *'; }
  },

  // === HOURLY PATTERNS ===
  {
    regex: /^(?:every\s+)?hour(?:ly)?$/i,
    handler: function() { return '0 * * * *'; }
  },
  {
    regex: /^every\s+(\d+)\s*hours?$/i,
    handler: function(match) {
      var hours = parseInt(match[1], 10);
      if (hours < 1 || hours > 23) { return null; }
      return '0 */' + hours + ' * * *';
    }
  },
  {
    regex: /^twice\s+(?:a\s+)?day$/i,
    handler: function() { return '0 0,12 * * *'; }
  },
  {
    regex: /^three\s+times\s+(?:a\s+)?day$/i,
    handler: function() { return '0 8,14,20 * * *'; }
  },
  {
    regex: /^four\s+times\s+(?:a\s+)?day$/i,
    handler: function() { return '0 0,6,12,18 * * *'; }
  },

  // === DAILY PATTERNS ===
  {
    regex: /^(?:every\s+)?day(?:ly)?$/i,
    handler: function() { return '0 0 * * *'; }
  },
  {
    regex: /^(?:every\s+)?day\s+at\s+(.+)$/i,
    handler: function(match) {
      var time = parseTime(match[1]);
      if (!time) { return null; }
      return time.minute + ' ' + time.hour + ' * * *';
    }
  },
  {
    regex: /^daily\s+at\s+(.+)$/i,
    handler: function(match) {
      var time = parseTime(match[1]);
      if (!time) { return null; }
      return time.minute + ' ' + time.hour + ' * * *';
    }
  },
  {
    regex: /^at\s+(.+)\s+(?:every\s+)?daily?$/i,
    handler: function(match) {
      var time = parseTime(match[1]);
      if (!time) { return null; }
      return time.minute + ' ' + time.hour + ' * * *';
    }
  },
  {
    regex: /^at\s+(.+)$/i,
    handler: function(match) {
      var time = parseTime(match[1]);
      if (!time) { return null; }
      return time.minute + ' ' + time.hour + ' * * *';
    }
  },
  {
    regex: /^midnight$/i,
    handler: function() { return '0 0 * * *'; }
  },
  {
    regex: /^noon$/i,
    handler: function() { return '0 12 * * *'; }
  },
  {
    regex: /^at\s+midnight$/i,
    handler: function() { return '0 0 * * *'; }
  },
  {
    regex: /^at\s+noon$/i,
    handler: function() { return '0 12 * * *'; }
  },

  // === WEEKDAY PATTERNS ===
  {
    regex: /^(?:every\s+)?weekday(?:s)?$/i,
    handler: function() { return '0 0 * * 1-5'; }
  },
  {
    regex: /^(?:every\s+)?weekday(?:s)?\s+at\s+(.+)$/i,
    handler: function(match) {
      var time = parseTime(match[1]);
      if (!time) { return null; }
      return time.minute + ' ' + time.hour + ' * * 1-5';
    }
  },
  {
    regex: /^(?:every\s+)?business\s+day(?:s)?$/i,
    handler: function() { return '0 0 * * 1-5'; }
  },
  {
    regex: /^(?:every\s+)?business\s+day(?:s)?\s+at\s+(.+)$/i,
    handler: function(match) {
      var time = parseTime(match[1]);
      if (!time) { return null; }
      return time.minute + ' ' + time.hour + ' * * 1-5';
    }
  },
  {
    regex: /^monday\s*(?:through|to|-)\s*friday(?:\s+at\s+(.+))?$/i,
    handler: function(match) {
      var time = match[1] ? parseTime(match[1]) : { hour: 0, minute: 0 };
      if (!time) { return null; }
      return time.minute + ' ' + time.hour + ' * * 1-5';
    }
  },

  // === WEEKEND PATTERNS ===
  {
    regex: /^(?:every\s+)?weekend(?:s)?$/i,
    handler: function() { return '0 0 * * 0,6'; }
  },
  {
    regex: /^(?:every\s+)?weekend(?:s)?\s+at\s+(.+)$/i,
    handler: function(match) {
      var time = parseTime(match[1]);
      if (!time) { return null; }
      return time.minute + ' ' + time.hour + ' * * 0,6';
    }
  },
  {
    regex: /^saturday\s+(?:and|&)\s+sunday(?:\s+at\s+(.+))?$/i,
    handler: function(match) {
      var time = match[1] ? parseTime(match[1]) : { hour: 0, minute: 0 };
      if (!time) { return null; }
      return time.minute + ' ' + time.hour + ' * * 0,6';
    }
  },

  // === SPECIFIC DAY OF WEEK PATTERNS ===
  {
    regex: /^(?:every\s+)?(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|tues|wed|thu|thur|thurs|fri|sat|sun)$/i,
    handler: function(match) {
      var dayNum = DAYS[match[1].toLowerCase()];
      if (dayNum === undefined) { return null; }
      return '0 0 * * ' + dayNum;
    }
  },
  {
    regex: /^(?:every\s+)?(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|tues|wed|thu|thur|thurs|fri|sat|sun)\s+at\s+(.+)$/i,
    handler: function(match) {
      var dayNum = DAYS[match[1].toLowerCase()];
      var time = parseTime(match[2]);
      if (dayNum === undefined || !time) { return null; }
      return time.minute + ' ' + time.hour + ' * * ' + dayNum;
    }
  },
  {
    regex: /^(.+)\s+(?:every\s+)?(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|tues|wed|thu|thur|thurs|fri|sat|sun)$/i,
    handler: function(match) {
      var time = parseTime(match[1]);
      var dayNum = DAYS[match[2].toLowerCase()];
      if (!time || dayNum === undefined) { return null; }
      return time.minute + ' ' + time.hour + ' * * ' + dayNum;
    }
  },
  {
    regex: /^on\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|tues|wed|thu|thur|thurs|fri|sat|sun)(?:\s+at\s+(.+))?$/i,
    handler: function(match) {
      var dayNum = DAYS[match[1].toLowerCase()];
      var time = match[2] ? parseTime(match[2]) : { hour: 0, minute: 0 };
      if (dayNum === undefined || !time) { return null; }
      return time.minute + ' ' + time.hour + ' * * ' + dayNum;
    }
  },

  // === MULTIPLE DAYS PATTERNS ===
  {
    regex: /^(?:every\s+)?(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|tues|wed|thu|thur|thurs|fri|sat|sun)(?:\s*,\s*|\s+and\s+|\s*&\s*)(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|tues|wed|thu|thur|thurs|fri|sat|sun)(?:\s+at\s+(.+))?$/i,
    handler: function(match) {
      var day1 = DAYS[match[1].toLowerCase()];
      var day2 = DAYS[match[2].toLowerCase()];
      var time = match[3] ? parseTime(match[3]) : { hour: 0, minute: 0 };
      if (day1 === undefined || day2 === undefined || !time) { return null; }
      var days = [day1, day2].sort(function(a, b) { return a - b; });
      return time.minute + ' ' + time.hour + ' * * ' + days.join(',');
    }
  },

  // === WEEKLY PATTERNS ===
  {
    regex: /^(?:every\s+)?week(?:ly)?$/i,
    handler: function() { return '0 0 * * 0'; }
  },
  {
    regex: /^once\s+(?:a\s+)?week$/i,
    handler: function() { return '0 0 * * 0'; }
  },
  {
    regex: /^twice\s+(?:a\s+)?week$/i,
    handler: function() { return '0 0 * * 0,3'; }
  },
  {
    regex: /^every\s+other\s+day$/i,
    handler: function() { return '0 0 */2 * *'; }
  },

  // === MONTHLY PATTERNS ===
  {
    regex: /^(?:every\s+)?month(?:ly)?$/i,
    handler: function() { return '0 0 1 * *'; }
  },
  {
    regex: /^once\s+(?:a\s+)?month$/i,
    handler: function() { return '0 0 1 * *'; }
  },
  {
    regex: /^(?:every\s+)?(\d{1,2})(?:st|nd|rd|th)?\s+(?:of\s+(?:the\s+)?month)?$/i,
    handler: function(match) {
      var day = parseInt(match[1], 10);
      if (day < 1 || day > 31) { return null; }
      return '0 0 ' + day + ' * *';
    }
  },
  {
    regex: /^(?:every\s+)?(\d{1,2})(?:st|nd|rd|th)?\s+(?:of\s+(?:the\s+)?month\s+)?at\s+(.+)$/i,
    handler: function(match) {
      var day = parseInt(match[1], 10);
      var time = parseTime(match[2]);
      if (day < 1 || day > 31 || !time) { return null; }
      return time.minute + ' ' + time.hour + ' ' + day + ' * *';
    }
  },
  {
    regex: /^on\s+the\s+(\d{1,2})(?:st|nd|rd|th)?(?:\s+(?:of\s+(?:the\s+)?month)?)?(?:\s+at\s+(.+))?$/i,
    handler: function(match) {
      var day = parseInt(match[1], 10);
      var time = match[2] ? parseTime(match[2]) : { hour: 0, minute: 0 };
      if (day < 1 || day > 31 || !time) { return null; }
      return time.minute + ' ' + time.hour + ' ' + day + ' * *';
    }
  },
  {
    regex: /^(?:every\s+)?(\d{1,2})(?:st|nd|rd|th)?\s+and\s+(\d{1,2})(?:st|nd|rd|th)?(?:\s+(?:of\s+(?:the\s+)?month)?)?$/i,
    handler: function(match) {
      var day1 = parseInt(match[1], 10);
      var day2 = parseInt(match[2], 10);
      if (day1 < 1 || day1 > 31 || day2 < 1 || day2 > 31) { return null; }
      return '0 0 ' + day1 + ',' + day2 + ' * *';
    }
  },
  {
    regex: /^last\s+day\s+of\s+(?:the\s+)?month$/i,
    handler: function() { return '0 0 L * *'; }
  },
  {
    regex: /^last\s+day\s+of\s+(?:the\s+)?month\s+at\s+(.+)$/i,
    handler: function(match) {
      var time = parseTime(match[1]);
      if (!time) { return null; }
      return time.minute + ' ' + time.hour + ' L * *';
    }
  },

  // === FIRST/LAST DAY OF WEEK IN MONTH ===
  {
    regex: /^(?:every\s+)?(first|second|third|fourth|fifth|last|1st|2nd|3rd|4th|5th)\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|tues|wed|thu|thur|thurs|fri|sat|sun)(?:\s+of\s+(?:the\s+)?month)?$/i,
    handler: function(match) {
      var ord = ORDINALS[match[1].toLowerCase()];
      var dayNum = DAYS[match[2].toLowerCase()];
      if (ord === undefined || dayNum === undefined) { return null; }
      if (ord === 'L') {
        return '0 0 * * ' + dayNum + 'L';
      }
      return '0 0 * * ' + dayNum + '#' + ord;
    }
  },
  {
    regex: /^(?:every\s+)?(first|second|third|fourth|fifth|last|1st|2nd|3rd|4th|5th)\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|tues|wed|thu|thur|thurs|fri|sat|sun)(?:\s+of\s+(?:the\s+)?month)?\s+at\s+(.+)$/i,
    handler: function(match) {
      var ord = ORDINALS[match[1].toLowerCase()];
      var dayNum = DAYS[match[2].toLowerCase()];
      var time = parseTime(match[3]);
      if (ord === undefined || dayNum === undefined || !time) { return null; }
      if (ord === 'L') {
        return time.minute + ' ' + time.hour + ' * * ' + dayNum + 'L';
      }
      return time.minute + ' ' + time.hour + ' * * ' + dayNum + '#' + ord;
    }
  },

  // === YEARLY PATTERNS ===
  {
    regex: /^(?:every\s+)?year(?:ly)?$/i,
    handler: function() { return '0 0 1 1 *'; }
  },
  {
    regex: /^annual(?:ly)?$/i,
    handler: function() { return '0 0 1 1 *'; }
  },
  {
    regex: /^once\s+(?:a\s+)?year$/i,
    handler: function() { return '0 0 1 1 *'; }
  },

  // === SPECIFIC MONTH PATTERNS ===
  {
    regex: /^(?:every\s+)?(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec)$/i,
    handler: function(match) {
      var monthNum = MONTHS[match[1].toLowerCase()];
      if (monthNum === undefined) { return null; }
      return '0 0 1 ' + monthNum + ' *';
    }
  },
  {
    regex: /^(?:every\s+)?(\d{1,2})(?:st|nd|rd|th)?\s+(?:of\s+)?(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec)$/i,
    handler: function(match) {
      var day = parseInt(match[1], 10);
      var monthNum = MONTHS[match[2].toLowerCase()];
      if (day < 1 || day > 31 || monthNum === undefined) { return null; }
      return '0 0 ' + day + ' ' + monthNum + ' *';
    }
  },
  {
    regex: /^(?:every\s+)?(\d{1,2})(?:st|nd|rd|th)?\s+(?:of\s+)?(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec)\s+at\s+(.+)$/i,
    handler: function(match) {
      var day = parseInt(match[1], 10);
      var monthNum = MONTHS[match[2].toLowerCase()];
      var time = parseTime(match[3]);
      if (day < 1 || day > 31 || monthNum === undefined || !time) { return null; }
      return time.minute + ' ' + time.hour + ' ' + day + ' ' + monthNum + ' *';
    }
  },

  // === QUARTERLY PATTERNS ===
  {
    regex: /^(?:every\s+)?quarter(?:ly)?$/i,
    handler: function() { return '0 0 1 1,4,7,10 *'; }
  },
  {
    regex: /^every\s+3\s+months$/i,
    handler: function() { return '0 0 1 */3 *'; }
  },

  // === BI-WEEKLY / FORTNIGHTLY PATTERNS ===
  // Note: Standard cron doesn't support true bi-weekly, this is an approximation
  {
    regex: /^(?:every\s+)?(?:bi-?weekly|fortnightly|every\s+other\s+week|every\s+two\s+weeks|every\s+2\s+weeks)$/i,
    handler: function() {
      // Run on 1st and 15th as approximation
      return '0 0 1,15 * *';
    }
  },

  // === SPECIAL PATTERNS ===
  {
    regex: /^(?:at\s+)?startup$/i,
    handler: function() { return '@reboot'; }
  },
  {
    regex: /^on\s+reboot$/i,
    handler: function() { return '@reboot'; }
  },

  // === COMPLEX TIME PATTERNS ===
  {
    regex: /^every\s+(\d+)\s*min(?:ute)?s?\s+(?:on\s+)?(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|tues|wed|thu|thur|thurs|fri|sat|sun)(?:s)?$/i,
    handler: function(match) {
      var mins = parseInt(match[1], 10);
      var dayNum = DAYS[match[2].toLowerCase()];
      if (mins < 1 || mins > 59 || dayNum === undefined) { return null; }
      return '*/' + mins + ' * * * ' + dayNum;
    }
  },
  {
    regex: /^every\s+(\d+)\s*hours?\s+(?:on\s+)?(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|tues|wed|thu|thur|thurs|fri|sat|sun)(?:s)?$/i,
    handler: function(match) {
      var hours = parseInt(match[1], 10);
      var dayNum = DAYS[match[2].toLowerCase()];
      if (hours < 1 || hours > 23 || dayNum === undefined) { return null; }
      return '0 */' + hours + ' * * ' + dayNum;
    }
  },
  {
    regex: /^every\s+(\d+)\s*min(?:ute)?s?\s+(?:on\s+)?weekdays?$/i,
    handler: function(match) {
      var mins = parseInt(match[1], 10);
      if (mins < 1 || mins > 59) { return null; }
      return '*/' + mins + ' * * * 1-5';
    }
  },
  {
    regex: /^every\s+(\d+)\s*hours?\s+(?:on\s+)?weekdays?$/i,
    handler: function(match) {
      var hours = parseInt(match[1], 10);
      if (hours < 1 || hours > 23) { return null; }
      return '0 */' + hours + ' * * 1-5';
    }
  },

  // === TIME RANGE PATTERNS (between X and Y) ===
  {
    regex: /^every\s+(\d+)\s*min(?:ute)?s?\s+between\s+(.+)\s+and\s+(.+)$/i,
    handler: function(match) {
      var mins = parseInt(match[1], 10);
      var startTime = parseTime(match[2]);
      var endTime = parseTime(match[3]);
      if (mins < 1 || mins > 59 || !startTime || !endTime) { return null; }
      return '*/' + mins + ' ' + startTime.hour + '-' + endTime.hour + ' * * *';
    }
  },
  {
    regex: /^every\s+hour\s+between\s+(.+)\s+and\s+(.+)$/i,
    handler: function(match) {
      var startTime = parseTime(match[1]);
      var endTime = parseTime(match[2]);
      if (!startTime || !endTime) { return null; }
      return '0 ' + startTime.hour + '-' + endTime.hour + ' * * *';
    }
  }
];

/**
 * Convert natural language to cron expression
 * @param {string} text - Natural language input
 * @returns {object|null} - { expression, matched } or null
 */
function englishToCron(text) {
  if (!text || typeof text !== 'string') {
    return null;
  }

  var input = text.trim();
  if (!input) {
    return null;
  }

  // Try each pattern
  for (var i = 0; i < PATTERNS.length; i++) {
    var pattern = PATTERNS[i];
    var match = input.match(pattern.regex);
    if (match) {
      var expression = pattern.handler(match);
      if (expression) {
        return {
          expression: expression,
          matched: true,
          original: input
        };
      }
    }
  }

  return null;
}

/**
 * Validate a cron expression
 * @param {string} expression - Cron expression to validate
 * @returns {object} - { valid, error }
 */
function validateCron(expression) {
  if (!expression || typeof expression !== 'string') {
    return { valid: false, error: 'Expression is required' };
  }

  var trimmed = expression.trim();

  // Handle special strings
  if (trimmed.startsWith('@')) {
    var specials = ['@yearly', '@annually', '@monthly', '@weekly', '@daily', '@midnight', '@hourly', '@reboot'];
    if (specials.indexOf(trimmed.toLowerCase()) !== -1) {
      return { valid: true, error: null };
    }
    return { valid: false, error: 'Invalid special string: ' + trimmed };
  }

  var parts = trimmed.split(/\s+/);

  // Standard cron has 5 fields, some implementations have 6 (with seconds) or 7 (with year)
  if (parts.length < 5 || parts.length > 7) {
    return { valid: false, error: 'Expected 5-7 fields, got ' + parts.length };
  }

  // Validate each field
  var fieldNames = ['minute', 'hour', 'day of month', 'month', 'day of week', 'year'];
  var fieldRanges = [
    { min: 0, max: 59 },  // minute
    { min: 0, max: 23 },  // hour
    { min: 1, max: 31 },  // day of month
    { min: 1, max: 12 },  // month
    { min: 0, max: 7 },   // day of week (0 and 7 both = Sunday)
    { min: 1970, max: 2099 } // year
  ];

  for (var i = 0; i < Math.min(parts.length, 6); i++) {
    var field = parts[i];
    var range = fieldRanges[i];
    var fieldName = fieldNames[i];

    // Check for valid characters
    if (!/^[\d\*\-\/\,\?\#LW]+$/i.test(field)) {
      return { valid: false, error: 'Invalid character in ' + fieldName + ' field' };
    }

    // Allow * and ?
    if (field === '*' || field === '?') {
      continue;
    }

    // Check step values (*/5, 0/15, etc.)
    if (field.includes('/')) {
      var stepParts = field.split('/');
      if (stepParts.length !== 2) {
        return { valid: false, error: 'Invalid step value in ' + fieldName };
      }
      var stepValue = parseInt(stepParts[1], 10);
      if (isNaN(stepValue) || stepValue < 1) {
        return { valid: false, error: 'Invalid step value in ' + fieldName };
      }
    }

    // Check list values (1,2,3)
    if (field.includes(',')) {
      var listParts = field.split(',');
      for (var j = 0; j < listParts.length; j++) {
        var val = parseInt(listParts[j], 10);
        if (!isNaN(val) && (val < range.min || val > range.max)) {
          return { valid: false, error: fieldName + ' value ' + val + ' is out of range (' + range.min + '-' + range.max + ')' };
        }
      }
    }

    // Check range values (1-5)
    if (field.includes('-') && !field.includes('/')) {
      var rangeParts = field.split('-');
      if (rangeParts.length === 2) {
        var start = parseInt(rangeParts[0], 10);
        var end = parseInt(rangeParts[1], 10);
        if (!isNaN(start) && !isNaN(end)) {
          if (start > end) {
            return { valid: false, error: 'Range start > end in ' + fieldName };
          }
          if (start < range.min || end > range.max) {
            return { valid: false, error: 'Range in ' + fieldName + ' is out of bounds' };
          }
        }
      }
    }

    // Check single numeric value
    if (/^\d+$/.test(field)) {
      var numVal = parseInt(field, 10);
      if (numVal < range.min || numVal > range.max) {
        return { valid: false, error: fieldName + ' value ' + numVal + ' is out of range (' + range.min + '-' + range.max + ')' };
      }
    }
  }

  return { valid: true, error: null };
}

/**
 * Get preset cron expressions
 */
function getPresets() {
  return [
    { label: 'Every minute', expression: '* * * * *', category: 'frequent' },
    { label: 'Every 5 minutes', expression: '*/5 * * * *', category: 'frequent' },
    { label: 'Every 15 minutes', expression: '*/15 * * * *', category: 'frequent' },
    { label: 'Every 30 minutes', expression: '*/30 * * * *', category: 'frequent' },
    { label: 'Every hour', expression: '0 * * * *', category: 'frequent' },
    { label: 'Every 2 hours', expression: '0 */2 * * *', category: 'hourly' },
    { label: 'Every 6 hours', expression: '0 */6 * * *', category: 'hourly' },
    { label: 'Every 12 hours', expression: '0 */12 * * *', category: 'hourly' },
    { label: 'Daily at midnight', expression: '0 0 * * *', category: 'daily' },
    { label: 'Daily at noon', expression: '0 12 * * *', category: 'daily' },
    { label: 'Daily at 9 AM', expression: '0 9 * * *', category: 'daily' },
    { label: 'Daily at 6 PM', expression: '0 18 * * *', category: 'daily' },
    { label: 'Weekdays at 9 AM', expression: '0 9 * * 1-5', category: 'weekly' },
    { label: 'Every Monday', expression: '0 0 * * 1', category: 'weekly' },
    { label: 'Every Friday at 5 PM', expression: '0 17 * * 5', category: 'weekly' },
    { label: 'Every weekend', expression: '0 0 * * 0,6', category: 'weekly' },
    { label: 'Weekly on Sunday', expression: '0 0 * * 0', category: 'weekly' },
    { label: '1st of every month', expression: '0 0 1 * *', category: 'monthly' },
    { label: '15th of every month', expression: '0 0 15 * *', category: 'monthly' },
    { label: 'Last day of month', expression: '0 0 L * *', category: 'monthly' },
    { label: 'First Monday of month', expression: '0 0 * * 1#1', category: 'monthly' },
    { label: 'Quarterly (Jan, Apr, Jul, Oct)', expression: '0 0 1 1,4,7,10 *', category: 'yearly' },
    { label: 'Yearly on Jan 1st', expression: '0 0 1 1 *', category: 'yearly' }
  ];
}

/**
 * Get example English phrases for reference
 */
function getExamplePhrases() {
  return [
    // Minutes
    { phrase: 'every minute', expression: '* * * * *' },
    { phrase: 'every 5 minutes', expression: '*/5 * * * *' },
    { phrase: 'every 15 minutes', expression: '*/15 * * * *' },
    { phrase: 'every 30 minutes', expression: '*/30 * * * *' },
    { phrase: 'every half hour', expression: '*/30 * * * *' },
    { phrase: 'every quarter hour', expression: '*/15 * * * *' },
    { phrase: 'twice an hour', expression: '0,30 * * * *' },

    // Hours
    { phrase: 'every hour', expression: '0 * * * *' },
    { phrase: 'hourly', expression: '0 * * * *' },
    { phrase: 'every 2 hours', expression: '0 */2 * * *' },
    { phrase: 'every 6 hours', expression: '0 */6 * * *' },
    { phrase: 'twice a day', expression: '0 0,12 * * *' },
    { phrase: 'three times a day', expression: '0 8,14,20 * * *' },

    // Daily
    { phrase: 'every day', expression: '0 0 * * *' },
    { phrase: 'daily', expression: '0 0 * * *' },
    { phrase: 'daily at 9am', expression: '0 9 * * *' },
    { phrase: 'every day at 5pm', expression: '0 17 * * *' },
    { phrase: 'every day at 17:30', expression: '30 17 * * *' },
    { phrase: 'at midnight', expression: '0 0 * * *' },
    { phrase: 'at noon', expression: '0 12 * * *' },
    { phrase: 'at 3:30pm', expression: '30 15 * * *' },

    // Weekdays
    { phrase: 'every weekday', expression: '0 0 * * 1-5' },
    { phrase: 'weekdays at 9am', expression: '0 9 * * 1-5' },
    { phrase: 'business days at 8am', expression: '0 8 * * 1-5' },
    { phrase: 'monday through friday', expression: '0 0 * * 1-5' },
    { phrase: 'monday to friday at 9am', expression: '0 9 * * 1-5' },
    { phrase: 'every other day', expression: '0 0 */2 * *' },

    // Weekends
    { phrase: 'every weekend', expression: '0 0 * * 0,6' },
    { phrase: 'weekends at 10am', expression: '0 10 * * 0,6' },
    { phrase: 'saturday and sunday', expression: '0 0 * * 0,6' },

    // Specific days
    { phrase: 'every monday', expression: '0 0 * * 1' },
    { phrase: 'every tuesday at 3pm', expression: '0 15 * * 2' },
    { phrase: 'every friday at 5pm', expression: '0 17 * * 5' },
    { phrase: 'on sunday at noon', expression: '0 12 * * 0' },
    { phrase: '9am every monday', expression: '0 9 * * 1' },
    { phrase: 'monday and thursday', expression: '0 0 * * 1,4' },
    { phrase: 'tuesday and friday at 10am', expression: '0 10 * * 2,5' },

    // Weekly
    { phrase: 'every week', expression: '0 0 * * 0' },
    { phrase: 'weekly', expression: '0 0 * * 0' },
    { phrase: 'once a week', expression: '0 0 * * 0' },
    { phrase: 'twice a week', expression: '0 0 * * 0,3' },

    // Monthly
    { phrase: 'every month', expression: '0 0 1 * *' },
    { phrase: 'monthly', expression: '0 0 1 * *' },
    { phrase: 'once a month', expression: '0 0 1 * *' },
    { phrase: 'every 1st', expression: '0 0 1 * *' },
    { phrase: 'every 15th', expression: '0 0 15 * *' },
    { phrase: 'every 1st and 15th', expression: '0 0 1,15 * *' },
    { phrase: 'on the 25th', expression: '0 0 25 * *' },
    { phrase: 'on the 1st at 9am', expression: '0 9 1 * *' },
    { phrase: 'last day of month', expression: '0 0 L * *' },
    { phrase: 'last day of month at noon', expression: '0 12 L * *' },

    // Ordinal weekdays
    { phrase: 'first monday of month', expression: '0 0 * * 1#1' },
    { phrase: 'second tuesday of month', expression: '0 0 * * 2#2' },
    { phrase: 'third wednesday of month at 2pm', expression: '0 14 * * 3#3' },
    { phrase: 'last friday of month', expression: '0 0 * * 5L' },
    { phrase: 'first monday of month at 9am', expression: '0 9 * * 1#1' },

    // Yearly
    { phrase: 'every year', expression: '0 0 1 1 *' },
    { phrase: 'yearly', expression: '0 0 1 1 *' },
    { phrase: 'annually', expression: '0 0 1 1 *' },
    { phrase: 'once a year', expression: '0 0 1 1 *' },

    // Specific months
    { phrase: 'every january', expression: '0 0 1 1 *' },
    { phrase: 'every december', expression: '0 0 1 12 *' },
    { phrase: '25th of december', expression: '0 0 25 12 *' },
    { phrase: '1st of january at midnight', expression: '0 0 1 1 *' },
    { phrase: '4th of july at noon', expression: '0 12 4 7 *' },

    // Quarterly
    { phrase: 'quarterly', expression: '0 0 1 1,4,7,10 *' },
    { phrase: 'every quarter', expression: '0 0 1 1,4,7,10 *' },
    { phrase: 'every 3 months', expression: '0 0 1 */3 *' },

    // Bi-weekly (approximation)
    { phrase: 'bi-weekly', expression: '0 0 1,15 * *' },
    { phrase: 'every other week', expression: '0 0 1,15 * *' },
    { phrase: 'every two weeks', expression: '0 0 1,15 * *' },
    { phrase: 'fortnightly', expression: '0 0 1,15 * *' },

    // Complex patterns
    { phrase: 'every 5 minutes on monday', expression: '*/5 * * * 1' },
    { phrase: 'every 2 hours on weekdays', expression: '0 */2 * * 1-5' },
    { phrase: 'every hour between 9am and 5pm', expression: '0 9-17 * * *' },
    { phrase: 'every 15 minutes between 8am and 6pm', expression: '*/15 8-18 * * *' }
  ];
}

export {
  englishToCron,
  validateCron,
  parseTime,
  parseDayOfWeek,
  parseMonth,
  parseDayOfMonth,
  parseInterval,
  getPresets,
  getExamplePhrases,
  DAYS,
  MONTHS,
  ORDINALS
};
