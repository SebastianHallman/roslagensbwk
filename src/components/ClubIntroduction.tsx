import teamData from '../data/teamData.js'

function ClubIntroduction() {
  return (
    <div className="grid md:grid-cols-2">
      <section
        id="om-klubben"
        className="bg-black px-4 py-14 text-white min-[40rem]:px-6 md:min-h-[36rem] md:px-[clamp(1.5rem,5vw,6rem)] md:py-24"
        aria-labelledby="club-heading"
      >
        <div className="mx-auto max-w-[32rem]">
          <h2 id="club-heading" className="mb-6 max-w-[22ch] text-3xl leading-tight text-balance lg:text-4xl">
            För att bowling är mer än bara bowling
          </h2>
          <p className="text-base text-warm-white">
            Ett bra slag, ett skratt och någon som hejar. I vår spellokal
            Roslagsbowling finns plats för både ambitioner och gemenskap,
            oavsett hur länge du har spelat. Vi delar tips, peppar varandra när
            käglorna står kvar och firar när allt sitter. Här får du utvecklas
            i din egen takt, hitta nya utmaningar och lära känna människor som
            delar glädjen i bowling.
          </p>
        </div>
      </section>

      <section
        id="vara-lag"
        className="bg-warm-white px-4 py-14 text-black min-[40rem]:px-6 md:px-[clamp(1.5rem,5vw,6rem)] md:py-24"
        aria-labelledby="teams-heading"
      >
        <div className="mx-auto max-w-[32rem]">
          <h2 id="teams-heading" className="mb-10 text-center text-3xl leading-tight lg:text-4xl">
            Våra lag
          </h2>
          <ul className="grid list-none gap-6 p-0 min-[30rem]:grid-cols-2 md:grid-cols-1 lg:grid-cols-2">
            {teamData.map((team) => (
              <li key={team.id} className="min-w-0 rounded-lg bg-white p-6">
                <h3 className="mb-2 font-heading text-xl leading-tight">{team.name}</h3>
                {team.series.length > 0 ? (
                  <ul className="grid list-none gap-3 p-0 text-sm">
                    {team.series.map((series) => (
                      <li key={series.id} className="break-words">
                        {series.url ? (
                          <a className="underline underline-offset-4 hover:decoration-2 focus-visible:outline-black" href={series.url}>
                            {series.name}
                          </a>
                        ) : series.name}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm">Serieuppgifter kommer.</p>
                )}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  )
}

export default ClubIntroduction
