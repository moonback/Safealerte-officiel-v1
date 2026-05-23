import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Search, Filter, Phone, MapPin, Check, CheckCheck, Mic, Image as ImageIcon, Send, Paperclip } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function TeamsScreen() {
    const navigate = useNavigate();
    const { id } = useParams();
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'Chat' | 'Infos' | 'Membres'>('Chat');
    const [message, setMessage] = useState('');
    const [team, setTeam] = useState<any>(null);
    const [members, setMembers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    useEffect(() => {
        const fetchTeamData = async () => {
            if (!id) return;
            setLoading(true);
            try {
                // Fetch team
                const { data: teamData, error: teamErr } = await supabase
                    .from('teams')
                    .select('*')
                    .eq('id', id)
                    .single();
                
                if (teamErr) throw teamErr;
                
                // Fetch members
                const { data: membersData, error: memErr } = await supabase
                    .from('team_members')
                    .select('*, users(name, avatar_url)')
                    .eq('team_id', id);

                if (memErr) throw memErr;

                setTeam(teamData);
                setMembers(membersData || []);
            } catch (err) {
                console.error("Error fetching team:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchTeamData();
    }, [id]);

    const handleSendMessage = async () => {
        if (!message.trim() || !user || !team) return;
        setIsSending(true);
        try {
            await supabase.from('messages').insert({
                team_id: team.id,
                user_id: user.id,
                content: message.trim()
            });
            setMessage('');
        } catch (e) {
            console.error("Error sending message", e);
        } finally {
            setIsSending(false);
            // On mobile, focus might remain on input. Adjust as needed.
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !e.target.files[0] || !user || !team) return;
        const file = e.target.files[0];
        setIsSending(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}_${Date.now()}.${fileExt}`;
            const { error: uploadError, data } = await supabase.storage
                .from('avatars')
                .upload(fileName, file);

            if (!uploadError && data) {
               const { data: publicData } = supabase.storage.from('avatars').getPublicUrl(fileName);
               await supabase.from('messages').insert({
                   team_id: team.id,
                   user_id: user.id,
                   media_url: publicData.publicUrl
               });
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsSending(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    if (loading) {
        return <div className="h-screen flex items-center justify-center bg-safe-dark bg-safe-dark text-white"><div className="animate-spin w-8 h-8 border-4 border-safe-red border-t-transparent rounded-full" /></div>;
    }

    if (!team) {
        return <div className="h-screen flex flex-col items-center justify-center bg-safe-dark text-white p-6">
            <h1 className="text-xl font-bold mb-4">Équipe introuvable</h1>
            <button onClick={() => navigate(-1)} className="bg-safe-card px-4 py-2 rounded-xl">Retour</button>
        </div>;
    }

    return (
        <div className="flex flex-col h-screen bg-safe-dark relative text-white">
            {/* Header */}
            <header className="bg-safe-card border-b border-safe-border px-4 py-4 flex flex-col pt-8 z-10 shadow-md">
                <div className="flex items-center justify-between mb-4 mt-2">
                    <div className="flex items-center gap-3">
                        <button onClick={() => navigate(-1)} className="p-2 bg-safe-dark rounded-full hover:bg-safe-border transition-colors">
                            <ArrowLeft size={20} className="text-white" />
                        </button>
                        <div>
                            <h1 className="font-bold text-xl leading-tight flex items-center gap-2">
                                {team.name}
                                <span className="bg-safe-green/20 text-safe-green text-[10px] uppercase font-bold px-2 py-0.5 rounded shrink-0">
                                    {team.status || 'Actif'}
                                </span>
                            </h1>
                            <span className="text-xs text-gray-400 font-medium">{members.length} membres • {team.location || 'Sur zone'}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        <button className="p-2 text-gray-300 hover:text-white"><Search size={22} /></button>
                        <button className="p-2 text-gray-300 hover:text-white"><Filter size={22} /></button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex bg-[#121212] p-1 rounded-xl border border-safe-border">
                    {['Chat', 'Infos', 'Membres'].map(tab => (
                        <button 
                            key={tab}
                            onClick={() => setActiveTab(tab as any)}
                            className={cn(
                                "flex-1 py-2 text-sm font-bold rounded-lg transition-all",
                                activeTab === tab ? "bg-safe-card text-white shadow-sm" : "text-gray-500 hover:text-gray-300"
                            )}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </header>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden relative bg-[#0a0a0a]">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="absolute inset-0 h-full"
                    >
                        {activeTab === 'Chat' && <ChatTab teamId={team.id} />}
                        {activeTab === 'Infos' && <InfosTab team={team} />}
                        {activeTab === 'Membres' && <MembresTab members={members} />}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Chat Input Area (only visible when Chat is active) */}
            {activeTab === 'Chat' && (
                <div className="bg-safe-card border-t border-safe-border px-4 py-3 pb-safe flex items-end gap-2 z-10">
                    <button className="p-2.5 text-gray-400 rounded-full hover:bg-safe-dark mb-0.5 shrink-0 transition-colors">
                        <Paperclip size={22} />
                    </button>
                    <div className="flex-1 bg-safe-dark border border-safe-border rounded-2xl flex items-end min-h-[48px] focus-within:border-gray-500 transition-colors">
                        <textarea 
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendMessage();
                                }
                            }}
                            placeholder="Message..."
                            className="bg-transparent flex-1 resize-none outline-none text-sm text-white px-4 py-3 max-h-32 min-h-[48px] disabled:opacity-50"
                            rows={message.split('\n').length > 1 ? Math.min(message.split('\n').length, 5) : 1}
                            disabled={isSending}
                        />
                        <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                        />
                        <button 
                            disabled={isSending}
                            onClick={() => fileInputRef.current?.click()}
                            className="p-3 text-safe-red shrink-0 hover:text-safe-red-hover transition-colors disabled:opacity-50"
                        >
                            <ImageIcon size={22} />
                        </button>
                    </div>
                    {message.trim() ? (
                        <motion.button 
                            onClick={handleSendMessage}
                            disabled={isSending}
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-safe-red w-12 h-12 rounded-full flex items-center justify-center text-white shrink-0 mb-0.5 shadow-lg active:scale-95 transition-transform disabled:opacity-50"
                        >
                            <Send size={20} className="translate-x-0.5" />
                        </motion.button>
                    ) : (
                        <button className="bg-safe-card border border-safe-border w-12 h-12 rounded-full flex items-center justify-center text-gray-400 shrink-0 mb-0.5 hover:text-white hover:bg-safe-dark transition-all">
                            <Mic size={22} />
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

function ChatTab({ teamId }: { teamId: string }) {
    const { user } = useAuth();
    const [messages, setMessages] = useState<any[]>([]);

    useEffect(() => {
        const fetchMessages = async () => {
            const { data } = await supabase
                .from('messages')
                .select('*, users(name)')
                .eq('team_id', teamId)
                .order('created_at', { ascending: true });
            if (data) setMessages(data);
        };
        fetchMessages();

        const channel = supabase.channel(`public:messages:team_${teamId}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `team_id=eq.${teamId}` }, payload => {
                const fetchNewMessage = async () => {
                    const { data } = await supabase.from('messages').select('*, users(name)').eq('id', payload.new.id).single();
                    if (data) setMessages(prev => [...prev, data]);
                };
                fetchNewMessage();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [teamId]);

    return (
        <div className="h-full overflow-y-auto p-5 flex flex-col gap-6 pb-6">
            <div className="text-center">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest bg-safe-card px-3 py-1 rounded-full border border-safe-border">
                    Démarrage de la mission
                </span>
            </div>
            
            {messages.length === 0 ? (
                <div className="text-center text-gray-500 mt-4 text-sm">Aucun message pour le moment.</div>
            ) : (
                messages.map(msg => (
                    <MessageBubble 
                        key={msg.id}
                        text={msg.content}
                        image={msg.media_url}
                        time={new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        isMe={msg.user_id === user?.id}
                        sender={msg.users?.name || 'Inconnu'}
                        avatar={(msg.users?.name || 'I').charAt(0)}
                    />
                ))
            )}
        </div>
    )
}

function MessageBubble({ text, time, isMe, sender, avatar, image }: any) {
    return (
        <div className={cn("flex flex-col max-w-[85%]", isMe ? "self-end items-end" : "self-start items-start")}>
            {!isMe && sender && <span className="text-[11px] font-semibold text-gray-500 mb-1.5 ml-11">{sender}</span>}
            <div className="flex items-end gap-2">
                {!isMe && (
                    <div className="w-8 h-8 rounded-full bg-safe-card border border-safe-border flex items-center justify-center text-xs font-bold text-gray-300 shrink-0 shadow-sm">
                        {avatar}
                    </div>
                )}
                
                <div className={cn(
                    "flex flex-col p-3.5 rounded-2xl relative shadow-sm",
                    isMe ? "bg-safe-green text-white rounded-br-sm" : "bg-white text-safe-dark rounded-bl-sm"
                )}>
                    {image && (
                        <img src={image} alt="Attachment" className="w-full h-auto rounded-xl mb-3 object-cover border border-black/10" />
                    )}
                    {text && <span className="text-[15px] font-medium leading-snug">{text}</span>}
                    <div className={cn(
                        "flex items-center gap-1 mt-1.5 justify-end font-bold",
                        isMe ? "text-white/70" : "text-gray-400"
                    )}>
                        <span className="text-[10px]">{time}</span>
                        {isMe && <CheckCheck size={14} />}
                    </div>
                </div>
            </div>
        </div>
    )
}

function InfosTab({ team }: any) {
    return (
        <div className="h-full overflow-y-auto p-6 space-y-6 pb-12">
            <div className="bg-safe-card border border-safe-border rounded-2xl p-5 shadow-lg">
                <h3 className="text-xs font-black text-gray-500 mb-5 uppercase tracking-widest">Détails de la mission</h3>
                <div className="space-y-5">
                    <div className="flex gap-4">
                        <div className="mt-1"><MapPin size={22} className="text-safe-red" /></div>
                        <div>
                            <span className="block text-base font-bold text-white mb-0.5">{team.location || 'Secteur non défini'}</span>
                            <span className="text-sm font-medium text-gray-400">Zone assignée pour la recherche.</span>
                        </div>
                    </div>
                    <div className="w-full h-px bg-safe-border" />
                    <div className="flex gap-4">
                        <div className="mt-1"><Check size={22} className="text-safe-green" /></div>
                        <div>
                            <span className="block text-base font-bold text-white mb-0.5">Statut</span>
                            <span className="text-sm font-medium text-gray-400 capitalize">{team.status || 'En attente'}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

function MembresTab({ members }: { members: any[] }) {
    return (
        <div className="h-full overflow-y-auto p-6 space-y-4 pb-12">
            <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest px-1">Membres ({members.length})</h3>
            
            <div className="space-y-3">
                {members.map(member => (
                    <MemberCard 
                        key={member.user_id}
                        name={member.users?.name || 'Inconnu'} 
                        role={member.is_leader ? "Chef d'équipe" : "Bénévole"} 
                        initial={(member.users?.name || 'I').charAt(0)} 
                        isLeader={member.is_leader} 
                    />
                ))}
                {members.length === 0 && (
                    <div className="text-gray-500 text-sm">Aucun membre dans cette équipe.</div>
                )}
            </div>
        </div>
    )
}

function MemberCard({ name, role, phone, initial, isLeader }: any) {
    return (
        <div className="flex items-center gap-4 bg-safe-card border border-safe-border p-4 rounded-2xl shadow-sm">
            <div className="w-12 h-12 bg-safe-dark border border-gray-700/50 rounded-full flex items-center justify-center font-black text-lg relative text-white">
                {initial}
                {isLeader && <div className="absolute -bottom-1 -right-1 bg-yellow-500 text-black text-[9px] font-black px-1.5 py-0.5 rounded border-2 border-safe-card shrink-0">CHEF</div>}
            </div>
            <div className="flex-1">
                <span className="block font-bold text-base text-white">{name}</span>
                <span className="text-sm font-medium text-gray-400 mb-1 inline-block">{role}</span>
                {phone && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-safe-dark w-max px-2 py-1 rounded-md">
                        <Phone size={12} /> {phone}
                    </div>
                )}
            </div>
            <button className="w-11 h-11 rounded-full bg-safe-dark border border-safe-border flex items-center justify-center text-safe-blue hover:bg-safe-blue hover:text-white transition-all shadow-sm">
                <Phone size={18} />
            </button>
        </div>
    )
}

