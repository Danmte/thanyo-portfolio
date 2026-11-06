import seed from './site.json'

export type Tone = 'blue' | 'green' | 'amber' | 'violet' | 'gray'
export type Point = { title: string; code: string; body: string }
export type Work = {
  id: string; number: string; title: string; subtitle: string; status: string; tone: Tone | string
  genre: string; duration: string; role: string; team: string; summary: string
  cover: string; images: string[]; video: string; software: string[]; points: Point[]
}
export type Art = { id: string; title: string; category: string; tools: string; note: string; image: string; pixel: boolean }
export type Spec = { label: string; value: string }
export type Model3D = {
  id: string; kind: string; name: string; title: string; description: string
  model: string; thumb: string; height: number; lift: number; spin: boolean
  clips: string[] // which clips to show (empty = all in the file). "T-Pose" = the rig's rest pose.
  defaultClip: string; specs: Spec[]; tools: string[]
  faces?: FaceBoard
}
/**
 * Face board: the face mesh samples one cell of a sticker sheet; changing the cell = changing the expression.
 * timeline: per clip, [seconds, col, row] steps (exported from the rig's FaceKnob keys).
 */
export type FaceBoard = {
  material: string; sheet: string; sheetSize: number[]; cols: number; rows: number
  stepU: number; stepV: number // UV distance between cells
  cell: number[] // [u0, v0, uWidth, vHeight] of cell (0,0) in glTF UV space (v down)
  default: number[]; timeline: Record<string, number[][]>
}
export type Contact = { label: string; value: string; url: string }
export type Section = { eyebrow: string; title: string; intro?: string }
export type Site = {
  site: { name: string; sub: string; role: string }
  hero: { tag: string; title: string; intro: string; primary: string; secondary: string }
  sections: { works: Section; studio: Section; gallery: Section; about: Section; contact: Section }
  works: Work[]
  gallery: Art[]
  models: Model3D[]
  about: {
    fullName: string; nickname: string; photo: string; avatar: string
    facts: Spec[]; quote: string; quoteBy: string; statement: string[]
    skills: string[]; education: { school: string; years: string }[]; hobbies: string[]
  }
  contacts: Contact[]
}

export const seedSite = seed as Site

/** Templates for "add new item" in the editor. */
export const blank = {
  work: (): Work => ({ id: `work-${Date.now()}`, number: '', title: 'ผลงานใหม่', subtitle: '', status: 'In development', tone: 'blue', genre: '', duration: '', role: '', team: '', summary: '', cover: '', images: [], video: '', software: [], points: [] }),
  art: (): Art => ({ id: `art-${Date.now()}`, title: 'ภาพใหม่', category: 'Illustration', tools: '', note: '', image: '', pixel: false }),
  model: (): Model3D => ({ id: `model-${Date.now()}`, kind: 'Character', name: 'โมเดลใหม่', title: '', description: '', model: '', thumb: '', height: 1.8, lift: 0, spin: false, clips: [], defaultClip: '', specs: [], tools: [] }),
  contact: (): Contact => ({ label: 'Link', value: '', url: '' }),
}
