// Files uploaded from the live editor exist in the repo before the site is rebuilt —
// show them from the local copy until then.
const previews = new Map<string, string>()
export const addPreview = (path: string, file: Blob) => { previews.set(path, URL.createObjectURL(file)) }

/** Resolve a file inside /public so it works on any hosting base path (data:/blob:/http URLs pass through). */
export const asset = (path: string) => previews.get(path) ?? (/^(data:|blob:|https?:)/.test(path) ? path : import.meta.env.BASE_URL + path.replace(/^\//, ''))
