import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
    FileText, FlaskConical, ImageIcon, Paperclip, Pill, Plus,
    Trash2, UploadCloud, Users, X, FolderLock, ExternalLink, Loader2
} from 'lucide-react';
import {
    createFamilyDocument,
    createFamilyMember,
    deleteFamilyDocument,
    getFamilyDocuments,
    getFamilyMembers,
} from '../services/api';
import PageTransition from '../components/common/PageTransition';

const categories = ['Lab Report', 'Prescription', 'Imaging', 'Discharge Summary', 'Other'];

function getDocIcon(category) {
    if (category === 'Lab Report') return FlaskConical;
    if (category === 'Prescription') return Pill;
    if (category === 'Imaging') return ImageIcon;
    if (category === 'Discharge Summary') return FileText;
    return Paperclip;
}

// Color mapping for document types to give the grid visual variety
function getDocColor(category) {
    if (category === 'Lab Report') return 'text-purple-600 bg-purple-50';
    if (category === 'Prescription') return 'text-blue-600 bg-blue-50';
    if (category === 'Imaging') return 'text-emerald-600 bg-emerald-50';
    if (category === 'Discharge Summary') return 'text-rose-600 bg-rose-50';
    return 'text-slate-600 bg-slate-100';
}

async function uploadFileToStorage(file) {
    const uploadEndpoint = import.meta.env.VITE_STORAGE_UPLOAD_ENDPOINT;
    if (uploadEndpoint) {
        const formData = new FormData();
        formData.append('file', file);
        const response = await fetch(uploadEndpoint, { method: 'POST', body: formData });
        if (!response.ok) throw new Error('Upload failed');
        const payload = await response.json();
        return {
            url: payload.url || payload.secure_url || payload.location,
            fileName: payload.fileName || payload.originalname || file.name,
        };
    }
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve({ url: reader.result, fileName: file.name });
        reader.onerror = () => reject(new Error('Fallback upload failed'));
        reader.readAsDataURL(file);
    });
}

const initialMemberForm = { name: '', relation: '', age: '', bloodGroup: '' };

export default function FamilyVault() {
    const [members, setMembers] = useState([]);
    const [documents, setDocuments] = useState([]);
    const [activeMemberId, setActiveMemberId] = useState('all');
    const [loading, setLoading] = useState(true);
    const [showMemberModal, setShowMemberModal] = useState(false);
    const [memberForm, setMemberForm] = useState(initialMemberForm);
    const [selectedCategory, setSelectedCategory] = useState(categories[0]);
    const [dragActive, setDragActive] = useState(false);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);

    const loadMembers = useCallback(async () => {
        try {
            const { data } = await getFamilyMembers();
            setMembers(Array.isArray(data) ? data : []);
        } catch {
            toast.error('Unable to sync family profiles.');
        }
    }, []);

    const loadDocuments = useCallback(async (memberId, showLoader = true) => {
        if (showLoader) setLoading(true);
        try {
            const params = memberId && memberId !== 'all' ? { familyMemberId: memberId } : undefined;
            const { data } = await getFamilyDocuments(params);
            setDocuments(Array.isArray(data) ? data : []);
        } catch {
            toast.error('Unable to fetch vault documents.');
        } finally {
            if (showLoader) setLoading(false);
        }
    }, []);

    useEffect(() => {
        async function bootstrap() {
            await loadMembers();
            await loadDocuments('all');
        }
        bootstrap();
    }, [loadDocuments, loadMembers]);

    useEffect(() => {
        if (!members.length && activeMemberId !== 'all') setActiveMemberId('all');
    }, [members, activeMemberId]);

    useEffect(() => { loadDocuments(activeMemberId, false); }, [activeMemberId, loadDocuments]);

    const activeMember = useMemo(() => members.find((m) => m._id === activeMemberId) || null, [members, activeMemberId]);

    async function handleAddMember(e) {
        e.preventDefault();
        if (!memberForm.name.trim() || !memberForm.relation.trim() || !memberForm.age) {
            toast.error('Please complete all required profile fields.'); return;
        }
        try {
            const { data } = await createFamilyMember({ ...memberForm, age: Number(memberForm.age) });
            setMembers((prev) => [...prev, data]);
            setShowMemberModal(false);
            setMemberForm(initialMemberForm);
            toast.success('Family member added securely.');
        } catch {
            toast.error('Failed to register family member.');
        }
    }

    async function handleFilesUpload(fileList) {
        if (!fileList?.length) return;
        if (activeMemberId === 'all') {
            toast.error('Please select a specific family member to upload documents.'); return;
        }
        setUploading(true);
        try {
            const files = Array.from(fileList);
            const uploadedDocs = [];
            for (const file of files) {
                const uploaded = await uploadFileToStorage(file);
                const { data } = await createFamilyDocument({
                    url: uploaded.url,
                    fileName: uploaded.fileName,
                    category: selectedCategory,
                    familyMemberId: activeMemberId,
                });
                uploadedDocs.push(data);
            }
            setDocuments((prev) => [...uploadedDocs, ...prev]);
            toast.success(`${uploadedDocs.length} document(s) securely vaulted.`);
        } catch {
            toast.error('Document encryption & upload failed.');
        } finally {
            setUploading(false);
        }
    }

    async function handleDeleteDocument(documentId) {
        try {
            await deleteFamilyDocument(documentId);
            setDocuments((prev) => prev.filter((doc) => doc._id !== documentId));
            toast.success('Document permanently deleted.');
        } catch {
            toast.error('Unable to remove document from vault.');
        }
    }

    return (
        <PageTransition className="mx-auto max-w-[1400px] space-y-8 pb-12 px-2">
            {/* Premium Header */}
            <header className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 px-8 py-10 text-white shadow-2xl shadow-slate-900/20">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.25),transparent_60%)]" />
                <div className="relative z-10 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                    <div className="max-w-2xl">
                        <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-blue-300 ring-1 ring-inset ring-blue-500/30 mb-4">
                            <FolderLock size={14} /> Encrypted Storage
                        </div>
                        <h1 className="text-4xl font-black tracking-tight lg:text-5xl">
                            Family <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Health Vault</span>
                        </h1>
                        <p className="mt-3 text-slate-400 text-lg">
                            Securely upload, organize, and access medical records for your entire household.
                        </p>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <div className="hidden md:block pr-6 border-r border-slate-700 text-right">
                            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Total Records</p>
                            <p className="text-2xl font-black text-white">{documents.length}</p>
                        </div>
                        <button
                            onClick={() => setShowMemberModal(true)}
                            className="group flex h-14 items-center gap-3 rounded-2xl bg-white px-6 text-sm font-bold text-slate-900 shadow-xl transition-all hover:bg-slate-50 active:scale-95"
                        >
                            <div className="rounded-full bg-slate-900 p-1 text-white transition-transform group-hover:rotate-90">
                                <Plus size={16} />
                            </div>
                            Add Member
                        </button>
                    </div>
                </div>
            </header>

            {/* Member Selector (Apple-Style Sliding Tabs) */}
            <div className="flex justify-center">
                <div className="flex p-1.5 space-x-2 bg-slate-100/80 rounded-2xl backdrop-blur-xl border border-slate-200/60 shadow-inner overflow-x-auto custom-scrollbar max-w-full">
                    <MemberTab 
                        label="All Members" 
                        isActive={activeMemberId === 'all'} 
                        onClick={() => setActiveMemberId('all')} 
                        icon={<Users size={16} />}
                    />
                    {members.map(member => (
                        <MemberTab 
                            key={member._id}
                            label={member.name} 
                            sublabel={member.relation}
                            isActive={activeMemberId === member._id} 
                            onClick={() => setActiveMemberId(member._id)} 
                            initial={member.name?.charAt(0).toUpperCase()}
                        />
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Col: Uploader (Only visible if a specific member is selected) */}
                <div className="lg:col-span-4 space-y-6">
                    <div className={`transition-all duration-500 ${activeMemberId === 'all' ? 'opacity-50 grayscale pointer-events-none' : 'opacity-100'}`}>
                        <div className="rounded-[2rem] bg-white p-6 shadow-xl shadow-slate-200/40 border border-slate-100">
                            <h3 className="text-lg font-bold text-slate-900 mb-1">Upload Document</h3>
                            <p className="text-xs text-slate-500 font-medium mb-4">
                                Target: <span className="text-blue-600 font-bold">{activeMember?.name || 'Please select a member'}</span>
                            </p>

                            <SelectField 
                                value={selectedCategory} 
                                onChange={setSelectedCategory} 
                                options={categories.map(c => ({ l: c, v: c }))} 
                            />

                            <div
                                onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                                onDragLeave={() => setDragActive(false)}
                                onDrop={(e) => { e.preventDefault(); setDragActive(false); handleFilesUpload(e.dataTransfer.files); }}
                                className={`mt-4 relative overflow-hidden rounded-[1.5rem] border-2 border-dashed p-8 text-center transition-all duration-300 ${
                                    dragActive ? 'border-blue-500 bg-blue-50 scale-[1.02]' : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                                }`}
                            >
                                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03]"></div>
                                <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-colors ${dragActive ? 'bg-blue-100 text-blue-600' : 'bg-white text-slate-400 shadow-sm'}`}>
                                    {uploading ? <Loader2 className="animate-spin" size={24} /> : <UploadCloud size={24} />}
                                </div>
                                <h4 className="text-sm font-bold text-slate-700">Drag & Drop files</h4>
                                <p className="text-xs text-slate-500 mt-1 mb-4">PDF, JPG, PNG up to 10MB</p>
                                
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploading || activeMemberId === 'all'}
                                    className="relative z-10 w-full rounded-xl bg-slate-900 py-3 text-xs font-bold text-white transition-all hover:bg-slate-800 active:scale-95 disabled:opacity-50"
                                >
                                    {uploading ? 'Encrypting & Uploading...' : 'Browse Files'}
                                </button>
                                <input ref={fileInputRef} type="file" multiple className="hidden" onChange={(e) => handleFilesUpload(e.target.files)} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Col: Documents Grid */}
                <div className="lg:col-span-8">
                    {loading ? (
                        <div className="flex h-64 items-center justify-center rounded-[2.5rem] border border-slate-100 bg-white/50 shadow-sm">
                            <Loader2 size={32} className="animate-spin text-blue-500" />
                        </div>
                    ) : !documents.length ? (
                        <div className="flex flex-col items-center justify-center h-full min-h-[400px] rounded-[2.5rem] border border-dashed border-slate-300 bg-white/50 text-center p-8">
                            <div className="h-24 w-24 rounded-full bg-slate-100 flex items-center justify-center mb-6 text-slate-300 shadow-inner">
                                <FolderLock size={48} />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-800 tracking-tight">Vault is empty</h3>
                            <p className="mt-2 text-sm text-slate-500 max-w-sm">
                                {activeMemberId === 'all' 
                                    ? "Select a family member on the left to start securely archiving their medical records."
                                    : `Upload ${activeMember?.name}'s lab reports, prescriptions, and imaging files here.`}
                            </p>
                        </div>
                    ) : (
                        <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <AnimatePresence>
                                {documents.map((doc, index) => {
                                    const Icon = getDocIcon(doc.category);
                                    const colorClass = getDocColor(doc.category);
                                    const docOwner = members.find(m => m._id === doc.familyMemberId)?.name || 'Unknown';

                                    return (
                                        <motion.div
                                            key={doc._id} layout
                                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            transition={{ duration: 0.3, delay: index * 0.05 }}
                                            className="group relative flex flex-col justify-between overflow-hidden rounded-[2rem] border border-slate-100 bg-white p-6 shadow-lg shadow-slate-200/30 hover:-translate-y-1 hover:shadow-xl transition-all duration-300"
                                        >
                                            <div>
                                                <div className="flex items-start justify-between mb-4">
                                                    <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shadow-inner ${colorClass}`}>
                                                        <Icon size={22} />
                                                    </div>
                                                    <button 
                                                        onClick={() => handleDeleteDocument(doc._id)} 
                                                        className="p-2 bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-600 rounded-xl transition-colors opacity-0 group-hover:opacity-100"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                                <h4 className="font-bold text-slate-900 leading-tight mb-1 line-clamp-2" title={doc.fileName}>{doc.fileName}</h4>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <span className="inline-block px-2 py-1 rounded-md bg-slate-100 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                                                        {doc.category}
                                                    </span>
                                                    {activeMemberId === 'all' && (
                                                        <span className="text-[11px] font-semibold text-slate-400 truncate">
                                                            • {docOwner}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                                                <span className="text-[10px] font-semibold text-slate-400">
                                                    {new Date(doc.uploadDate || doc.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </span>
                                                <a
                                                    href={doc.url} target="_blank" rel="noreferrer"
                                                    className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg"
                                                >
                                                    Open <ExternalLink size={12} />
                                                </a>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>
                        </motion.div>
                    )}
                </div>
            </div>

            {/* Premium Add Member Modal */}
            <AnimatePresence>
                {showMemberModal && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-md"
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="w-full max-w-md rounded-[2.5rem] bg-white p-8 shadow-2xl border border-white"
                        >
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h3 className="text-2xl font-black tracking-tight text-slate-900">Add Member</h3>
                                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mt-1">Create clinical profile</p>
                                </div>
                                <button onClick={() => setShowMemberModal(false)} className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors">
                                    <X size={18} />
                                </button>
                            </div>

                            <form onSubmit={handleAddMember} className="space-y-5">
                                <InputField label="Legal Name" value={memberForm.name} onChange={(v) => setMemberForm(p => ({ ...p, name: v }))} placeholder="e.g. Jane Doe" />
                                <InputField label="Relationship" value={memberForm.relation} onChange={(v) => setMemberForm(p => ({ ...p, relation: v }))} placeholder="e.g. Mother, Son" />

                                <div className="grid grid-cols-2 gap-4">
                                    <InputField label="Age" type="number" value={memberForm.age} onChange={(v) => setMemberForm(p => ({ ...p, age: v }))} min="0" />
                                    <SelectField 
                                        value={memberForm.bloodGroup} 
                                        onChange={(v) => setMemberForm(p => ({ ...p, bloodGroup: v }))} 
                                        options={[{l:'Unknown', v:''}, {l:'A+',v:'A+'}, {l:'A-',v:'A-'}, {l:'B+',v:'B+'}, {l:'B-',v:'B-'}, {l:'O+',v:'O+'}, {l:'O-',v:'O-'}, {l:'AB+',v:'AB+'}, {l:'AB-',v:'AB-'}]} 
                                        label="Blood Group"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="mt-6 w-full h-14 rounded-2xl bg-blue-600 text-white text-base font-bold shadow-xl shadow-blue-500/20 transition-all hover:bg-blue-700 active:scale-95 flex items-center justify-center gap-2"
                                >
                                    <Users size={18} /> Initialize Profile
                                </button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </PageTransition>
    );
}

// --- Micro UI Components ---
function MemberTab({ label, sublabel, isActive, onClick, icon, initial }) {
    return (
        <button
            onClick={onClick}
            className={`relative flex items-center gap-3 px-5 py-2.5 rounded-xl transition-all duration-300 outline-none shrink-0 ${
                isActive ? 'text-slate-900' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
            }`}
        >
            {isActive && (
                <motion.div
                    layoutId="memberTabIndicator"
                    className="absolute inset-0 bg-white rounded-xl shadow-md border border-slate-200/50"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
            )}
            <span className="relative z-10 flex items-center gap-3">
                {icon ? (
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${isActive ? 'bg-blue-50 text-blue-600' : 'bg-slate-200 text-slate-500'}`}>
                        {icon}
                    </div>
                ) : (
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center text-xs font-bold ${isActive ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20' : 'bg-slate-200 text-slate-500'}`}>
                        {initial}
                    </div>
                )}
                <div className="text-left hidden sm:block">
                    <span className="block text-sm font-bold leading-tight">{label}</span>
                    {sublabel && <span className={`block text-[10px] font-semibold uppercase tracking-widest ${isActive ? 'text-blue-500' : 'text-slate-400'}`}>{sublabel}</span>}
                </div>
            </span>
        </button>
    );
}

function InputField({ label, value, onChange, placeholder, type = "text", min }) {
    return (
        <div className="relative group">
            <input 
                type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} min={min}
                className="peer w-full h-14 rounded-2xl border-none bg-slate-50 px-4 pt-4 text-sm font-bold text-slate-900 outline-none ring-2 ring-transparent focus:bg-white focus:ring-blue-500/20 focus:border-blue-300 transition-all shadow-inner"
            />
            <label className="absolute left-4 top-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 transition-all peer-focus:text-blue-600">
                {label}
            </label>
        </div>
    );
}

function SelectField({ value, onChange, options, label }) {
    return (
        <div className="relative group">
            <select 
                value={value} onChange={(e) => onChange(e.target.value)}
                className={`peer w-full h-14 rounded-2xl border-none bg-slate-50 px-4 text-sm font-bold text-slate-900 outline-none ring-2 ring-transparent focus:bg-white focus:ring-blue-500/20 focus:border-blue-300 transition-all shadow-inner appearance-none ${label ? 'pt-4' : ''}`}
            >
                {options.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
            </select>
            {label && (
                <label className="absolute left-4 top-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 transition-all peer-focus:text-blue-600">
                    {label}
                </label>
            )}
        </div>
    );
}