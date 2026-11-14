declare const __EDITION__: 'portfolio' | 'personal' | 'kmitl'
declare const __CONTENT_FILE__: string

/** Which version of the site this build is: the admissions portfolio (CAMT), its KMITL IT copy, or the personal site. */
export const EDITION = __EDITION__
export const isPersonal = EDITION === 'personal'
/** Repo path of this edition's content file (the editor saves here). */
export const CONTENT_FILE = __CONTENT_FILE__
/** Prefix for browser-storage keys so editions never share drafts. */
export const storeKey = (k: string) => (EDITION === 'portfolio' ? k : `${k}-${EDITION}`)
