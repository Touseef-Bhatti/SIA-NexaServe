import lv from './lv.js';

// The existing HTML is the English source. Its text supplies the English value
// for each shared key, so adding a key in lv.js also registers it here.
export default Object.fromEntries(Object.keys(lv).map((key) => [key, key]));
