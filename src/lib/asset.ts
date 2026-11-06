/** Resolve a file inside /public so it works on any hosting base path. */
export const asset = (path: string) => import.meta.env.BASE_URL + path.replace(/^\//, '')
