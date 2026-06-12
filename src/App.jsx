import { useEffect, useMemo, useState, useRef } from "react"
import { supabase } from "./supabaseClient"

const isRecoveryLink =
  typeof window !== "undefined" &&
  (window.location.hash.includes("type=recovery") || window.location.search.includes("type=recovery"))

function readRoute() {
  const raw = (window.location.hash || "").replace(/^#\/?/, "")
  if (raw.startsWith("case/")) return { page: "case-files", caseId: decodeURIComponent(raw.slice(5)) }
  const known = ["case-files", "discussion", "about", "contact", "account", "reset-password"]
  if (known.includes(raw)) return { page: raw, caseId: null }
  return { page: "home", caseId: null }
}

const processSteps = [
  {
    title: "You tell us. We listen.",
    description:
      "Send the weird problem, strange story, petty dispute, or situation that makes no sense.",
    icon: "☎",
  },
  {
    title: "We investigate. We film it.",
    description:
      "The Public Investigator looks into the case and documents the process for the world to see.",
    icon: "🕵️",
  },
  {
    title: "We find answers (maybe).",
    description:
      "Some cases get solved. Some get stranger. Either way, the footage becomes part of the record.",
    icon: "🔦",
  },
  {
    title: "You watch. We all decide.",
    description:
      "The audience reviews the evidence, argues theories, and decides what really happened.",
    icon: "📺",
  },
]

const caseFiles = [
  {
    id: "patio-chair",
    title: "The Patio Chair Displacement",
    status: "Open",
    location: "Unknown",
    date: "Case 001",
    summary:
      "A patio chair keeps moving overnight. Nobody admits touching it. The chair may know more than the witnesses.",
    videoLabel: "Investigation footage pending",
  },
  {
    id: "parking-cone",
    title: "The Parking Cone Conspiracy",
    status: "Under Review",
    location: "Field Report",
    date: "Case 002",
    summary:
      "A suspicious parking cone appears in the same place every morning. Coincidence, territorial claim, or nonsense?",
    videoLabel: "Evidence archived",
  },
  {
    id: "missing-wallet",
    title: "The Missing Wallet Mystery",
    status: "Unresolved",
    location: "Witness Submitted",
    date: "Case 003",
    summary:
      "A wallet disappears, reappears, then disappears again. The timeline is questionable. So are the witnesses.",
    videoLabel: "Episode coming soon",
  },
]

const starterComments = {
  "patio-chair": [
    {
      user: "BayouSleuth",
      body: "The chair is probably being moved by someone with a very specific grudge.",
      tag: "Theory",
    },
    {
      user: "PorchWitness17",
      body: "Check whether the chair legs leave scrape marks. Direction matters.",
      tag: "Clue",
    },
  ],
  "parking-cone": [
    {
      user: "ConeWatcher",
      body: "Nobody owns that cone. That is exactly why it is suspicious.",
      tag: "Theory",
    },
  ],
  "missing-wallet": [
    {
      user: "ReceiptReader",
      body: "If the wallet came back once, the timeline is the whole case.",
      tag: "Clue",
    },
  ],
}

function InstagramLogo() {
  return (
    <span className="relative inline-flex h-6 w-6 items-center justify-center rounded-md border-2 border-[#F2C94C]">
      <span className="h-2.5 w-2.5 rounded-full border-2 border-[#F2C94C]" />
      <span className="absolute right-1 top-1 h-1 w-1 rounded-full bg-[#F2C94C]" />
    </span>
  )
}

function TikTokLogo() {
  return (
    <span className="inline-flex h-6 w-6 items-center justify-center text-xl font-black leading-none text-[#F2C94C]">
      ♪
    </span>
  )
}

function YouTubeLogo() {
  return (
    <span className="inline-flex h-6 w-8 items-center justify-center rounded-md border-2 border-[#F2C94C]">
      <span className="ml-0.5 block h-0 w-0 border-y-[6px] border-y-transparent border-l-[10px] border-l-[#F2C94C]" />
    </span>
  )
}

function XLogo() {
  return (
    <span className="inline-flex h-6 w-6 items-center justify-center rounded-sm border-2 border-[#F2C94C] text-sm font-black text-[#F2C94C]">
      X
    </span>
  )
}

function RedditLogo() {
  return (
    <span className="inline-flex h-6 w-6 items-center justify-center">
      <svg viewBox="0 0 64 64" aria-hidden="true" className="h-6 w-6">
        <circle cx="32" cy="32" r="29" fill="none" stroke="#F2C94C" strokeWidth="4" />
        <path d="M38 18L42 8L53 10" fill="none" stroke="#F2C94C" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="55" cy="10.5" r="5" fill="#F2C94C" />
        <circle cx="17" cy="32" r="7" fill="#F2C94C" />
        <circle cx="47" cy="32" r="7" fill="#F2C94C" />
        <ellipse cx="32" cy="36" rx="21" ry="16" fill="#F2C94C" />
        <circle cx="25" cy="34" r="3.2" fill="#08111C" />
        <circle cx="39" cy="34" r="3.2" fill="#08111C" />
        <path d="M24 41C28 45 36 45 40 41" fill="none" stroke="#08111C" strokeWidth="3.5" strokeLinecap="round" />
      </svg>
    </span>
  )
}

function IconLink({ href, label, children }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      className="inline-flex transition-transform hover:scale-110"
    >
      {children}
    </a>
  )
}

function SocialStrip() {
  return (
    <section className="border-b border-[#F2C94C]/10 py-14 md:py-20">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-center gap-8 px-5 text-center text-xs uppercase tracking-[0.14em] text-zinc-400 md:px-6 md:text-sm md:tracking-[0.18em]">
        <div className="flex flex-wrap items-center justify-center gap-8 text-[#F2C94C] md:gap-12">
          <div className="flex items-center justify-center gap-3">
            <IconLink href="https://www.instagram.com/brettsanchez.tv" label="Open Instagram profile">
              <InstagramLogo />
            </IconLink>
            <IconLink href="https://www.tiktok.com/@brettsanchez.tv" label="Open TikTok profile">
              <TikTokLogo />
            </IconLink>
            <span>@BRETTSANCHEZ.TV</span>
          </div>

          <div className="flex items-center justify-center gap-3">
            <IconLink href="https://www.youtube.com/@BrettSanchezTV" label="Open YouTube channel">
              <YouTubeLogo />
            </IconLink>
            <IconLink href="https://x.com/BrettSanchezTV" label="Open X profile">
              <XLogo />
            </IconLink>
            <span>@BRETTSANCHEZTV</span>
          </div>

          <div className="flex items-center justify-center gap-3">
            <IconLink href="https://www.reddit.com/r/ThePublicInvestigator" label="Open Reddit community">
              <RedditLogo />
            </IconLink>
            <span>r/ThePublicInvestigator</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-14">
          <div>504-252-0313</div>
          <div>thepublicinvestigator.com</div>
        </div>
      </div>
    </section>
  )
}

function Nav({ page, setPage, user, setPageCase, navigate }) {
  const links = [
    ["home", "Home"],
    ["case-files", "Case Files"],
    ["discussion", "Discussion Board"],
    ["about", "About"],
    ["contact", "Contact"],
  ]

  return (
    <nav className="sticky top-0 z-50 border-b border-[#F2C94C]/20 bg-[#08111C]/90 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-8 px-5 py-5 md:px-6">
        <button onClick={() => { setPage("home"); setPageCase(null) }} className="text-left">
          <div className="text-xs font-black uppercase tracking-[0.16em] text-[#F2C94C] sm:text-sm md:text-base md:tracking-[0.28em]">
            The Public Investigator
          </div>
          <div className="mt-1 text-xs uppercase tracking-[0.25em] text-zinc-500">
            The Truth Is Weird
          </div>
        </button>

        <div className="hidden items-center gap-7 text-sm uppercase tracking-[0.18em] text-zinc-300 lg:flex">
          {links.map(([key, label]) => (
            <button
              key={key}
              onClick={() => {
                setPage(key)
                setPageCase(null)
              }}
              className={`transition-colors hover:text-[#F2C94C] ${page === key ? "text-[#F2C94C]" : ""}`}
            >
              {label}
            </button>
          ))}
        </div>

        <button
          onClick={() => navigate("account", "signup")}
          className="hidden border border-[#F2C94C]/40 px-5 py-3 text-xs font-black uppercase tracking-[0.2em] text-[#F2C94C] transition-colors hover:bg-[#F2C94C]/10 md:block"
        >
          {user ? user.username : "Create Account / Log In"}
        </button>
      </div>

      <div className="flex gap-4 overflow-x-auto border-t border-[#F2C94C]/10 px-5 py-3 text-xs uppercase tracking-[0.18em] text-zinc-400 lg:hidden">
        {links.map(([key, label]) => (
          <button
            key={key}
            onClick={() => {
              setPage(key)
              setPageCase(null)
            }}
            className={`shrink-0 ${page === key ? "text-[#F2C94C]" : ""}`}
          >
            {label}
          </button>
        ))}
        <button onClick={() => navigate("account", "signup")} className="shrink-0 text-[#F2C94C]">
          {user ? user.username : "Create Account / Log In"}
        </button>
      </div>
    </nav>
  )
}

function PageHeader({ eyebrow, title, children }) {
  return (
    <section className="relative overflow-hidden border-b border-[#F2C94C]/10 py-16 md:py-28">
      <div className="absolute inset-0 bg-gradient-to-br from-[#F2C94C]/10 via-transparent to-transparent" />
      <div className="relative z-10 mx-auto max-w-7xl px-5 md:px-6">
        <div className="mb-5 text-xs uppercase tracking-[0.24em] text-[#F2C94C] md:text-sm md:tracking-[0.3em]">{eyebrow}</div>
        <h1 className="max-w-5xl break-words text-[3rem] font-black uppercase leading-[0.9] tracking-[-0.04em] text-[#F2C94C] sm:text-5xl md:text-7xl md:tracking-tight">
          {title}
        </h1>
        {children && <div className="mt-8 max-w-3xl text-base leading-relaxed text-zinc-300 md:text-xl">{children}</div>}
      </div>
    </section>
  )
}

function SubmissionForm() {
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [description, setDescription] = useState("")
  const [status, setStatus] = useState("idle")

  async function handleSubmit() {
    if (!description.trim()) {
      setStatus("needs-description")
      return
    }
    setStatus("sending")
    const { error } = await supabase.from("mysteries").insert({
      name: name.trim() || null,
      phone: phone.trim() || null,
      email: email.trim() || null,
      description: description.trim(),
    })
    if (error) {
      console.error(error)
      setStatus("error")
    } else {
      setStatus("success")
      setName("")
      setPhone("")
      setEmail("")
      setDescription("")
    }
  }

  return (
    <div className="relative">
      <div className="absolute right-4 -top-4 z-20 rotate-[3deg] bg-[#F2C94C] px-5 py-2 text-xs font-black uppercase tracking-[0.25em] text-[#08111C] shadow-xl md:-right-5 md:-top-5 md:rotate-[4deg]">
        Submit A Case
      </div>

      <div className="relative overflow-hidden border border-[#F2C94C]/25 bg-[#0d1725] p-5 shadow-2xl md:p-8">
        <div className="absolute inset-0 opacity-[0.04] bg-[linear-gradient(to_right,_#F2C94C_1px,_transparent_1px),linear-gradient(to_bottom,_#F2C94C_1px,_transparent_1px)] bg-[size:42px_42px]" />
        <div className="relative z-10">
          <div className="mb-4 text-xs uppercase tracking-[0.3em] text-[#F2C94C]">Open Investigation Request</div>
          <h2 className="mb-8 text-3xl font-black uppercase leading-none md:text-4xl">Tell Us What Happened.</h2>
          <div className="grid gap-4 text-left md:grid-cols-2">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your Name" className="border border-[#F2C94C]/20 bg-[#08111C] px-5 py-4 text-sm uppercase tracking-[0.12em] outline-none focus:border-[#F2C94C]" />
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone Number" className="border border-[#F2C94C]/20 bg-[#08111C] px-5 py-4 text-sm uppercase tracking-[0.12em] outline-none focus:border-[#F2C94C]" />
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="border border-[#F2C94C]/20 bg-[#08111C] px-5 py-4 text-sm uppercase tracking-[0.12em] outline-none focus:border-[#F2C94C] md:col-span-2" />
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={6} placeholder="Explain the situation..." className="resize-none border border-[#F2C94C]/20 bg-[#08111C] px-5 py-4 text-sm tracking-[0.05em] outline-none focus:border-[#F2C94C] md:col-span-2" />
          </div>
          <button onClick={handleSubmit} disabled={status === "sending"} className="mt-6 w-full bg-[#F2C94C] px-8 py-5 text-sm font-black uppercase tracking-[0.3em] text-[#08111C] transition-colors hover:bg-[#ffe082] disabled:opacity-60">{status === "sending" ? "Sending..." : "Open Investigation"}</button>
          {status === "success" && <p className="mt-4 text-sm uppercase tracking-[0.15em] text-green-400">Case received — thank you. We'll review it.</p>}
          {status === "error" && <p className="mt-4 text-sm uppercase tracking-[0.15em] text-red-400">Something went wrong. Please try again in a moment.</p>}
          {status === "needs-description" && <p className="mt-4 text-sm uppercase tracking-[0.15em] text-red-400">Please describe what happened before submitting.</p>}
        </div>
      </div>
    </div>
  )
}

function CTABox({ eyebrow, title, children, button, onClick }) {
  return (
    <div className="group relative overflow-hidden border border-[#F2C94C]/20 bg-[#0d1725] p-7 transition-all hover:border-[#F2C94C]/50 md:p-12">
      <div className="absolute right-0 top-0 h-48 w-48 bg-[#F2C94C]/10 blur-3xl" />
      <div className="relative z-10 mb-5 text-xs uppercase tracking-[0.3em] text-[#F2C94C]">{eyebrow}</div>
      <h3 className="relative z-10 mb-8 text-4xl font-black uppercase leading-[0.95] md:text-5xl">{title}</h3>
      <p className="relative z-10 max-w-md leading-relaxed text-zinc-400">{children}</p>
      <button onClick={onClick} className="relative z-10 mt-10 border border-[#F2C94C]/40 px-8 py-4 text-sm uppercase tracking-[0.25em] text-[#F2C94C] transition-colors hover:bg-[#F2C94C]/10">{button}</button>
    </div>
  )
}

function HomePage({ setPage }) {
  return (
    <>
      <section className="relative border-b border-[#F2C94C]/10">
        <div className="absolute inset-0 bg-gradient-to-br from-[#F2C94C]/10 via-transparent to-transparent" />
        <div className="absolute right-10 top-20 h-80 w-80 rounded-full bg-[#F2C94C]/10 blur-3xl" />
        <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-10 overflow-hidden px-5 py-16 md:px-6 md:py-24 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
          <div>
            <h1 className="break-words text-[3.2rem] font-black uppercase leading-[0.88] tracking-[-0.05em] text-[#F2C94C] sm:text-7xl sm:tracking-tight md:text-8xl md:leading-[0.92]">We<br />Investigate<br />Nonsense.</h1>
            <p className="mt-8 max-w-xl font-serif text-lg italic leading-relaxed text-zinc-300 md:mt-10 md:text-xl">
              Got a weird problem? A strange story? A situation that makes no sense? <strong className="font-black not-italic text-[#F2C94C]">Tell us. We'll look into it.</strong>
            </p>
            <div className="mt-10 flex flex-col flex-wrap gap-4 sm:flex-row sm:gap-5 md:mt-12">
              <button onClick={() => setPage("contact")} className="w-full bg-[#F2C94C] px-8 py-4 text-sm font-black uppercase tracking-[0.22em] text-[#08111C] transition-colors hover:bg-[#ffe082] sm:w-auto md:tracking-[0.25em]">Submit A Mystery</button>
              <button onClick={() => setPage("about")} className="w-full border border-[#F2C94C]/40 px-8 py-4 text-sm uppercase tracking-[0.22em] text-[#F2C94C] transition-colors hover:bg-[#F2C94C]/10 sm:w-auto md:tracking-[0.25em]">Learn More</button>
            </div>
          </div>
          <SubmissionForm />
        </div>
      </section>

      <section className="relative overflow-hidden border-b border-[#F2C94C]/10 py-20 md:py-28">
        <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,_#F2C94C_1px,_transparent_1px),linear-gradient(to_bottom,_#F2C94C_1px,_transparent_1px)] bg-[size:60px_60px]" />
        <div className="relative z-10 mx-auto max-w-7xl px-5 md:px-6">
          <div className="mb-12 text-center md:mb-20">
            <div className="mb-5 text-sm uppercase tracking-[0.3em] text-[#F2C94C]">Investigation Procedure</div>
            <h2 className="text-5xl font-black uppercase tracking-tight text-[#F2C94C] md:text-6xl">How It Works</h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 md:gap-8 lg:grid-cols-4">
            {processSteps.map((item, index) => (
              <div key={item.title} className="flex min-h-[280px] flex-col items-center justify-between border border-[#F2C94C]/20 bg-[#0d1725] p-6 text-center transition-all duration-300 hover:-translate-y-1 hover:border-[#F2C94C]/60 md:min-h-[320px] md:p-8">
                <div className="flex h-28 w-28 items-center justify-center rounded-full border border-[#F2C94C]/30 bg-[#08111C] text-6xl shadow-2xl shadow-[#F2C94C]/10">{item.icon}</div>
                <div className="text-2xl font-black uppercase text-[#F2C94C] opacity-30">0{index + 1}</div>
                <div>
                  <h3 className="text-lg font-black uppercase leading-snug tracking-[0.1em] text-[#F2C94C]">{item.title}</h3>
                  <p className="mt-4 text-sm leading-relaxed text-zinc-400">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-[#F2C94C]/10 py-20 md:py-28">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 md:px-6 lg:grid-cols-2 lg:gap-10">
          <CTABox eyebrow="Archived Investigations" title={<>Check Out<br />Our Most<br />Recent Cases.</>} button="Open Case Files" onClick={() => setPage("case-files")}>Watch the investigations, review the evidence, and decide for yourself what really happened.</CTABox>
          <CTABox eyebrow="Public Discussion Board" title={<>Discuss<br />The Cases.</>} button="Enter Discussion Board" onClick={() => setPage("discussion")}>Post theories, argue interpretations, contribute clues, and interact with other investigators.</CTABox>
        </div>
      </section>

      <section className="border-b border-[#F2C94C]/10 bg-[#050B13] py-10">
        <div className="mx-auto max-w-5xl px-5 text-center text-xs uppercase leading-relaxed tracking-[0.14em] text-zinc-500 md:px-6">
          The Public Investigator does not provide legal, professional, or private investigation services. We do not trespass, harass, or engage in illegal activity. Content is for entertainment and informational purposes only.
        </div>
      </section>
    </>
  )
}

function CaseFilesPage({ setPageCase, cases, casesLoading }) {
  const [searchTerm, setSearchTerm] = useState("")
  const filteredCases = cases.filter((caseFile) => `${caseFile.date} ${caseFile.title} ${caseFile.summary} ${caseFile.status}`.toLowerCase().includes(searchTerm.toLowerCase().trim()))

  return (
    <>
      <PageHeader eyebrow="Case Archive" title="Case Files">Every mystery gets a file. Every file gets a discussion. Every discussion might reopen the case.</PageHeader>
      <section className="py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-5 md:px-6">
          {casesLoading ? (
            <div className="border border-[#F2C94C]/20 bg-[#0d1725] p-10 text-center"><p className="text-sm uppercase tracking-[0.25em] text-zinc-500">Loading case files...</p></div>
          ) : cases.length === 0 ? (
            <div className="border border-[#F2C94C]/20 bg-[#0d1725] p-12 text-center"><div className="mb-4 text-xs uppercase tracking-[0.3em] text-[#F2C94C]">Coming Soon</div><h2 className="mb-4 text-3xl font-black uppercase text-zinc-100">The First Case Is On Its Way.</h2><p className="mx-auto max-w-xl leading-relaxed text-zinc-400">Investigations are being prepared right now. Check back soon, or submit a mystery of your own to help kick things off.</p></div>
          ) : (
            <>
              <div className="mb-10 border border-[#F2C94C]/20 bg-[#0d1725] p-5 md:p-6">
                <div className="mb-3 text-xs uppercase tracking-[0.3em] text-[#F2C94C]">Search The Archive</div>
                <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search by case number, title, status, or keyword..." className="w-full border border-[#F2C94C]/20 bg-[#08111C] px-5 py-4 text-sm uppercase tracking-[0.12em] text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-[#F2C94C]" />
                <div className="mt-3 text-xs uppercase tracking-[0.18em] text-zinc-500">Showing {filteredCases.length} of {cases.length} case files</div>
              </div>
              {filteredCases.length > 0 ? (
                <div className="grid gap-8 lg:grid-cols-3">
                  {filteredCases.map((caseFile) => (
                    <button key={caseFile.id} onClick={() => setPageCase(caseFile.id)} className="group overflow-hidden border border-[#F2C94C]/20 bg-[#0d1725] text-left transition-all hover:-translate-y-1 hover:border-[#F2C94C]/60">
                      <div className="flex h-64 items-center justify-center bg-gradient-to-br from-zinc-800 to-black px-8 text-center text-xs uppercase tracking-[0.25em] text-zinc-500">{caseFile.videoLabel}</div>
                      <div className="p-7">
                        <div className="mb-4 flex items-center justify-between text-xs uppercase tracking-[0.2em] text-[#F2C94C]"><span>{caseFile.date}</span><span>{caseFile.status}</span></div>
                        <h2 className="mb-5 text-3xl font-black uppercase leading-none text-zinc-100 group-hover:text-[#F2C94C]">{caseFile.title}</h2>
                        <p className="leading-relaxed text-zinc-400">{caseFile.summary}</p>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="border border-[#F2C94C]/20 bg-[#0d1725] p-10 text-center"><div className="mb-3 text-xs uppercase tracking-[0.3em] text-[#F2C94C]">No Case Files Found</div><p className="text-zinc-400">Try searching a different case number, title, status, or keyword.</p></div>
              )}
            </>
          )}
        </div>
      </section>
    </>
  )
}

function CaseDetailPage({ caseId, cases, casesLoading, user, navigate }) {
  const caseFile = cases.find((item) => item.id === caseId)
  const [caseComments, setCaseComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [body, setBody] = useState("")
  const [posting, setPosting] = useState(false)

  useEffect(() => {
    if (!caseFile) return
    let active = true
    setLoading(true)
    supabase
      .from("comments")
      .select("*")
      .eq("case_id", caseFile.id)
      .order("created_at", { ascending: true })
      .then(({ data, error }) => {
        if (!active) return
        if (!error) setCaseComments(data || [])
        setLoading(false)
      })
    return () => {
      active = false
    }
  }, [caseFile?.id])

  async function addComment() {
    if (!user || !caseFile || !body.trim() || posting) return
    setPosting(true)
    const { data, error } = await supabase
      .from("comments")
      .insert({ case_id: caseFile.id, user_id: user.id, username: user.username, body: body.trim() })
      .select()
      .single()
    setPosting(false)
    if (!error && data) {
      setCaseComments((prev) => [...prev, data])
      setBody("")
    }
  }

  function formatDate(ts) {
    if (!ts) return ""
    return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }

  if (!caseFile) {
    return (
      <section className="py-32">
        <div className="mx-auto max-w-2xl px-5 text-center md:px-6">
          <p className="text-sm uppercase tracking-[0.25em] text-zinc-500">{casesLoading ? "Loading case..." : "That case could not be found."}</p>
          {!casesLoading && (<button onClick={() => navigate("case-files")} className="mt-6 border border-[#F2C94C]/40 px-6 py-3 text-xs font-black uppercase tracking-[0.25em] text-[#F2C94C] hover:bg-[#F2C94C]/10">Back To Case Files</button>)}
        </div>
      </section>
    )
  }

  return (
    <>
      <PageHeader eyebrow={`${caseFile.date} • ${caseFile.status}`} title={caseFile.title}>{caseFile.summary}</PageHeader>
      <section className="py-20 md:py-28">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 md:px-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="mb-8 flex h-[420px] items-center justify-center border border-[#F2C94C]/20 bg-gradient-to-br from-zinc-900 to-black text-center text-xs uppercase tracking-[0.25em] text-zinc-500">YouTube Episode Embed</div>
            <div className="border border-[#F2C94C]/20 bg-[#0d1725] p-7 md:p-10"><div className="mb-4 text-xs uppercase tracking-[0.3em] text-[#F2C94C]">Case Summary</div><p className="text-lg leading-relaxed text-zinc-300">This is where the full written case file will live: timeline, witnesses, evidence, updates, and final status.</p></div>
          </div>
          <div className="border border-[#F2C94C]/20 bg-[#0d1725] p-6 md:p-8">
            <div className="mb-6 flex items-center justify-between gap-4"><div><div className="text-xs uppercase tracking-[0.3em] text-[#F2C94C]">Case Discussion</div><h2 className="mt-2 text-3xl font-black uppercase">Public Theories</h2></div><button onClick={() => navigate("discussion")} className="text-xs uppercase tracking-[0.18em] text-zinc-500 hover:text-[#F2C94C]">All Threads</button></div>
            <div className="space-y-4">
              {loading ? (
                <p className="text-sm uppercase tracking-[0.18em] text-zinc-500">Loading theories...</p>
              ) : caseComments.length === 0 ? (
                <p className="text-sm uppercase tracking-[0.18em] text-zinc-500">No theories yet. Be the first.</p>
              ) : (
                caseComments.map((comment) => (
                  <div key={comment.id} className="border border-[#F2C94C]/10 bg-[#08111C] p-5"><div className="mb-3 flex items-center justify-between text-xs uppercase tracking-[0.18em]"><span className="text-[#F2C94C]">@{comment.username}</span><span className="text-zinc-500">{formatDate(comment.created_at)}</span></div><p className="leading-relaxed text-zinc-300">{comment.body}</p></div>
                ))
              )}
            </div>
            <div className="mt-6 border-t border-[#F2C94C]/10 pt-6">{user ? (<><textarea value={body} onChange={(event) => setBody(event.target.value)} rows={4} placeholder="Add a theory, clue, or comment..." className="w-full resize-none border border-[#F2C94C]/20 bg-[#08111C] p-4 text-sm outline-none focus:border-[#F2C94C]" /><button onClick={addComment} disabled={posting} className="mt-4 w-full bg-[#F2C94C] px-6 py-4 text-sm font-black uppercase tracking-[0.25em] text-[#08111C] disabled:opacity-60">{posting ? "Posting..." : "Post Comment"}</button></>) : (<button onClick={() => navigate("account", "signup")} className="w-full border border-[#F2C94C]/40 px-6 py-4 text-sm font-black uppercase tracking-[0.25em] text-[#F2C94C] hover:bg-[#F2C94C]/10">Create Account To Comment</button>)}</div>
          </div>
        </div>
      </section>
    </>
  )
}

function DiscussionPage({ setPageCase, cases, casesLoading }) {
  const [searchTerm, setSearchTerm] = useState("")
  const filteredThreads = cases.filter((caseFile) => `${caseFile.date} ${caseFile.title} ${caseFile.summary} ${caseFile.status}`.toLowerCase().includes(searchTerm.toLowerCase().trim()))

  return (
    <>
      <PageHeader eyebrow="Public Discussion Board" title="Discuss The Cases.">Each case has its own thread. Theories, clues, disputes, corrections, and suspicious observations belong here.</PageHeader>
      <section className="py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-5 md:px-6">
          {casesLoading ? (
            <div className="border border-[#F2C94C]/20 bg-[#0d1725] p-10 text-center"><p className="text-sm uppercase tracking-[0.25em] text-zinc-500">Loading discussions...</p></div>
          ) : cases.length === 0 ? (
            <div className="border border-[#F2C94C]/20 bg-[#0d1725] p-12 text-center"><div className="mb-4 text-xs uppercase tracking-[0.3em] text-[#F2C94C]">Coming Soon</div><h2 className="mb-4 text-3xl font-black uppercase text-zinc-100">Discussions Open With The First Case.</h2><p className="mx-auto max-w-xl leading-relaxed text-zinc-400">The boards light up the moment the first investigation drops. Sit tight, or submit a mystery to help start the conversation.</p></div>
          ) : (
            <>
              <div className="mb-10 border border-[#F2C94C]/20 bg-[#0d1725] p-5 md:p-6">
                <div className="mb-3 text-xs uppercase tracking-[0.3em] text-[#F2C94C]">Search Discussions</div>
                <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search by case number, title, status, or keyword..." className="w-full border border-[#F2C94C]/20 bg-[#08111C] px-5 py-4 text-sm uppercase tracking-[0.08em] text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-[#F2C94C] md:tracking-[0.12em]" />
                <div className="mt-3 text-xs uppercase tracking-[0.18em] text-zinc-500">Showing {filteredThreads.length} of {cases.length} discussion threads</div>
              </div>
              {filteredThreads.length > 0 ? (<div className="space-y-5">{filteredThreads.map((caseFile) => (<button key={caseFile.id} onClick={() => setPageCase(caseFile.id)} className="grid w-full gap-6 border border-[#F2C94C]/20 bg-[#0d1725] p-6 text-left transition-all hover:border-[#F2C94C]/60 md:grid-cols-[1fr_auto] md:p-8"><div className="min-w-0"><div className="mb-3 text-xs uppercase tracking-[0.2em] text-[#F2C94C] md:tracking-[0.25em]">{caseFile.date} • {caseFile.status}</div><h2 className="break-words text-3xl font-black uppercase leading-none">{caseFile.title}</h2><p className="mt-4 max-w-3xl leading-relaxed text-zinc-400">{caseFile.summary}</p></div><div className="self-center text-sm uppercase tracking-[0.2em] text-[#F2C94C]">Open Thread</div></button>))}</div>) : (<div className="border border-[#F2C94C]/20 bg-[#0d1725] p-10 text-center"><div className="mb-3 text-xs uppercase tracking-[0.3em] text-[#F2C94C]">No Discussions Found</div><p className="text-zinc-400">Try searching a different case number, title, status, or keyword.</p></div>)}
            </>
          )}
        </div>
      </section>
    </>
  )
}

function AccountPage({ user, initialMode }) {
  const [mode, setMode] = useState(initialMode || "login")
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState(null)
  const [captchaToken, setCaptchaToken] = useState("")
  const captchaRef = useRef(null)
  const widgetIdRef = useRef(null)

  useEffect(() => {
    const SITEKEY = "0x4AAAAAADhka0sijzcck1QK"
    function renderWidget() {
      if (!window.turnstile || !captchaRef.current || widgetIdRef.current !== null) return
      widgetIdRef.current = window.turnstile.render(captchaRef.current, {
        sitekey: SITEKEY,
        theme: "dark",
        callback: (token) => setCaptchaToken(token),
        "error-callback": () => setCaptchaToken(""),
        "expired-callback": () => setCaptchaToken(""),
      })
    }
    if (window.turnstile) {
      renderWidget()
    } else {
      let sc = document.getElementById("cf-turnstile-script")
      if (!sc) {
        sc = document.createElement("script")
        sc.id = "cf-turnstile-script"
        sc.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        sc.async = true
        sc.defer = true
        document.head.appendChild(sc)
      }
      sc.addEventListener("load", renderWidget)
    }
    return () => {
      if (window.turnstile && widgetIdRef.current !== null) {
        try { window.turnstile.remove(widgetIdRef.current) } catch (e) {}
      }
      widgetIdRef.current = null
    }
  }, [user])

  function resetCaptcha() {
    setCaptchaToken("")
    if (window.turnstile && widgetIdRef.current !== null) {
      try { window.turnstile.reset(widgetIdRef.current) } catch (e) {}
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
  }

  async function handleSubmit() {
    setMessage(null)
    if (!captchaToken) {
      setMessage({ type: "error", text: "Hang on a second for the security check to finish, then try again." })
      return
    }
    if (mode === "signup") {
      if (!username.trim() || !email.trim() || !password) {
        setMessage({ type: "error", text: "Please fill in a username, email, and password." })
        return
      }
      setBusy(true)
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { username: username.trim() }, captchaToken },
      })
      setBusy(false)
      if (error) {
        setMessage({ type: "error", text: error.message })
      } else {
        setMessage({ type: "success", text: "Account created. Check your email for a confirmation link, then log in." })
        setMode("login")
        setPassword("")
      }
    } else if (mode === "forgot") {
      if (!email.trim()) {
        setMessage({ type: "error", text: "Please enter your email." })
        return
      }
      setBusy(true)
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { captchaToken, redirectTo: window.location.origin + "/?type=recovery" })
      setBusy(false)
      if (error) setMessage({ type: "error", text: error.message })
      else setMessage({ type: "success", text: "If that email has an account, a reset link is on its way. Check your inbox (and spam)." })
    } else {
      if (!email.trim() || !password) {
        setMessage({ type: "error", text: "Please enter your email and password." })
        return
      }
      setBusy(true)
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password, options: { captchaToken } })
      setBusy(false)
      if (error) setMessage({ type: "error", text: error.message })
    }
    resetCaptcha()
  }

  if (user) {
    return (
      <>
        <PageHeader eyebrow="Account Access" title="Your Investigator Profile.">You are logged in. You can now post in the case discussion boards.</PageHeader>
        <section className="py-20 md:py-28"><div className="mx-auto max-w-2xl px-5 md:px-6"><div className="border border-[#F2C94C]/20 bg-[#0d1725] p-7 md:p-10">
          <div className="mb-6 text-xs uppercase tracking-[0.3em] text-[#F2C94C]">Signed In</div>
          <div className="space-y-3 text-sm uppercase tracking-[0.12em]">
            <div><span className="text-zinc-500">Handle: </span><span className="font-black text-zinc-100">{user.username}</span></div>
            <div><span className="text-zinc-500">Email: </span><span className="text-zinc-100">{user.email}</span></div>
            <div><span className="text-zinc-500">Role: </span><span className="text-[#F2C94C]">{user.role}</span></div>
          </div>
          <button onClick={handleLogout} className="mt-8 w-full border border-[#F2C94C]/40 px-8 py-4 text-sm font-black uppercase tracking-[0.25em] text-[#F2C94C] transition-colors hover:bg-[#F2C94C]/10">Log Out</button>
        </div></div></section>
      </>
    )
  }

  return (
    <>
      <PageHeader eyebrow="Account Access" title={mode === "signup" ? "Create Your Investigator Handle." : mode === "forgot" ? "Reset Your Password." : "Log In To Investigate."}>{mode === "signup" ? "Pick a username that can be referenced in future videos, case updates, and public clue callouts." : mode === "forgot" ? "Enter your email and we will send you a link to set a new password." : "Welcome back. Log in to post theories and join the discussion."}</PageHeader>
      <section className="py-20 md:py-28"><div className="mx-auto max-w-2xl px-5 md:px-6"><div className="border border-[#F2C94C]/20 bg-[#0d1725] p-7 md:p-10">
        <div className="mb-6 flex gap-2">
          <button onClick={() => { setMode("login"); setMessage(null) }} className={`flex-1 px-4 py-3 text-xs font-black uppercase tracking-[0.2em] transition-colors ${mode === "login" ? "bg-[#F2C94C] text-[#08111C]" : "border border-[#F2C94C]/30 text-[#F2C94C]"}`}>Log In</button>
          <button onClick={() => { setMode("signup"); setMessage(null) }} className={`flex-1 px-4 py-3 text-xs font-black uppercase tracking-[0.2em] transition-colors ${mode === "signup" ? "bg-[#F2C94C] text-[#08111C]" : "border border-[#F2C94C]/30 text-[#F2C94C]"}`}>Sign Up</button>
        </div>
        <div className="space-y-4">
          {mode === "signup" && (
            <input value={username} onChange={(e) => setUsername(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") handleSubmit() }} placeholder="Username" className="w-full border border-[#F2C94C]/20 bg-[#08111C] px-5 py-4 text-sm uppercase tracking-[0.12em] outline-none focus:border-[#F2C94C]" />
          )}
          <input value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") handleSubmit() }} type="email" placeholder="Email" className="w-full border border-[#F2C94C]/20 bg-[#08111C] px-5 py-4 text-sm uppercase tracking-[0.12em] outline-none focus:border-[#F2C94C]" />
          {mode !== "forgot" && (
            <input value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") handleSubmit() }} type="password" placeholder="Password" className="w-full border border-[#F2C94C]/20 bg-[#08111C] px-5 py-4 text-sm uppercase tracking-[0.12em] outline-none focus:border-[#F2C94C]" />
          )}
          <div ref={captchaRef} className="flex justify-center"></div>
          <button onClick={handleSubmit} disabled={busy} className="w-full bg-[#F2C94C] px-8 py-5 text-sm font-black uppercase tracking-[0.25em] text-[#08111C] transition-colors hover:bg-[#ffe082] disabled:opacity-60">{busy ? "Working..." : mode === "signup" ? "Create Account" : mode === "forgot" ? "Send Reset Link" : "Log In"}</button>
          {mode === "login" && (
            <button onClick={() => { setMode("forgot"); setMessage(null) }} className="w-full text-center text-xs uppercase tracking-[0.18em] text-zinc-500 transition-colors hover:text-[#F2C94C]">Forgot Password?</button>
          )}
        </div>
        {message && (
          <p className={`mt-5 text-sm tracking-[0.04em] ${message.type === "error" ? "text-red-400" : "text-green-400"}`}>{message.text}</p>
        )}
      </div></div></section>
    </>
  )
}

function ResetPasswordPage({ navigate }) {
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState(null)

  async function handleUpdate() {
    setMessage(null)
    if (password.length < 6) {
      setMessage({ type: "error", text: "Password must be at least 6 characters." })
      return
    }
    if (password !== confirm) {
      setMessage({ type: "error", text: "Those passwords do not match." })
      return
    }
    setBusy(true)
    const { error } = await supabase.auth.updateUser({ password })
    setBusy(false)
    if (error) setMessage({ type: "error", text: error.message })
    else {
      setMessage({ type: "success", text: "Password updated. You are logged in." })
      navigate("account")
    }
  }

  return (
    <>
      <PageHeader eyebrow="Account Access" title="Set A New Password.">Choose a new password for your account below.</PageHeader>
      <section className="py-20 md:py-28"><div className="mx-auto max-w-2xl px-5 md:px-6"><div className="border border-[#F2C94C]/20 bg-[#0d1725] p-7 md:p-10">
        <div className="space-y-4">
          <input value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") handleUpdate() }} type="password" placeholder="New Password" className="w-full border border-[#F2C94C]/20 bg-[#08111C] px-5 py-4 text-sm uppercase tracking-[0.12em] outline-none focus:border-[#F2C94C]" />
          <input value={confirm} onChange={(e) => setConfirm(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") handleUpdate() }} type="password" placeholder="Confirm New Password" className="w-full border border-[#F2C94C]/20 bg-[#08111C] px-5 py-4 text-sm uppercase tracking-[0.12em] outline-none focus:border-[#F2C94C]" />
          <button onClick={handleUpdate} disabled={busy} className="w-full bg-[#F2C94C] px-8 py-5 text-sm font-black uppercase tracking-[0.25em] text-[#08111C] transition-colors hover:bg-[#ffe082] disabled:opacity-60">{busy ? "Working..." : "Update Password"}</button>
        </div>
        {message && (
          <p className={`mt-5 text-sm tracking-[0.04em] ${message.type === "error" ? "text-red-400" : "text-green-400"}`}>{message.text}</p>
        )}
      </div></div></section>
    </>
  )
}

function AboutPage() {
  const aboutSteps = [
    { title: "You tell us. We listen.", body: "You submit the strange story, petty dispute, missing item, bizarre rumor, or situation that makes absolutely no sense. We read it, look for the hook, and decide whether it has the right mix of mystery, humor, and public interest." },
    { title: "We investigate. We film it.", body: "If the case has potential, we build a plan, ask questions, chase leads, talk to people, document the process, and film the investigation in a way that turns the story into entertaining content." },
    { title: "We find answers (maybe).", body: "Some mysteries get solved. Some only get stranger. The goal is to follow the weird wherever it leads, uncover whatever can reasonably be uncovered, and present the evidence without pretending every case has a perfect ending." },
    { title: "You watch. We all decide.", body: "The audience watches the case file, discusses theories, submits clues, argues over the evidence, and helps decide what really happened. A strong viewer contribution may even reopen a case." },
  ]

  return (
    <>
      <PageHeader eyebrow="About The Operation" title="The Authorities Have Better Things To Do.">The Public Investigator examines strange stories, petty disputes, bizarre rumors, and unexplained nonsense for entertainment and public discussion.</PageHeader>
      <section className="py-20 md:py-28"><div className="mx-auto grid max-w-7xl gap-8 px-5 md:px-6 sm:grid-cols-2 lg:grid-cols-4">{aboutSteps.map((step, index) => (<div key={step.title} className="border border-[#F2C94C]/20 bg-[#0d1725] p-8"><div className="mb-5 text-5xl font-black text-[#F2C94C]/30">0{index + 1}</div><h2 className="mb-5 break-words text-2xl font-black uppercase leading-tight text-[#F2C94C]">{step.title}</h2><p className="leading-relaxed text-zinc-400">{step.body}</p></div>))}</div></section>
      <section className="border-t border-[#F2C94C]/10 py-14"><div className="mx-auto max-w-7xl px-5 text-center md:px-6"><div className="mb-5 text-xs uppercase tracking-[0.3em] text-[#F2C94C]">Follow The Investigation</div><div className="flex flex-wrap items-center justify-center gap-6 text-sm uppercase tracking-[0.14em] text-[#F2C94C] md:gap-10 md:tracking-[0.18em]"><a href="https://www.instagram.com/brettsanchez.tv" target="_blank" rel="noreferrer" className="transition-colors hover:text-zinc-100">Instagram - @BrettSanchez.TV</a><a href="https://www.tiktok.com/@brettsanchez.tv" target="_blank" rel="noreferrer" className="transition-colors hover:text-zinc-100">TikTok - @BrettSanchez.TV</a><a href="https://www.youtube.com/@BrettSanchezTV" target="_blank" rel="noreferrer" className="transition-colors hover:text-zinc-100">YouTube - @BrettSanchezTV</a><a href="https://x.com/BrettSanchezTV" target="_blank" rel="noreferrer" className="transition-colors hover:text-zinc-100">X - @BrettSanchezTV</a><a href="https://www.reddit.com/r/ThePublicInvestigator" target="_blank" rel="noreferrer" className="transition-colors hover:text-zinc-100">Reddit - r/ThePublicInvestigator</a></div></div></section>
    </>
  )
}

function ContactPage() {
  return (
    <>
      <PageHeader eyebrow="Contact" title="Submit A Mystery Or Reach Out.">Send the case, the clue, the business inquiry, or the strange thing you cannot explain.</PageHeader>
      <section className="py-20 md:py-28"><div className="mx-auto grid max-w-7xl gap-10 px-5 md:px-6 lg:grid-cols-[0.9fr_1.1fr]"><div className="border border-[#F2C94C]/20 bg-[#0d1725] p-5 sm:p-8"><div className="mb-6 text-xs uppercase tracking-[0.3em] text-[#F2C94C]">Direct Line</div><div className="space-y-5 break-words text-sm uppercase tracking-[0.08em] text-zinc-300 md:tracking-[0.14em]"><div className="border-b border-[#F2C94C]/10 pb-5"><div className="mb-2 text-xs text-zinc-500">Call or Text</div><a href="tel:5042520313" className="text-lg font-black text-zinc-100 transition-colors hover:text-[#F2C94C]">504-252-0313</a></div><div className="border-b border-[#F2C94C]/10 pb-5"><div className="mb-2 text-xs text-zinc-500">Website</div><a href="https://thepublicinvestigator.com" target="_blank" rel="noreferrer" className="text-lg font-black text-[#F2C94C] transition-colors hover:text-zinc-100">thepublicinvestigator.com</a></div><div className="flex items-center gap-3 border-b border-[#F2C94C]/10 pb-5"><InstagramLogo /><div><div className="mb-1 text-xs text-zinc-500">Instagram</div><a href="https://www.instagram.com/brettsanchez.tv" target="_blank" rel="noreferrer" className="font-black text-[#F2C94C] transition-colors hover:text-zinc-100">@BrettSanchez.TV</a></div></div><div className="flex items-center gap-3 border-b border-[#F2C94C]/10 pb-5"><TikTokLogo /><div><div className="mb-1 text-xs text-zinc-500">TikTok</div><a href="https://www.tiktok.com/@brettsanchez.tv" target="_blank" rel="noreferrer" className="font-black text-[#F2C94C] transition-colors hover:text-zinc-100">@BrettSanchez.TV</a></div></div><div className="flex items-center gap-3 border-b border-[#F2C94C]/10 pb-5"><YouTubeLogo /><div><div className="mb-1 text-xs text-zinc-500">YouTube</div><a href="https://www.youtube.com/@BrettSanchezTV" target="_blank" rel="noreferrer" className="font-black text-[#F2C94C] transition-colors hover:text-zinc-100">@BrettSanchezTV</a></div></div><div className="flex items-center gap-3 border-b border-[#F2C94C]/10 pb-5"><XLogo /><div><div className="mb-1 text-xs text-zinc-500">X</div><a href="https://x.com/BrettSanchezTV" target="_blank" rel="noreferrer" className="font-black text-[#F2C94C] transition-colors hover:text-zinc-100">@BrettSanchezTV</a></div></div><div className="flex items-center gap-3"><RedditLogo /><div><div className="mb-1 text-xs text-zinc-500">Reddit</div><a href="https://www.reddit.com/r/ThePublicInvestigator" target="_blank" rel="noreferrer" className="break-words font-black text-[#F2C94C] transition-colors hover:text-zinc-100">r/ThePublicInvestigator</a></div></div></div></div><SubmissionForm /></div></section>
    </>
  )
}

export default function PublicInvestigatorFullSite() {
  const initialRoute = isRecoveryLink ? { page: "reset-password", caseId: null } : readRoute()
  const [page, setPage] = useState(initialRoute.page)
  const [activeCaseId, setActiveCaseId] = useState(initialRoute.caseId)
  const [user, setUser] = useState(null)
  const [comments, setComments] = useState(starterComments)
  const [accountMode, setAccountMode] = useState("login")
  const [cases, setCases] = useState([])
  const [casesLoading, setCasesLoading] = useState(true)

  const userNavigatedRef = useRef(false)

  function navigate(targetPage, mode) {
    userNavigatedRef.current = true
    setActiveCaseId(null)
    if (mode) setAccountMode(mode)
    setPage(targetPage)
  }

  useEffect(() => { window.scrollTo({ top: 0, left: 0, behavior: "smooth" }) }, [page, activeCaseId])

  useEffect(() => {
    let hash = ""
    if (activeCaseId) hash = "#/case/" + encodeURIComponent(activeCaseId)
    else if (page && page !== "home") hash = "#/" + page
    if (window.location.hash !== hash) {
      if (hash === "") {
        window.history.replaceState(null, "", window.location.pathname + window.location.search)
      } else {
        window.location.hash = hash
      }
    }
  }, [page, activeCaseId])

  useEffect(() => {
    function onHashChange() {
      const r = readRoute()
      setActiveCaseId(r.caseId)
      setPage(r.page)
    }
    window.addEventListener("hashchange", onHashChange)
    return () => window.removeEventListener("hashchange", onHashChange)
  }, [])

  useEffect(() => {
    supabase
      .from("cases")
      .select("*")
      .order("sort_order", { ascending: true })
      .then(({ data, error }) => {
        if (!error) {
          setCases((data || []).map((c) => ({ id: c.id, title: c.title, status: c.status, location: c.location, date: c.date, summary: c.summary, videoLabel: c.video_label })))
        }
        setCasesLoading(false)
      })
  }, [])

  useEffect(() => {
    async function loadUser(authUser) {
      if (!authUser) { setUser(null); return }
      const { data: profile } = await supabase
        .from("profiles")
        .select("username, role")
        .eq("id", authUser.id)
        .maybeSingle()
      setUser({
        id: authUser.id,
        email: authUser.email,
        username: profile?.username || authUser.email,
        role: profile?.role || "member",
      })
    }
    supabase.auth.getSession().then(({ data: { session } }) => loadUser(session?.user ?? null))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" && !userNavigatedRef.current) {
        setActiveCaseId(null)
        setPage("reset-password")
      }
      loadUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  const content = useMemo(() => {
    if (activeCaseId) return <CaseDetailPage caseId={activeCaseId} cases={cases} casesLoading={casesLoading} user={user} navigate={navigate} />
    if (page === "case-files") return <CaseFilesPage setPageCase={setActiveCaseId} cases={cases} casesLoading={casesLoading} />
    if (page === "discussion") return <DiscussionPage setPageCase={setActiveCaseId} cases={cases} casesLoading={casesLoading} />
    if (page === "about") return <AboutPage />
    if (page === "contact") return <ContactPage />
    if (page === "account") return <AccountPage user={user} initialMode={accountMode} />
    if (page === "reset-password") return <ResetPasswordPage navigate={navigate} />
    return <HomePage setPage={setPage} />
  }, [page, activeCaseId, comments, user, accountMode, cases, casesLoading])

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#08111C] font-sans text-[#F5F5F5]">
      <div className="pointer-events-none fixed inset-0 opacity-[0.03] bg-[radial-gradient(circle_at_center,_white_1px,_transparent_1px)] bg-[size:18px_18px]" />
      <Nav page={page} setPage={setPage} user={user} setPageCase={setActiveCaseId} navigate={navigate} />
      {content}
      <SocialStrip />
    </div>
  )
}
