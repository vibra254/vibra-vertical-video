
import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, updateProfile, signOut } from 'firebase/auth'
import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, increment, orderBy, query, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore'
import { getDownloadURL, ref as storageRef, uploadBytes } from 'firebase/storage'
import { getVibraAIModel, getVibraAuth, getVibraDb, getVibraStorage, vibraGoogleProvider } from '../lib/firebase'
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
  id?: string
  video_id: string
  username: string
  text: string
  created_at: string
}
type StoredVideo = Omit<Video, 'video_url'> & { file: Blob }
function openVibraDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('vibra-worldwide-local', 1)
    request.onupgradeneeded = () => { if (!request.result.objectStoreNames.contains('videos')) request.result.createObjectStore('videos', { keyPath: 'id' }) }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}
async function saveLocalVideo(video: StoredVideo): Promise<void> {
  const db = await openVibraDB()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction('videos', 'readwrite'); tx.objectStore('videos').put(video)
    tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error)
  })
  db.close()
}
async function readLocalVideos(): Promise<Video[]> {
  const db = await openVibraDB()
  const rows = await new Promise<StoredVideo[]>((resolve, reject) => {
    const request = db.transaction('videos', 'readonly').objectStore('videos').getAll()
    request.onsuccess = () => resolve(request.result as StoredVideo[]); request.onerror = () => reject(request.error)
  })
  db.close()
  return rows.map(({file,...video})=>({...video,video_url:URL.createObjectURL(file)}))
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
  const [followerCount, setFollowerCount] = useState(0)
  const [notifications, setNotifications] = useState<{id:string;type:string;actorName:string;videoId?:string;createdAt?:any}[]>([])
  const [loadingNotifications, setLoadingNotifications] = useState(false)
  const [savedIds, setSavedIds] = useState<string[]>([])
  const [dp, setDp] = useState('')
  const [userName, setUserName] = useState('Mr vibra')
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
  const [lyricsVideoId, setLyricsVideoId] = useState<string | null>(null)
  const [lyricsByVideo, setLyricsByVideo] = useState<Record<string, string>>({})

  const fileRef = useRef<HTMLInputElement>(null)
  const recordRef = useRef<HTMLInputElement>(null)
  const imageRef = useRef<HTMLInputElement>(null)
  const [uploadMenuOpen, setUploadMenuOpen] = useState(false)
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({})

  // Soma data za ndani baada ya ukurasa kufunguka (salama kwa server-side rendering).
  useEffect(() => {
    try {
      setSavedIds(JSON.parse(localStorage.getItem('vibra_saved') || '[]'))
      setLikedIds(JSON.parse(localStorage.getItem('vibra_demo_likes') || '[]'))
      setFollowedIds(JSON.parse(localStorage.getItem('vibra_following') || '[]'))
      setDp(localStorage.getItem('vibra_dp') || '')
      setUserName(localStorage.getItem('vibra_name') || 'Mr vibra')
      setLanguage(localStorage.getItem('vibra_language') || 'sw')
      setLyricsByVideo(JSON.parse(localStorage.getItem('vibra_lyrics') || '{}'))
    } catch {}
  }, [])
  const toggleLanguage = () => {
    const next = language === 'sw' ? 'en' : 'sw'
    setLanguage(next)
    try { localStorage.setItem('vibra_language', next) } catch {}
  }
  const toggleFollow = async (creatorId: string) => {
    if (!creatorId || creatorId === userId) return
    const wasFollowing = followedIds.includes(creatorId)
    const followingRef = doc(getVibraDb(), 'users', userId, 'following', creatorId)
    try {
      if (wasFollowing) {
        await deleteDoc(followingRef)
        await setDoc(doc(getVibraDb(), 'users', creatorId), { followersCount: increment(-1) }, { merge: true })
        setFollowedIds(ids => ids.filter(id => id !== creatorId))
      } else {
        await setDoc(followingRef, { userId, creatorId, createdAt: serverTimestamp() })
        await setDoc(doc(getVibraDb(), 'users', creatorId), { followersCount: increment(1) }, { merge: true })
        await addDoc(collection(getVibraDb(), 'users', creatorId, 'notifications'), { type: 'follow', actorId: userId, actorName: userName, createdAt: serverTimestamp() })
        setFollowedIds(ids => [...ids, creatorId])
      }
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Follow action failed.')
    }
  }
  
const sendAiMessage = async () => {
 const q = aiInput.trim()
 if (!q || aiLoading) return
 const previous = aiMessages.slice(-12).map(message => (message.role === 'user' ? 'User: ' : 'VIBRA AI: ') + message.text).join('\n')
 setAiMessages(items => [...items, { role: 'user', text: q }])
 setAiInput('')
 setAiLoading(true)
 try {
   const model = getVibraAIModel()
   const result = await model.generateContent(previous ? previous + '\nUser: ' + q + '\nVIBRA AI:' : q)
   const answer = result.response.text().trim()
   if (!answer) throw new Error('AI haikurudisha jibu. Jaribu tena.')
   setAiMessages(items => [...items, { role: 'assistant', text: answer }])
 } catch (error) {
   const message = error instanceof Error ? error.message : 'VIBRA AI haijaweza kujibu.'
   setAiMessages(items => [...items, { role: 'assistant', text: 'Samahani, VIBRA AI haijaweza kujibu sasa hivi. ' + message }])
 } finally {
   setAiLoading(false)
 }
}
useEffect(() => onAuthStateChanged(getVibraAuth(), user => { setUserId(user?.uid || ''); setUserName(user?.displayName || user?.email?.split('@')[0] || 'VIBRA Creator'); setAuthReady(true) }), [])
const submitAuth=async()=>{
 if(!email.trim()||!password){setAuthError(language==='sw'?'Weka email na password.':'Enter email and password.');return}
 if(password.length<6){setAuthError(language==='sw'?'Password iwe na angalau herufi 6.':'Password must be at least 6 characters.');return}
 setAuthBusy(true);setAuthError('')
 try {
   const auth=getVibraAuth()
   if(authMode==='signup'){
     const credential=await createUserWithEmailAndPassword(auth,email.trim(),password)
     await updateProfile(credential.user,{displayName:email.trim().split('@')[0]})
     await setDoc(doc(getVibraDb(),'users',credential.user.uid),{uid:credential.user.uid,email:credential.user.email,displayName:credential.user.displayName,createdAt:serverTimestamp()},{merge:true})
   } else {
     await signInWithEmailAndPassword(auth,email.trim(),password)
   }
 } catch(error){setAuthError(error instanceof Error?error.message:'Authentication failed.')}
 finally{setAuthBusy(false)}
}
const loginGoogle=async()=>{
 setAuthBusy(true);setAuthError('')
 try{await signInWithPopup(getVibraAuth(),vibraGoogleProvider)}
 catch(error){setAuthError(error instanceof Error?error.message:'Google sign-in failed.')}
 finally{setAuthBusy(false)}
}
// Demo video feed.
const loadVideos=async()=>{
 setLoadingVideos(true)
 try {
   const snap=await getDocs(query(collection(getVibraDb(),'videos'),orderBy('created_at','desc')))
   const rows=snap.docs.map(item=>({id:item.id,...item.data()} as Video))
   setVideos(rows)
   setServerLikes(Object.fromEntries(rows.map(v=>[v.id,Number((v as any).likes||0)])))
   setCommentCounts(Object.fromEntries(rows.map(v=>[v.id,Number((v as any).comments_count||0)])))
 } catch(error){setAuthError(error instanceof Error?error.message:'Could not load videos.');setVideos([])}
 finally{setLoadingVideos(false)}
}
useEffect(() => {
 if (page !== 'inbox' || !userId) return
 setLoadingNotifications(true)
 void getDocs(query(collection(getVibraDb(), 'users', userId, 'notifications'), orderBy('createdAt', 'desc')))
   .then(snap => setNotifications(snap.docs.map(item => ({ id: item.id, ...item.data() } as any))))
   .catch(error => setAuthError(error instanceof Error ? error.message : 'Could not load notifications.'))
   .finally(() => setLoadingNotifications(false))
}, [page, userId])

useEffect(() => {
 if (!userId) { setVideos([]); return }
 void loadVideos()
 void (async () => {
   try {
     const [follows, saved] = await Promise.all([
       getDocs(collection(getVibraDb(), 'users', userId, 'following')),
       getDocs(collection(getVibraDb(), 'users', userId, 'savedVideos')),
     ])
     setFollowedIds(follows.docs.map(item => item.id))
     setSavedIds(saved.docs.map(item => item.id))
     const profile = await getDoc(doc(getVibraDb(), 'users', userId))
     if (profile.exists()) {
       const data = profile.data()
       if (typeof data.displayName === 'string') setUserName(data.displayName)
       if (typeof data.photoURL === 'string') setDp(data.photoURL)
       setFollowerCount(Number(data.followersCount || 0))
     }
   } catch (error) { setAuthError(error instanceof Error ? error.message : 'Could not load your profile.') }
 })()
},[userId])

  // Demo likes na comments zinatunzwa ndani ya app.
const loadServerLikes = async (rows: Video[]) => {
  try {
    const results = await Promise.all(rows.map(async video => {
      const [like, count] = await Promise.all([
        getDoc(doc(getVibraDb(), 'videos', video.id, 'likes', userId)),
        getDoc(doc(getVibraDb(), 'videos', video.id)),
      ])
      return { id: video.id, liked: like.exists(), count: Number(count.data()?.likes || 0) }
    }))
    setLikedIds(results.filter(item => item.liked).map(item => item.id))
    setServerLikes(Object.fromEntries(results.map(item => [item.id, item.count])))
  } catch (error) { setAuthError(error instanceof Error ? error.message : 'Could not load likes.') }
}
const loadServerComments = async (clipKey: string) => {
  setLoadingComments(true)
  try {
    const snap = await getDocs(query(collection(getVibraDb(), 'videos', clipKey, 'comments'), orderBy('createdAt', 'asc')))
    setComments(snap.docs.map(item => {
      const data = item.data()
      return { id: item.id, video_id: clipKey, username: data.username || 'VIBRA Creator', text: data.text || '', created_at: data.createdAt?.toDate?.()?.toISOString?.() || new Date().toISOString() }
    }))
  } catch (error) { setAuthError(error instanceof Error ? error.message : 'Could not load comments.'); setComments([]) }
  finally { setLoadingComments(false) }
}
useEffect(() => { if (userId && videos.length) void loadServerLikes(videos) }, [userId, videos])

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

  useEffect(() => {
    if (page !== 'home' || !activeVideoId) return
    const target = document.querySelector(`[data-video-id="${activeVideoId}"]`)
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [page, activeVideoId, videos])

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

  const toggleSave = async (id: string) => {
    const wasSaved = savedIds.includes(id)
    const savedRef = doc(getVibraDb(), 'users', userId, 'savedVideos', id)
    try {
      if (wasSaved) {
        await deleteDoc(savedRef)
        setSavedIds(ids => ids.filter(item => item !== id))
      } else {
        await setDoc(savedRef, { videoId: id, createdAt: serverTimestamp() })
        setSavedIds(ids => [...ids, id])
      }
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Could not save video.')
    }
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
 if(!userId){setAuthError('Sign in to like videos.');return}
 const was=likedIds.includes(id)
 const next=was?likedIds.filter(x=>x!==id):[...likedIds,id]
 setWorkingLikeIds(p=>[...p,id])
 try{
   const likeRef=doc(getVibraDb(),'videos',id,'likes',userId)
   if(was){await import('firebase/firestore').then(m=>m.deleteDoc(likeRef))}
   else{await setDoc(likeRef,{userId,createdAt:serverTimestamp()})}
   await updateDoc(doc(getVibraDb(),'videos',id),{likes:increment(was?-1:1)})
   if (!was) {
     const videoSnap = await getDoc(doc(getVibraDb(), 'videos', id))
     const ownerId = videoSnap.data()?.user_id
     if (ownerId && ownerId !== userId) await addDoc(collection(getVibraDb(), 'users', ownerId, 'notifications'), { type: 'like', actorId: userId, actorName: userName, videoId: id, createdAt: serverTimestamp() })
   }
   setLikedIds(next);setServerLikes(p=>({...p,[id]:Math.max(0,(p[id]||0)+(was?-1:1))}))
 }catch(error){setAuthError(error instanceof Error?error.message:'Like failed.')}
 finally{setWorkingLikeIds(p=>p.filter(x=>x!==id))}
}
const openComments = (id: string) => {
    setActiveVideo(id)
    setCommentText('')
    void loadServerComments(id)
  }

const addComment=async()=>{
 if(!activeVideo||!commentText.trim()||!userId)return
 setSendingComment(true)
 try{
   const entry={video_id:activeVideo,user_id:userId,username:userHandle,text:commentText.trim(),created_at:new Date().toISOString()}
   await addDoc(collection(getVibraDb(),'videos',activeVideo,'comments'),{...entry,createdAt:serverTimestamp()})
   const videoSnap = await getDoc(doc(getVibraDb(), 'videos', activeVideo))
   const ownerId = videoSnap.data()?.user_id
   if (ownerId && ownerId !== userId) await addDoc(collection(getVibraDb(), 'users', ownerId, 'notifications'), { type: 'comment', actorId: userId, actorName: userName, videoId: activeVideo, comment: entry.text, createdAt: serverTimestamp() })
   setComments(p=>[...p,{...entry}]);setCommentCounts(p=>({...p,[activeVideo]:(p[activeVideo]||0)+1}));setCommentText('')
 }catch(error){setAuthError(error instanceof Error?error.message:'Comment failed.')}
 finally{setSendingComment(false)}
}
// Upload video ya demo kwenye simu hii pekee.
const uploadVideo=async(event:ChangeEvent<HTMLInputElement>)=>{
 const file=event.target.files?.[0];if(!file)return
 if(!userId){setAuthError('Sign in before uploading.');event.target.value='';return}
 if(!file.type.startsWith('video/')){alert('Chagua faili la video.');return}
 if(file.size>100*1024*1024){alert('Video maximum ni 100 MB.');return}
 setUploading(true)
 try{
   const caption=window.prompt(language==='sw'?'Andika maelezo ya video:':'Add a video caption:')||''
   const path='videos/'+userId+'/'+crypto.randomUUID()
   const objectRef=storageRef(getVibraStorage(),path)
   await uploadBytes(objectRef,file,{contentType:file.type})
   const videoUrl=await getDownloadURL(objectRef)
   const item={user_id:userId,video_url:videoUrl,storage_path:path,caption,username:userName||userHandle,avatar:dp||null,country:'Kenya',created_at:new Date().toISOString(),likes:0,comments_count:0}
   const saved=await addDoc(collection(getVibraDb(),'videos'),{...item,created_at:serverTimestamp()})
   setVideos(p=>[{...item,id:saved.id},...p]);setPage('home')
 }catch(error){setAuthError(error instanceof Error?error.message:'Upload failed. Check Firebase Storage setup and rules.')}
 finally{setUploading(false);event.target.value=''}
}
const changePhoto = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { alert('Picha iwe chini ya 5 MB.'); return }
    if (!file.type.startsWith('image/')) { alert('Chagua picha sahihi.'); return }
    try {
      const path = 'profiles/' + userId + '/avatar-' + Date.now()
      const objectRef = storageRef(getVibraStorage(), path)
      await uploadBytes(objectRef, file, { contentType: file.type })
      const url = await getDownloadURL(objectRef)
      await updateProfile(getVibraAuth().currentUser!, { photoURL: url })
      await setDoc(doc(getVibraDb(), 'users', userId), { photoURL: url, avatar: url }, { merge: true })
      setDp(url)
      alert('Picha ya wasifu imehifadhiwa.')
    } catch (error) { setAuthError(error instanceof Error ? error.message : 'Profile photo upload failed.') }
    finally { event.target.value = '' }
  }

  const shareVideo = async (video: Video) => {
    const link = video.video_url
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(link)
        alert(language === 'sw' ? 'Link ya video imenakiliwa.' : 'Video link copied.')
      } else {
        const field = document.createElement('textarea')
        field.value = link
        field.style.position = 'fixed'
        field.style.opacity = '0'
        document.body.appendChild(field)
        field.select()
        const copied = document.execCommand('copy')
        field.remove()
        alert(copied ? (language === 'sw' ? 'Link ya video imenakiliwa.' : 'Video link copied.') : (language === 'sw' ? 'Imeshindikana kunakili link.' : 'Could not copy the link.'))
      }
    } catch {
      alert(language === 'sw' ? 'Imeshindikana kunakili link.' : 'Could not copy the link.')
    }
  }

  const saveLyrics = (videoId: string) => {
    const current = lyricsByVideo[videoId] || ''
    const value = window.prompt(language === 'sw' ? 'Weka maneno ya wimbo (lyrics):' : 'Enter song lyrics:', current)
    if (value === null) return
    const next = { ...lyricsByVideo, [videoId]: value.trim() }
    setLyricsByVideo(next)
    try { localStorage.setItem('vibra_lyrics', JSON.stringify(next)) } catch {}
    setLyricsVideoId(videoId)
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
      <span onClick={() => setPage('home')} style={{cursor:'pointer', color:page==='home'?'#00DDF5':'#fff', display:'flex', flexDirection:'column', alignItems:'center', gap:3, fontSize:11}}><Home size={23}/><b>{language==='sw'?'Nyumbani':'Home'}</b></span>
      <span onClick={() => setPage('discover')} style={{cursor:'pointer', color:page==='discover'?'#00DDF5':'#fff', display:'flex', flexDirection:'column', alignItems:'center', gap:3, fontSize:11}}><Search size={23}/><b>{language==='sw'?'Tafuta':'Explore'}</b></span>
      <span onClick={() => {setPage('home');setUploadMenuOpen(true)}} style={{background:'#00DDF5', color:'#fff', width:54, height:44, display:'flex', alignItems:'center', justifyContent:'center', borderRadius:10, cursor:'pointer'}}><Plus size={30}/></span>
      <span onClick={() => setPage('ai')} style={{cursor:'pointer', color:'#00DDF5', display:'flex', flexDirection:'column', alignItems:'center', gap:3, fontSize:11}}><Bot size={24}/><b>VIBRA AI</b></span>
      <span onClick={() => setPage('inbox')} style={{cursor:'pointer', color:page==='inbox'?'#00DDF5':'#fff', display:'flex', flexDirection:'column', alignItems:'center', gap:3, fontSize:11}}><Inbox size={23}/><b>{language==='sw'?'Ujumbe':'Inbox'}</b></span>
      <span onClick={() => setPage('me')} style={{cursor:'pointer', color:page==='me'?'#00DDF5':'#fff', display:'flex', flexDirection:'column', alignItems:'center', gap:3, fontSize:11}}><User size={23}/><b>{language==='sw'?'Wasifu':'Profile'}</b></span>
    </div>
  )

// Firebase login gate: do not expose creator actions before authentication.
if (!authReady) {
  return <div style={{minHeight:'100vh',display:'grid',placeItems:'center',background:'#080D18',color:'#00DDF5',fontFamily:'sans-serif'}}><div style={{textAlign:'center'}}><h1>VIBRA WORLDWIDE</h1><p>Inaunganisha akaunti...</p></div></div>
}
if (!userId) {
  return (
    <div style={{minHeight:'100vh',background:'#080D18',color:'#fff',fontFamily:'sans-serif',display:'flex',justifyContent:'center',alignItems:'center',padding:20}}>
      <div style={{width:'100%',maxWidth:420,background:'#101B2B',border:'1px solid #123B55',borderRadius:22,padding:24,boxSizing:'border-box'}}>
        <div style={{textAlign:'center',marginBottom:24}}>
          <div style={{fontSize:38,fontWeight:900,color:'#00DDF5',letterSpacing:2}}>VIBRA</div>
          <div style={{fontSize:13,color:'#B9C9D8'}}>WORLDWIDE • CREATE • CONNECT</div>
          <h2 style={{marginBottom:4}}>{authMode==='login'?'Karibu tena':'Jiunge na VIBRA'}</h2>
          <p style={{color:'#9FB2C5',fontSize:13}}>{authMode==='login'?'Ingia kwenye akaunti yako':'Fungua akaunti yako ya VIBRA'}</p>
        </div>
        <label style={{display:'block',fontSize:13,marginBottom:6}}>Email</label>
        <input type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" style={{width:'100%',boxSizing:'border-box',padding:14,marginBottom:14,borderRadius:10,border:'1px solid #29435B',background:'#081321',color:'#fff'}} />
        <label style={{display:'block',fontSize:13,marginBottom:6}}>Password</label>
        <div style={{display:'flex',gap:8}}>
          <input type={showPassword?'text':'password'} autoComplete={authMode==='login'?'current-password':'new-password'} value={password} onChange={e=>setPassword(e.target.value)} placeholder="Angalau herufi 6" style={{flex:1,minWidth:0,boxSizing:'border-box',padding:14,marginBottom:14,borderRadius:10,border:'1px solid #29435B',background:'#081321',color:'#fff'}} />
          <button type="button" onClick={()=>setShowPassword(v=>!v)} style={{height:46,padding:'0 12px',borderRadius:10,border:'1px solid #29435B',background:'#142033',color:'#00DDF5'}}>{showPassword?'Ficha':'Onyesha'}</button>
        </div>
        {authError && <div role="alert" style={{background:'#3B1720',color:'#FFB8C2',padding:10,borderRadius:9,fontSize:13,marginBottom:12,overflowWrap:'anywhere'}}>{authError}</div>}
        <button type="button" disabled={authBusy} onClick={()=>void submitAuth()} style={{width:'100%',padding:14,border:0,borderRadius:12,background:'#00DDF5',color:'#001018',fontWeight:900,fontSize:16,opacity:authBusy ? 0.6 : 1}}>{authBusy?'Tafadhali subiri...':authMode==='login'?'INGIA':'FUNGUA AKAUNTI'}</button>
        <button type="button" disabled={authBusy} onClick={()=>void loginGoogle()} style={{width:'100%',padding:13,marginTop:10,border:'1px solid #426078',borderRadius:12,background:'#142033',color:'#fff',fontWeight:700}}>Endelea na Google</button>
        <button type="button" onClick={()=>{setAuthMode(authMode==='login'?'signup':'login');setAuthError('')}} style={{width:'100%',padding:12,marginTop:12,border:0,background:'transparent',color:'#00DDF5'}}>{authMode==='login'?'Huna akaunti? Jisajili':'Una akaunti tayari? Ingia'}</button>
        <button type="button" onClick={toggleLanguage} style={{display:'block',margin:'8px auto 0',border:0,background:'transparent',color:'#9FB2C5'}}>{language==='sw'?'Switch to English':'Badili Kiswahili'}</button>
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
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <button onClick={()=>setPage('home')} style={{background:'transparent',color:'#fff',border:0,fontSize:24}}>←</button>
          <button onClick={()=>void signOut(getVibraAuth())} style={{background:'#142033',color:'#FFB8C2',border:'1px solid #56313B',borderRadius:18,padding:'7px 12px'}}>Toka</button>
          <b>{userHandle}</b>
          <button onClick={toggleLanguage} style={{background:'#142033',color:'#00DDF5',border:'1px solid #00DDF5',borderRadius:18,padding:'7px 12px'}}>{language==='sw'?'EN':'SW'}</button>
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
          <p style={{color:'#aaa',fontSize:13}}>{language==='sw'?'Bonyeza picha kubadilisha':'Tap photo to change'}</p>
          <button onClick={() => imageRef.current?.click()} style={{
            background: '#00DDF5', color: '#fff', border: 0,
            padding: '12px 25px', borderRadius: 25, fontWeight: 800,
          }}>{language==='sw'?'Badilisha Picha':'Change Profile Photo'}</button>
          <br/>
          <button onClick={() => { setDp(''); localStorage.removeItem('vibra_dp') }} style={{
            background: 'transparent', color: '#aaa', border: '1px solid #444',
            padding: 9, borderRadius: 20, marginTop: 10,
          }}>Remove DP</button>
        </div>

        <input aria-label="Profile name" value={userName} onChange={e=>setUserName(e.target.value)} onBlur={()=>{void (async()=>{try{await updateProfile(getVibraAuth().currentUser!,{displayName:userName.trim()});await setDoc(doc(getVibraDb(),'users',userId),{displayName:userName.trim()},{merge:true})}catch(error){setAuthError(error instanceof Error?error.message:'Could not save profile name.')}})()}} style={{display:'block',margin:'18px auto 5px',textAlign:'center',fontSize:23,fontWeight:800,color:'#fff',background:'transparent',border:0,borderBottom:'1px solid #00DDF5',width:'80%'}} />
        <p style={{ textAlign: 'center', color: '#aaa' }}>{getVibraAuth().currentUser?.email || userHandle} • Kenya</p>
        <p style={{ textAlign: 'center' }}>🔥 VIBRA Creator 🌍</p>

        <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center', margin: '25px 0' }}>
          <div><b>{followedIds.length}</b><br/><small>{language==='sw'?'Unafuata':'Following'}</small></div>
          <div><b>{followerCount}</b><br/><small>{language==='sw'?'Wanaokufuata':'Followers'}</small></div>
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

        <h3>🎬 {language==='sw'?'Video Zangu':'My Videos'}</h3>
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
        <h2>🔖 {language==='sw'?'Video Zilizohifadhiwa':'Saved Videos'}</h2>
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
    const creators = Array.from(new Map(videos.map(v=>[v.user_id || v.username,{id:v.user_id || v.username,name:v.username,avatar:v.avatar}])).values())
      .filter(person=>person.name.toLowerCase().includes(search.toLowerCase()))
    return (
      <div style={{ background: '#000', minHeight: '100vh', color: '#fff', fontFamily: 'sans-serif', padding: '16px 16px 100px', maxWidth: 500, margin: '0 auto' }}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}><h2>🔍 {language==='sw'?'Tafuta VIBRA':'Discover VIBRA'}</h2><button onClick={toggleLanguage} style={{background:'#142033',color:'#00DDF5',border:'1px solid #00DDF5',borderRadius:18,padding:'7px 12px'}}>{language==='sw'?'EN':'SW'}</button></div>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder={language==='sw'?'Tafuta video au watu...':'Search videos or people...'} style={{
            width: '100%', padding: 13, borderRadius: 20,
            border: 0, background: '#222', color: '#fff',
          }} />
        <h3 style={{marginTop:18}}>{language==='sw'?'Watu':'People'}</h3>
        <div style={{display:'flex',gap:10,overflowX:'auto',paddingBottom:8}}>
          {creators.map(person=><div key={person.id} style={{minWidth:100,background:'#151d2b',padding:10,borderRadius:12,textAlign:'center'}}>
            <div style={{fontSize:26}}>{person.avatar?<img src={person.avatar} style={{width:42,height:42,borderRadius:'50%',objectFit:'cover'}}/>:'👤'}</div>
            <small>{person.name}</small>
            <button onClick={()=>toggleFollow(String(person.id))} style={{display:'block',margin:'8px auto 0',background:followedIds.includes(String(person.id))?'#444':'#00DDF5',color:'#fff',border:0,borderRadius:15,padding:'5px 10px'}}>{followedIds.includes(String(person.id))?(language==='sw'?'Unafuata':'Following'):(language==='sw'?'Fuata':'Follow')}</button>
          </div>)}
        </div>
        <h3>{language==='sw'?'Video':'Videos'}</h3>
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
      <div style={{ background: '#080D18', minHeight: '100vh', color: '#fff', fontFamily: 'sans-serif', padding: '16px 16px 100px', maxWidth: 500, margin: '0 auto' }}>
        <h2>📥 {language==='sw'?'Arifa':'Notifications'}</h2>
        {loadingNotifications ? <p style={{color:'#9FB2C5'}}>Inapakia arifa...</p> : notifications.length === 0 ? <div style={{background:'#142033',padding:16,borderRadius:12,color:'#9FB2C5'}}>Bado huna arifa. Likes, comments na followers zitaonekana hapa.</div> : notifications.map(item => (
          <div key={item.id} style={{background:'#142033',padding:14,borderRadius:12,marginBottom:9}}>
            <b>{item.actorName || 'VIBRA user'}</b> {item.type === 'like' ? 'ame-like video yako ❤️' : item.type === 'comment' ? 'amecomment video yako 💬' : 'ameanza kukufuata ➕'}
            {item.comment && <p style={{marginBottom:0,color:'#C6D5E2'}}>{item.comment}</p>}
            {item.createdAt?.toDate && <small style={{color:'#8FA4B8'}}>{item.createdAt.toDate().toLocaleString()}</small>}
          </div>
        ))}
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
        <span style={{fontWeight:800}}>{language==='sw'?'Kwa Ajili Yako':'For You'}</span>
        <div style={{display:'flex',alignItems:'center',gap:12,pointerEvents:'auto'}}>
          <button type="button" onClick={toggleLanguage} aria-label="Change language" style={{background:'#071421cc',color:'#00DDF5',border:'1px solid #00DDF5',borderRadius:18,padding:'6px 9px',fontWeight:800}}>{language==='sw'?'EN':'SW'}</button>
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
              <button type="button" aria-label="Fungua Profile ya @hamadoski" onClick={e => { e.preventDefault(); e.stopPropagation(); setPage('me') }} style={{
                width: 48, height: 48, borderRadius: '50%',
                background: '#333', border: '2px solid white',
                display: 'flex', alignItems: 'center',
                justifyContent: 'center', overflow: 'hidden',
              }}>
                {v.avatar ? <img src={v.avatar} alt="Creator" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (v.user_id === userId && dp ? <img src={dp} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '👤')}
              </button>

              {v.user_id !== userId && (
                <button type="button" aria-label="Follow creator" onClick={e => { e.preventDefault(); e.stopPropagation(); toggleFollow(v.user_id || '') }} style={{
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
                <small>{commentCounts[v.id] ?? 0}</small>
              </button>

              <button type="button" aria-label="Hifadhi video" onClick={e => { e.preventDefault(); e.stopPropagation(); toggleSave(v.id) }} style={{ textAlign: 'center', cursor: 'pointer', pointerEvents: 'auto', touchAction: 'manipulation', background: 'transparent', border: 0, color: '#fff', padding: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <span style={{ fontSize: 30 }}>🔖</span>
                <small>{savedIds.includes(v.id) ? 'Saved' : 'Save'}</small>
              </button>

              <button type="button" aria-label="Share video" onClick={e => { e.preventDefault(); e.stopPropagation(); void shareVideo(v) }} style={{ fontSize: 30, cursor: 'pointer', pointerEvents: 'auto', touchAction: 'manipulation', background: 'transparent', border: 0, color: '#fff', padding: 0 }}>🔗</button>

              <button type="button" aria-label="Onyesha lyrics" onClick={e => { e.preventDefault(); e.stopPropagation(); setLyricsVideoId(lyricsVideoId === v.id ? null : v.id) }} style={{ textAlign: 'center', cursor: 'pointer', pointerEvents: 'auto', touchAction: 'manipulation', background: 'transparent', border: 0, color: '#fff', padding: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <span style={{ fontSize: 28, lineHeight: 1 }}>🎵</span>
                <small>Lyrics</small>
              </button>
            </div>

            {lyricsVideoId === v.id && (
              <div style={{ position: 'absolute', left: 12, right: 72, bottom: 175, zIndex: 95, maxHeight: '28vh', overflowY: 'auto', background: '#000c', border: '1px solid #ffffff44', borderRadius: 12, padding: 12, color: '#fff', whiteSpace: 'pre-wrap' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}><b>🎵 Lyrics</b><button type="button" onClick={() => saveLyrics(v.id)} style={{ background: '#00DDF5', color: '#001018', border: 0, borderRadius: 14, padding: '5px 9px', fontWeight: 700 }}>{lyricsByVideo[v.id] ? (language === 'sw' ? 'Hariri' : 'Edit') : (language === 'sw' ? 'Ongeza lyrics' : 'Add lyrics')}</button></div>
                <div style={{ fontSize: 13, color: '#eee' }}>{lyricsByVideo[v.id] || (language === 'sw' ? 'Bado hakuna lyrics za wimbo huu. Bonyeza “Ongeza lyrics” kuweka maneno ya wimbo.' : 'No lyrics have been added for this video yet. Tap “Add lyrics” to enter them.')}</div>
              </div>
            )}

            <div style={{
              position: 'absolute', bottom: 100, left: 14, right: 75,
              textShadow: '1px 1px 4px #000',
            }}>
              <b>{v.username}</b>
              <button onClick={()=>toggleFollow(v.user_id || '')} style={{marginLeft:10,background:followedIds.includes(v.user_id || '')?'#555':'#00DDF5',color:'#fff',border:0,borderRadius:14,padding:'4px 10px'}}>{followedIds.includes(v.user_id || '')?(language==='sw'?'Unafuata':'Following'):(language==='sw'?'Fuata':'Follow')}</button>
              <p style={{fontSize:14,margin:'6px 0'}}>{v.caption}</p>
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
            <h3 style={{textAlign:'center',marginTop:4}}>＋ {language==='sw'?'Tengeneza VIBRA':'Create on VIBRA'}</h3>
            <button onClick={() => { setUploadMenuOpen(false); recordRef.current?.click() }} style={{
              width: '100%', padding: 16, marginTop: 10, border: 0,
              borderRadius: 12, background: '#00DDF5', color: '#fff',
              fontSize: 16, fontWeight: 800,
            }}>{language==='sw'?'🎥 Rekodi video':'🎥 Record video'}</button>
            <button onClick={() => { setUploadMenuOpen(false); fileRef.current?.click() }} style={{
              width: '100%', padding: 16, marginTop: 10, border: '1px solid #555',
              borderRadius: 12, background: '#142033', color: '#fff',
              fontSize: 16, fontWeight: 800,
            }}>{language==='sw'?'🖼️ Chagua kutoka Gallery':'🖼️ Choose from Gallery'}</button>
            <button onClick={() => setUploadMenuOpen(false)} style={{
              width: '100%', padding: 13, marginTop: 10, border: 0,
              background: 'transparent', color: '#aaa', fontSize: 15,
            }}>{language==='sw'?'Ghairi':'Cancel'}</button>
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
              <b>{language==='sw'?'Maoni':'Comments'} ({comments.length})</b>
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
                placeholder={language==='sw'?'Andika maoni...':'Write a comment...'}
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
                {sendingComment?'...':(language==='sw'?'Tuma':'Send')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
