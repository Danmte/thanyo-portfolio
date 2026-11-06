import { HudFrame, StatBar } from '../components/HudFrame'
import { PixelField } from '../components/Hud'
import { profile } from '../data/profile'
import { projects } from '../data/projects'
import { characters } from '../data/characters'
import { artworks } from '../data/artworks'
import { asset } from '../lib/asset'
import { sfx } from '../lib/sfx'

export default function Profile() {
  return (
    <HudFrame title="DOSSIER" sub="STATUS" code="ID" tone="dark" className="profile">
      <div className="pf">
        <div className="pf-photo">
          <img src={asset(profile.avatar)} alt={profile.name} />
          <PixelField seed={12} count={10} />
          <span className="pf-clip" />
        </div>

        <article className="pf-sheet">
          <header className="pf-sheet-head">
            <div>
              <small>FILE OF PERSONNEL</small>
              <h2>{profile.name}</h2>
              <p>{profile.className}</p>
            </div>
            <div className="pf-lv"><small>LV</small><b>{profile.level}</b></div>
          </header>

          <table className="pf-table">
            <tbody>
              <tr><th>GAMES</th><td>{projects.length}</td><th>MODELS</th><td>{characters.length}</td></tr>
              <tr><th>ARTWORKS</th><td>{artworks.length}</td><th>TARGET</th><td>Creative Director</td></tr>
            </tbody>
          </table>

          <section>
            <h3>PROFILE</h3>
            <p className="pf-bio">{profile.bio}</p>
          </section>

          <div className="pf-cols">
            <section>
              <h3>SKILLS</h3>
              {profile.skills.map((s) => <StatBar key={s.label} {...s} />)}
            </section>
            <section>
              <h3>RECORD</h3>
              <ul className="pf-ach">
                {profile.achievements.map((a) => <li key={a.title}><b>{a.title}</b><small>{a.desc}</small></li>)}
              </ul>
              <h3>CONTACT</h3>
              <div className="pf-links">
                {profile.links.map((l) => (
                  <a key={l.label} href={l.url} target="_blank" rel="noreferrer" onMouseEnter={() => sfx('hover')}>{l.label}</a>
                ))}
              </div>
            </section>
          </div>

          <span className="pf-stamp">CONFIDENTIAL</span>
          <span className="pf-sign">{profile.name.toLowerCase()}</span>
        </article>
      </div>
    </HudFrame>
  )
}
