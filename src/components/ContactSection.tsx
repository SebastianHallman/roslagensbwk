import contactData from '../data/contactData.js'

const fieldClassName = 'mt-2 w-full rounded border border-black/20 bg-warm-white/40 px-4 py-3 text-base text-black placeholder:text-black/55 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black'

function ContactSection() {
  return (
    <section id="kontakt" className="scroll-mt-6 bg-white py-14 text-black [color-scheme:light] md:py-20" aria-labelledby="contact-heading">
      <div className="mx-auto w-[calc(100%_-_2rem)] max-w-[76rem] min-[40rem]:w-[calc(100%_-_3rem)]">
        <h2 id="contact-heading" className="mb-4 text-3xl leading-tight md:text-4xl">
          Vill du spela med oss?
        </h2>
        <p className="max-w-[65ch]">
          Nyfiken på klubben, träningen eller att bli medlem? Skicka oss ett meddelande så ses vi på banorna snart. 
        </p>

        <div className="mt-10 grid gap-12 md:grid-cols-2 md:gap-16">
          <div>
            <h3 id="message-heading" className="mb-6 font-heading text-2xl">Skicka ett meddelande</h3>
            <form className="grid gap-5" aria-labelledby="message-heading" aria-describedby="form-notice" onSubmit={(event) => event.preventDefault()}>
              <div>
                <label htmlFor="contact-name">Namn</label>
                <input id="contact-name" name="name" autoComplete="name" placeholder="Ditt namn" required className={fieldClassName} />
              </div>
              <div>
                <label htmlFor="contact-email">E-post</label>
                <input id="contact-email" name="email" type="email" autoComplete="email" placeholder="Din e-postadress" required className={fieldClassName} />
              </div>
              <div>
                <label htmlFor="contact-message">Meddelande</label>
                <textarea id="contact-message" name="message" rows={5} placeholder="Vad vill du veta eller berätta?" required className={`${fieldClassName} resize-y`} />
              </div>
              <p id="form-notice" className="text-sm">Formuläret är inte öppet för meddelanden ännu.</p>
              <button type="submit" disabled className="min-h-11 justify-self-start rounded bg-red px-5 py-3 font-heading text-white opacity-60 disabled:cursor-not-allowed">
                Skicka meddelande
              </button>
            </form>
          </div>

          <div>
            <h3 className="mb-6 font-heading text-2xl">Kontakta klubben</h3>
            <dl className="grid gap-6 min-[30rem]:grid-cols-2 md:grid-cols-1 lg:grid-cols-2">
              <div className="min-w-0">
                <dt className="mb-1 font-medium">E-post</dt>
                <dd className="break-words">
                  {contactData.email ? (
                    <a href={`mailto:${contactData.email}`} className="underline underline-offset-4 focus-visible:outline-black!">{contactData.email}</a>
                  ) : 'Uppgift kommer.'}
                </dd>
              </div>
              <div className="min-w-0">
                <dt className="mb-1 font-medium">Telefon</dt>
                <dd>
                  {contactData.phone ? (
                    <a href={`tel:${contactData.phone.replace(/[\s()-]/g, '')}`} className="underline underline-offset-4 focus-visible:outline-black!">{contactData.phone}</a>
                  ) : 'Uppgift kommer.'}
                </dd>
              </div>
            </dl>
            <p className="mt-6">Vår spellokal: {contactData.venue}</p>

            <div className="mt-8 border-t border-black/15 pt-6">
              <h3 className="mb-6 font-heading text-2xl">Styrelsen</h3>
              <dl className="grid gap-x-8 gap-y-6 min-[30rem]:grid-cols-2 md:grid-cols-1 lg:grid-cols-2">
                {contactData.board.map((member) => (
                  <div key={member.id} className="min-w-0">
                    <dt className="mb-1 font-medium">{member.role}</dt>
                    <dd className="break-words">{member.name || 'Uppgift kommer.'}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default ContactSection
