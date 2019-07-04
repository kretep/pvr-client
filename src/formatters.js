
// Properly capitalize first and last name.
// Used when creating new person and loading/saving existing
export function capitalizeName(name) {
  var splitNameCurrent = name.split(" ");
  var parts = [];
  splitNameCurrent.forEach(function(part) {
    part = part.toLowerCase(); // lower case is default
    if (['van', 'de', 'der', 'v/d', 'den', "'t"].indexOf(part) > -1) {
      // leave these unchanged
      parts.push(part);
    }
    else {
      if (part !== '') { // filter out extra spaces
        // Convert first character to upper case
        parts.push(part.charAt(0).toUpperCase() + part.slice(1));
      }
    }
  });
  return parts.join(" ");
}

export function formatPhoneForSave(phone) {
  if (!phone) {
    return '';
  }
  [' ', '-'].forEach(function(c) {
    phone = phone.replace(c, '');
  })
  return phone;
}

export function formatPhoneForDisplay(phone) {
  phone = formatPhoneForSave(phone);
  if (!phone) {
    return '';
  }
  if (phone.slice(0, 2) === '06') {
    phone = '06-' + phone.slice(2);
  }
  else {
    phone = phone.slice(0, 3) + '-' + phone.slice(3);
  }
  return phone;
}

// Converts ISO-6801 date to plain date (without time)
export function formatDateForDisplay(date) {
  if (date) {
    return date.slice(0, 10);
  }
  return '';
}

export function formatPostcode(postcode) {
  if (!postcode) {
    return '';
  }
  postcode = postcode.replace(' ', '');
  postcode = postcode.toUpperCase();
  postcode = postcode.slice(0, 4) + ' ' + postcode.slice(4, 6);
  return postcode;
}
