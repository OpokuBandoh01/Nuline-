import { supabase } from '@/lib/supabase'

export type BriefImage = {
  name: string
  url: string
  path?: string
  size: number
  type: string
}

export type PageDraft = {
  title: string
  subtitle: string
  text: string
}

export type MagazineBrief = {
  id: string
  category: string
  contact_name: string
  contact_email: string
  answers: Record<string, string>
  format: { size: string; pages: string }
  page_notes: Record<number, string>
  page_images: Record<number, string>
  additional_notes: string
  images: BriefImage[]
  status: 'submitted' | 'drafting' | 'reviewing' | 'approved' | 'printed'
  created_at: string
  page_drafts?: Record<number, PageDraft>
}

const LOCAL_STORAGE_KEY = 'nuline_magazine_briefs'

// Mock briefs to seed localStorage if empty
const mockBriefs: MagazineBrief[] = [
  {
    id: 'brief-mock-1',
    category: 'Birthday',
    contact_name: 'Sarah Jenkins',
    contact_email: 'sarah.j@example.com',
    answers: {
      honoree: 'Thomas Jenkins',
      age: '40th Birthday',
      memories: 'Thomas loves vintage vinyl records, roasting coffee in the garage, and hiking in the Pacific Northwest. He is known for his dad jokes, his patience, and making the absolute best Sunday pancakes. His friends all talk about how he has been a rock through tough times and always shows up with a smile and a warm cup of coffee.'
    },
    format: { size: 'A4', pages: '12' },
    page_notes: {
      1: 'Thomas smiling next to his turntable on the cover',
      2: 'A quick text intro about starting this project',
      3: 'Happy birthday message from his family',
      4: 'A retro photo of Sarah and Thomas in college',
      5: 'Funny story about his garage coffee roasting mishap',
      6: 'A gorgeous photo of Thomas hiking Mount Hood',
      7: 'A collection of quotes from friends'
    },
    page_images: {
      1: 'thomas_turntable.jpg',
      2: 'garage_coffee.jpg',
      4: 'college_vintage.jpg',
      6: 'hiking_mount_hood.jpg'
    },
    additional_notes: 'Please make the style feel rustic, warm, and slightly retro editorial. Use earthy colors like deep green and warm cream.',
    images: [
      { name: 'thomas_turntable.jpg', url: 'https://images.unsplash.com/photo-1484755560695-a4c740285a15?auto=format&fit=crop&w=800&q=80', size: 102400, type: 'image/jpeg' },
      { name: 'garage_coffee.jpg', url: 'https://images.unsplash.com/photo-1498804103079-a6351b050096?auto=format&fit=crop&w=800&q=80', size: 204800, type: 'image/jpeg' },
      { name: 'college_vintage.jpg', url: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80', size: 153600, type: 'image/jpeg' },
      { name: 'hiking_mount_hood.jpg', url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80', size: 307200, type: 'image/jpeg' }
    ],
    status: 'drafting',
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    page_drafts: {
      1: { title: 'Thomas Jenkins', subtitle: 'The Man, The Myth, The Legend at Forty', text: 'Forty years of laughter, coffee, and vinyl. A curated look into the life of Thomas Jenkins on his milestone birthday.' },
      2: { title: 'Editor’s Note', subtitle: 'A Letter from Sarah', text: 'Creating this magazine has been a journey through some of the happiest moments of our lives. Thank you, Thomas, for being the heart of our home.' },
      3: { title: 'Forty Years of Light', subtitle: 'Wishes from Those Who Love You', text: 'You bring warmth and joy into every room you enter. Here is to forty more years of making pancakes and spinning records.' }
    }
  },
  {
    id: 'brief-mock-2',
    category: 'Anniversary',
    contact_name: 'David & Amanda Rose',
    contact_email: 'david.rose@example.com',
    answers: {
      couple: 'David & Amanda Rose',
      date: '2016-08-20',
      story: 'We met in Paris during a summer study abroad program. We spent the whole first night walking along the Seine and talking about architecture. Ten years later, we have built a beautiful home in Boston, adopted a golden retriever named Beau, and traveled to seven countries together. We are celebrating our 10th anniversary.'
    },
    format: { size: 'A3', pages: '15' },
    page_notes: {
      1: 'Paris silhouette or couple photo on the cover',
      2: 'A nice dedication page',
      3: 'Story of the Paris trip in 2016',
      4: 'Beau the golden retriever page',
      5: 'Our favorite trips (Iceland, Japan, Italy)',
      10: 'Black and white wedding photo'
    },
    page_images: {
      1: 'paris_romance.jpg',
      3: 'seine_walk.jpg',
      4: 'beau_retriever.jpg',
      5: 'travel_adventure.jpg'
    },
    additional_notes: 'Modern minimalist design. High contrast, black and white spreads with elegant serif fonts. Very editorial.',
    images: [
      { name: 'paris_romance.jpg', url: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=80', size: 120400, type: 'image/jpeg' },
      { name: 'seine_walk.jpg', url: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=800&q=80', size: 250400, type: 'image/jpeg' },
      { name: 'beau_retriever.jpg', url: 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=800&q=80', size: 198200, type: 'image/jpeg' },
      { name: 'travel_adventure.jpg', url: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=800&q=80', size: 289100, type: 'image/jpeg' }
    ],
    status: 'submitted',
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'brief-mock-3',
    category: 'Business',
    contact_name: 'Elena Rostova',
    contact_email: 'elena@rostova-design.com',
    answers: {
      brand: 'Rostova Atelier',
      milestone: '5-Year Brand Anniversary & Fall Collection Launch',
      positioning: 'Rostova Atelier stands for sustainable luxury. We source linen from family-owned mills in Europe and dye everything with botanicals in our studio. We want readers to understand the slow craft, meet our tailors, and see the raw texture of the fabric in an editorial, fine-art layout.'
    },
    format: { size: 'A4', pages: '8' },
    page_notes: {
      1: 'Minimalist studio workspace detail for the cover',
      2: 'Founder message from Elena',
      3: 'The slow craft values and botanical dyeing process',
      4: 'Meet the tailors (hands at work)',
      5: 'Fall Collection highlight spread'
    },
    page_images: {
      1: 'studio_workspace.jpg',
      3: 'linen_botanicals.jpg',
      4: 'tailoring_detail.jpg',
      5: 'model_shoot.jpg'
    },
    additional_notes: 'Muted warm neutrals (linen, oatmeal, terracotta). A lot of breathing room, large imagery, delicate typography.',
    images: [
      { name: 'studio_workspace.jpg', url: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80', size: 140200, type: 'image/jpeg' },
      { name: 'linen_botanicals.jpg', url: 'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&w=800&q=80', size: 220100, type: 'image/jpeg' },
      { name: 'tailoring_detail.jpg', url: 'https://images.unsplash.com/photo-1558603668-6570496b66f8?auto=format&fit=crop&w=800&q=80', size: 180300, type: 'image/jpeg' },
      { name: 'model_shoot.jpg', url: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=800&q=80', size: 310500, type: 'image/jpeg' }
    ],
    status: 'approved',
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  }
]

// Retrieve from localStorage or seed with mock data
const getLocalStorageBriefs = (): MagazineBrief[] => {
  if (typeof window === 'undefined') return []
  const data = localStorage.getItem(LOCAL_STORAGE_KEY)
  if (!data) {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(mockBriefs))
    return mockBriefs
  }
  try {
    return JSON.parse(data)
  } catch (e) {
    console.error('Error parsing briefs from localStorage, resetting to mock data', e)
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(mockBriefs))
    return mockBriefs
  }
}

// Save to localStorage
const saveLocalStorageBriefs = (briefs: MagazineBrief[]) => {
  if (typeof window === 'undefined') return
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(briefs))
}

export const briefStore = {
  isSupabaseConfigured(): boolean {
    return supabase !== null
  },

  async getBriefs(): Promise<MagazineBrief[]> {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('magazine_briefs')
          .select('*')
          .order('created_at', { ascending: false })
        
        if (error) throw error
        
        // Merge Supabase with localStorage if any local tests exist
        const local = getLocalStorageBriefs().filter(b => b.id.startsWith('local-') || b.id.startsWith('brief-mock-'))
        const merged = [...(data || []), ...local]
        // Deduplicate by ID
        const seen = new Set()
        return merged.filter(b => {
          const duplicate = seen.has(b.id)
          seen.add(b.id)
          return !duplicate
        }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      } catch (e) {
        console.error('Supabase query failed, falling back to localStorage', e)
        return getLocalStorageBriefs()
      }
    }
    return getLocalStorageBriefs()
  },

  async saveBrief(brief: MagazineBrief): Promise<void> {
    if (supabase) {
      try {
        const { error } = await supabase.from('magazine_briefs').insert(brief)
        if (error) throw error
        return
      } catch (e) {
        console.error('Supabase insert failed, falling back to local storage', e)
      }
    }

    // Save to localStorage
    const briefs = getLocalStorageBriefs()
    const index = briefs.findIndex(b => b.id === brief.id)
    if (index !== -1) {
      briefs[index] = brief
    } else {
      briefs.unshift(brief)
    }
    saveLocalStorageBriefs(briefs)
  },

  async updateBrief(brief: MagazineBrief): Promise<void> {
    if (supabase) {
      try {
        const { error } = await supabase
          .from('magazine_briefs')
          .update(brief)
          .eq('id', brief.id)
        if (error) throw error
      } catch (e) {
        console.error('Supabase update failed, updating in localStorage', e)
      }
    }

    const briefs = getLocalStorageBriefs()
    const index = briefs.findIndex(b => b.id === brief.id)
    if (index !== -1) {
      briefs[index] = brief
      saveLocalStorageBriefs(briefs)
    }
  },

  async deleteBrief(id: string): Promise<void> {
    if (supabase) {
      try {
        const { error } = await supabase
          .from('magazine_briefs')
          .delete()
          .eq('id', id)
        if (error) throw error
      } catch (e) {
        console.error('Supabase delete failed, deleting from localStorage', e)
      }
    }

    const briefs = getLocalStorageBriefs()
    const filtered = briefs.filter(b => b.id !== id)
    saveLocalStorageBriefs(filtered)
  }
}
