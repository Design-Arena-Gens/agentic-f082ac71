"use client"
import { useEffect, useMemo, useRef, useState } from 'react'
import NavBar from '@/components/NavBar'

type User = { userId: string; name: string; isAdmin?: boolean }

type Message = { id: string; senderId: string; recipientUserId?: string; recipientGroupId?: string; text?: string; fileId?: string; createdAt: number }

type Group = { groupId: string; name: string; ownerId: string; members: string[] }

export default function DashboardPage() {
  const [me, setMe] = useState<User | null>(null)
  const [activeTab, setActiveTab] = useState<'chat' | 'groups' | 'friends' | 'profile' | 'admin'>('chat')
  const [peerId, setPeerId] = useState('')
  const [groupId, setGroupId] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState('')
  const [friends, setFriends] = useState<any[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [newGroupName, setNewGroupName] = useState('')
  const videoLocalRef = useRef<HTMLVideoElement>(null)
  const videoRemoteRef = useRef<HTMLVideoElement>(null)
  const pcRef = useRef<RTCPeerConnection | null>(null)

  useEffect(() => {
    fetch('/api/auth/logout').then(async (r) => {
      const d = await r.json()
      if (!d.user) { location.replace('/auth/login'); return }
      setMe(d.user)
    })
  }, [])

  useEffect(() => {
    if (!me) return
    const es = new EventSource('/api/events')
    es.onmessage = (e) => {
      const data = JSON.parse(e.data)
      if (data.type === 'message') setMessages((prev) => [...prev, data.payload])
      if (data.type === 'friend_request') fetchFriends()
      if (data.type === 'webrtc_signal') handleIncomingSignal(data.payload)
    }
    return () => es.close()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me])

  async function fetchFriends() {
    const r = await fetch('/api/friends')
    const d = await r.json()
    if (r.ok) setFriends(d.friends)
  }

  async function fetchGroups() {
    const r = await fetch('/api/groups')
    const d = await r.json()
    if (r.ok) setGroups(d.groups)
  }

  async function loadPrivate() {
    if (!peerId) return
    const r = await fetch(`/api/chat/private?peerId=${encodeURIComponent(peerId)}`)
    const d = await r.json()
    if (r.ok) setMessages(d.messages)
  }

  async function loadGroup() {
    if (!groupId) return
    const r = await fetch(`/api/chat/group?groupId=${encodeURIComponent(groupId)}`)
    const d = await r.json()
    if (r.ok) setMessages(d.messages)
  }

  async function sendPrivate() {
    if (!text || !peerId) return
    const r = await fetch('/api/chat/private', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ toId: peerId, text }) })
    const d = await r.json()
    if (r.ok) { setMessages((prev) => [...prev, d.message]); setText('') }
  }

  async function sendGroup() {
    if (!text || !groupId) return
    const r = await fetch('/api/chat/group', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ groupId, text }) })
    const d = await r.json()
    if (r.ok) { setMessages((prev) => [...prev, d.message]); setText('') }
  }

  async function addFriend(userId: string) {
    const r = await fetch('/api/friends', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId }) })
    if (r.ok) fetchFriends()
  }

  async function createGroup() {
    if (!newGroupName) return
    const r = await fetch('/api/groups', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newGroupName }) })
    const d = await r.json()
    if (r.ok) { setGroups((g) => [d.group, ...g]); setNewGroupName('') }
  }

  async function joinGroup() {
    if (!groupId) return
    const r = await fetch('/api/groups', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ groupId }) })
    if (r.ok) fetchGroups()
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>, isGroup: boolean) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async () => {
      const dataUrl = reader.result as string
      const up = await fetch('/api/files/upload', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ dataUrl, mimeType: file.type, name: file.name, size: file.size }) })
      const d = await up.json()
      if (up.ok) {
        if (isGroup) await fetch('/api/chat/group', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ groupId, fileId: d.file.id }) })
        else await fetch('/api/chat/private', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ toId: peerId, fileId: d.file.id }) })
      }
    }
    reader.readAsDataURL(file)
  }

  async function startCall() {
    if (!peerId) return
    const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] })
    pcRef.current = pc
    pc.ontrack = (ev) => {
      if (videoRemoteRef.current) {
        // @ts-ignore
        videoRemoteRef.current.srcObject = ev.streams[0]
      }
    }
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true })
    stream.getTracks().forEach((t) => pc.addTrack(t, stream))
    if (videoLocalRef.current) {
      // @ts-ignore
      videoLocalRef.current.srcObject = stream
    }
    const offer = await pc.createOffer()
    await pc.setLocalDescription(offer)
    await fetch('/api/webrtc/signal', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ targetId: peerId, signal: { sdp: offer.sdp, type: offer.type } }) })
  }

  async function handleIncomingSignal(payload: any) {
    let pc = pcRef.current
    if (!pc) {
      pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] })
      pcRef.current = pc
      pc.ontrack = (ev) => {
        if (videoRemoteRef.current) {
          // @ts-ignore
          videoRemoteRef.current.srcObject = ev.streams[0]
        }
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true })
      stream.getTracks().forEach((t) => pc!.addTrack(t, stream))
      if (videoLocalRef.current) {
        // @ts-ignore
        videoLocalRef.current.srcObject = stream
      }
    }
    const signal = payload.signal
    if (signal.type === 'offer') {
      await pc.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp: signal.sdp }))
      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)
      await fetch('/api/webrtc/signal', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ targetId: payload.fromUserId, signal: { sdp: answer.sdp, type: answer.type } }) })
    } else if (signal.type === 'answer') {
      await pc.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp: signal.sdp }))
    }
  }

  const myIdShort = useMemo(() => me?.userId ?? '', [me])

  return (
    <main>
      <NavBar user={me} />
      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="mb-4 flex gap-2">
          <button className={`btn ${activeTab==='chat'?'':'bg-white text-primary-700 border border-primary-600 hover:bg-primary-50'}`} onClick={() => setActiveTab('chat')}>Chat</button>
          <button className={`btn ${activeTab==='groups'?'':'bg-white text-primary-700 border border-primary-600 hover:bg-primary-50'}`} onClick={() => { setActiveTab('groups'); fetchGroups() }}>Grup</button>
          <button className={`btn ${activeTab==='friends'?'':'bg-white text-primary-700 border border-primary-600 hover:bg-primary-50'}`} onClick={() => { setActiveTab('friends'); fetchFriends() }}>Teman</button>
          <button className={`btn ${activeTab==='profile'?'':'bg-white text-primary-700 border border-primary-600 hover:bg-primary-50'}`} onClick={() => setActiveTab('profile')}>Profil</button>
          {me?.isAdmin && <button className={`btn ${activeTab==='admin'?'':'bg-white text-primary-700 border border-primary-600 hover:bg-primary-50'}`} onClick={() => setActiveTab('admin')}>Admin</button>}
        </div>

        {activeTab === 'chat' && (
          <div className="grid gap-4 md:grid-cols-3">
            <div className="card p-4 space-y-3">
              <h2 className="font-semibold">Chat Pribadi</h2>
              <input className="input" placeholder="ID teman (PRVT-XXXXXX)" value={peerId} onChange={(e) => setPeerId(e.target.value)} />
              <div className="flex gap-2">
                <button className="btn" onClick={loadPrivate}>Buka</button>
                <button className="btn" onClick={startCall}>Panggilan</button>
                <label className="btn cursor-pointer">
                  Kirim File
                  <input type="file" className="hidden" onChange={(e) => handleFile(e, false)} />
                </label>
              </div>
              <div className="mt-4 space-y-2">
                <video ref={videoLocalRef} className="w-full rounded" autoPlay muted playsInline />
                <video ref={videoRemoteRef} className="w-full rounded" autoPlay playsInline />
              </div>
            </div>
            <div className="card p-4 md:col-span-2 flex flex-col">
              <div className="flex-1 space-y-2 overflow-auto">
                {messages.map((m) => (
                  <div key={m.id} className={`rounded p-2 ${m.senderId===myIdShort?'bg-primary-100 text-primary-900':'bg-gray-100'}`}>
                    <div className="text-[11px] opacity-70">{m.senderId===myIdShort?'Saya':m.senderId}</div>
                    {m.text && <div>{m.text}</div>}
                    {m.fileId && <a className="text-sm text-primary-700 underline" href={`/api/files/${m.fileId}`} target="_blank">Lampiran: {m.fileId}</a>}
                  </div>
                ))}
              </div>
              <div className="mt-3 flex gap-2">
                <input className="input" placeholder="Tulis pesan..." value={text} onChange={(e) => setText(e.target.value)} />
                <button className="btn" onClick={sendPrivate}>Kirim</button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'groups' && (
          <div className="grid gap-4 md:grid-cols-3">
            <div className="card p-4 space-y-3">
              <h2 className="font-semibold">Grup</h2>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input className="input" placeholder="Nama grup" value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} />
                  <button className="btn" onClick={createGroup}>Buat</button>
                </div>
                <div className="flex gap-2">
                  <input className="input" placeholder="ID Grup (GRP-XXXX)" value={groupId} onChange={(e) => setGroupId(e.target.value)} />
                  <button className="btn" onClick={joinGroup}>Gabung</button>
                </div>
                <label className="btn cursor-pointer">
                  Kirim File ke Grup
                  <input type="file" className="hidden" onChange={(e) => handleFile(e, true)} />
                </label>
              </div>
              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-700">Daftar Grup</h3>
                <ul className="mt-2 space-y-1 text-sm">
                  {groups.map((g) => (
                    <li key={g.groupId}>
                      <button className="underline" onClick={() => { setGroupId(g.groupId); loadGroup() }}>{g.name} ({g.groupId})</button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="card p-4 md:col-span-2 flex flex-col">
              <div className="flex-1 space-y-2 overflow-auto">
                {messages.map((m) => (
                  <div key={m.id} className={`rounded p-2 ${m.senderId===myIdShort?'bg-primary-100 text-primary-900':'bg-gray-100'}`}>
                    <div className="text-[11px] opacity-70">{m.senderId===myIdShort?'Saya':m.senderId}</div>
                    {m.text && <div>{m.text}</div>}
                    {m.fileId && <a className="text-sm text-primary-700 underline" href={`/api/files/${m.fileId}`} target="_blank">Lampiran: {m.fileId}</a>}
                  </div>
                ))}
              </div>
              <div className="mt-3 flex gap-2">
                <input className="input" placeholder="Tulis pesan..." value={text} onChange={(e) => setText(e.target.value)} />
                <button className="btn" onClick={sendGroup}>Kirim</button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'friends' && (
          <div className="card p-4">
            <div className="flex gap-2">
              <input className="input" placeholder="Tambah teman via ID" onKeyDown={(e) => { if (e.key==='Enter') addFriend((e.target as HTMLInputElement).value) }} />
              <button className="btn" onClick={() => fetchFriends()}>Segarkan</button>
            </div>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2 md:grid-cols-3">
              {friends.map((f: any) => (
                <li key={f.userId} className="rounded border p-3">
                  <div className="font-medium">{f.name}</div>
                  <div className="text-xs text-gray-500">{f.userId}</div>
                  <div className="text-sm mt-1">{f.status || '?'}</div>
                  <div className="mt-2 flex gap-2 text-sm">
                    <button className="btn px-3 py-1" onClick={() => { setPeerId(f.userId); setActiveTab('chat'); loadPrivate() }}>Chat</button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {activeTab === 'profile' && (
          <ProfileView />
        )}

        {activeTab === 'admin' && me?.isAdmin && (
          <AdminView />
        )}
      </div>
    </main>
  )
}

function ProfileView() {
  const [profile, setProfile] = useState<any>(null)
  const [name, setName] = useState('')
  const [status, setStatus] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [privacy, setPrivacy] = useState<'public'|'friends'|'private'>('friends')

  useEffect(() => {
    fetch('/api/profile').then(async (r) => { const d = await r.json(); if (r.ok) { setProfile(d); setName(d.name||''); setStatus(d.status||''); setAvatarUrl(d.avatarUrl||''); setPrivacy(d.privacy) } })
  }, [])

  async function save() {
    const r = await fetch('/api/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, status, avatarUrl, privacy }) })
    if (r.ok) alert('Profil diperbarui')
  }

  if (!profile) return <div className="card p-4">Memuat...</div>
  return (
    <div className="card p-4 space-y-3">
      <div className="text-sm text-gray-600">UserID: {profile.userId}</div>
      <div>
        <label className="text-sm">Nama</label>
        <input className="input mt-1" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div>
        <label className="text-sm">Status</label>
        <input className="input mt-1" value={status} onChange={(e) => setStatus(e.target.value)} />
      </div>
      <div>
        <label className="text-sm">Foto Profil (URL)</label>
        <input className="input mt-1" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} />
      </div>
      <div>
        <label className="text-sm">Privasi</label>
        <select className="input mt-1" value={privacy} onChange={(e) => setPrivacy(e.target.value as any)}>
          <option value="public">Publik</option>
          <option value="friends">Teman</option>
          <option value="private">Pribadi</option>
        </select>
      </div>
      <button className="btn" onClick={save}>Simpan</button>
    </div>
  )
}

function AdminView() {
  const [data, setData] = useState<{ users: any[]; groups: any[] } | null>(null)
  async function load() {
    const r = await fetch('/api/admin')
    const d = await r.json()
    if (r.ok) setData(d)
  }
  useEffect(() => { load() }, [])

  async function delUser(userId: string) {
    if (!confirm('Hapus user?')) return
    const r = await fetch('/api/admin', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId }) })
    if (r.ok) load()
  }
  async function delGroup(groupId: string) {
    if (!confirm('Hapus grup?')) return
    const r = await fetch('/api/admin', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ groupId }) })
    if (r.ok) load()
  }

  if (!data) return <div className="card p-4">Memuat...</div>
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="card p-4">
        <h3 className="font-semibold mb-2">Pengguna</h3>
        <ul className="space-y-2 text-sm">
          {data.users.map((u) => (
            <li key={u.userId} className="flex items-center justify-between border rounded p-2">
              <div>{u.name} ({u.userId}) {u.isAdmin? '?':''}</div>
              <button className="btn px-3 py-1" onClick={() => delUser(u.userId)}>Hapus</button>
            </li>
          ))}
        </ul>
      </div>
      <div className="card p-4">
        <h3 className="font-semibold mb-2">Grup</h3>
        <ul className="space-y-2 text-sm">
          {data.groups.map((g) => (
            <li key={g.groupId} className="flex items-center justify-between border rounded p-2">
              <div>{g.name} ({g.groupId}) - {g.members} anggota</div>
              <button className="btn px-3 py-1" onClick={() => delGroup(g.groupId)}>Hapus</button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
