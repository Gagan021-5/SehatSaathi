import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
    FileText,
    FlaskConical,
    ImageIcon,
    Paperclip,
    Pill,
    Plus,
    Trash2,
    UploadCloud,
    Users,
    X,
} from 'lucide-react';
import {
    createFamilyDocument,
    createFamilyMember,
    deleteFamilyDocument,
    getFamilyDocuments,
    getFamilyMembers,
} from '../services/api';
import Card from '../components/common/Card';
import PageTransition from '../components/common/PageTransition';

const categories = ['Lab Report', 'Prescription', 'Imaging', 'Discharge Summary', 'Other'];

function getDocIcon(category) {
    if (category === 'Lab Report') return FlaskConical;
    if (category === 'Prescription') return Pill;
    if (category === 'Imaging') return ImageIcon;
    if (category === 'Discharge Summary') return FileText;
    return Paperclip;
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

const initialMemberForm = {
    name: '',
    relation: '',
    age: '',
    bloodGroup: '',
};

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
            toast.error('Unable to load family members.');
        }
    }, []);

    const loadDocuments = useCallback(async (memberId, showLoader = true) => {
        if (showLoader) setLoading(true);
        try {
            const params = memberId && memberId !== 'all' ? { familyMemberId: memberId } : undefined;
            const { data } = await getFamilyDocuments(params);
            setDocuments(Array.isArray(data) ? data : []);
        } catch {
            toast.error('Unable to load family documents.');
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
        if (!members.length && activeMemberId !== 'all') {
            setActiveMemberId('all');
        }
    }, [members, activeMemberId]);

    useEffect(() => {
        loadDocuments(activeMemberId, false);
    }, [activeMemberId, loadDocuments]);

    const activeMember = useMemo(
        () => members.find((member) => member._id === activeMemberId) || null,
        [members, activeMemberId]
    );

    async function handleAddMember(event) {
        event.preventDefault();
        if (!memberForm.name.trim() || !memberForm.relation.trim() || !memberForm.age) {
            toast.error('Name, relation, and age are required.');
            return;
        }

        try {
            const { data } = await createFamilyMember({
                ...memberForm,
                age: Number(memberForm.age),
            });
            setMembers((prev) => [...prev, data]);
            setShowMemberModal(false);
            setMemberForm(initialMemberForm);
            toast.success('Family member added.');
        } catch {
            toast.error('Failed to add family member.');
        }
    }

    async function handleFilesUpload(fileList) {
        if (!fileList?.length) return;
        if (activeMemberId === 'all') {
            toast.error('Select a family member before uploading documents.');
            return;
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
            toast.success(`${uploadedDocs.length} document(s) uploaded.`);
        } catch {
            toast.error('Document upload failed.');
        } finally {
            setUploading(false);
        }
    }

    async function handleDeleteDocument(documentId) {
        try {
            await deleteFamilyDocument(documentId);
            setDocuments((prev) => prev.filter((doc) => doc._id !== documentId));
            toast.success('Document removed.');
        } catch {
            toast.error('Unable to remove document.');
        }
    }

    return (
        <PageTransition className="mx-auto max-w-7xl space-y-4">
            <Card className="p-6 md:p-7 bg-gradient-to-r from-zinc-900 via-blue-900 to-teal-700 text-white border-transparent">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <p className="text-sm text-blue-100">Family Health Vault</p>
                        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-white">Shared Medical Documents</h1>
                        <p className="mt-2 text-sm text-blue-100">
                            Upload and organize reports by family member in a secure, structured vault.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setShowMemberModal(true)}
                        className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-blue-700 shadow-lg shadow-slate-950/20"
                    >
                        <Plus size={16} /> Add Family Member
                    </button>
                </div>
            </Card>

            <Card className="p-4">
                <div className="flex items-center gap-3 overflow-x-auto pb-1">
                    <button
                        type="button"
                        onClick={() => setActiveMemberId('all')}
                        className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold ring-1 ${
                            activeMemberId === 'all'
                                ? 'bg-gradient-to-r from-blue-600 to-teal-500 text-white ring-blue-300/65'
                                : 'bg-white text-slate-600 ring-slate-200'
                        }`}
                    >
                        All
                    </button>

                    {members.map((member) => {
                        const selected = activeMemberId === member._id;
                        return (
                            <button
                                key={member._id}
                                type="button"
                                onClick={() => setActiveMemberId(member._id)}
                                className={`shrink-0 rounded-full px-2 py-1.5 transition-all ${
                                    selected ? 'bg-blue-50 ring-1 ring-blue-200' : 'bg-white ring-1 ring-slate-200'
                                }`}
                            >
                                <span className="flex items-center gap-2">
                                    <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-blue-600 to-teal-500 text-xs font-semibold text-white">
                                        {member.name?.slice(0, 1)?.toUpperCase() || 'F'}
                                    </span>
                                    <span className="pr-2 text-left">
                                        <span className="block text-sm font-semibold text-slate-800">{member.name}</span>
                                        <span className="block text-xs text-slate-500">{member.relation}</span>
                                    </span>
                                </span>
                            </button>
                        );
                    })}
                </div>
            </Card>

            <Card className="p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Users size={15} />
                        Upload for: <span className="font-semibold text-slate-900">{activeMember?.name || 'Select member'}</span>
                    </div>
                    <select value={selectedCategory} onChange={(event) => setSelectedCategory(event.target.value)} className="text-sm">
                        {categories.map((category) => (
                            <option key={category} value={category}>
                                {category}
                            </option>
                        ))}
                    </select>
                </div>

                <div
                    onDragOver={(event) => {
                        event.preventDefault();
                        setDragActive(true);
                    }}
                    onDragLeave={() => setDragActive(false)}
                    onDrop={(event) => {
                        event.preventDefault();
                        setDragActive(false);
                        handleFilesUpload(event.dataTransfer.files);
                    }}
                    className={`mt-4 rounded-2xl border-2 border-dashed p-8 text-center transition-all ${
                        dragActive ? 'border-blue-400 bg-blue-50/70' : 'border-slate-300 bg-slate-50/70'
                    }`}
                >
                    <UploadCloud size={22} className="mx-auto text-slate-500" />
                    <p className="mt-2 text-sm text-slate-600">Drag and drop document files here</p>
                    <p className="text-xs text-slate-500">or</p>
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="mt-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                    >
                        {uploading ? 'Uploading...' : 'Choose Files'}
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        className="hidden"
                        onChange={(event) => handleFilesUpload(event.target.files)}
                    />
                </div>
            </Card>

            {loading ? (
                <Card className="p-8 text-center">
                    <p className="text-sm text-slate-500">Loading documents...</p>
                </Card>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {documents.map((doc, index) => {
                        const Icon = getDocIcon(doc.category);
                        return (
                            <motion.div
                                key={doc._id}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, ease: 'easeOut', delay: index * 0.03 }}
                            >
                                <Card className="p-4 h-full">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                            <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-700">
                                                <Icon size={17} />
                                            </span>
                                            <div>
                                                <p className="text-sm font-semibold text-slate-900 break-all">{doc.fileName}</p>
                                                <p className="text-xs text-slate-500">{doc.category}</p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleDeleteDocument(doc._id)}
                                            className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                    <p className="mt-4 text-xs text-slate-500">
                                        Uploaded: {new Date(doc.uploadDate || doc.createdAt).toLocaleString()}
                                    </p>
                                    <a
                                        href={doc.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="mt-3 inline-flex rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700"
                                    >
                                        Open Document
                                    </a>
                                </Card>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {!loading && !documents.length ? (
                <Card className="p-8 text-center">
                    <p className="text-sm text-slate-500">No documents found for this view.</p>
                </Card>
            ) : null}

            <AnimatePresence>
                {showMemberModal ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ opacity: 0, y: 16, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 12, scale: 0.98 }}
                            className="w-full max-w-md rounded-[1.6rem] border border-white/65 bg-white/90 p-5 shadow-[0_28px_80px_rgba(15,23,42,0.22)]"
                        >
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-semibold tracking-tight text-slate-900">Add Family Member</h3>
                                <button
                                    type="button"
                                    onClick={() => setShowMemberModal(false)}
                                    className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            <form onSubmit={handleAddMember} className="mt-4 space-y-3">
                                <input
                                    value={memberForm.name}
                                    onChange={(event) => setMemberForm((prev) => ({ ...prev, name: event.target.value }))}
                                    placeholder="Name"
                                />
                                <input
                                    value={memberForm.relation}
                                    onChange={(event) => setMemberForm((prev) => ({ ...prev, relation: event.target.value }))}
                                    placeholder="Relation"
                                />
                                <div className="grid grid-cols-2 gap-2">
                                    <input
                                        type="number"
                                        min="0"
                                        value={memberForm.age}
                                        onChange={(event) => setMemberForm((prev) => ({ ...prev, age: event.target.value }))}
                                        placeholder="Age"
                                    />
                                    <input
                                        value={memberForm.bloodGroup}
                                        onChange={(event) => setMemberForm((prev) => ({ ...prev, bloodGroup: event.target.value }))}
                                        placeholder="Blood Group"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-teal-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/25"
                                >
                                    Save Member
                                </button>
                            </form>
                        </motion.div>
                    </motion.div>
                ) : null}
            </AnimatePresence>
        </PageTransition>
    );
}
