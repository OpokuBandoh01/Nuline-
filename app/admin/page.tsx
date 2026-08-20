'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import {
  briefStore,
  type MagazineBrief,
  type BriefImage,
  type PageDraft
} from '@/lib/brief-store'
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  BookOpen,
  Briefcase,
  Layers,
  Trash2,
  Lock,
  Download,
  Printer,
  ChevronRight,
  Search,
  Filter,
  CheckCircle2,
  Calendar,
  Mail,
  User,
  ExternalLink,
  Edit3,
  RefreshCw,
  FileText,
  Eye,
  Sliders,
  Check,
  ArrowUpRight,
  LogOut
} from 'lucide-react'
import Link from 'next/link'
import { ThemeToggle } from '@/components/theme-toggle'

export default function AdminPage() {
  const [adminDisplayName, setAdminDisplayName] = useState('')
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [isSupabaseActive, setIsSupabaseActive] = useState(false)
  
  // Auth Inputs
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passcode, setPasscode] = useState('')
  const [authError, setAuthError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Data states
  const [newPasswordUpdate, setNewPasswordUpdate] = useState('')
  const [passwordUpdateMessage, setPasswordUpdateMessage] = useState('')
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)
  
  const [briefs, setBriefs] = useState<MagazineBrief[]>([])
  const [selectedBrief, setSelectedBrief] = useState<MagazineBrief | null>(null)
  const [activeTab, setActiveTab] = useState<'dashboard' | 'briefs' | 'creative' | 'preview'>('dashboard')
  
  // Filtering & Search
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  
  // Editor state for Creative Board
  const [editingPage, setEditingPage] = useState<number | null>(null)
  const [pageDrafts, setPageDrafts] = useState<Record<number, PageDraft>>({})
  const [pageImages, setPageImages] = useState<Record<number, string>>({})
  const [statusUpdating, setStatusUpdating] = useState(false)
  const [aiGenerating, setAiGenerating] = useState(false)

  // Load briefs
  const loadBriefs = async () => {
    const data = await briefStore.getBriefs()
    setBriefs(data)
  }

  // Setup Auth state listener
  useEffect(() => {
    const active = briefStore.isSupabaseConfigured()
    setIsSupabaseActive(active)
    
    if (active && supabase) {
      // Get initial session
      supabase.auth.getSession().then(({ data: { session } }) => {
        setIsUnlocked(!!session)
        if (session) {
          loadBriefs()
          const emailStr = session.user?.email || ''
          const name = session.user?.user_metadata?.name || emailStr.split('@')[0] || 'Publisher'
          setAdminDisplayName(name)
        }
      })

      // Listen to auth changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setIsUnlocked(!!session)
        if (session) {
          loadBriefs()
          const emailStr = session.user?.email || ''
          const name = session.user?.user_metadata?.name || emailStr.split('@')[0] || 'Publisher'
          setAdminDisplayName(name)
        } else {
          setBriefs([])
          setAdminDisplayName('')
        }
      })

      return () => {
        subscription.unsubscribe()
      }
    } else {
      // Local storage fallback checks session storage
      if (typeof window !== 'undefined') {
        const unlocked = sessionStorage.getItem('nuline_admin_unlocked')
        if (unlocked === 'true') {
          setIsUnlocked(true)
          loadBriefs()
          setAdminDisplayName('Publisher Sandbox')
        }
      }
    }
  }, [isUnlocked])

  // Sync editor state when active brief changes
  useEffect(() => {
    if (selectedBrief) {
      setPageDrafts(selectedBrief.page_drafts || {})
      setPageImages(selectedBrief.page_images || {})
    } else {
      setPageDrafts({})
      setPageImages({})
    }
  }, [selectedBrief])

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthError('')
    setIsLoading(true)

    if (isSupabaseActive && supabase) {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setAuthError(error.message)
      } else {
        setIsUnlocked(true)
        loadBriefs()
      }
    } else {
      // Local storage passcode bypass
      if (passcode === 'admin123' || passcode.toLowerCase() === 'bypass') {
        setIsUnlocked(true)
        setAdminDisplayName('Publisher Sandbox')
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('nuline_admin_unlocked', 'true')
        }
        loadBriefs()
      } else {
        setAuthError('Invalid passcode. Use "admin123" to unlock.')
      }
    }
    setIsLoading(false)
  }

  const handleSignOut = async () => {
    if (isSupabaseActive && supabase) {
      await supabase.auth.signOut()
    } else {
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('nuline_admin_unlocked')
      }
      setIsUnlocked(false)
    }
    setAdminDisplayName('')
    setSelectedBrief(null)
    setActiveTab('dashboard')
    if (typeof window !== 'undefined') {
      window.location.href = '/'
    }
  }

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPasswordUpdate || newPasswordUpdate.length < 6) {
      setPasswordUpdateMessage('Password must be at least 6 characters.')
      return
    }
    setIsUpdatingPassword(true)
    setPasswordUpdateMessage('')
    
    try {
      if (isSupabaseActive && supabase) {
        const { error } = await supabase.auth.updateUser({ password: newPasswordUpdate })
        if (error) {
          setPasswordUpdateMessage(error.message)
        } else {
          setPasswordUpdateMessage('Password updated successfully!')
          setNewPasswordUpdate('')
        }
      } else {
        setPasswordUpdateMessage('Not supported in local sandbox.')
      }
    } catch (err: any) {
      setPasswordUpdateMessage(err.message || 'An error occurred.')
    } finally {
      setIsUpdatingPassword(false)
    }
  }

  const handleStatusChange = async (brief: MagazineBrief, newStatus: MagazineBrief['status']) => {
    setStatusUpdating(true)
    const updated = { ...brief, status: newStatus }
    await briefStore.updateBrief(updated)
    await loadBriefs()
    if (selectedBrief?.id === brief.id) {
      setSelectedBrief(updated)
    }
    setStatusUpdating(false)
  }

  const handleDeleteBrief = async (id: string) => {
    if (confirm('Are you sure you want to delete this brief? This cannot be undone.')) {
      await briefStore.deleteBrief(id)
      await loadBriefs()
      if (selectedBrief?.id === id) {
        setSelectedBrief(null)
      }
    }
  }

  const handleSavePageDraft = async (page: number, draft: PageDraft) => {
    if (!selectedBrief) return
    const updatedDrafts = { ...pageDrafts, [page]: draft }
    setPageDrafts(updatedDrafts)
    
    const updated = {
      ...selectedBrief,
      page_drafts: updatedDrafts
    }
    await briefStore.updateBrief(updated)
    await loadBriefs()
    setSelectedBrief(updated)
    setEditingPage(null)
  }

  const handlePageImageChange = async (page: number, imageName: string) => {
    if (!selectedBrief) return
    const updatedImages = { ...pageImages, [page]: imageName }
    setPageImages(updatedImages)
    
    const updated = {
      ...selectedBrief,
      page_images: updatedImages
    }
    await briefStore.updateBrief(updated)
    await loadBriefs()
    setSelectedBrief(updated)
  }

  const handleGenerateAICopy = async () => {
    if (!selectedBrief) return
    setAiGenerating(true)
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500))

    const category = selectedBrief.category.toLowerCase()
    const answers = selectedBrief.answers || {}
    const pageCount = Number(selectedBrief.format.pages) || 12
    const drafts: Record<number, PageDraft> = {}

    // Dynamic Mock AI Content Generator based on category & user responses
    if (category === 'birthday') {
      const honoree = answers.honoree || 'the honoree'
      const age = answers.age || 'this special milestone'
      
      drafts[1] = {
        title: honoree.toUpperCase(),
        subtitle: `A Celebration of ${age}`,
        text: `Dedicated to a life rich with laughter, music, and quiet wisdom. Happy Birthday, ${honoree}.`
      }
      drafts[2] = {
        title: 'EDITOR’S NOTE',
        subtitle: 'Why We Stand in Gratitude',
        text: `This keepsake compiles the snapshots, stories, and warm coffee-scented memories of a true friend. Created with love, for ${honoree}.`
      }
      drafts[3] = {
        title: 'THE MAN BEHIND THE RECORDS',
        subtitle: 'Turntables & Coffee Roasters',
        text: `Whether spinning classic vinyl in the living room or roasting experimental beans in the garage, Thomas finds art in the slow rhythm of everyday life.`
      }
      for (let i = 4; i <= pageCount; i++) {
        drafts[i] = {
          title: `CHAPTER ${i - 2}: THE INSIDE STORY`,
          subtitle: `Memories that Shape Us`,
          text: `Looking back at our shared adventures. From the first impressions to the midnight fires and hiking trails, your constant presence has been our anchor.`
        }
      }
    } else if (category === 'anniversary') {
      const couple = answers.couple || 'David & Amanda'
      drafts[1] = {
        title: couple.toUpperCase(),
        subtitle: `Ten Years of Devotion`,
        text: `From the stone bridges of the Seine to the warm hearth of a home. The story of a perfect architecture.`
      }
      drafts[2] = {
        title: 'THE PREFACE',
        subtitle: 'A Decade of Shared Skylines',
        text: `Celebrating David and Amanda. Inside, we look back at ten years of growth, travel, and the quiet moments in between.`
      }
      drafts[3] = {
        title: 'PARIS IN THE SUMMERTIME',
        subtitle: 'Where It All Began',
        text: `Study abroad, late sunset strolls, and architectural theory. A random meeting along the Seine that laid the foundation for a lifetime.`
      }
      for (let i = 4; i <= pageCount; i++) {
        drafts[i] = {
          title: `MILESTONE ${i - 2}`,
          subtitle: `Building a Life Together`,
          text: `A collection of milestones: our first home, adopting Beau the golden retriever, and packing bags for Iceland and Japan. The blueprint of love.`
        }
      }
    } else if (category === 'business') {
      const brand = answers.brand || 'Rostova Atelier'
      const milestone = answers.milestone || '5-Year Anniversary'
      drafts[1] = {
        title: brand.toUpperCase(),
        subtitle: `Slow Craft & Sustainable Luxury`,
        text: `Marking ${milestone}. A visual history of plant-dyed linen and slow European craftsmanship.`
      }
      drafts[2] = {
        title: 'FOUNDER’S LETTER',
        subtitle: 'A Vision In Linen',
        text: `Elena Rostova writes on five years of sourcing, sewing, and returning to the raw texture of slow craft. A journey of passion.`
      }
      drafts[3] = {
        title: 'THE BOTANICAL STUDIO',
        subtitle: 'Dyeing with the Seasons',
        text: `Sourcing marigolds, avocado skins, and indigo. Every thread of Rostova linen carries the botanical fingerprint of our slow kitchen dye vats.`
      }
      for (let i = 4; i <= pageCount; i++) {
        drafts[i] = {
          title: `PRINCIPLE ${i - 2}`,
          subtitle: `Detailing the Craft`,
          text: `Meet our tailors. Sourced European flax is spun at family-owned mills, then tailored in small batches. Slow luxury designed to breathe and last.`
        }
      }
    } else {
      // Generic generator
      const client = selectedBrief.contact_name
      drafts[1] = {
        title: `${selectedBrief.category.toUpperCase()} EDITION`,
        subtitle: `A Personal Narrative`,
        text: `Curated details for ${client}. A beautiful printed legacy of a meaningful moment.`
      }
      drafts[2] = {
        title: 'EDITOR’S FOREWORD',
        subtitle: 'Crafting the Visual Brief',
        text: `We have woven the stories and layout concepts together to design a magazine that feels authentic and timeless.`
      }
      for (let i = 3; i <= pageCount; i++) {
        drafts[i] = {
          title: `PAGE SPREAD ${i}`,
          subtitle: `A Visual Record`,
          text: `Drafting content based on the intake questionnaire. Every word has been crafted to complement the photographic layout of this page.`
        }
      }
    }

    setPageDrafts(drafts)
    const updated = { ...selectedBrief, page_drafts: drafts }
    await briefStore.updateBrief(updated)
    await loadBriefs()
    setSelectedBrief(updated)
    setAiGenerating(false)
  }

  const exportBriefJson = () => {
    if (!selectedBrief) return
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(selectedBrief, null, 2))
    const downloadAnchor = document.createElement('a')
    downloadAnchor.setAttribute("href",     dataStr)
    downloadAnchor.setAttribute("download", `nuline_brief_${selectedBrief.id}.json`)
    document.body.appendChild(downloadAnchor)
    downloadAnchor.click()
    downloadAnchor.remove()
  }

  const triggerPrint = () => {
    window.print()
  }

  // Filter briefs
  const filteredBriefs = briefs.filter(brief => {
    const matchesSearch = 
      brief.contact_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      brief.contact_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      brief.id.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesCategory = categoryFilter === 'All' || brief.category === categoryFilter
    const matchesStatus = statusFilter === 'All' || brief.status === statusFilter

    return matchesSearch && matchesCategory && matchesStatus
  })

  // Count variables for stats
  const totalCount = briefs.length
  const submittedCount = briefs.filter(b => b.status === 'submitted').length
  const draftingCount = briefs.filter(b => b.status === 'drafting').length
  const reviewingCount = briefs.filter(b => b.status === 'reviewing').length
  const approvedCount = briefs.filter(b => b.status === 'approved' || b.status === 'printed').length

  if (!isUnlocked) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center px-6 relative overflow-hidden text-foreground transition-colors duration-300">
        <div className="pointer-events-none fixed inset-0 bg-memo-noise opacity-30" />
        <div className="absolute size-96 rounded-full bg-memo-gold/5 blur-[120px] -top-20 -left-20" />
        <div className="absolute size-96 rounded-full bg-memo-blue/10 blur-[150px] -bottom-20 -right-20" />
        
        <form onSubmit={handleSignIn} className="relative z-10 w-full max-w-md rounded-2xl border border-memo-line bg-memo-panel p-8 backdrop-blur-md">
          <div className="text-center mb-8">
            <span className="inline-flex size-14 items-center justify-center rounded-full border border-memo-gold/30 bg-memo-blue/80 mb-4">
              <Lock className="size-6 text-memo-gold" />
            </span>
            <h1 className="font-serif text-3xl text-foreground">Publisher Workspace</h1>
            <p className="mt-2 text-sm text-memo-muted">
              {isSupabaseActive ? 'Sign in using Supabase Auth Credentials' : 'Local Sandbox Offline Gate'}
            </p>
          </div>

          {isSupabaseActive ? (
            <div className="space-y-4 mb-6">
              <label className="block">
                <span className="block text-xs uppercase tracking-widest text-memo-muted mb-2">Email Address</span>
                <input 
                  type="email" 
                  value={email} 
                  onChange={(e) => { setEmail(e.target.value); setAuthError('') }}
                  placeholder="admin@example.com"
                  required
                  className="w-full rounded-xl border border-memo-line bg-memo-ink/80 px-4 py-3 text-sm text-memo-cream outline-none placeholder:text-memo-muted/30 focus:border-memo-gold"
                />
              </label>
              <label className="block">
                <span className="block text-xs uppercase tracking-widest text-memo-muted mb-2">Password</span>
                <input 
                  type="password" 
                  value={password} 
                  onChange={(e) => { setPassword(e.target.value); setAuthError('') }}
                  placeholder="••••••••"
                  required
                  className="w-full rounded-xl border border-memo-line bg-memo-ink/80 px-4 py-3 text-sm text-memo-cream outline-none placeholder:text-memo-muted/30 focus:border-memo-gold"
                />
              </label>
            </div>
          ) : (
            <div className="space-y-4 mb-6">
              <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3 text-xs text-amber-500/90 leading-relaxed">
                Supabase keys not configured in <code>.env.local</code>. Running in Local Storage sandbox mode.
              </div>
              <label className="block">
                <span className="block text-xs uppercase tracking-widest text-memo-muted mb-2">Passcode</span>
                <input 
                  type="password" 
                  value={passcode} 
                  onChange={(e) => { setPasscode(e.target.value); setAuthError('') }}
                  placeholder="Enter passcode (admin123)"
                  className="w-full rounded-xl border border-memo-line bg-memo-ink/80 px-4 py-3 text-sm text-memo-cream outline-none placeholder:text-memo-muted/30 focus:border-memo-gold"
                  autoFocus
                />
              </label>
            </div>
          )}

          {authError && (
            <p className="text-xs text-memo-gold mb-6 text-center">{authError}</p>
          )}

          <div className="flex flex-col gap-3">
            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-memo-gold px-6 py-3 text-sm font-semibold text-memo-ink hover:bg-memo-gold-light disabled:opacity-60 transition-all cursor-pointer"
            >
              {isLoading ? 'Authenticating...' : 'Unlock Workspace'}
            </button>
            <Link href="/" className="w-full inline-flex items-center justify-center gap-2 rounded-full border border-memo-line hover:border-memo-gold/60 px-6 py-3 text-sm text-foreground transition-all">
              <ArrowLeft className="size-4" /> Client intake Form
            </Link>
          </div>
        </form>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col relative print:bg-white print:text-black transition-colors duration-300">
      <div className="pointer-events-none fixed inset-0 bg-memo-noise opacity-30 print:hidden" />
      
      {/* Header */}
      <header className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between border-b border-memo-line/40 px-6 py-5 sm:px-10 lg:px-14 print:hidden">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-full border border-memo-gold/50 bg-memo-blue/50">
            <Sparkles className="size-4 text-memo-gold" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif text-xl italic tracking-wide text-memo-gold">Nuline Admin</span>
              <span className="rounded bg-memo-blue px-2 py-0.5 text-[10px] uppercase font-mono tracking-wider text-memo-muted">
                {isSupabaseActive ? 'Live DB' : 'Local Storage'}
              </span>
            </div>
            {adminDisplayName && (
              <p className="text-[10px] text-memo-muted mt-0.5 font-mono">
                Hi, <span className="text-memo-gold font-semibold capitalize">{adminDisplayName}</span>
              </p>
            )}
          </div>
        </div>

        <nav className="flex items-center gap-6">
          <ThemeToggle />
          <button 
            onClick={handleSignOut}
            className="text-xs uppercase tracking-widest text-memo-gold hover:text-memo-gold-light inline-flex items-center gap-1 hover:underline transition-colors cursor-pointer"
          >
            <LogOut className="size-3" /> Log Out
          </button>
        </nav>
      </header>

      {/* Main Workspace */}
      <div className="flex-1 relative z-10 mx-auto w-full max-w-7xl px-6 py-8 sm:px-10 lg:px-14 flex flex-col print:p-0">
        
        {/* Navigation Tabs (Hidden during print) */}
        <div className="flex items-center justify-between border-b border-memo-line/30 pb-4 mb-8 overflow-x-auto print:hidden gap-4">
          <div className="flex items-center gap-2 md:gap-4 shrink-0">
            <TabButton active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')}>
              <Layers className="size-4" /> Overview
            </TabButton>
            <TabButton active={activeTab === 'briefs'} onClick={() => setActiveTab('briefs')}>
              <Briefcase className="size-4" /> Client Briefs ({totalCount})
            </TabButton>
            {selectedBrief && (
              <>
                <span className="text-memo-line font-light">|</span>
                <TabButton active={activeTab === 'creative'} onClick={() => setActiveTab('creative')}>
                  <Edit3 className="size-4" /> Creative Canvas
                </TabButton>
                <TabButton active={activeTab === 'preview'} onClick={() => setActiveTab('preview')}>
                  <BookOpen className="size-4" /> Print Proof
                </TabButton>
              </>
            )}
          </div>
          
          {selectedBrief && (
            <div className="flex items-center gap-2">
              <button 
                onClick={exportBriefJson}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-memo-line bg-memo-panel px-3 text-xs text-foreground hover:bg-memo-panel-hover cursor-pointer"
                title="Download brief metadata"
              >
                <Download className="size-3.5 text-memo-gold" /> Export JSON
              </button>
              <button 
                onClick={triggerPrint}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-memo-line bg-memo-panel px-3 text-xs text-foreground hover:bg-memo-panel-hover cursor-pointer"
                title="Print Layout"
              >
                <Printer className="size-3.5 text-memo-gold" /> Print PDF
              </button>
            </div>
          )}
        </div>

        {/* 1. DASHBOARD VIEW */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8 animate-fade-in print:hidden">
            
            {/* Stats Summary Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatsCard title="Total Orders" value={totalCount} description="Total client projects in catalog" icon={Layers} color="text-memo-gold" />
              <StatsCard title="Submitted (Unread)" value={submittedCount} description="Newly received customer forms" icon={ExternalLink} color="text-amber-500" />
              <StatsCard title="Active Design" value={draftingCount + reviewingCount} description="In copywriting & alignment" icon={Edit3} color="text-blue-400" />
              <StatsCard title="Ready / Completed" value={approvedCount} description="Approved and sent to print shop" icon={CheckCircle2} color="text-emerald-400" />
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {/* Category Breakdown Custom Charts */}
              <div className="md:col-span-2 rounded-2xl border border-memo-line bg-memo-panel p-6">
                <h2 className="font-serif text-2xl mb-6">Volume by Project Type</h2>
                <div className="space-y-4">
                  <CategoryBar label="Birthday Spreads" count={briefs.filter(b => b.category === 'Birthday').length} total={totalCount} color="bg-memo-gold" />
                  <CategoryBar label="Anniversaries" count={briefs.filter(b => b.category === 'Anniversary').length} total={totalCount} color="bg-indigo-400" />
                  <CategoryBar label="Friendship Keepsakes" count={briefs.filter(b => b.category === 'Friendship' || b.category === 'Parents').length} total={totalCount} color="bg-rose-400" />
                  <CategoryBar label="Business & Founders" count={briefs.filter(b => b.category === 'Business').length} total={totalCount} color="bg-blue-400" />
                  <CategoryBar label="Family Moments" count={briefs.filter(b => b.category === 'Family').length} total={totalCount} color="bg-teal-400" />
                  <CategoryBar label="Custom & Experimental" count={briefs.filter(b => b.category === 'Custom' || b.category === 'Something else').length} total={totalCount} color="bg-slate-400" />
                </div>
              </div>

              {/* Quick Actions Panel */}
              <div className="rounded-2xl border border-memo-line bg-memo-panel p-6 flex flex-col justify-between">
                <div>
                  <h2 className="font-serif text-2xl mb-4">Quick Settings</h2>
                  <p className="text-sm text-memo-muted leading-relaxed mb-6">
                    Welcome to the Nuline magazine admin dashboard. You can review customer details, edit layout copy, assign custom photography from customer uploads, and export press packages.
                  </p>
                  
                  {isSupabaseActive && (
                    <form onSubmit={handleUpdatePassword} className="space-y-3 pt-6 border-t border-memo-line/30">
                      <span className="block text-xs uppercase tracking-widest text-memo-muted">Update Admin Password</span>
                      <div className="flex gap-2">
                        <input
                          type="password"
                          value={newPasswordUpdate}
                          onChange={(e) => setNewPasswordUpdate(e.target.value)}
                          placeholder="Enter new password"
                          required
                          className="flex-1 rounded-xl border border-memo-line bg-memo-ink/60 px-3 py-2 text-xs text-memo-cream outline-none focus:border-memo-gold placeholder:text-memo-muted/30"
                        />
                        <button
                          type="submit"
                          disabled={isUpdatingPassword}
                          className="rounded-xl bg-memo-gold px-4 py-2 text-xs font-semibold text-memo-ink hover:bg-memo-gold-light disabled:opacity-60 transition-all cursor-pointer"
                        >
                          Update
                        </button>
                      </div>
                      {passwordUpdateMessage && (
                        <p className="text-[10px] text-memo-gold font-mono">{passwordUpdateMessage}</p>
                      )}
                    </form>
                  )}
                </div>
                <div className="mt-8 space-y-3">
                  <button 
                    onClick={() => setActiveTab('briefs')} 
                    className="w-full flex items-center justify-between rounded-xl bg-memo-blue border border-memo-line/40 p-4 hover:border-memo-gold/60 text-sm transition-all cursor-pointer"
                  >
                    <span>Inspect Client Briefs</span>
                    <ChevronRight className="size-4 text-memo-gold" />
                  </button>
                  <div className="rounded-xl border border-memo-line bg-memo-blue/15 p-4 text-xs text-memo-muted">
                    <span className="font-semibold block text-memo-gold mb-1">Database Connectivity</span>
                    {isSupabaseActive ? (
                      <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium"><CheckCircle2 className="size-3.5" /> Supabase Storage Connected</span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-500 font-medium"><Sliders className="size-3.5" /> LocalStorage Fallback (Offline Sandbox)</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Orders List */}
            <div className="rounded-2xl border border-memo-line bg-memo-panel p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-serif text-2xl">Recent Project Arrivals</h2>
                <button onClick={() => setActiveTab('briefs')} className="text-xs text-memo-gold flex items-center gap-1 hover:underline cursor-pointer">
                  View all <ChevronRight className="size-3.5" />
                </button>
              </div>
              <div className="divide-y divide-memo-line/20">
                {briefs.slice(0, 5).map(brief => (
                  <div key={brief.id} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                    <div>
                      <h4 className="font-serif text-lg text-foreground">{brief.contact_name}</h4>
                      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-memo-muted">
                        <span>{brief.category}</span>
                        <span>·</span>
                        <span>{brief.format.size} / {brief.format.pages} pgs</span>
                        <span>·</span>
                        <span>{brief.images.length} uploads</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={brief.status} />
                      <button 
                        onClick={() => { setSelectedBrief(brief); setActiveTab('creative') }} 
                        className="rounded-lg bg-memo-blue px-3 py-1.5 text-xs text-memo-gold hover:bg-memo-blue/80 cursor-pointer"
                      >
                        Inspect
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* 2. BRIEFS LIST VIEW */}
        {activeTab === 'briefs' && !selectedBrief && (
          <div className="space-y-6 animate-fade-in print:hidden">
            {/* Search & Filters */}
            <div className="flex flex-col md:flex-row gap-4 justify-between bg-memo-panel p-4 rounded-xl border border-memo-line">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 size-4 text-memo-muted" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by client, email, or order ID..."
                  className="w-full rounded-lg border border-memo-line/45 bg-memo-ink/65 pl-9 pr-4 py-2 text-sm text-memo-cream outline-none focus:border-memo-gold"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <label className="inline-flex items-center gap-1.5 text-xs text-memo-muted">
                  <Filter className="size-3 text-memo-gold" />
                  Category:
                  <select 
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="rounded bg-memo-ink border border-memo-line px-2 py-1 text-xs text-memo-cream"
                  >
                    <option value="All">All Categories</option>
                    <option value="Birthday">Birthday</option>
                    <option value="Anniversary">Anniversary</option>
                    <option value="Friendship">Friendship</option>
                    <option value="Business">Business</option>
                    <option value="Family">Family</option>
                    <option value="Custom">Custom</option>
                  </select>
                </label>

                <label className="inline-flex items-center gap-1.5 text-xs text-memo-muted">
                  Status:
                  <select 
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="rounded bg-memo-ink border border-memo-line px-2 py-1 text-xs text-memo-cream"
                  >
                    <option value="All">All Statuses</option>
                    <option value="submitted">Submitted</option>
                    <option value="drafting">Drafting</option>
                    <option value="reviewing">Reviewing</option>
                    <option value="approved">Approved</option>
                    <option value="printed">Printed</option>
                  </select>
                </label>
              </div>
            </div>

            {/* Briefs Table Layout */}
            <div className="rounded-2xl border border-memo-line bg-memo-panel overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-memo-line/40 bg-memo-blue/40 text-xs uppercase tracking-widest text-memo-muted font-mono">
                      <th className="px-6 py-4">Client Detail</th>
                      <th className="px-6 py-4">Category</th>
                      <th className="px-6 py-4">Format</th>
                      <th className="px-6 py-4">Uploads</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Received</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-memo-line/20 text-sm">
                    {filteredBriefs.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-memo-muted">
                          No client briefs found matching the current search parameters.
                        </td>
                      </tr>
                    ) : (
                      filteredBriefs.map(brief => (
                        <tr key={brief.id} className="hover:bg-memo-panel-hover/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-serif text-base font-semibold">{brief.contact_name}</div>
                            <div className="text-xs text-memo-muted font-mono">{brief.contact_email}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-xs uppercase tracking-wider font-mono bg-memo-blue px-2 py-1 rounded text-memo-gold">
                              {brief.category}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-foreground">
                             {brief.format.size} / {brief.format.pages} pgs
                           </td>
                          <td className="px-6 py-4 font-mono text-xs text-memo-muted">
                            {brief.images?.length || 0} image{brief.images?.length === 1 ? '' : 's'}
                          </td>
                          <td className="px-6 py-4">
                            <StatusBadge status={brief.status} />
                          </td>
                          <td className="px-6 py-4 text-xs text-memo-muted">
                            {new Date(brief.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="inline-flex gap-2">
                              <button 
                                onClick={() => { setSelectedBrief(brief); setActiveTab('creative') }} 
                                className="inline-flex size-8 items-center justify-center rounded-lg bg-memo-blue text-memo-gold hover:bg-memo-blue/80 cursor-pointer"
                                title="Open Canvas Editor"
                              >
                                <Edit3 className="size-4" />
                              </button>
                              <button 
                                onClick={() => handleDeleteBrief(brief.id)} 
                                className="inline-flex size-8 items-center justify-center rounded-lg bg-red-950/20 text-red-400 border border-red-900/30 hover:bg-red-900/40 cursor-pointer"
                                title="Delete Order"
                              >
                                <Trash2 className="size-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 3. CREATIVE BOARD WORKSPACE */}
        {activeTab === 'creative' && selectedBrief && (
          <div className="grid gap-8 lg:grid-cols-3 animate-fade-in print:hidden">
            
            {/* Left sidebar: Intake Form answers & status */}
            <div className="space-y-6">
              
              {/* Client Info Card */}
              <div className="rounded-xl border border-memo-line bg-memo-panel p-5">
                <div className="flex items-center justify-between mb-4 pb-4 border-b border-memo-line/20">
                  <h3 className="font-serif text-xl">Brief Detail</h3>
                  <button 
                    onClick={() => { setSelectedBrief(null); setActiveTab('briefs') }}
                    className="text-xs text-memo-muted hover:text-memo-cream cursor-pointer"
                  >
                    Close Brief
                  </button>
                </div>
                
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-memo-muted">Client Name:</span>
                    <span className="font-semibold">{selectedBrief.contact_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-memo-muted">Client Email:</span>
                    <span className="font-mono text-xs">{selectedBrief.contact_email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-memo-muted">Category:</span>
                    <span className="text-memo-gold">{selectedBrief.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-memo-muted">Format Size:</span>
                    <span>{selectedBrief.format.size} Layout</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-memo-muted">Pages:</span>
                    <span>{selectedBrief.format.pages} Pages</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-memo-muted">Submission ID:</span>
                    <span className="font-mono text-[10px] text-memo-muted truncate max-w-[150px]">{selectedBrief.id}</span>
                  </div>
                </div>

                {/* Status Switcher */}
                <div className="mt-6 pt-4 border-t border-memo-line/20">
                  <label className="block text-xs uppercase tracking-widest text-memo-muted mb-2">Publisher Status</label>
                  <select 
                    value={selectedBrief.status} 
                    disabled={statusUpdating}
                    onChange={(e) => handleStatusChange(selectedBrief, e.target.value as MagazineBrief['status'])}
                    className="w-full rounded-lg border border-memo-line bg-memo-ink px-3 py-2 text-sm text-memo-gold outline-none cursor-pointer"
                  >
                    <option value="submitted">Submitted (In Review)</option>
                    <option value="drafting">Drafting Editorial Copy</option>
                    <option value="reviewing">Reviewing Spreads</option>
                    <option value="approved">Approved for Press</option>
                    <option value="printed">Printed / Completed</option>
                  </select>
                </div>
              </div>

              {/* Questionnaire Answers */}
              <div className="rounded-xl border border-memo-line bg-memo-panel p-5">
                <h3 className="font-serif text-xl mb-4 pb-4 border-b border-memo-line/20">Intake Answers</h3>
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                  {Object.entries(selectedBrief.answers).map(([key, value]) => (
                    <div key={key} className="text-sm">
                      <span className="block text-xs uppercase tracking-wider text-memo-muted font-mono">{key}</span>
                      <p className="mt-1 text-foreground leading-relaxed whitespace-pre-wrap">{value}</p>
                    </div>
                  ))}
                  {selectedBrief.additional_notes && (
                    <div className="text-sm">
                      <span className="block text-xs uppercase tracking-wider text-memo-muted font-mono">Special Notes</span>
                      <p className="mt-1 text-foreground leading-relaxed whitespace-pre-wrap">{selectedBrief.additional_notes}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Uploaded Gallery */}
              <div className="rounded-xl border border-memo-line bg-memo-panel p-5">
                <h3 className="font-serif text-xl mb-4 pb-4 border-b border-memo-line/20">Client Uploads ({selectedBrief.images?.length || 0})</h3>
                <div className="grid grid-cols-4 gap-2">
                  {selectedBrief.images?.map((img, idx) => (
                    <div key={idx} className="group relative aspect-square rounded-lg border border-memo-line/40 overflow-hidden bg-memo-ink">
                      <img src={img.url} alt={img.name} className="size-full object-cover group-hover:scale-105 transition-transform" />
                      <div className="absolute inset-0 bg-memo-ink/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <span className="text-[10px] font-mono text-memo-gold bg-memo-ink px-1 py-0.5 rounded truncate max-w-[80%]">
                          {idx + 1}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Right columns: Page drafts layout grid */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Editor controls */}
              <div className="flex items-center justify-between bg-memo-panel/30 border border-memo-line/60 rounded-xl p-4">
                <div>
                  <h3 className="font-serif text-lg text-memo-gold flex items-center gap-2">
                    <Sparkles className="size-4" /> Editorial Canvas
                  </h3>
                  <p className="text-xs text-memo-muted mt-1">Assign layout elements, titles, and body content for every page.</p>
                </div>
                
                <button
                  onClick={handleGenerateAICopy}
                  disabled={aiGenerating}
                  className="inline-flex h-9 items-center gap-1.5 rounded-full bg-memo-gold px-4 text-xs font-semibold text-memo-ink hover:bg-memo-gold-light disabled:opacity-60 transition-colors cursor-pointer"
                >
                  {aiGenerating ? (
                    <RefreshCw className="size-3 animate-spin" />
                  ) : (
                    <Sparkles className="size-3" />
                  )}
                  AI Draft Copy
                </button>
              </div>

              {/* Pages Grid */}
              <div className="space-y-4">
                {Array.from({ length: Number(selectedBrief.format.pages) || 12 }, (_, i) => i + 1).map((pageNum) => {
                  const pageDraft = pageDrafts[pageNum] || { title: '', subtitle: '', text: '' }
                  const pageImageName = pageImages[pageNum] || ''
                  const pageImage = selectedBrief.images?.find(img => img.name === pageImageName)
                  
                  const isEditing = editingPage === pageNum

                  return (
                    <div key={pageNum} className="rounded-xl border border-memo-line bg-memo-panel p-5">
                      <div className="flex items-start gap-4 justify-between">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <span className="font-mono text-sm text-memo-gold bg-memo-blue size-8 rounded-full flex items-center justify-center shrink-0">
                            {String(pageNum).padStart(2, '0')}
                          </span>
                          
                          <div className="flex-1 min-w-0">
                            {isEditing ? (
                              <div className="space-y-3">
                                <label className="block">
                                  <span className="text-[10px] uppercase font-mono text-memo-muted block mb-1">Headline</span>
                                  <input 
                                    type="text" 
                                    defaultValue={pageDraft.title}
                                    id={`title-${pageNum}`}
                                    className="w-full rounded bg-memo-ink border border-memo-line px-3 py-1.5 text-sm text-memo-cream"
                                    placeholder="Enter page title"
                                  />
                                </label>
                                <label className="block">
                                  <span className="text-[10px] uppercase font-mono text-memo-muted block mb-1">Sub-headline</span>
                                  <input 
                                    type="text" 
                                    defaultValue={pageDraft.subtitle}
                                    id={`subtitle-${pageNum}`}
                                    className="w-full rounded bg-memo-ink border border-memo-line px-3 py-1.5 text-sm text-memo-cream"
                                    placeholder="Enter page sub-headline"
                                  />
                                </label>
                                <label className="block">
                                  <span className="text-[10px] uppercase font-mono text-memo-muted block mb-1">Body Article / Message</span>
                                  <textarea 
                                    defaultValue={pageDraft.text}
                                    id={`text-${pageNum}`}
                                    rows={4}
                                    className="w-full rounded bg-memo-ink border border-memo-line px-3 py-1.5 text-sm text-memo-cream resize-none"
                                    placeholder="Write editorial content..."
                                  />
                                </label>
                                <div className="flex justify-end gap-2 pt-1">
                                  <button 
                                    onClick={() => setEditingPage(null)} 
                                    className="px-3 py-1 rounded bg-memo-blue text-xs text-memo-muted cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                  <button 
                                    onClick={() => {
                                      const title = (document.getElementById(`title-${pageNum}`) as HTMLInputElement).value
                                      const subtitle = (document.getElementById(`subtitle-${pageNum}`) as HTMLInputElement).value
                                      const text = (document.getElementById(`text-${pageNum}`) as HTMLTextAreaElement).value
                                      handleSavePageDraft(pageNum, { title, subtitle, text })
                                    }}
                                    className="px-3 py-1 rounded bg-memo-gold text-xs font-semibold text-memo-ink hover:bg-memo-gold-light cursor-pointer"
                                  >
                                    Save Draft
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div onClick={() => setEditingPage(pageNum)} className="cursor-pointer group/page select-none hover:bg-memo-ink/10 p-2 rounded-lg transition-colors">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-serif text-xl text-foreground group-hover/page:text-memo-gold transition-colors font-semibold">
                                    {pageDraft.title || <em className="text-memo-muted text-sm font-sans font-normal">No page headline written</em>}
                                  </h4>
                                  <Edit3 className="size-3 text-memo-muted opacity-0 group-hover/page:opacity-100 transition-opacity" />
                                </div>
                                {pageDraft.subtitle && (
                                  <h5 className="font-mono text-xs text-memo-gold mt-1 tracking-wide">{pageDraft.subtitle}</h5>
                                )}
                                {pageDraft.text && (
                                  <p className="text-xs text-memo-muted leading-relaxed mt-2 line-clamp-3 whitespace-pre-wrap">{pageDraft.text}</p>
                                )}
                              </div>
                            )}

                            {/* Client intent prompt reference */}
                            {selectedBrief.page_notes[pageNum] && (
                              <div className="mt-3 p-2.5 rounded-lg bg-memo-blue/30 border border-memo-line/20 text-xs text-memo-muted flex gap-2">
                                <span className="font-semibold text-memo-gold">Client Intent:</span>
                                <span>{selectedBrief.page_notes[pageNum]}</span>
                              </div>
                            )}

                            {/* Image selector */}
                            <div className="mt-4 flex flex-wrap items-center gap-3 pt-3 border-t border-memo-line/20">
                              <span className="text-[10px] uppercase font-mono text-memo-muted">Photography:</span>
                              <select
                                value={pageImageName}
                                onChange={(e) => handlePageImageChange(pageNum, e.target.value)}
                                className="rounded bg-memo-ink border border-memo-line px-2 py-1 text-xs text-memo-cream max-w-xs outline-none cursor-pointer"
                              >
                                <option value="">No image / designer's layout fallback</option>
                                {selectedBrief.images?.map((img, idx) => (
                                  <option key={idx} value={img.name}>
                                    Image {idx + 1} — {img.name}
                                  </option>
                                ))}
                              </select>
                            </div>

                          </div>
                        </div>

                        {/* Page image preview thumbnail */}
                        {pageImage && (
                          <div className="size-20 rounded-lg overflow-hidden border border-memo-line shrink-0 bg-memo-ink">
                            <img src={pageImage.url} alt={pageImage.name} className="size-full object-cover" />
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* View final proof button */}
              <div className="flex justify-end pt-4">
                <button 
                  onClick={() => setActiveTab('preview')}
                  className="inline-flex items-center gap-2 rounded-full bg-memo-gold px-6 py-3 text-sm font-semibold text-memo-ink hover:bg-memo-gold-light transition-all cursor-pointer"
                >
                  <BookOpen className="size-4" /> Open Digital Proof Spread
                </button>
              </div>

            </div>

          </div>
        )}

        {/* 4. MAGAZINE PREVIEW / PRINT PROOF VIEW */}
        {activeTab === 'preview' && selectedBrief && (
          <div className="space-y-12 animate-fade-in">
            
            {/* Quick print instructions (hidden on print) */}
            <div className="rounded-xl border border-memo-line bg-memo-panel p-5 flex flex-col md:flex-row items-center justify-between gap-4 print:hidden">
              <div>
                <h3 className="font-serif text-xl text-memo-gold">Print Preview Proof</h3>
                <p className="text-xs text-memo-muted mt-1">This simulates the final double-page printing spreads. Use 'Print PDF' to compile press files.</p>
              </div>
              <button 
                onClick={triggerPrint}
                className="inline-flex items-center gap-2 rounded-full bg-memo-gold px-6 py-3 text-sm font-semibold text-memo-ink hover:bg-memo-gold-light cursor-pointer"
              >
                <Printer className="size-4" /> Compile and Print PDF
              </button>
            </div>

            {/* Spreads rendering */}
            <div className="space-y-10 print:space-y-0 print:block">
              {(() => {
                const totalPages = Number(selectedBrief.format.pages) || 12
                const spreads = []

                // Cover page (Single layout page)
                spreads.push(
                  <div key="cover" className="relative mx-auto w-full max-w-2xl aspect-[3/4] bg-[#faf8f5] text-[#111a34] shadow-2xl flex flex-col justify-between p-12 border border-slate-200 print:shadow-none print:border-none page-break-after">
                    {/* Retro noise overlay */}
                    <div className="pointer-events-none absolute inset-0 bg-memo-noise opacity-5 opacity-40 mix-blend-overlay" />
                    
                    <div className="text-center">
                      <p className="text-[10px] tracking-[0.3em] uppercase font-mono text-[#8a7238] border-b border-[#8a7238]/30 pb-2">
                        {selectedBrief.format.size} Special Edition · Nuline Publisher
                      </p>
                    </div>

                    {/* Cover image (Page 1 assigned image) */}
                    {(() => {
                      const covImgName = pageImages[1] || ''
                      const covImg = selectedBrief.images?.find(img => img.name === covImgName) || selectedBrief.images?.[0]
                      return covImg ? (
                        <div className="my-8 flex-1 w-full max-h-[55%] rounded border border-slate-200 overflow-hidden bg-slate-100">
                          <img src={covImg.url} alt="Cover image" className="size-full object-cover" />
                        </div>
                      ) : (
                        <div className="my-8 flex-1 w-full max-h-[55%] border border-dashed border-[#8a7238]/50 flex items-center justify-center text-xs text-[#8a7238] italic">
                          No cover image placed
                        </div>
                      )
                    })()}

                    <div className="text-center space-y-4">
                      <h1 className="font-serif text-5xl font-normal tracking-wide text-balance uppercase leading-none">
                        {pageDrafts[1]?.title || selectedBrief.contact_name}
                      </h1>
                      <h2 className="font-serif italic text-2xl text-[#8a7238]">
                        {pageDrafts[1]?.subtitle || `Celebrating ${selectedBrief.category}`}
                      </h2>
                      <p className="text-xs max-w-md mx-auto text-slate-600 leading-relaxed font-sans mt-4 font-light">
                        {pageDrafts[1]?.text || selectedBrief.additional_notes || 'A custom designed printed narrative curated for this important milestone.'}
                      </p>
                    </div>

                    <div className="text-center mt-6">
                      <span className="font-mono text-[9px] tracking-widest text-[#8a7238] uppercase">
                        Issue 01 · Printed {new Date(selectedBrief.created_at).getFullYear()}
                      </span>
                    </div>
                  </div>
                )

                // Editorial pages (two-page spreads: 2-3, 4-5, 6-7, etc.)
                for (let pageNum = 2; pageNum <= totalPages; pageNum += 2) {
                  const leftPage = pageNum
                  const rightPage = pageNum + 1 <= totalPages ? pageNum + 1 : null

                  const leftDraft = pageDrafts[leftPage] || { title: '', subtitle: '', text: '' }
                  const leftImgName = pageImages[leftPage] || ''
                  const leftImg = selectedBrief.images?.find(img => img.name === leftImgName)

                  const rightDraft = rightPage ? (pageDrafts[rightPage] || { title: '', subtitle: '', text: '' }) : null
                  const rightImgName = rightPage ? (pageImages[rightPage] || '') : ''
                  const rightImg = rightPage ? selectedBrief.images?.find(img => img.name === rightImgName) : null

                  spreads.push(
                    <div key={`spread-${leftPage}`} className="flex flex-col md:flex-row gap-6 mx-auto w-full max-w-5xl print:flex-row print:gap-0 print:max-w-none page-break-after">
                      
                      {/* Left Page */}
                      <div className="flex-1 aspect-[3/4] bg-[#faf8f5] text-[#111a34] shadow-2xl p-10 border border-slate-200 flex flex-col justify-between print:shadow-none print:border-none print:aspect-auto print:min-h-screen">
                        <div className="flex justify-between items-center text-[9px] font-mono text-slate-400 border-b border-slate-200 pb-2 uppercase">
                          <span>{selectedBrief.category} Magazine</span>
                          <span>Editorial Plan</span>
                        </div>

                        <div className="my-auto space-y-6">
                          {leftImg && (
                            <div className="w-full aspect-[16/10] rounded overflow-hidden bg-slate-100 border border-slate-200 shadow-sm">
                              <img src={leftImg.url} alt={leftImg.name} className="size-full object-cover" />
                            </div>
                          )}
                          
                          <div className="space-y-3">
                            <h3 className="font-serif text-3xl font-normal leading-tight text-balance uppercase">
                              {leftDraft.title || `PAGE HEADER ${leftPage}`}
                            </h3>
                            {leftDraft.subtitle && (
                              <h4 className="font-mono text-xs tracking-wider text-[#8a7238] uppercase">
                                {leftDraft.subtitle}
                              </h4>
                            )}
                            <p className="text-sm text-slate-600 font-light leading-relaxed whitespace-pre-wrap font-sans">
                              {leftDraft.text || 'Editorial copy under development. Fill out copy drafts in the Creative Canvas.'}
                            </p>
                          </div>
                        </div>

                        <div className="flex justify-between items-center text-[9px] font-mono text-slate-400 border-t border-slate-200 pt-2">
                          <span>Page {leftPage}</span>
                          <span className="italic">Nuline Press</span>
                        </div>
                      </div>

                      {/* Right Page */}
                      {rightPage ? (
                        <div className="flex-1 aspect-[3/4] bg-[#faf8f5] text-[#111a34] shadow-2xl p-10 border border-slate-200 flex flex-col justify-between print:shadow-none print:border-none print:aspect-auto print:min-h-screen">
                          <div className="flex justify-between items-center text-[9px] font-mono text-slate-400 border-b border-slate-200 pb-2 uppercase">
                            <span>Editorial Plan</span>
                            <span>{selectedBrief.category} Magazine</span>
                          </div>

                          <div className="my-auto space-y-6">
                            {rightDraft && (
                              <div className="space-y-3">
                                <h3 className="font-serif text-3xl font-normal leading-tight text-balance uppercase">
                                  {rightDraft.title || `PAGE HEADER ${rightPage}`}
                                </h3>
                                {rightDraft.subtitle && (
                                  <h4 className="font-mono text-xs tracking-wider text-[#8a7238] uppercase">
                                    {rightDraft.subtitle}
                                  </h4>
                                )}
                                <p className="text-sm text-slate-600 font-light leading-relaxed whitespace-pre-wrap font-sans">
                                  {rightDraft.text || 'Editorial copy under development. Fill out copy drafts in the Creative Canvas.'}
                                </p>
                              </div>
                            )}

                            {rightImg && (
                              <div className="w-full aspect-[16/10] rounded overflow-hidden bg-slate-100 border border-slate-200 shadow-sm">
                                <img src={rightImg.url} alt={rightImg.name} className="size-full object-cover" />
                              </div>
                            )}
                          </div>

                          <div className="flex justify-between items-center text-[9px] font-mono text-slate-400 border-t border-slate-200 pt-2">
                            <span className="italic">Nuline Press</span>
                            <span>Page {rightPage}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex-1 hidden md:block print:hidden bg-slate-900 border border-memo-line border-dashed rounded-2xl flex items-center justify-center text-xs text-memo-muted">
                          End of Layout Format
                        </div>
                      )}

                    </div>
                  )
                }

                return spreads
              })()}
            </div>

          </div>
        )}

      </div>
    </main>
  )
}

// Subcomponents

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-wider transition-all select-none cursor-pointer ${
        active 
          ? 'bg-memo-gold text-memo-ink' 
          : 'text-memo-muted hover:text-memo-cream hover:bg-memo-panel/30'
      }`}
    >
      {children}
    </button>
  )
}

function StatsCard({ title, value, description, icon: Icon, color }: { title: string; value: number; description: string; icon: any; color: string }) {
  return (
    <div className="rounded-xl border border-memo-line bg-memo-panel p-6">
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono uppercase tracking-widest text-memo-muted">{title}</span>
        <Icon className={`size-5 ${color}`} />
      </div>
      <div className="mt-4 flex items-baseline gap-2">
        <span className="font-serif text-4xl font-semibold text-foreground">{value}</span>
      </div>
      <p className="mt-2 text-xs text-memo-muted leading-relaxed">{description}</p>
    </div>
  )
}

function CategoryBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const percentage = total > 0 ? (count / total) * 100 : 0
  return (
    <div>
      <div className="flex justify-between text-xs font-mono mb-1">
        <span className="text-foreground">{label}</span>
        <span className="text-memo-muted">{count} orders ({Math.round(percentage)}%)</span>
      </div>
      <div className="h-2 rounded bg-memo-ink overflow-hidden border border-memo-line/30">
        <div className={`h-full ${color} rounded`} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: MagazineBrief['status'] }) {
  let styles = 'bg-memo-blue/15 text-memo-gold border border-memo-line'
  let label = 'Submitted'
  
  if (status === 'drafting') {
    styles = 'bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-900/30'
    label = 'Drafting'
  } else if (status === 'reviewing') {
    styles = 'bg-indigo-100 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900/30'
    label = 'Reviewing'
  } else if (status === 'approved') {
    styles = 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/30'
    label = 'Approved'
  } else if (status === 'printed') {
    styles = 'bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
    label = 'Printed'
  }

  return (
    <span className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded ${styles}`}>
      {label}
    </span>
  )
}
