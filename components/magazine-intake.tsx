'use client'

import { ChangeEvent, DragEvent, useMemo, useRef, useState } from 'react'
import { briefStore } from '@/lib/brief-store'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { ThemeToggle } from '@/components/theme-toggle'
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  CakeSlice,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  Heart,
  ImagePlus,
  LoaderCircle,
  NotebookPen,
  Pencil,
  Sparkles,
  Trash2,
  Upload,
  Users,
} from 'lucide-react'

type CategoryId = 'birthday' | 'anniversary' | 'parents' | 'business' | 'family' | 'custom'
type Step = 'welcome' | 'category' | 'format' | 'questions' | 'images' | 'details' | 'review' | 'success'
type MagazineImage = { id: string; file: File; url: string }
type PagePrompt = { page: number; title: string; prompt: string; photoPrompt: string }

type Category = {
  id: CategoryId
  title: string
  description: string
  icon: typeof CakeSlice
  questions: { id: string; label: string; placeholder: string; type?: 'text' | 'date' | 'textarea' }[]
  pages: PagePrompt[]
}

const birthdayPages = [
  ['Cover Page', 'The honoree’s name, birthday milestone and a cover message.', 'Which photo should appear on the cover?'],
  ["Editor’s Note", 'A message from the friend creating the magazine.', 'Choose a portrait or behind-the-scenes photo for this page.'],
  ['Birthday Wishes', 'A special birthday wish from the friend.', 'Would you like a photo beside the birthday wish?'],
  ['How We Met', 'The story of how the friendship started.', 'Choose a photo from your early days together.'],
  ['My First Impression of You', 'What I thought about you when we first met.', 'Which image captures their personality?'],
  ['Things I Love About You', 'Your personality, kindness, humor and everything you treasure.', 'Pick a candid photo or let this page be text-led.'],
  ['Our Favorite Memory', 'The best moment you have shared together.', 'Which photo belongs with this memory?'],
  ['Funny Moments Together', 'Funny stories and inside jokes.', 'Choose a playful or funny image.'],
  ['What Makes You Special', 'Why they are different and important to you.', 'Would you like to feature a close-up portrait?'],
  ["Things You’ve Taught Me", 'Lessons you have learned from this friendship.', 'Pick an image that feels thoughtful or nostalgic.'],
  ['Reasons I’m Grateful for You', 'The things you appreciate most.', 'Which photo best represents your gratitude?'],
  ['Photo Memories', 'A curated spread of special moments together.', 'List the photos you want in this gallery.'],
  ['An Open Letter to You', 'A heartfelt letter from friend to friend.', 'Choose a quiet portrait or leave this page without an image.'],
  ['My Wishes and Prayers for You', 'Birthday blessings and hopes for the future.', 'Would you like a hopeful or celebratory photo here?'],
  ['Final Message', 'A closing thank-you, favorite quote or final photo.', 'Which image should close the magazine?'],
]
const anniversaryPages = [
  ['Cover Page', 'The couple’s names, anniversary date and favorite cover message.', 'Which favorite photo should appear on the cover?'],
  ["Editor’s Note", 'A special introduction to the couple.', 'Choose a portrait of the couple for this page.'],
  ['Anniversary Wishes', 'Heartfelt wishes for the couple.', 'Which image belongs beside the wishes?'],
  ['How You Met', 'The story of how the couple first met.', 'Choose a photo from the beginning of their story.'],
  ['The Love Story', 'How the relationship grew over time.', 'Which image shows their journey?'],
  ['First Date Memories', 'Memories from the first date or early days together.', 'Pick a nostalgic photo.'],
  ['Favorite Moments Together', 'Special memories shared by the couple.', 'Which photos should feature here?'],
  ['Things We Love About Each Other', 'Qualities each partner admires in the other.', 'Choose a candid or portrait photo.'],
  ['Funny and Cute Moments', 'Funny stories and inside jokes.', 'Which playful image fits this page?'],
  ['Challenges We Overcame Together', 'How the couple supported one another.', 'Would a meaningful photo accompany this story?'],
  ['Our Best Adventures', 'Trips, outings and exciting experiences.', 'List the adventure photos for this page.'],
  ['Photo Gallery', 'Pictures from different stages of the relationship.', 'Which images belong in the gallery?'],
  ['A Love Letter', 'A heartfelt letter from one partner to the other.', 'Choose a romantic portrait or leave it text-led.'],
  ['Future Dreams Together', 'Goals, dreams and plans for the future.', 'Pick an image that feels hopeful.'],
  ['Final Message & Blessing', 'A closing tribute, prayer, quote and anniversary wishes.', 'Which photo should close the magazine?'],
]
const parentsPages = [
  ['Cover Page', 'Your friend’s name, your name, date and a beautiful cover message.', 'Which photo should appear on the cover?'],
  ["Editor’s Note", 'Why you created this magazine for your friend.', 'Choose a warm photo of the two of you.'],
  ['Friendship Wishes', 'Sweet wishes and greetings to your friend.', 'Would you like a photo beside this message?'],
  ['About My Friend', 'Who they are and what makes them unique.', 'Which portrait captures them best?'],
  ['How We Met', 'The story of how your friendship began.', 'Choose a photo from your early days together.'],
  ['My Favorite Memory With You', 'A special memory you shared together.', 'Choose the photo that belongs with this memory.'],
  ['Things I Love About You', 'The things you truly love about your friend.', 'Pick a candid photo of the two of you.'],
  ['Lessons You Have Taught Me', 'Life lessons, values and things they have shown you.', 'Which thoughtful image fits this page?'],
  ['Thank You for Everything', 'A message of appreciation for their friendship.', 'Choose a photo that feels grateful.'],
  ['Funny and Sweet Moments', 'Funny stories, inside jokes and cute memories.', 'Which playful photo should appear here?'],
  ['Why You Matter to Me', 'Why they inspire you and mean so much.', 'Pick a powerful portrait or shared moment.'],
  ['Photo Gallery', 'Pictures with captions.', 'List the photos you want in this gallery.'],
  ['A Letter to My Friend', 'A full heartfelt letter directly to them.', 'Choose a quiet portrait or leave it text-led.'],
  ['My Wishes for You', 'Hopes for their future, health and happiness.', 'Which hopeful photo belongs here?'],
  ['Final Message', 'A strong ending message and celebration of your friendship.', 'Which final image should close the magazine?'],
]

const toPages = (items: string[][]): PagePrompt[] => items.map(([title, prompt, photoPrompt], index) => ({ page: index + 1, title, prompt, photoPrompt }))
const genericPages = (title: string): PagePrompt[] => toPages([
  ['Cover Page', `The title, people and message that introduce your ${title.toLowerCase()} magazine.`, 'Which photo should appear on the cover?'],
  ["Editor’s Note", 'A short introduction to why this magazine was created.', 'Choose an opening image.'],
  ['The Story', 'The story, background or beginning readers should know.', 'Which image helps tell this story?'],
  ['People & Personalities', 'The people, roles and personalities at the heart of the magazine.', 'Pick a portrait or group image.'],
  ['Milestones', 'Important moments, achievements or changes worth remembering.', 'Which milestone photos should appear?'],
  ['What Makes It Special', 'The values, details and qualities that make this subject unique.', 'Choose an image that captures the feeling.'],
  ['Behind the Scenes', 'The small details and unseen moments behind the story.', 'Would you like a candid image here?'],
  ['Favorite Moments', 'The most memorable moments and highlights.', 'Which photos belong with these memories?'],
  ['A Personal Message', 'A letter, tribute or message from the person creating the magazine.', 'Choose a meaningful portrait or leave text-led.'],
  ['Photo Gallery', 'A visual collection of the best images.', 'List the photos you want in this gallery.'],
  ['Looking Ahead', 'Hopes, plans, dreams or the next chapter.', 'Choose a hopeful closing image.'],
  ['Final Message', 'A strong closing note, quote or final tribute.', 'Which image should close the magazine?'],
])

const categories: Category[] = [
  { id: 'birthday', title: 'Birthday', description: "Celebrate someone's special day", icon: CakeSlice, questions: [{ id: 'honoree', label: 'Who is this magazine celebrating?', placeholder: 'Their name' }, { id: 'age', label: 'What birthday are they marking?', placeholder: 'For example, 30th birthday' }, { id: 'memories', label: 'What makes them unforgettable?', placeholder: 'Share memories, inside jokes, milestones or qualities…', type: 'textarea' }], pages: toPages(birthdayPages) },
  { id: 'anniversary', title: 'Anniversary', description: "Honor a couple's love story", icon: Heart, questions: [{ id: 'couple', label: 'Who is this celebration for?', placeholder: 'Names of the couple' }, { id: 'date', label: 'When did their story begin?', placeholder: '', type: 'date' }, { id: 'story', label: 'Tell us the story worth remembering', placeholder: 'How they met, adventures, family moments and what makes them special…', type: 'textarea' }], pages: toPages(anniversaryPages) },
  { id: 'parents', title: 'Friendship', description: 'Celebrate the people who make life special', icon: Users, questions: [{ id: 'parent', label: 'Who are you celebrating?', placeholder: 'Their name or names' }, { id: 'relationship', label: 'What do they mean to you?', placeholder: 'For example, my best friend, my chosen family, my constant' }, { id: 'tribute', label: 'What would you love them to know?', placeholder: 'A heartfelt message, shared memories or what makes this friendship special…', type: 'textarea' }], pages: toPages(parentsPages) },
  { id: 'business', title: 'Business', description: 'Feature a brand, founder or milestone', icon: BriefcaseBusiness, questions: [{ id: 'brand', label: 'What brand or business is this about?', placeholder: 'Company or founder name' }, { id: 'milestone', label: 'What are you celebrating?', placeholder: 'For example, a launch, anniversary or founder story' }, { id: 'positioning', label: 'What should readers take away?', placeholder: 'The story, values, people and achievements to highlight…', type: 'textarea' }], pages: genericPages('business') },
  { id: 'family', title: 'Family', description: 'Turn everyday moments into a keepsake', icon: NotebookPen, questions: [{ id: 'familyName', label: 'What family or people should we feature?', placeholder: 'Family name or names' }, { id: 'season', label: 'Is there a moment or season to capture?', placeholder: 'For example, a reunion, new home or holiday' }, { id: 'familyStory', label: 'What should the magazine feel like?', placeholder: 'Share the moments, traditions and details that feel like home…', type: 'textarea' }], pages: genericPages('family') },
  { id: 'custom', title: 'Something else', description: 'A magazine made around your idea', icon: Sparkles, questions: [{ id: 'idea', label: 'What would you like to create?', placeholder: 'Give your magazine a working title' }, { id: 'audience', label: 'Who is it for?', placeholder: 'The person, people or audience' }, { id: 'direction', label: 'Tell us about your vision', placeholder: 'Anything about the story, tone, mood or details you have in mind…', type: 'textarea' }], pages: genericPages('custom') },
]

const maxImages = 20
const maxImageSize = 10 * 1024 * 1024
const inputClass = 'w-full rounded-xl border border-memo-line bg-memo-panel px-4 py-4 text-base text-foreground outline-none placeholder:text-memo-muted/70 focus:border-memo-gold'

export function MagazineIntake() {
  const [step, setStep] = useState<Step>('welcome')
  const [categoryId, setCategoryId] = useState<CategoryId | null>(null)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [format, setFormat] = useState({ size: '', pages: '' })
  const [pageNotes, setPageNotes] = useState<Record<number, string>>({})
  const [pageImages, setPageImages] = useState<Record<number, string>>({})
  const [details, setDetails] = useState({ name: '', email: '', notes: '' })
  const [images, setImages] = useState<MagazineImage[]>([])
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)
  const category = useMemo(() => categories.find((item) => item.id === categoryId), [categoryId])
  const pageCount = Number(format.pages) || 15
  const visiblePages = category?.pages.slice(0, pageCount) ?? []
  const progress = step === 'category' ? 1 : step === 'format' ? 2 : step === 'questions' ? 3 : step === 'images' ? 4 : step === 'details' ? 5 : step === 'review' ? 6 : 0

  const goBack = () => { setError(''); if (step === 'category') setStep('welcome'); else if (step === 'format') setStep('category'); else if (step === 'questions') setStep('format'); else if (step === 'images') setStep('questions'); else if (step === 'details') setStep('images'); else if (step === 'review') setStep('details') }
  const chooseCategory = (id: CategoryId) => { setCategoryId(id); setAnswers({}); setPageNotes({}); setPageImages({}); setError(''); setStep('format') }
  const updateAnswer = (id: string, value: string) => setAnswers((current) => ({ ...current, [id]: value }))
  const chooseFormat = () => { if (!format.size || !format.pages) { setError('Choose a paper size and page count to continue.'); return }; setError(''); setStep('questions') }
  const continueQuestions = () => { if (!category || category.questions.some((question) => !answers[question.id]?.trim())) { setError('Please answer each question so we can shape the magazine around your story.'); return }; setError(''); setStep('images') }
  const addFiles = (files: FileList | File[]) => { const next = Array.from(files); if (!next.length) return; if (images.length + next.length > maxImages) { setError(`You can add up to ${maxImages} images.`); return }; const valid = next.filter((file) => file.type.startsWith('image/') && file.size <= maxImageSize); if (valid.length !== next.length) { setError('Please choose image files smaller than 10 MB each.'); return }; setImages((current) => [...current, ...valid.map((file) => ({ id: `${file.name}-${file.lastModified}-${Math.random()}`, file, url: URL.createObjectURL(file) }))]); setError('') }
  const onDrop = (event: DragEvent<HTMLDivElement>) => { event.preventDefault(); addFiles(event.dataTransfer.files) }
  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => { if (event.target.files) addFiles(event.target.files); event.target.value = '' }
  const continueImages = () => { if (!images.length) { setError('Add at least one image so we can plan the visual direction.'); return }; setError(''); setStep('details') }
  const continueDetails = () => { if (!details.name.trim() || !details.email.trim() || !/^\S+@\S+\.\S+$/.test(details.email)) { setError('Add your name and a valid email address so we know where to follow up.'); return }; setError(''); setStep('review') }
  const submit = async () => {
    if (!category) return
    setIsSubmitting(true)
    setError('')

    const isSupabase = briefStore.isSupabaseConfigured()
    const briefId = crypto.randomUUID()
    const uploadedPaths: string[] = []
    let uploadedImages = []

    try {
      if (isSupabase && supabase) {
        const client = supabase
        uploadedImages = await Promise.all(images.map(async (image, index) => {
          const safeName = image.file.name.toLowerCase().replace(/[^a-z0-9._-]+/g, '-').slice(-80) || `image-${index + 1}.jpg`
          const path = `${briefId}/${String(index + 1).padStart(2, '0')}-${safeName}`
          const { error: uploadError } = await client.storage.from('magazine-images').upload(path, image.file, { contentType: image.file.type, cacheControl: '3600', upsert: false })
          if (uploadError) throw uploadError
          uploadedPaths.push(path)
          const { data } = client.storage.from('magazine-images').getPublicUrl(path)
          return { name: image.file.name, path, url: data.publicUrl, size: image.file.size, type: image.file.type }
        }))
      } else {
        uploadedImages = images.map((image) => ({
          name: image.file.name,
          url: image.url || URL.createObjectURL(image.file),
          size: image.file.size,
          type: image.file.type
        }))
      }

      const mappedPageImages: Record<number, string> = {}
      Object.entries(pageImages).forEach(([page, imgId]) => {
        const img = images.find(i => i.id === imgId)
        if (img) {
          mappedPageImages[Number(page)] = img.file.name
        }
      })

      const briefData = {
        id: isSupabase ? briefId : `local-${briefId}`,
        category: category.title,
        contact_name: details.name.trim(),
        contact_email: details.email.trim().toLowerCase(),
        answers,
        format,
        page_notes: pageNotes,
        page_images: mappedPageImages,
        additional_notes: details.notes.trim(),
        images: uploadedImages,
        status: 'submitted' as const,
        created_at: new Date().toISOString()
      }

      await briefStore.saveBrief(briefData)

      // Send email notification to admin (non-blocking)
      fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          briefId: briefData.id,
          clientName: briefData.contact_name,
          clientEmail: briefData.contact_email,
          category: briefData.category,
          format: briefData.format,
        }),
      }).catch((err) => console.error('Failed to notify admin via email:', err))

      setIsSubmitting(false)
      setStep('success')
    } catch (submissionError) {
      if (isSupabase && uploadedPaths.length && supabase) {
        await supabase.storage.from('magazine-images').remove(uploadedPaths)
      }
      console.error('Magazine brief submission failed:', submissionError)
      setError('We could not save your magazine brief. Please check your connection and try again.')
      setIsSubmitting(false)
    }
  }
  const restart = () => { setStep('welcome'); setCategoryId(null); setAnswers({}); setFormat({ size: '', pages: '' }); setPageNotes({}); setPageImages({}); setDetails({ name: '', email: '', notes: '' }); setImages([]); setError('') }
  if (step === 'success') return <SuccessScreen onRestart={restart} />

  return <main className="min-h-screen overflow-hidden bg-background text-foreground transition-colors duration-300"><div className="pointer-events-none fixed inset-0 bg-memo-noise opacity-30" /><header className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-6 sm:px-10 lg:px-14"><button className="flex items-center gap-3" aria-label="Nuline magazine home" onClick={restart}><span className="flex size-10 items-center justify-center rounded-full border border-memo-gold/50 bg-memo-blue/50"><Sparkles className="size-4 text-memo-gold" /></span><span className="font-serif text-xl italic tracking-wide text-memo-gold">Nuline magazine</span></button><div className="flex items-center gap-6 text-xs uppercase tracking-[0.2em] text-memo-muted"><span className="hidden sm:block">Your story, beautifully told</span><ThemeToggle /></div></header>{step !== 'welcome' && <ProgressBar progress={progress} onBack={goBack} total={6} />}<div className="relative z-10 mx-auto flex min-h-[calc(100vh-96px)] w-full max-w-7xl flex-col px-6 pb-12 sm:px-10 lg:px-14">{step === 'welcome' && <WelcomeScreen onStart={() => setStep('category')} />}{step === 'category' && <CategoryScreen onChoose={chooseCategory} />}{step === 'format' && category && <FormatScreen category={category} format={format} setFormat={setFormat} onContinue={chooseFormat} error={error} />}{step === 'questions' && category && <QuestionScreen category={category} answers={answers} onChange={updateAnswer} onContinue={continueQuestions} error={error} />}{step === 'images' && category && <ImagePlanScreen pages={visiblePages} images={images} pageNotes={pageNotes} pageImages={pageImages} setPageNotes={setPageNotes} setPageImages={setPageImages} onDrop={onDrop} onFileChange={onFileChange} fileInput={fileInput} removeImage={(id) => setImages((current) => current.filter((image) => image.id !== id))} onContinue={continueImages} error={error} />}{step === 'details' && <DetailsScreen details={details} setDetails={setDetails} images={images} onContinue={continueDetails} error={error} />}{step === 'review' && category && <ReviewScreen category={category} format={format} answers={answers} details={details} images={images} pageImages={pageImages} pageNotes={pageNotes} onEdit={setStep} onSubmit={submit} isSubmitting={isSubmitting} error={error} />}</div></main>
}

function ProgressBar({ progress, onBack, total }: { progress: number; onBack: () => void; total: number }) { return <div className="relative z-10 mx-auto flex w-full max-w-7xl items-center gap-4 px-6 sm:px-10 lg:px-14"><button onClick={onBack} className="flex items-center gap-2 text-sm text-memo-muted transition hover:text-memo-cream"><ArrowLeft className="size-4" /> Back</button><div className="h-px flex-1 bg-memo-line"><div className="h-full bg-memo-gold transition-all duration-500" style={{ width: `${progress / total * 100}%` }} /></div><span className="font-mono text-xs text-memo-muted">0{progress} / 0{total}</span></div> }
function WelcomeScreen({ onStart }: { onStart: () => void }) { return <section className="flex flex-1 flex-col justify-center py-16 lg:py-20"><div className="max-w-3xl"><p className="mb-8 flex items-center gap-3 text-xs uppercase tracking-[0.32em] text-memo-gold"><span className="h-px w-10 bg-memo-gold" /> Personalized magazines for every moment</p><h1 className="max-w-3xl font-serif text-5xl leading-[0.95] text-balance sm:text-7xl lg:text-8xl">Your moment, <em className="text-memo-gold">in print.</em></h1><p className="mt-8 max-w-xl text-lg leading-8 text-memo-muted sm:text-xl">Tell us the story, choose the format and guide us page by page. We’ll shape a beautiful magazine around the people and moments that matter most.</p><button onClick={onStart} className="mt-10 inline-flex items-center gap-3 rounded-full bg-memo-gold px-7 py-4 text-sm font-semibold text-memo-ink transition hover:bg-memo-gold-light">Create your magazine <ArrowRight className="size-4" /></button></div><div className="mt-20 flex flex-wrap gap-x-10 gap-y-4 text-xs uppercase tracking-[0.24em] text-memo-muted"><span className="flex items-center gap-2"><Check className="size-4 text-memo-gold" /> Page-by-page planning</span><span className="flex items-center gap-2"><Check className="size-4 text-memo-gold" /> Your images welcome</span><span className="flex items-center gap-2"><Check className="size-4 text-memo-gold" /> A keepsake made around you</span></div></section> }
function CategoryScreen({ onChoose }: { onChoose: (id: CategoryId) => void }) { return <section className="flex-1 py-14 lg:py-20"><div className="mb-10 max-w-xl"><p className="text-xs uppercase tracking-[0.28em] text-memo-gold">Let’s begin</p><h1 className="mt-4 font-serif text-4xl text-balance sm:text-5xl">What would you like to create?</h1><p className="mt-4 leading-7 text-memo-muted">Choose a starting point. We’ll ask the right questions and create a page plan tailored to your idea.</p></div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{categories.map((item) => { const Icon = item.icon; return <button key={item.id} onClick={() => onChoose(item.id)} className="group flex min-h-48 flex-col justify-between rounded-2xl border border-memo-line bg-memo-panel p-6 text-left transition hover:-translate-y-1 hover:border-memo-gold/70 hover:bg-memo-panel-hover"><span className="flex size-11 items-center justify-center rounded-full border border-memo-line bg-memo-blue text-memo-gold"><Icon className="size-5" /></span><span><span className="flex items-center justify-between font-serif text-2xl text-foreground"><span>{item.title}</span><ChevronRight className="size-5 text-memo-gold opacity-0 transition group-hover:opacity-100" /></span><span className="mt-2 block text-sm text-memo-muted">{item.description}</span></span></button> })}</div></section> }
function FormatScreen({ category, format, setFormat, onContinue, error }: { category: Category; format: { size: string; pages: string }; setFormat: (value: { size: string; pages: string }) => void; onContinue: () => void; error: string }) { return <section className="flex-1 py-14 lg:py-20"><div className="mb-10 max-w-2xl"><p className="text-xs uppercase tracking-[0.28em] text-memo-gold">{category.title} magazine</p><h1 className="mt-4 font-serif text-4xl sm:text-5xl">Choose the shape of your story.</h1><p className="mt-4 leading-7 text-memo-muted">Start with the physical feel of the magazine. We’ll then tailor the questions and page plan to match.</p></div><div className="grid max-w-3xl gap-5 sm:grid-cols-2"><label className="rounded-2xl border border-memo-line bg-memo-panel p-6"><span className="block text-sm font-medium">Paper size</span><span className="mt-1 block text-sm text-memo-muted">Choose the finished magazine size.</span><select value={format.size} onChange={(event) => setFormat({ ...format, size: event.target.value })} className={`${inputClass} mt-5`}><option value="">Select a size</option><option value="A4">A4 — classic editorial</option><option value="A3">A3 — spacious and visual</option></select></label><label className="rounded-2xl border border-memo-line bg-memo-panel p-6"><span className="block text-sm font-medium">Number of pages</span><span className="mt-1 block text-sm text-memo-muted">Choose how much of your story to include.</span><select value={format.pages} onChange={(event) => setFormat({ ...format, pages: event.target.value })} className={`${inputClass} mt-5`}><option value="">Select pages</option>{[8, 10, 12, 15].map((count) => <option key={count} value={count}>{count} pages</option>)}</select></label></div><FormFooter error={error} onContinue={onContinue} label="Build my page plan" /></section> }
function QuestionScreen({ category, answers, onChange, onContinue, error }: { category: Category; answers: Record<string, string>; onChange: (id: string, value: string) => void; onContinue: () => void; error: string }) { return <section className="flex-1 py-14 lg:py-20"><div className="mb-10 max-w-2xl"><p className="text-xs uppercase tracking-[0.28em] text-memo-gold">The story behind it</p><h1 className="mt-4 font-serif text-4xl sm:text-5xl">Let’s make it personal.</h1><p className="mt-4 leading-7 text-memo-muted">There are no wrong answers. The little details are what make a magazine feel like yours.</p></div><div className="flex max-w-2xl flex-col gap-6">{category.questions.map((question, index) => <label key={question.id}><span className="mb-3 block text-sm font-medium"><span className="mr-2 font-mono text-xs text-memo-gold">0{index + 1}</span>{question.label}</span>{question.type === 'textarea' ? <textarea value={answers[question.id] ?? ''} onChange={(event) => onChange(question.id, event.target.value)} placeholder={question.placeholder} rows={5} className={`${inputClass} resize-none`} /> : <input type={question.type ?? 'text'} value={answers[question.id] ?? ''} onChange={(event) => onChange(question.id, event.target.value)} placeholder={question.placeholder} className={inputClass} />}</label>)}</div><FormFooter error={error} onContinue={onContinue} label="Plan the pages" /></section> }
function ImagePlanScreen({ pages, images, pageNotes, pageImages, setPageNotes, setPageImages, onDrop, onFileChange, fileInput, removeImage, onContinue, error }: { pages: PagePrompt[]; images: MagazineImage[]; pageNotes: Record<number, string>; pageImages: Record<number, string>; setPageNotes: (value: Record<number, string>) => void; setPageImages: (value: Record<number, string>) => void; onDrop: (event: DragEvent<HTMLDivElement>) => void; onFileChange: (event: ChangeEvent<HTMLInputElement>) => void; fileInput: React.RefObject<HTMLInputElement | null>; removeImage: (id: string) => void; onContinue: () => void; error: string }) { return <section className="flex-1 py-14 lg:py-20"><div className="mb-10 max-w-3xl"><p className="text-xs uppercase tracking-[0.28em] text-memo-gold">Visual direction</p><h1 className="mt-4 font-serif text-4xl text-balance sm:text-5xl">Place the pictures that tell the story.</h1><p className="mt-4 leading-7 text-memo-muted">Upload your images, then tell us which ones belong on the cover and each page. You can also leave a note for a text-only or full-bleed layout.</p></div><div onDrop={onDrop} onDragOver={(event) => event.preventDefault()} className="mb-10 rounded-2xl border border-dashed border-memo-gold/60 bg-memo-panel p-8 text-center"><span className="mx-auto flex size-12 items-center justify-center rounded-full bg-memo-gold/10 text-memo-gold"><ImagePlus className="size-5" /></span><p className="mt-4 font-serif text-2xl">Drop your images here</p><p className="mt-2 text-sm text-memo-muted">Up to 20 images, 10 MB each. JPG, PNG or HEIC are welcome.</p><button type="button" onClick={() => fileInput.current?.click()} className="mt-5 inline-flex items-center gap-2 rounded-full border border-memo-gold px-5 py-3 text-sm text-memo-gold"><Upload className="size-4" /> Choose images</button><input ref={fileInput} type="file" accept="image/*" multiple className="hidden" onChange={onFileChange} /></div>{images.length > 0 && <div className="mb-10 flex flex-wrap gap-3">{images.map((image) => <div key={image.id} className="group relative"><img src={image.url} alt={image.file.name} className="size-20 rounded-xl border border-memo-line object-cover" /><button type="button" aria-label={`Remove ${image.file.name}`} onClick={() => removeImage(image.id)} className="absolute -right-2 -top-2 rounded-full bg-memo-ink p-1 text-memo-gold"><Trash2 className="size-3" /></button></div>)}</div>}<div className="flex max-w-4xl flex-col gap-5">{pages.map((page) => <div key={page.page} className="rounded-2xl border border-memo-line bg-memo-panel p-5 sm:p-6"><div className="flex items-start gap-4"><span className="font-mono text-xs text-memo-gold">{String(page.page).padStart(2, '0')}</span><div className="min-w-0 flex-1"><h2 className="font-serif text-2xl">{page.title}</h2><p className="mt-2 text-sm leading-6 text-memo-muted">{page.prompt}</p><label className="mt-4 block"><span className="mb-2 block text-xs uppercase tracking-[0.16em] text-memo-muted">Picture for this page</span><select value={pageImages[page.page] ?? ''} onChange={(event) => setPageImages({ ...pageImages, [page.page]: event.target.value })} className={inputClass}><option value="">No specific image / let the designer choose</option>{images.map((image, index) => <option key={image.id} value={image.id}>Image {index + 1} — {image.file.name}</option>)}</select></label><label className="mt-4 block"><span className="mb-2 block text-xs uppercase tracking-[0.16em] text-memo-muted">Your direction</span><input value={pageNotes[page.page] ?? ''} onChange={(event) => setPageNotes({ ...pageNotes, [page.page]: event.target.value })} placeholder={page.photoPrompt} className={inputClass} /></label></div></div></div>)}</div><FormFooter error={error} onContinue={onContinue} label="Continue to details" /></section> }
function DetailsScreen({ details, setDetails, images, onContinue, error }: { details: { name: string; email: string; notes: string }; setDetails: (value: { name: string; email: string; notes: string }) => void; images: MagazineImage[]; onContinue: () => void; error: string }) { return <section className="flex-1 py-14 lg:py-20"><div className="mb-10 max-w-2xl"><p className="text-xs uppercase tracking-[0.28em] text-memo-gold">The finishing touches</p><h1 className="mt-4 font-serif text-4xl sm:text-5xl">Bring it to life.</h1><p className="mt-4 leading-7 text-memo-muted">Share your contact details and any additional text, quote or must-have detail.</p></div><div className="flex max-w-2xl flex-col gap-5"><label><span className="mb-2 block text-sm font-medium">Your name</span><input value={details.name} onChange={(event) => setDetails({ ...details, name: event.target.value })} placeholder="How should we address you?" className={inputClass} /></label><label><span className="mb-2 block text-sm font-medium">Email address</span><input type="email" value={details.email} onChange={(event) => setDetails({ ...details, email: event.target.value })} placeholder="you@example.com" className={inputClass} /></label><label><span className="mb-2 block text-sm font-medium">Anything else?</span><textarea value={details.notes} onChange={(event) => setDetails({ ...details, notes: event.target.value })} placeholder="A quote, a must-have detail, a mood or text you want included…" rows={6} className={`${inputClass} resize-none`} /></label><p className="text-sm text-memo-muted">{images.length} image{images.length === 1 ? '' : 's'} ready to guide the design.</p></div><FormFooter error={error} onContinue={onContinue} label="Review my brief" /></section> }
function ReviewScreen({ category, format, answers, details, images, pageImages, pageNotes, onEdit, onSubmit, isSubmitting, error }: { category: Category; format: { size: string; pages: string }; answers: Record<string, string>; details: { name: string; email: string; notes: string }; images: MagazineImage[]; pageImages: Record<number, string>; pageNotes: Record<number, string>; onEdit: (step: Step) => void; onSubmit: () => void; isSubmitting: boolean; error: string }) { return <section className="flex-1 py-14 lg:py-20"><div className="mb-10 max-w-3xl"><p className="text-xs uppercase tracking-[0.28em] text-memo-gold">One last look</p><h1 className="mt-4 font-serif text-4xl sm:text-5xl">Your story, at a glance.</h1><p className="mt-4 leading-7 text-memo-muted">Review the format, story and page-by-page visual direction before sending your brief.</p></div><div className="grid max-w-5xl gap-4 sm:grid-cols-2"><ReviewCard title="Format" onEdit={() => onEdit('format')}><p className="text-sm text-foreground">{format.size} magazine · {format.pages} pages</p></ReviewCard><ReviewCard title={`${category.title} details`} onEdit={() => onEdit('questions')}>{category.questions.map((question) => <div key={question.id} className="mb-4 last:mb-0"><p className="text-xs uppercase tracking-wider text-memo-muted">{question.label}</p><p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-foreground">{answers[question.id]}</p></div>)}</ReviewCard><ReviewCard title="Page direction" onEdit={() => onEdit('images')}><p className="text-sm text-memo-muted">{images.length} images uploaded · {Object.keys(pageImages).length} pages assigned</p><div className="mt-4 flex max-h-64 flex-col gap-3 overflow-auto">{Object.entries(pageNotes).filter(([, note]) => note).map(([page, note]) => <p key={page} className="text-sm leading-6 text-foreground"><span className="font-mono text-xs text-memo-gold">Page {page}</span> — {note}</p>)}</div></ReviewCard><ReviewCard title="Contact & notes" onEdit={() => onEdit('details')}><p className="text-sm text-foreground">{details.name}</p><p className="mt-1 text-sm text-memo-muted">{details.email}</p><p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-foreground">{details.notes || 'No additional notes.'}</p></ReviewCard></div><div className="mt-8 flex max-w-5xl flex-col items-start justify-between gap-5 border-t border-memo-line pt-6 sm:flex-row sm:items-center"><p className="flex max-w-md items-start gap-2 text-xs leading-5 text-memo-muted"><CircleHelp className="mt-0.5 size-4 shrink-0 text-memo-gold" /> We’ll use your brief to shape the first creative direction for your magazine.</p><div className="flex flex-wrap items-center gap-3"><button onClick={() => onEdit('details')} className="inline-flex items-center gap-2 rounded-full border border-memo-line px-5 py-3 text-sm text-foreground"><Pencil className="size-4" /> Edit</button><button onClick={onSubmit} disabled={isSubmitting} className="inline-flex items-center gap-2 rounded-full bg-memo-gold px-6 py-3 text-sm font-semibold text-memo-ink disabled:opacity-60">{isSubmitting ? <LoaderCircle className="size-4 animate-spin" /> : <Check className="size-4" />} Send my brief</button></div></div>{error && <p className="mt-5 text-sm text-memo-gold">{error}</p>}</section> }
function ReviewCard({ title, onEdit, children }: { title: string; onEdit: () => void; children: React.ReactNode }) { return <div className="rounded-2xl border border-memo-line bg-memo-panel p-6"><div className="mb-6 flex items-center justify-between gap-4"><h2 className="font-serif text-2xl">{title}</h2><button onClick={onEdit} className="text-memo-gold"><Pencil className="size-4" /></button></div>{children}</div> }
function FormFooter({ error, onContinue, label }: { error: string; onContinue: () => void; label: string }) { return <div className="mt-10 flex flex-col items-start gap-4"><button onClick={onContinue} className="inline-flex items-center gap-3 rounded-full bg-memo-gold px-6 py-3 text-sm font-semibold text-memo-ink">{label} <ArrowRight className="size-4" /></button>{error && <p className="text-sm text-memo-gold">{error}</p>}</div> }
function SuccessScreen({ onRestart }: { onRestart: () => void }) { 
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground transition-colors duration-300">
      <div className="pointer-events-none fixed inset-0 bg-memo-noise opacity-30" />
      <section className="relative z-10 max-w-xl text-center">
        <CheckCircle2 className="mx-auto size-16 text-memo-gold" />
        <p className="mt-8 text-xs uppercase tracking-[0.32em] text-memo-gold">Brief received</p>
        <h1 className="mt-4 font-serif text-5xl">Your story is on its way.</h1>
        <p className="mt-6 leading-8 text-memo-muted">
          Thank you for sharing the details, memories and images that will make this magazine yours. We’ll be in touch with the next creative steps.
        </p>
        {typeof window !== 'undefined' && !process.env.NEXT_PUBLIC_SUPABASE_URL && (
          <div className="mx-auto mt-6 max-w-md rounded-xl border border-memo-line bg-memo-panel/40 p-4 text-xs text-memo-muted">
            <span className="font-semibold text-memo-gold block mb-1">Local Storage Mode Active</span>
            Supabase is not configured. Your brief was saved to your browser's local storage so it is immediately viewable in the admin workspace.
          </div>
        )}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button onClick={onRestart} className="w-full sm:w-auto rounded-full border border-memo-line hover:border-memo-gold px-6 py-3 text-sm text-foreground transition-colors cursor-pointer">
            Create another magazine
          </button>
        </div>
      </section>
    </main>
  )
}
