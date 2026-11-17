import contactData from '../data/contactData.js'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { fetchBoardMembers, sendContactMessage } from '../api/api.js'
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile'

const turnstileSiteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY?.trim();

const fieldClassName = 'mt-2 w-full rounded border border-black/20 bg-warm-white/40 px-4 py-3 text-base text-black placeholder:text-black/55 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black'

type BoardMember = {
  id: number;
  name: string | null;
  role: string;
};

function ContactSection() {
  const [boardMembers, setBoardMembers] = useState<BoardMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [contactError, setContactError] = useState<string | null>(null);
  const [contactStatus, setContactStatus] = useState('');
  const sendingRef = useRef(false);
  const turnstileRef = useRef<TurnstileInstance | null>(null);
  const [turnstileToken, setTurnstileToken] = useState('');
  const [captchaError, setCaptchaError] = useState<string | null>(null);
  const captchaContainerRef = useRef<HTMLDivElement | null>(null);
  const [captchaSize, setCaptchaSize] = useState<'compact' | 'flexible'>('compact');
  const captchaSizeRef = useRef<'compact' | 'flexible'>('compact');

  useEffect(() => {
    const container = captchaContainerRef.current;
    if (!container) return;

    const observer = new ResizeObserver(([entry]) => {
      // Cloudflare's flexible widget requires at least 300px of available width.
      const nextSize = entry.contentRect.width >= 300 ? 'flexible' : 'compact';
      if (nextSize !== captchaSizeRef.current) {
        captchaSizeRef.current = nextSize;
        setTurnstileToken('');
        setCaptchaSize(nextSize);
      }
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  function handleCaptchaError() {
    setTurnstileToken('');
    setCaptchaError('Säkerhetskontrollen kunde inte laddas eller slutföras. Ladda om sidan och försök igen, eller kontakta oss via e-post.');
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sendingRef.current) return;

    const form = event.currentTarget;
    const data = new FormData(form);
    const contact = {
      name: String(data.get('name') ?? '').trim(),
      email: String(data.get('email') ?? '').trim(),
      message: String(data.get('message') ?? '').trim(),
    };
    setContactError(null);
    setContactStatus('');
    if (!contact.name || !contact.message) {
      setContactError('Fyll i namn och meddelande. Fälten får inte bara innehålla blanksteg.');
      return;
    }
    if (!turnstileSiteKey || !turnstileToken || turnstileRef.current?.isExpired()) {
      setTurnstileToken('');
      setCaptchaError('Slutför säkerhetskontrollen innan du skickar meddelandet.');
      return;
    }

    sendingRef.current = true;
    setIsSending(true);
    setContactStatus('Skickar ditt meddelande…');
    try {
      await sendContactMessage({ ...contact, turnstileToken });
      form.reset();
      setContactStatus('Tack! Ditt meddelande har skickats till klubben.');
    } catch (error: unknown) {
      const status = error && typeof error === 'object' && 'status' in error ? error.status : undefined;
      const code = error && typeof error === 'object' && 'code' in error ? error.code : undefined;
      const messages: Record<number, string> = {
        400: 'Kontrollera namn (högst 100 tecken), e-postadress och meddelande (högst 2 000 tecken).',
        413: 'Meddelandet är för stort. Korta ned texten och försök igen.',
        429: 'För många försök. Vänta 15 minuter och försök sedan igen.',
        503: 'Kontaktformuläret är tillfälligt stängt. Kontakta oss via e-post eller försök igen senare.',
      };
      setContactStatus('');
      if (code === 'INVALID_CAPTCHA') {
        setContactError('Säkerhetskontrollen misslyckades. Slutför kontrollen igen och försök på nytt.');
      } else {
        setContactError(typeof status === 'number' && messages[status]
          ? messages[status]
          : 'Meddelandet kunde inte skickas. Kontrollera din anslutning och försök igen, eller kontakta oss via e-post.');
      }
    } finally {
      setTurnstileToken('');
      turnstileRef.current?.reset();
      sendingRef.current = false;
      setIsSending(false);
    }
  }

  useEffect(() => {
    let ignored = false;
    const fetchBoardData = async () => {
      try {
        const members = await fetchBoardMembers();
        if (!ignored) {
          setBoardMembers(members);
        }
      } catch {
        if (!ignored) {
          setError('Kunde inte hämta styrelsemedlemmar. Försök igen senare.');
        }
      } finally {
        if (!ignored) {
          setIsLoading(false);
        }
      }
    };

    fetchBoardData();
    return () => {
      ignored = true;
    };
  }, []);

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
            <form className="grid gap-5" aria-labelledby="message-heading" aria-busy={isSending} onSubmit={handleSubmit}>
              <div>
                <label htmlFor="contact-name">Namn</label>
                <input id="contact-name" name="name" autoComplete="name" placeholder="Ditt namn" required maxLength={100} readOnly={isSending} className={fieldClassName} />
              </div>
              <div>
                <label htmlFor="contact-email">E-post</label>
                <input id="contact-email" name="email" type="email" autoComplete="email" placeholder="Din e-postadress" required maxLength={254} readOnly={isSending} className={fieldClassName} />
              </div>
              <div>
                <label htmlFor="contact-message">Meddelande</label>
                <textarea id="contact-message" name="message" rows={5} placeholder="Vad vill du veta eller berätta?" required maxLength={2000} readOnly={isSending} className={`${fieldClassName} resize-y`} />
              </div>
              {turnstileSiteKey ? (
                <div ref={captchaContainerRef} className="min-w-0 w-full">
                  <Turnstile
                    ref={turnstileRef}
                    siteKey={turnstileSiteKey}
                    options={{ action: 'contact', language: 'sv', theme: 'light', size: captchaSize }}
                    scriptOptions={{ onError: handleCaptchaError }}
                    onSuccess={(token) => {
                      setTurnstileToken(token);
                      setCaptchaError(null);
                    }}
                    onExpire={() => {
                      setTurnstileToken('');
                      setCaptchaError('Säkerhetskontrollen har gått ut. Slutför kontrollen igen innan du skickar.');
                    }}
                    onTimeout={() => {
                      setTurnstileToken('');
                      setCaptchaError('Säkerhetskontrollen tog för lång tid. Slutför kontrollen igen.');
                    }}
                    onError={handleCaptchaError}
                    onUnsupported={handleCaptchaError}
                  />
                </div>
              ) : (
                <p role="alert" className="text-sm text-red">Kontaktformuläret är tillfälligt stängt. Kontakta oss via e-post.</p>
              )}
              {captchaError && <p role="alert" className="text-sm text-red">{captchaError}</p>}
              <p role="status" className="text-sm empty:hidden">{contactStatus}</p>
              {contactError && <p role="alert" className="text-sm text-red">{contactError}</p>}
              <button type="submit" disabled={isSending || !turnstileSiteKey || !turnstileToken} className="min-h-11 justify-self-start rounded bg-red px-5 py-3 font-heading text-white disabled:cursor-not-allowed disabled:opacity-60">
                {isSending ? 'Skickar…' : 'Skicka meddelande'}
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
              {isLoading ? (
              <p role="status">Hämtar styrelsen…</p>
            ) : error ? (
              <p role="alert">{error}</p>
            ) : boardMembers.length === 0 ? (
              <p>Inga styrelseuppgifter finns ännu.</p>
            ) : (
              <dl className="grid gap-x-8 gap-y-6 min-[30rem]:grid-cols-2 md:grid-cols-1 lg:grid-cols-2">
                {boardMembers.map((member) => (
                  <div key={member.id} className="min-w-0">
                    <dt className="mb-1 font-medium">{member.role}</dt>
                    <dd className="break-words">
                      {member.name || 'Uppgift kommer.'}
                    </dd>
                  </div>
                ))}
              </dl>
            )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default ContactSection
