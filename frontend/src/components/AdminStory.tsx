import bowlingHero from '../assets/bowling-hero.png'

function AdminStory() {
  return (
    <section className="admin-story" aria-labelledby="admin-heading">
      <img className="admin-photo" src={bowlingHero} alt="" />
      <div className="admin-story-content">
        <p className="admin-eyebrow">För klubbens administratörer</p>
        <h1 id="admin-heading">Bakom<br /><span>kulisserna.</span></h1>
        <p>Klubbens gemensamma plats för administration.</p>
      </div>
    </section>
  )
}

export default AdminStory
