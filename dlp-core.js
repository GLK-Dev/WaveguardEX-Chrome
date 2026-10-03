// Pure DLP logic (no DOM, no chrome.*) so it can be unit-tested in Node.
(function(root) {
  'use strict';

  const MASK = '[MASKED SENSITIVE DATA]';

  function luhnValid(digits) {
    let sum = 0;
    let double = false;
    for (let i = digits.length - 1; i >= 0; i--) {
      let d = digits.charCodeAt(i) - 48;
      if (double) {
        d *= 2;
        if (d > 9) d -= 9;
      }
      sum += d;
      double = !double;
    }
    return sum % 10 === 0;
  }

  // Each rule's replacer returns the original text to leave a match alone.
  // String.prototype.replace resets lastIndex itself, so no regex state leaks between calls.
  const RULES = [
    {
      name: 'Credit Card',
      regex: /(?<!\d)(?:\d[ -]?){12,18}\d(?!\d)/g,
      accept: (match) => {
        const digits = match.replace(/[ -]/g, '');
        return digits.length >= 13 && digits.length <= 19 && luhnValid(digits);
      }
    },
    {
      name: 'Email Address',
      regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g
    },
    {
      name: 'Phone Number',
      regex: /(?<!\d)(?:(?:\+7|8)[\s(-]*\d{3}[\s)-]*\d{3}[\s-]*\d{2}[\s-]*\d{2}|(?:\+\d{1,3}[\s.-]?)?(?:\(\d{3}\)|\d{3})[\s.-]?\d{3}[\s.-]?\d{4})(?!\d)/g
    }
  ];

  function maskSensitive(text) {
    let masked = String(text);
    let found = false;
    for (const rule of RULES) {
      masked = masked.replace(rule.regex, (match) => {
        if (rule.accept && !rule.accept(match)) return match;
        found = true;
        return MASK;
      });
    }
    return { masked, found };
  }

  const api = { maskSensitive, luhnValid, MASK };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.WaveguardDLP = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
