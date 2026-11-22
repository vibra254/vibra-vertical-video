
import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import {
  Home, Search, Plus, Inbox, User, Heart,
  MessageCircle, Share2, Volume2, VolumeX, Bot, Sparkles
} from 'lucide-react'
export const Route = createFileRoute('/')({
  component: VibraApp,
})

type Video = {
  id: string
  user_id: string | null
  video_url: string
  caption: string
  username: string
  avatar: string | null
  country: string
  created_at: string
}

type Comment = {
  id?: number
  video_id: string
  username: string
  text: string
  created_at: string
}

function VibraApp() {
  const [page, setPage] = useState('home')
  const [aiMessages, setAiMessages] = useState<{role: 'user' | 'assistant'; text: string}[]>([])
  const [aiInput, setAiInput] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [userId, setUserId] = useState('')
  const [authReady, setAuthReady] = useState(false)
  const [authError, setAuthError] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [authBusy, setAuthBusy] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login')
  const [language, setLanguage] = useState('sw')
  const [videos, setVideos] = useState<Video[]>([])
  const [loadingVideos, setLoadingVideos] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [likedIds, setLikedIds] = useState<string[]>([])
  const [serverLikes, setServerLikes] = useState<Record<string, number>>({})
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({})
  const [followedIds, setFollowedIds] = useState<string[]>([])
  const [savedIds, setSavedIds] = useState<string[]>([])
  const [dp, setDp] = useState('')
  const [userName] = useState('Mr vibra')
  const [userHandle] = useState('@hamadoski')
  const [activeVideo, setActiveVideo] = useState<string | null>(null)
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [commentText, setCommentText] = useState('')
  const [loadingComments, setLoadingComments] = useState(false)
  const [sendingComment, setSendingComment] = useState(false)
  const [workingLikeIds, setWorkingLikeIds] = useState<string[]>([])
  const [search, setSearch] = useState('')
  const [progress, setProgress] = useState<Record<string, number>>({})
  const [durations, setDurations] = useState<Record<string, number>>({})
  const [muted, setMuted] = useState(true)

  const fileRef = useRef<HTMLInputElement>(null)
  const recordRef = useRef<HTMLInputElement>(null)
  const imageRef = useRef<HTMLInputElement>(null)
  const [uploadMenuOpen, setUploadMenuOpen] = useState(false)
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({})

  // Soma data za ndani baada ya ukurasa kufunguka (salama kwa server-side rendering).
  useEffect(() => {
    try {
      setSavedIds(JSON.parse(localStorage.getItem('vibra_saved') || '[]'))
      setDp(localStorage.getItem('vibra_dp') || '')
    } catch {
      setSavedIds([])
      setDp('')
    }
  }, [])
  
const sendAiMessage = async () => {
 const q=aiInput.trim(); if(!q||aiLoading)return
 setAiMessages(p=>[...p,{role:'user',text:q}]);setAiInput('');setAiLoading(true)
 window.setTimeout(()=>{setAiMessages(p=>[...p,{role:'assistant',text:'Karibu VIBRA WORLDWIDE! Hii ni demo ya VIBRA AI.'}]);setAiLoading(false)},450)
}
useEffect(()=>{try{const id=localStorage.getItem('vibra_demo_user');if(id)setUserId(id)}catch{}setAuthReady(true)},[])
const submitAuth=async()=>{
 if(!email.trim()||!password){alert(language==='sw'?'Weka email na password.':'Enter email and password.');return}
 if(password.length<4){alert(language==='sw'?'Password iwe na angalau herufi/namba 4.':'Password must be at least 4 characters.');return}
 setAuthBusy(true);const id='demo-'+email.trim().toLowerCase()
 try{localStorage.setItem('vibra_demo_user',id);localStorage.setItem('vibra_demo_email',email.trim())}catch{}
 setUserId(id);setAuthError('');setAuthBusy(false)
}
const loginGoogle=async()=>{try{localStorage.setItem('vibra_demo_user','demo-guest')}catch{}setUserId('demo-guest');setAuthError('')}
// Demo video feed.
const loadVideos=async()=>{
 setLoadingVideos(true)
 setVideos([
 {id:'demo-flower',user_id:'creator-1',video_url:'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',caption:'Karibu VIBRA WORLDWIDE 🌍✨ #VIBRA #Kenya',username:'VIBRA WORLDWIDE',avatar:null,country:'Kenya',created_at:new Date().toISOString()},
 {id:'demo-bunny',user_id:'creator-2',video_url:'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',caption:'Furahia video fupi hapa VIBRA! 🎬',username:'VIBRA Creator',avatar:null,country:'Worldwide',created_at:new Date().toISOString()},
 {id:'demo-elephant',user_id:'creator-3',video_url:'https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',caption:'Create • Watch • Share ❤️',username:'VIBRA Studio',avatar:null,country:'Worldwide',created_at:new Date().toISOString()}
 ])
 setServerLikes({'demo-flower':128,'demo-bunny':86,'demo-elephant':54});setCommentCounts({'demo-flower':12,'demo-bunny':8,'demo-elephant':5});setLoadingVideos(false)
}
useEffect(()=>{if(userId)loadVideos()},[userId])

  // Demo likes na comments zinatunzwa ndani ya app.
const loadServerLikes=async()=>{}
const loadServerComments=async(_clipKey:string)=>{setComments([]);setLoadingComments(false)}
useEffect(()=>{try{setLikedIds(JSON.parse(localStorage.getItem('vibra_demo_likes')||'[]'))}catch{setLikedIds([])}},[userId])

  useEffect(() => {
    if (activeVideo) loadServerComments(activeVideo)
  }, [activeVideo])

  // Video inachezwa ikiwa imeonekana kwenye skrini.
  useEffect(() => {
    if (page !== 'home' || videos.length === 0) return

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.65) {
            const id = entry.target.getAttribute('data-video-id')
            if (id) setActiveVideoId(id)
          }
        })
      },
      { threshold: [0.3, 0.65, 0.9] }
    )

    document.querySelectorAll('[data-video-id]').forEach(element => {
      observer.observe(element)
    })

    return () => observer.disconnect()
  }, [videos, page])

  // Simamisha video zote isipokuwa iliyo mbele.
  useEffect(() => {
    Object.entries(videoRefs.current).forEach(([id, video]) => {
      if (!video) return

      if (id === activeVideoId && page === 'home') {
        video.muted = muted
        video.play().catch(() => {
          video.muted = true
          setMuted(true)
          video.play().catch(() => {})
        })
      } else {
        video.pause()
        video.muted = true
      }
    })
  }, [activeVideoId, page, videos, muted])

  const toggleSave = (id: string) => {
    setSavedIds(previous => {
      const next = previous.includes(id) ? previous.filter(item => item !== id) : [...previous, id]
      localStorage.setItem('vibra_saved', JSON.stringify(next))
      return next
    })
  }

  const toggleSound = (id: string) => {
    const video = videoRefs.current[id]
    if (!video) return

    const nextMuted = !muted
    setMuted(nextMuted)
    video.muted = nextMuted

    if (!nextMuted) video.play().catch(() => {})
  }

const toggleLike=async(id:string)=>{
 const was=likedIds.includes(id);const next=was?likedIds.filter(x=>x!==id):[...likedIds,id]
 setLikedIds(next);setServerLikes(p=>({...p,[id]:Math.max(0,(p[id]||0)+(was?-1:1))}))
 try{localStorage.setItem('vibra_demo_likes',JSON.stringify(next))}catch{}
}
const openComments = (id: string) => {
    setActiveVideo(id)
    setComments([])
    setCommentText('')
  }

const addComment=async()=>{
 if(!activeVideo||!commentText.trim())return
 setSendingComment(true);setComments(p=>[...p,{video_id:activeVideo,username:userHandle,text:commentText.trim(),created_at:new Date().toISOString()}])
 setCommentCounts(p=>({...p,[activeVideo]:(p[activeVideo]||0)+1}));setCommentText('');setSendingComment(false)
}
// Upload video ya demo kwenye simu hii pekee.
const uploadVideo=async(event:ChangeEvent<HTMLInputElement>)=>{
 const file=event.target.files?.[0];if(!file)return
 if(!file.type.startsWith('video/')){alert('Chagua faili la video.');return}
 if(file.size>50*1024*1024){alert('Video izidi 50 MB.');return}
 setUploading(true)
 const item:Video={id:'local-'+Date.now(),user_id:userId,video_url:URL.createObjectURL(file),caption:window.prompt('Andika maelezo ya video:')||'Video yangu ya VIBRA',username:userHandle,avatar:dp||null,country:'Kenya',created_at:new Date().toISOString()}
 setVideos(p=>[item,...p]);setUploading(false);setPage('home');alert('Video imeongezwa kwenye simu hii pekee; haijaonekana kwa wengine.');event.target.value=''
}
const changePhoto = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.size > 3 * 1024 * 1024) {
      alert('Picha iwe chini ya 3 MB.')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const url = reader.result as string
      setDp(url)
      localStorage.setItem('vibra_dp', url)
      alert('Picha imebadilika!')
    }
    reader.readAsDataURL(file)
  }

  const shareVideo = async (video: Video) => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'VIBRA WORLDWIDE',
          text: video.caption,
          url: video.video_url,
        })
      } else {
        await navigator.clipboard.writeText(video.video_url)
        alert('Link imenakiliwa.')
      }
    } catch {
      // Mtumiaji akifunga share, hakuna hatua inayohitajika.
    }
  }
  const bottomNav = (
    <div style={{
      position: 'fixed', bottom: 0, left: '50%',
      transform: 'translateX(-50%)', width: '100%',
      maxWidth: '500px', background: '#080D18',
      display: 'flex', justifyContent: 'space-around',
      alignItems: 'center', padding: '9px 0',
      paddingBottom: 'max(9px, env(safe-area-inset-bottom))',
      borderTop: '1px solid #142033', zIndex: 50, color: '#fff',
    }}>
      <span onClick={() => setPage('home')} style={{cursor:'pointer', color:page==='home'?'#00DDF5':'#fff', display:'flex', flexDirection:'column', alignItems:'center', gap:3, fontSize:11}}><Home size={23}/><b>Home</b></span>
      <span onClick={() => setPage('discover')} style={{cursor:'pointer', color:page==='discover'?'#00DDF5':'#fff', display:'flex', flexDirection:'column', alignItems:'center', gap:3, fontSize:11}}><Search size={23}/><b>Explore</b></span>
      <span onClick={() => setUploadMenuOpen(true)} style={{background:'#00DDF5', color:'#fff', width:54, height:44, display:'flex', alignItems:'center', justifyContent:'center', borderRadius:10, cursor:'pointer'}}><Plus size={30}/></span>
      <span onClick={() => setPage('ai')} style={{cursor:'pointer', color:'#00DDF5', display:'flex', flexDirection:'column', alignItems:'center', gap:3, fontSize:11}}><Bot size={24}/><b>VIBRA AI</b></span>
      <span onClick={() => setPage('inbox')} style={{cursor:'pointer', color:page==='inbox'?'#00DDF5':'#fff', display:'flex', flexDirection:'column', alignItems:'center', gap:3, fontSize:11}}><Inbox size={23}/><b>Inbox</b></span>
      <span onClick={() => setPage('me')} style={{cursor:'pointer', color:page==='me'?'#00DDF5':'#fff', display:'flex', flexDirection:'column', alignItems:'center', gap:3, fontSize:11}}><User size={23}/><b>Me</b></span>
    </div>
  )

  if (!authReady) {
    return (
      <div style={{
        background: '#000', color: '#fff', minHeight: '100vh',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', fontFamily: 'sans-serif',
      }}>
        <h1 style={{ color: '#00DDF5', fontSize: '48px', margin: 0 }}>VIBRA</h1>
        <p>VIBRA WORLDWIDE</p>
        <p style={{ color: '#aaa' }}>Inaunganisha...</p>
      </div>
    )
  }

  if (!userId) {
    const sw = language === 'sw'
    return (
      <div style={{ minHeight: '100dvh', background: '#070B14', color: '#fff', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 22, fontFamily: 'Arial,sans-serif' }}>
        <div style={{ width: '100%', maxWidth: 420 }}>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ fontSize: 48, fontWeight: 900, letterSpacing: 2, color: '#00DDF5' }}>VIBRA</div>
            <div style={{ color: '#aab4c5', letterSpacing: 3, fontSize: 12 }}>WORLDWIDE</div>
            <p style={{ color: '#dbe5f5' }}>{sw ? 'Karibu kwenye dunia ya video fupi' : 'Welcome to the world of short videos'}</p>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 18 }}>
            <button type="button" onClick={() => setLanguage('sw')} style={{ padding: '8px 15px', borderRadius: 20, border: language === 'sw' ? '1px solid #00DDF5' : '1px solid #445', background: language === 'sw' ? '#063744' : '#151d2b', color: '#fff' }}>Kiswahili</button>
            <button type="button" onClick={() => setLanguage('en')} style={{ padding: '8px 15px', borderRadius: 20, border: language === 'en' ? '1px solid #00DDF5' : '1px solid #445', background: language === 'en' ? '#063744' : '#151d2b', color: '#fff' }}>English</button>
          </div>
          <div style={{ background: '#111927', border: '1px solid #263449', borderRadius: 18, padding: 22 }}>
            <h2 style={{ marginTop: 0, textAlign: 'center' }}>{authMode === 'login' ? (sw ? 'Ingia VIBRA' : 'Login to VIBRA') : (sw ? 'Tengeneza akaunti' : 'Create account')}</h2>
            <button type="button" disabled={authBusy} onClick={loginGoogle} style={{ width: '100%', padding: 13, borderRadius: 10, border: '1px solid #536176', background: '#fff', color: '#111', fontWeight: 700, marginBottom: 16 }}>
              G  {sw ? 'Endelea na Google' : 'Continue with Google'}
            </button>
            <div style={{ textAlign: 'center', color: '#8190a5', fontSize: 12, margin: '2px 0 14px' }}>— {sw ? 'AU KWA EMAIL' : 'OR WITH EMAIL'} —</div>
            <label style={{ display: 'block', fontSize: 13, marginBottom: 6 }}>Email</label>
            <input type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" style={{ width: '100%', boxSizing: 'border-box', padding: 13, borderRadius: 9, border: '1px solid #39485e', background: '#080f1b', color: '#fff', marginBottom: 13 }} />
            <label style={{ display: 'block', fontSize: 13, marginBottom: 6 }}>Password</label>
            <div style={{ display: 'flex', border: '1px solid #39485e', borderRadius: 9, background: '#080f1b', marginBottom: 16 }}>
              <input type={showPassword ? 'text' : 'password'} autoComplete={authMode === 'login' ? 'current-password' : 'new-password'} value={password} onChange={e => setPassword(e.target.value)} placeholder={sw ? 'Weka password' : 'Enter password'} style={{ flex: 1, minWidth: 0, padding: 13, border: 0, outline: 0, background: 'transparent', color: '#fff' }} />
              <button type="button" aria-label={showPassword ? 'Ficha password' : 'Onyesha password'} onClick={() => setShowPassword(v => !v)} style={{ border: 0, background: 'transparent', color: '#00DDF5', padding: '0 14px', fontSize: 18 }}>{showPassword ? '🙈' : '👁️'}</button>
            </div>
            {authError && <div role="alert" style={{ color: '#ff9b9b', fontSize: 13, marginBottom: 12, overflowWrap: 'anywhere' }}>{authError}</div>}
            <button type="button" disabled={authBusy} onClick={submitAuth} style={{ width: '100%', padding: 14, borderRadius: 10, border: 0, background: '#00DDF5', color: '#00131a', fontWeight: 900, opacity: authBusy ? .6 : 1 }}>
              {authBusy ? (sw ? 'Subiri...' : 'Please wait...') : authMode === 'login' ? (sw ? 'Ingia' : 'Login') : (sw ? 'Jisajili' : 'Create account')}
            </button>
            <button type="button" disabled={authBusy} onClick={() => { setAuthMode(m => m === 'login' ? 'signup' : 'login'); setAuthError('') }} style={{ width: '100%', marginTop: 13, padding: 10, border: 0, background: 'transparent', color: '#00DDF5' }}>
              {authMode === 'login' ? (sw ? 'Huna akaunti? Jisajili' : 'No account? Sign up') : (sw ? 'Tayari una akaunti? Ingia' : 'Already registered? Login')}
            </button>
            <button type="button" onClick={() => window.location.reload()} style={{ width: '100%', marginTop: 4, padding: 9, border: 0, background: 'transparent', color: '#9aa9bd' }}>{sw ? 'Jaribu kuunganisha tena' : 'Retry connection'}</button>
          </div>
          <p style={{ textAlign: 'center', color: '#718096', fontSize: 11, marginTop: 16 }}>VIBRA WORLDWIDE • Watch. Create. Share.</p>
        </div>
      </div>
    )
  }
// VIBRA AI
if (page === 'ai') {
  return (
    <div style={{
      background: '#080D18',
      color: '#fff',
      minHeight: '100vh',
      maxWidth: 500,
      margin: '0 auto',
      fontFamily: 'sans-serif',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <div style={{
        padding: 18,
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        borderBottom: '1px solid #142033',
      }}>
        <button onClick={() => setPage('home')}>←</button>
        <Bot size={28} color="#00DDF5" />
        <div>
          <b>VIBRA AI</b>
          <div style={{ color: '#aaa', fontSize: 12 }}>
            Your smart assistant
          </div>
        </div>
        <Sparkles color="#00DDF5" />
      </div>

      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: 16,
        paddingBottom: 100,
      }}>
        {aiMessages.length === 0 && (
          <div style={{ textAlign: 'center', marginTop: 70 }}>
            <Bot size={55} color="#00DDF5" />
            <h2>Karibu VIBRA AI!</h2>
            <p style={{ color: '#aaa' }}>
              Uliza swali lolote. Niko hapa kukusaidia.
            </p>
          </div>
        )}

        {aiMessages.map((message, index) => (
          <div key={index} style={{
            background: message.role === 'user' ? '#007F9E' : '#142033',
            padding: 14,
            borderRadius: 16,
            marginBottom: 12,
            maxWidth: '85%',
            marginLeft: message.role === 'user' ? 'auto' : 0,
            whiteSpace: 'pre-wrap',
          }}>
            {message.text}
          </div>
        ))}

        {aiLoading && <p style={{ color: '#00DDF5' }}>VIBRA AI inafikiria...</p>}
      </div>

      <div style={{
        display: 'flex',
        gap: 8,
        padding: 12,
        position: 'sticky',
        bottom: 0,
        background: '#080D18',
      }}>
        <input
          value={aiInput}
          onChange={e => setAiInput(e.target.value)}
          placeholder="Andika swali lako..."
          style={{
            flex: 1,
            padding: 14,
            borderRadius: 25,
            border: '1px solid #444',
            background: '#142033',
            color: '#fff',
            outline: 'none',
          }}
        />
        <button
          onClick={sendAiMessage}
          disabled={aiLoading || !aiInput.trim()}
          style={{
            background: '#00DDF5',
            color: '#fff',
            border: 0,
            borderRadius: 25,
            padding: '0 18px',
          }}
        >
          Tuma
        </button>
      </div>
    </div>
  )
}
  // PROFILE
  if (page === 'me') {
    return (
      <div style={{ background: '#000', minHeight: '100vh', color: '#fff', fontFamily: 'sans-serif', padding: '20px 16px 100px', maxWidth: 500, margin: '0 auto' }}>
        <input ref={imageRef} type="file" accept="image/*" onChange={changePhoto} style={{ display: 'none' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span onClick={() => setPage('home')} style={{ fontSize: 24 }}>←</span>
          <b>{userHandle}</b><span>⋯</span>
        </div>

        <div style={{ textAlign: 'center', marginTop: 28 }}>
          <div onClick={() => imageRef.current?.click()} style={{
            width: 115, height: 115, borderRadius: '50%', background: '#333',
            margin: 'auto', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: 50, overflow: 'hidden',
            border: '3px solid #00DDF5',
          }}>
            {dp ? <img src={dp} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '👤'}
          </div>
          <p style={{ color: '#aaa', fontSize: 13 }}>Bonyeza picha kubadilisha</p>
          <button onClick={() => imageRef.current?.click()} style={{
            background: '#00DDF5', color: '#fff', border: 0,
            padding: '12px 25px', borderRadius: 25, fontWeight: 800,
          }}>Change DP - Badilisha Picha</button>
          <br/>
          <button onClick={() => { setDp(''); localStorage.removeItem('vibra_dp') }} style={{
            background: 'transparent', color: '#aaa', border: '1px solid #444',
            padding: 9, borderRadius: 20, marginTop: 10,
          }}>Remove DP</button>
        </div>

        <h2 style={{ textAlign: 'center', marginBottom: 5 }}>{userName}</h2>
        <p style={{ textAlign: 'center', color: '#aaa' }}>{userHandle} • Kenya</p>
        <p style={{ textAlign: 'center' }}>🔥 VIBRA Creator 🌍</p>

        <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center', margin: '25px 0' }}>
          <div><b>0</b><br/><small>Following</small></div>
          <div><b>0</b><br/><small>Followers</small></div>
          <div><b>{likedIds.length}</b><br/><small>Likes</small></div>
        </div>

        <button onClick={() => setPage('saved')} style={{
          width: '100%', padding: 12, marginBottom: 12, background: '#222',
          color: '#fff', border: 0, borderRadius: 8,
        }}>🔖 Saved Videos ({savedIds.length})</button>
        <button onClick={() => setPage('home')} style={{
          width: '100%', padding: 12, background: '#222',
          color: '#fff', border: 0, borderRadius: 8,
        }}>Back to Videos</button>

        <h3>🎬 My Videos</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 5 }}>
          {videos.filter(v => v.user_id === userId).map(v => (
            <video key={v.id} src={v.video_url} muted playsInline style={{
              width: '100%', aspectRatio: '3/4', objectFit: 'cover',
              background: '#222', borderRadius: 5,
            }} />
          ))}
        </div>
        {bottomNav}
      </div>
    )
  }

  // SAVED VIDEOS
  if (page === 'saved') {
    const savedVideos = videos.filter(v => savedIds.includes(v.id))
    return (
      <div style={{ background: '#000', minHeight: '100vh', color: '#fff', fontFamily: 'sans-serif', padding: '16px 16px 100px', maxWidth: 500, margin: '0 auto' }}>
        <h2>🔖 Saved Videos</h2>
        <button onClick={() => setPage('me')} style={{ background: '#222', color: '#fff', border: 0, padding: 10, borderRadius: 8 }}>← Profile</button>
        {savedVideos.length === 0 ? <p style={{ color: '#aaa' }}>Bado hujahifadhi video.</p> : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 14 }}>
            {savedVideos.map(v => <div key={v.id} onClick={() => { setPage('home'); setActiveVideoId(v.id) }}>
              <video src={v.video_url} muted playsInline style={{ width: '100%', aspectRatio: '3/4', objectFit: 'cover', background: '#222', borderRadius: 8 }} />
              <small>{v.username}</small>
            </div>)}
          </div>
        )}
        {bottomNav}
      </div>
    )
  }

  // DISCOVER
  if (page === 'discover') {
    const filteredVideos = videos.filter(v =>
      `${v.username} ${v.caption}`.toLowerCase().includes(search.toLowerCase())
    )

    return (
      <div style={{ background: '#000', minHeight: '100vh', color: '#fff', fontFamily: 'sans-serif', padding: '16px 16px 100px', maxWidth: 500, margin: '0 auto' }}>
        <h2>🔍 Discover VIBRA</h2>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search VIBRA..." style={{
            width: '100%', padding: 13, borderRadius: 20,
            border: 0, background: '#222', color: '#fff',
          }} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginTop: 16 }}>
          {filteredVideos.map(v => (
            <div key={v.id} onClick={() => { setPage('home'); setActiveVideoId(v.id) }} style={{ position: 'relative' }}>
              <video src={v.video_url} muted playsInline style={{
                width: '100%', aspectRatio: '3/4', objectFit: 'cover',
                background: '#222', borderRadius: 7,
              }} />
              <small>{v.username}</small>
            </div>
          ))}
        </div>
        {filteredVideos.length === 0 && <p style={{ color: '#aaa' }}>Hakuna video iliyopatikana.</p>}
        {bottomNav}
      </div>
    )
  }

  // INBOX
  if (page === 'inbox') {
    return (
      <div style={{ background: '#000', minHeight: '100vh', color: '#fff', fontFamily: 'sans-serif', padding: '16px 16px 100px', maxWidth: 500, margin: '0 auto' }}>
        <h2>📥 Inbox</h2>
        <p style={{ color: '#aaa' }}>Karibu VIBRA WORLDWIDE!</p>
        <div style={{ background: '#151515', padding: 15, borderRadius: 12 }}>❤️ Likes na comments zako zitaonekana hapa.</div>
        {bottomNav}
      </div>
    )
  }

  // HOME FEED
  return (
    <div style={{
      background: '#000', color: '#fff', fontFamily: 'sans-serif',
      height: '100dvh', overflowY: 'auto', scrollSnapType: 'y mandatory',
    }}>
      <input ref={fileRef} type="file" accept="video/*" onChange={uploadVideo} style={{ display: 'none' }} />
      <input ref={recordRef} type="file" accept="video/*" capture="environment" onChange={uploadVideo} style={{ display: 'none' }} />

      <div style={{
        position: 'fixed', top: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 500, zIndex: 10,
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', padding: '12px 16px',
        background: 'linear-gradient(#0009,transparent)',
        pointerEvents: 'none',
      }}>
        <b style={{ fontSize: 25, color: '#00DDF5' }}>VIBRA</b>
        <span style={{ fontWeight: 800 }}>For You</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, pointerEvents: 'auto' }}>
          <button type="button" aria-label="Tafuta video" onClick={() => setPage('discover')} style={{ fontSize: 22, background: 'transparent', border: 0, color: '#fff', padding: 4 }}>🔍</button>
          <button type="button" aria-label="Fungua wasifu wangu" onClick={() => setPage('me')} style={{ width: 36, height: 36, borderRadius: '50%', overflow: 'hidden', border: '2px solid #00DDF5', background: '#142033', color: '#fff', padding: 0, display: 'grid', placeItems: 'center' }}>
            {dp ? <img src={dp} alt="DP" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '👤'}
          </button>
        </div>
      </div>

      {uploading && (
        <div style={{
          position: 'fixed', top: 65, left: 0, right: 0,
          zIndex: 80, textAlign: 'center', background: '#00DDF5',
          padding: 10, color: '#fff',
        }}>Inapakia video yako...</div>
      )}

      {loadingVideos ? (
        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
          <h1 style={{ color: '#00DDF5' }}>VIBRA</h1>
          <p>Inapakia video...</p>
        </div>
      ) : videos.length === 0 ? (
        <div style={{
          height: '100%', display: 'flex', alignItems: 'center',
          justifyContent: 'center', flexDirection: 'column',
          textAlign: 'center', padding: 30,
        }}>
          <h1 style={{ color: '#00DDF5', fontSize: 42 }}>VIBRA</h1>
          <h3>Karibu VIBRA WORLDWIDE 🌍</h3>
          <p style={{ color: '#aaa' }}>Bado hakuna video. Kuwa wa kwanza kupakia video!</p>
          <button onClick={() => fileRef.current?.click()} style={{
            background: '#00DDF5', color: '#fff', border: 0,
            padding: '14px 25px', borderRadius: 25, fontWeight: 800,
          }}>＋ Upload Video</button>
        </div>
      ) : (
        videos.map(v => (
          <div key={v.id} data-video-id={v.id} style={{
            height: '100dvh', width: '100%', maxWidth: 500,
            margin: '0 auto', position: 'relative',
            background: '#000', scrollSnapAlign: 'start',
            overflow: 'hidden',
          }}>
            <video
              ref={element => { videoRefs.current[v.id] = element }}
              src={v.video_url}
              playsInline
              loop
              muted={muted || activeVideoId !== v.id}
              preload="metadata"
              onTimeUpdate={e => setProgress(previous => ({
                ...previous, [v.id]: e.currentTarget.currentTime,
              }))}
              onLoadedMetadata={e => setDurations(previous => ({
                ...previous, [v.id]: e.currentTarget.duration || 0,
              }))}
              style={{
                width: '100%', height: '100%', objectFit: 'contain',
                background: '#000', pointerEvents: 'none',
              }}
            />

            <button type="button" aria-label="Washa au zima sauti" onClick={e => { e.preventDefault(); e.stopPropagation(); toggleSound(v.id) }} style={{
              position: 'absolute', top: 75, right: 15, zIndex: 80,
              background: '#000b', color: '#fff', border: '1px solid #ffffff55',
              padding: '8px 11px', borderRadius: 25, fontSize: 20,
            }}>{muted ? '🔇' : '🔊'}</button>

            <div
              onClick={e => e.stopPropagation()}
              style={{
                position: 'absolute', right: 12, bottom: 115,
                zIndex: 90, pointerEvents: 'auto',
                display: 'flex', flexDirection: 'column',
                gap: 20, alignItems: 'center',
                touchAction: 'manipulation',
              }}>
              <div onClick={() => v.user_id === userId && setPage('me')} style={{
                width: 48, height: 48, borderRadius: '50%',
                background: '#333', border: '2px solid white',
                display: 'flex', alignItems: 'center',
                justifyContent: 'center', overflow: 'hidden',
              }}>
                {v.avatar ? <img src={v.avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '👤'}
              </div>

              {v.user_id !== userId && (
                <button type="button" aria-label="Follow creator" onClick={e => { e.preventDefault(); e.stopPropagation(); setFollowedIds(previous => previous.includes(v.user_id || '') ? previous.filter(id => id !== v.user_id) : [...previous, v.user_id || '']) }} style={{
                  background: followedIds.includes(v.user_id || '') ? '#555' : '#00DDF5',
                  border: 0, color: '#fff', borderRadius: '50%', padding: '2px 7px', marginTop: -25,
                  pointerEvents: 'auto', touchAction: 'manipulation',
                }}>{followedIds.includes(v.user_id || '') ? '✓' : '+'}</button>
              )}

              <button type="button" aria-label="Like video" onClick={e => { e.preventDefault(); e.stopPropagation(); void toggleLike(v.id) }} style={{ textAlign: 'center', cursor: 'pointer', pointerEvents: 'auto', touchAction: 'manipulation', background: 'transparent', border: 0, color: '#fff', padding: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <span style={{ fontSize: 32, lineHeight: 1 }}>{likedIds.includes(v.id) ? '❤️' : '🤍'}</span>
                <small>{serverLikes[v.id] || 0}</small>
              </button>

              <button type="button" aria-label="Fungua comments" onClick={e => { e.preventDefault(); e.stopPropagation(); void openComments(v.id) }} style={{ textAlign: 'center', cursor: 'pointer', pointerEvents: 'auto', touchAction: 'manipulation', background: 'transparent', border: 0, color: '#fff', padding: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <span style={{ fontSize: 30, lineHeight: 1 }}>💬</span>
                <small>{commentCounts[v.id] || 0}</small>
              </button>

              <button type="button" aria-label="Hifadhi video" onClick={e => { e.preventDefault(); e.stopPropagation(); toggleSave(v.id) }} style={{ textAlign: 'center', cursor: 'pointer', pointerEvents: 'auto', touchAction: 'manipulation', background: 'transparent', border: 0, color: '#fff', padding: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <span style={{ fontSize: 30 }}>🔖</span>
                <small>{savedIds.includes(v.id) ? 'Saved' : 'Save'}</small>
              </button>

              <button type="button" aria-label="Share video" onClick={e => { e.preventDefault(); e.stopPropagation(); void shareVideo(v) }} style={{ fontSize: 30, cursor: 'pointer', pointerEvents: 'auto', touchAction: 'manipulation', background: 'transparent', border: 0, color: '#fff', padding: 0 }}>↗️</button>
            </div>

            <div style={{
              position: 'absolute', bottom: 100, left: 14, right: 75,
              textShadow: '1px 1px 4px #000',
            }}>
              <b>{v.username}</b>
              <p style={{ fontSize: 14, margin: '6px 0' }}>{v.caption}</p>
              <small>🎵 Original sound • {v.username}</small>
            </div>

            <div style={{
              position: 'absolute', bottom: 83, left: 0, right: 0,
              height: 3, background: '#ffffff55',
            }}>
              <div style={{
                height: '100%', background: '#00DDF5',
                width: `${durations[v.id] ? Math.min(100, (progress[v.id] || 0) / durations[v.id] * 100) : 0}%`,
              }} />
            </div>

            <input
              type="range"
              min="0"
              max={durations[v.id] || 100}
              value={Math.min(progress[v.id] || 0, durations[v.id] || 100)}
              onChange={e => {
                const video = videoRefs.current[v.id]
                if (video) {
                  video.currentTime = Number(e.target.value)
                  setProgress(previous => ({ ...previous, [v.id]: video.currentTime }))
                }
              }}
              style={{
                position: 'absolute', bottom: 75, left: 0,
                width: '100%', height: 12, opacity: 0.01,
              }}
            />
          </div>
        ))
      )}

      {bottomNav}

      {uploadMenuOpen && (
        <div onClick={() => setUploadMenuOpen(false)} style={{
          position: 'fixed', inset: 0, zIndex: 120, background: '#000b',
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            width: '100%', maxWidth: 500, background: '#171717',
            color: '#fff', borderRadius: '20px 20px 0 0', padding: 22,
            paddingBottom: 'max(22px, env(safe-area-inset-bottom))',
          }}>
            <h3 style={{ textAlign: 'center', marginTop: 4 }}>＋ Create on VIBRA</h3>
            <button onClick={() => { setUploadMenuOpen(false); recordRef.current?.click() }} style={{
              width: '100%', padding: 16, marginTop: 10, border: 0,
              borderRadius: 12, background: '#00DDF5', color: '#fff',
              fontSize: 16, fontWeight: 800,
            }}>🎥 Record video</button>
            <button onClick={() => { setUploadMenuOpen(false); fileRef.current?.click() }} style={{
              width: '100%', padding: 16, marginTop: 10, border: '1px solid #555',
              borderRadius: 12, background: '#142033', color: '#fff',
              fontSize: 16, fontWeight: 800,
            }}>🖼️ Choose from Gallery</button>
            <button onClick={() => setUploadMenuOpen(false)} style={{
              width: '100%', padding: 13, marginTop: 10, border: 0,
              background: 'transparent', color: '#aaa', fontSize: 15,
            }}>Cancel</button>
          </div>
        </div>
      )}

      {activeVideo !== null && (
        <div style={{
          position: 'fixed', inset: 0, background: '#000b',
          zIndex: 99999, display: 'flex', alignItems: 'flex-end', pointerEvents: 'auto',
          justifyContent: 'center',
        }}>
          <div style={{
            width: '100%', maxWidth: 500, height: '70vh',
            background: '#171717', borderRadius: '18px 18px 0 0',
            color: '#fff', display: 'flex', flexDirection: 'column',
            padding: 16, position: 'relative', zIndex: 100000, pointerEvents: 'auto',
          }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              borderBottom: '1px solid #333', paddingBottom: 12,
            }}>
              <b>Comments ({comments.length})</b>
              <span onClick={() => setActiveVideo(null)} style={{ fontSize: 24 }}>✕</span>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 0' }}>
              {loadingComments ? (
                <p style={{ color: '#aaa', textAlign: 'center' }}>Inapakia...</p>
              ) : comments.length === 0 ? (
                <p style={{ color: '#aaa', textAlign: 'center' }}>Hakuna comment bado.</p>
              ) : comments.map((comment, index) => (
                <div key={comment.id ?? `${comment.created_at}-${index}`} style={{ padding: 10, borderBottom: '1px solid #333' }}>
                  <b>{comment.username}</b>
                  <p>{comment.text}</p>
                  <small style={{ color: '#888' }}>{new Date(comment.created_at).toLocaleString()}</small>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 8, paddingTop: 10 }}>
              <input
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') addComment() }}
                placeholder="Andika comment..."
                style={{
                  flex: 1, minWidth: 0, padding: 12,
                  borderRadius: 22, border: '1px solid #444',
                  background: '#142033', color: '#fff',
                }}
              />
              <button onClick={addComment} disabled={sendingComment || !commentText.trim()}
                style={{
                  background: '#00DDF5', color: '#fff',
                  border: 0, borderRadius: 22, padding: '0 16px',
                }}>
                {sendingComment ? '...' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
