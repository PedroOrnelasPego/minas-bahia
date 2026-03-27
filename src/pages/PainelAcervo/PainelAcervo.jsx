import { useState, useEffect } from "react";
import { Container, Row, Col, Spinner, Form, InputGroup, Table, Badge, Button, Modal } from "react-bootstrap";
import {
  LayoutDashboard, PlusSquare, Settings, ShieldCheck,
  Search, Edit2, Trash2, Eye, Info, Music, Image as ImageIcon, Upload, Disc, AlertTriangle
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useMsal } from "@azure/msal-react";
import { getAuthEmail } from "../../auth/session";
import { getPerfilCache } from "../../utils/profileCache";

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=150";

export default function PainelAcervo() {
  const [activeTab, setActiveTab] = useState('overview');
  const [items, setItems] = useState([]);
  const [filterCategory, setFilterCategory] = useState("Todas as Categorias");
  const [filterSort, setFilterSort] = useState("recentes");
  const [itemDeleteConfirm, setItemDeleteConfirm] = useState({ visible: false, item: null });
  const [exemplars, setExemplars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();
  const [editingId, setEditingId] = useState(null);
  const [imageDeleteConfirm, setImageDeleteConfirm] = useState({ visible: false, url: null, field: null });
  const [existingImages, setExistingImages] = useState({ cover: null, back: null, insert: null, record: null });

  // ======== CONTROLE DE PERMISSÕES ======== //
  const { accounts } = useMsal();
  const mestreEmail = "contato@capoeiraminasbahia.com.br";
  const email = getAuthEmail();
  const isMestre = accounts[0]?.username === mestreEmail || email === mestreEmail;

  const [tracksA, setTracksA] = useState([{ id: String(Date.now()), side: "A", name: "", artists: "", duration: "", audioFile: null }]);
  const [tracksB, setTracksB] = useState([]);
  const cachedProfile = getPerfilCache(email);
  const [perfilLocal, setPerfilLocal] = useState(cachedProfile);

  // Recarregar o perfil do servidor para garantir permissões frescas
  useEffect(() => {
    async function refreshProfile() {
      if (!email) return;
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/perfil/${email}`);
        if (response.ok) {
          const data = await response.json();
          setPerfilLocal(data);
          setPerfilCache(email, data);
        }
      } catch (e) { console.error("Falha ao atualizar perfil:", e); }
    }
    refreshProfile();
  }, [email]);

  // Redefinir variáveis de permissão baseadas no perfil fresco
  const permissaoAcervo = perfilLocal?.permissaoAcervo || "leitor";
  const categoriasAcervo = Array.isArray(perfilLocal?.categoriasAcervo) ? perfilLocal.categoriasAcervo : [];
  const isEditor = permissaoAcervo === "editor";
  const isCurador = permissaoAcervo === "curador";
  const categoriasPermitidas = (isMestre || isEditor) ? ["vinil", "cd", "livro", "documento"] : categoriasAcervo;
  const podeAdicionar = isMestre || isEditor || (isCurador && categoriasPermitidas.length > 0);
  const podeEditar = isMestre || isEditor;
  const podeApagar = isMestre;

  // Estados do Formulário "Novo Registro"
  const [category, setCategory] = useState("vinil");
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [recordLabel, setRecordLabel] = useState("");
  const [country, setCountry] = useState("Brasil");
  const [year, setYear] = useState("");
  const [trackCountA, setTrackCountA] = useState("1");
  const [trackCountB, setTrackCountB] = useState("0");
  const [quantity, setQuantity] = useState(1);

  // Garantir que a categoria inicial seja válida para o usuário logado
  useEffect(() => {
    if (categoriasPermitidas.length > 0 && !categoriasPermitidas.includes(category)) {
      setCategory(categoriasPermitidas[0]);
    }
  }, [categoriasPermitidas, category]);

  useEffect(() => {
    if (quantity > 1) {
      const needed = quantity - 1;
      setExemplars(prev => {
        const copy = [...prev];
        while (copy.length < needed) copy.push({ cover: null, back: null, insert: null, record: null });
        while (copy.length > needed) copy.pop();
        return copy;
      });
    } else {
      setExemplars([]);
    }
  }, [quantity]);

  // Estados das Imagens
  const [coverImage, setCoverImage] = useState(null);
  const [backImage, setBackImage] = useState(null);
  const [insertImage, setInsertImage] = useState(null);
  const [recordImage, setRecordImage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function fetchAcervo() {
      try {
        const baseUrl = import.meta.env.VITE_ACERVO_API_URL || "http://localhost:3334";
        const res = await fetch(`${baseUrl}/api/acervo`);
        if (res.ok) {
          const data = await res.json();
          setItems(data);
        }
      } catch (error) {
        console.error("Erro ao carregar Itens:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchAcervo();
  }, []);

  const handleTrackCountA = (val) => {
    setTrackCountA(val);
    const num = parseInt(val) || 0;
    setTracksA(prev => {
      if (num === prev.length) return prev;
      if (num < prev.length) return prev.slice(0, num);
      return [...prev, ...Array.from({ length: num - prev.length }).map((_, i) => ({
        id: Date.now() + i, side: "A", name: "", artists: "", duration: "", audioFile: null
      }))];
    });
  };

  const handleTrackCountB = (val) => {
    setTrackCountB(val);
    const num = parseInt(val) || 0;
    setTracksB(prev => {
      if (num === prev.length) return prev;
      if (num < prev.length) return prev.slice(0, num);
      return [...prev, ...Array.from({ length: num - prev.length }).map((_, i) => ({
        id: Date.now() + i + 1000, side: "B", name: "", artists: "", duration: "", audioFile: null
      }))];
    });
  };

  const filteredItems = items.filter(item => {
    // Curador só vê o que pode adicionar. Editor/Mestre vê tudo.
    if (!categoriasPermitidas.includes(item.type)) {
      if (!isMestre && !isEditor) return false;
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchesSearch = (item.title || "").toLowerCase().includes(term) ||
        (item.author || "").toLowerCase().includes(term) ||
        (item.shortId || "").toLowerCase().includes(term);
      if (!matchesSearch) return false;
    }
    if (filterCategory !== "Todas as Categorias") {
      const catMap = { "Discos de Vinil": "vinil", "Livros": "livro", "Áudios / CDs": "cd", "Documentos": "documento" };
      if (item.type !== catMap[filterCategory]) return false;
    }
    return true;
  }).sort((a, b) => {
    const dateA = new Date(a.createdAt || 0).getTime();
    const dateB = new Date(b.createdAt || 0).getTime();
    switch (filterSort) {
      case 'recentes': return dateB - dateA;
      case 'antigos': return dateA - dateB;
      case 'az': return (a.title || "").localeCompare(b.title || "");
      case 'qtdDesc': return (Number(b.quantity) || 1) - (Number(a.quantity) || 1);
      default: return dateB - dateA;
    }
  });

  const updateTrackA = (id, field, value) => {
    setTracksA(tracksA.map(t => t.id === id ? { ...t, [field]: value } : t));
  };
  const updateTrackB = (id, field, value) => {
    setTracksB(tracksB.map(t => t.id === id ? { ...t, [field]: value } : t));
  };
  const removeTrackA = (id) => {
    setTracksA(tracksA.filter(t => t.id !== id));
    setTrackCountA(String(tracksA.length - 1));
  };
  const removeTrackB = (id) => {
    setTracksB(tracksB.filter(t => t.id !== id));
    setTrackCountB(String(tracksB.length - 1));
  };
  const handleTimeFormat = (val) => {
    let clean = val.replace(/\D/g, '');
    if (clean.length > 2) clean = clean.substring(0, 2) + ':' + clean.substring(2, 4);
    return clean;
  };

  const handleEdit = (id) => {
    const item = items.find(i => i.id === id);
    if (!item) return;
    setEditingId(id);
    setCategory(item.type || 'vinil');
    setTitle(item.title || '');
    setAuthor(item.author || '');
    setRecordLabel(item.recordLabel || '');
    setCountry(item.country || 'Brasil');
    setYear(item.year || '');
    setQuantity(item.quantity || 1);

    const tA = item.tracksA || [];
    const tB = item.tracksB || [];
    setTracksA(tA.length > 0 ? tA.map(t => ({ ...t, audioFile: null })) : [{ id: Date.now(), side: "A", name: "", artists: "", duration: "", audioFile: null }]);
    setTracksB(tB.length > 0 ? tB.map(t => ({ ...t, audioFile: null })) : []);
    setTrackCountA(String(tA.length || 1));
    setTrackCountB(String(tB.length || 0));

    setExistingImages({
      cover: item.image || null,
      back: item.backImage || null,
      insert: item.insertImage || null,
      record: item.recordImage || null
    });

    if (item.quantity > 1) {
      const needed = item.quantity - 1;
      const parsedExemplars = [];
      const exArray = item.exemplarImages || [];
      for (let i = 0; i < needed; i++) {
        const baseIdx = i * 4;
        parsedExemplars.push({
          cover: exArray[baseIdx] || null,
          back: exArray[baseIdx + 1] || null,
          insert: exArray[baseIdx + 2] || null,
          record: exArray[baseIdx + 3] || null
        });
      }
      setExemplars(parsedExemplars);
    } else {
      setExemplars([]);
    }

    setCoverImage(null); setBackImage(null); setInsertImage(null); setRecordImage(null);
    setActiveTab('new');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const executeItemDeletion = async () => {
    const item = itemDeleteConfirm.item;
    if (!item) return;
    setIsSubmitting(true);
    try {
      const baseUrl = import.meta.env.VITE_ACERVO_API_URL || "http://localhost:3334";

      const urlsToDelete = [
        item.image, item.backImage, item.insertImage, item.recordImage,
        ...(item.exemplarImages || [])
      ].filter(Boolean);

      (item.tracksA || []).forEach(t => t.audioUrl && urlsToDelete.push(t.audioUrl));
      (item.tracksB || []).forEach(t => t.audioUrl && urlsToDelete.push(t.audioUrl));

      for (const url of urlsToDelete) {
        try {
          await fetch(`${baseUrl}/api/uploads`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url })
          });
        } catch (e) { console.error("Falha ao deletar arquivo:", url) }
      }

      const response = await fetch(`${baseUrl}/api/acervo/${item.id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Falha ao excluir do banco de dados.');

      setItems(prev => prev.filter(i => i.id !== item.id));
      setItemDeleteConfirm({ visible: false, item: null });
    } catch (err) {
      console.error(err);
      alert('Erro ao excluir item: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNovoCadastroClick = () => {
    const fallbackCategory = categoriasPermitidas.length > 0 ? categoriasPermitidas[0] : 'vinil';
    if (editingId) {
      if (window.confirm("Você tem modificações não salvas na edição em curso. Tem certeza que deseja cancelar a edição e abrir um novo cadastro vazio?")) {
        setEditingId(null);
        setCategory(fallbackCategory);
        setTitle(''); setAuthor(''); setYear(''); setQuantity(1); setRecordLabel('');
        setCoverImage(null); setBackImage(null); setInsertImage(null); setRecordImage(null);
        setExistingImages({ cover: null, back: null, insert: null, record: null });
        setTracksA([{ id: String(Date.now()), side: "A", name: "", artists: "", duration: "", audioFile: null }]);
        setTracksB([]);
        setActiveTab('new');
      }
    } else {
      setCategory(fallbackCategory);
      setActiveTab('new');
    }
  };

  const triggerImageDeletion = (url, field) => {
    if (!url || typeof url !== 'string') {
      if (field === 'cover') setCoverImage(null);
      if (field === 'back') setBackImage(null);
      if (field === 'insert') setInsertImage(null);
      if (field === 'record') setRecordImage(null);

      if (field.startsWith('ex_')) {
        const parts = field.split('_');
        const slot = parts[1];
        const idxStr = parts[2];
        setExemplars(prev => prev.map((ex, i) => i === parseInt(idxStr) ? { ...ex, [slot]: null } : ex));
      } else {
        setExistingImages(prev => ({ ...prev, [field]: null }));
      }
      return;
    }
    setImageDeleteConfirm({ visible: true, url, field });
  };

  const handleDeleteImagePermanent = async () => {
    const { url, field } = imageDeleteConfirm;
    if (!url) return;
    setIsSubmitting(true);
    try {
      const baseUrl = import.meta.env.VITE_ACERVO_API_URL || "http://localhost:3334";
      const delRes = await fetch(`${baseUrl}/api/uploads`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      if (!delRes.ok) throw new Error('Falha ao excluir do Azure Storage');

      let updatedExemplars = [...exemplars];

      if (field === 'cover') { setCoverImage(null); setExistingImages(prev => ({ ...prev, cover: null })); }
      if (field === 'back') { setBackImage(null); setExistingImages(prev => ({ ...prev, back: null })); }
      if (field === 'insert') { setInsertImage(null); setExistingImages(prev => ({ ...prev, insert: null })); }
      if (field === 'record') { setRecordImage(null); setExistingImages(prev => ({ ...prev, record: null })); }

      if (field.startsWith('ex_')) {
        const parts = field.split('_');
        const slot = parts[1];
        const idxStr = parts[2];
        updatedExemplars = exemplars.map((ex, i) => i === parseInt(idxStr) ? { ...ex, [slot]: null } : ex);
        setExemplars(updatedExemplars);
      }

      if (editingId) {
        const item = items.find(i => i.id === editingId);
        if (item) {
          const dbPayload = {
            ...item,
            image: field === 'cover' ? null : existingImages.cover,
            backImage: field === 'back' ? null : existingImages.back,
            insertImage: field === 'insert' ? null : existingImages.insert,
            recordImage: field === 'record' ? null : existingImages.record,
            exemplarImages: Array.prototype.concat(...updatedExemplars.map(ex => [
              typeof ex.cover === 'string' ? ex.cover : null,
              typeof ex.back === 'string' ? ex.back : null,
              typeof ex.insert === 'string' ? ex.insert : null,
              typeof ex.record === 'string' ? ex.record : null
            ]))
          };

          await fetch(`${baseUrl}/api/vinis/${editingId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dbPayload)
          });

          setItems(prev => prev.map(i => i.id === editingId ? { ...i, ...dbPayload } : i));
        }
      }
    } catch (err) {
      console.error(err);
      alert('Erro ao excluir mídia: ' + err.message);
    } finally {
      setIsSubmitting(false);
      setImageDeleteConfirm({ visible: false, url: null, field: null });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const baseUrl = import.meta.env.VITE_ACERVO_API_URL || "http://localhost:3334";
      const allFilesToUpload = [];
      if (coverImage) allFilesToUpload.push({ original: coverImage, type: 'cover' });
      if (backImage) allFilesToUpload.push({ original: backImage, type: 'back' });
      if (insertImage) allFilesToUpload.push({ original: insertImage, type: 'insert' });
      if (recordImage) allFilesToUpload.push({ original: recordImage, type: 'record' });

      exemplars.forEach((ex, idx) => {
        if (ex.cover instanceof File) allFilesToUpload.push({ original: ex.cover, type: 'ex_cover', idx });
        if (ex.back instanceof File) allFilesToUpload.push({ original: ex.back, type: 'ex_back', idx });
        if (ex.insert instanceof File) allFilesToUpload.push({ original: ex.insert, type: 'ex_insert', idx });
        if (ex.record instanceof File) allFilesToUpload.push({ original: ex.record, type: 'ex_record', idx });
      });

      tracksA.forEach(t => { if (t.audioFile) allFilesToUpload.push({ original: t.audioFile, type: 'trackA', id: t.id }); });
      tracksB.forEach(t => { if (t.audioFile) allFilesToUpload.push({ original: t.audioFile, type: 'trackB', id: t.id }); });

      const finalUrls = {
        coverImage: existingImages.cover || null,
        backImage: existingImages.back || null,
        insertImage: existingImages.insert || null,
        recordImage: existingImages.record || null
      };
      const finalExemplars = Array.prototype.concat(...exemplars.map(ex => [
        typeof ex.cover === 'string' ? ex.cover : null,
        typeof ex.back === 'string' ? ex.back : null,
        typeof ex.insert === 'string' ? ex.insert : null,
        typeof ex.record === 'string' ? ex.record : null
      ]));

      if (allFilesToUpload.length > 0) {
        const formData = new FormData();
        formData.append('category', category);
        allFilesToUpload.forEach(f => formData.append('arquivos', f.original));

        const uploadRes = await fetch(`${baseUrl}/api/uploads`, {
          method: 'POST',
          body: formData
        });
        if (!uploadRes.ok) throw new Error('Falha no upload das mídias para a Nuvem.');

        const uploadData = await uploadRes.json();

        uploadData.files.forEach((uploadedFile, index) => {
          const fileRef = allFilesToUpload[index];
          if (fileRef.type === 'cover') finalUrls.coverImage = uploadedFile.url;
          if (fileRef.type === 'back') finalUrls.backImage = uploadedFile.url;
          if (fileRef.type === 'insert') finalUrls.insertImage = uploadedFile.url;
          if (fileRef.type === 'record') finalUrls.recordImage = uploadedFile.url;
          if (fileRef.type === 'trackA') finalUrls[`trackA_${fileRef.id}`] = uploadedFile.url;
          if (fileRef.type === 'trackB') finalUrls[`trackB_${fileRef.id}`] = uploadedFile.url;

          if (fileRef.type.startsWith('ex_')) {
            const baseIdx = fileRef.idx * 4;
            if (fileRef.type === 'ex_cover') finalExemplars[baseIdx] = uploadedFile.url;
            if (fileRef.type === 'ex_back') finalExemplars[baseIdx + 1] = uploadedFile.url;
            if (fileRef.type === 'ex_insert') finalExemplars[baseIdx + 2] = uploadedFile.url;
            if (fileRef.type === 'ex_record') finalExemplars[baseIdx + 3] = uploadedFile.url;
          }
        });
      }

      const formattedTracksA = tracksA.map((t, idx) => ({
        id: t.id.toString(), side: t.side, order: idx + 1, name: t.name, artists: t.artists || author, duration: t.duration,
        audioUrl: finalUrls[`trackA_${t.id}`] || t.audioUrl || null
      }));
      const formattedTracksB = tracksB.map((t, idx) => ({
        id: t.id.toString(), side: t.side, order: idx + 1, name: t.name, artists: t.artists || author, duration: t.duration,
        audioUrl: finalUrls[`trackB_${t.id}`] || t.audioUrl || null
      }));

      const payload = {
        type: category, quantity: Number(quantity), title, author, recordLabel, country,
        year: year ? parseInt(year, 10) : null, description: "",
        image: finalUrls.coverImage, backImage: finalUrls.backImage,
        insertImage: finalUrls.insertImage, recordImage: finalUrls.recordImage,
        exemplarImages: finalExemplars,
        tracksA: category === 'vinil' ? formattedTracksA : [],
        tracksB: category === 'vinil' ? formattedTracksB : [],
        revised: false
      };

      const url = editingId ? `${baseUrl}/api/vinis/${editingId}` : `${baseUrl}/api/vinis`;
      const response = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error('Falha ao comunicar com o servidor.');

      alert(`Sucesso! Item histórico ${editingId ? 'atualizado' : 'registrado'} no Acervo.`);

      setTitle(''); setAuthor(''); setYear(''); setQuantity(1); setRecordLabel('');
      setCoverImage(null); setBackImage(null); setInsertImage(null); setRecordImage(null);
      setExistingImages({ cover: null, back: null, insert: null, record: null });
      setTracksA([{ id: String(Date.now()), side: "A", name: "", artists: "", duration: "", audioFile: null }]);
      setTracksB([]);
      setEditingId(null);
      setActiveTab('overview');
      window.location.reload();

    } catch (error) {
      console.error(error);
      alert('Erro ao registrar item: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ backgroundColor: "#f8fafc", minHeight: "100vh", paddingBottom: "3rem" }}>
      <style>
        {`
          .admin-sidebar-btn {
            width: 100%; display: flex; align-items: center; gap: 0.75rem;
            padding: 1rem 1.25rem; border-radius: 1rem;
            font-weight: 700; font-size: 0.95rem; border: none;
            transition: all 0.3s ease; text-align: left; background: transparent; color: #64748b;
          }
          .admin-sidebar-btn:hover { background: rgba(139,0,0,0.05); color: #8b0000; }
          .admin-sidebar-btn.active {
            background: #8b0000; color: white; box-shadow: 0 10px 15px -3px rgba(139,0,0,0.25);
          }
          .admin-header-title { font-size: 2.25rem; font-weight: 900; color: #0f172a; letter-spacing: -0.02em; }
          .custom-table th { background: transparent; color: #94a3b8; font-size: 0.7rem; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; border-bottom: 2px solid #f1f5f9; padding-bottom: 1rem; }
          .custom-table td { vertical-align: middle; padding: 1rem 0; border-bottom: 1px solid #f1f5f9; }
          .item-thumb { width: 45px; height: 45px; border-radius: 0.5rem; object-fit: cover; border: 1px solid #e2e8f0; }
          .action-btn { width: 34px; height: 34px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; background: white; border: 1px solid #e2e8f0; color: #94a3b8; margin-right: 0.5rem; transition: all 0.2s; }
          .action-btn:hover { border-color: #cbd5e1; color: #0f172a; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
          .action-btn.delete:hover { color: #ef4444; border-color: #fca5a5; background: #fef2f2; }
          
          /* Form Styles */
          .form-section { background: white; border-radius: 1.5rem; padding: 2.5rem; border: 1px solid #f1f5f9; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); margin-bottom: 2rem; }
          .form-label { font-size: 0.8rem; font-weight: 800; color: #334155; margin-bottom: 0.5rem; }
          .form-control, .form-select { 
             border-radius: 1rem; padding: 1rem 1.25rem; border: 2px solid #f1f5f9; 
             font-weight: 600; font-size: 0.9rem; color: #475569; background-color: #f8fafc; transition: all 0.2s;
          }
          .form-control::placeholder { color: #cbd5e1; font-weight: 600; }
          .form-control:focus, .form-select:focus { border-color: #8b0000; box-shadow: 0 0 0 4px rgba(139,0,0,0.1); background-color: #ffffff; outline: none; }
          .icon-circle { width: 3.5rem; height: 3.5rem; border-radius: 50%; border: 1px solid #e2e8f0; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
          .qty-btn { width: 3rem; background: transparent; border: none; font-size: 1.25rem; font-weight: bold; color: #8b0000; }
          .qty-btn.minus { color: #64748b; }
          .track-table th { font-size: 0.65rem; color: #94a3b8; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; padding-bottom: 1rem; border-bottom: 1px solid #e2e8f0;}
          .track-table td { padding: 1rem 0; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
          .track-input { background: transparent; border: none; box-shadow: none; font-weight: 700; color: #334155; width: 100%; outline: none; font-size: 0.85rem; }
          .track-input:focus { outline: none; background: transparent; }
          .track-input.author-style { font-style: italic; color: #8b0000; opacity: 0.8; }
          .track-input.time-style { text-align: center; font-family: monospace; letter-spacing: 1px; }
          
          .upload-btn { border-radius: 0.75rem; padding: 0.6rem 1rem; border: 1px solid #e2e8f0; font-size: 0.8rem; font-weight: 700; color: #475569; background: white; transition: all 0.2s; display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; }
          .upload-btn:hover { border-color: #8b0000; color: #8b0000; background: rgba(139,0,0,0.02); }
          
          .media-slot {
            aspect-ratio: 1/1; border: 2px dashed #cbd5e1; border-radius: 1.5rem;
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            transition: all 0.2s; cursor: pointer; color: #94a3b8; background: #f8fafc;
          }
          .media-slot:hover { border-color: #8b0000; color: #8b0000; background: rgba(139,0,0,0.02); transform: translateY(-4px); }
          .media-slot .slot-title { font-size: 0.65rem; font-weight: 900; letter-spacing: 0.05em; text-transform: uppercase; margin-top: 1rem; }
          
          /* Custom Buttons */
          .btn-outline-custom { background-color: white !important; border: 2px solid #e2e8f0 !important; color: #475569 !important; transition: all 0.2s; }
          .btn-outline-custom:hover { border-color: #cbd5e1 !important; background-color: #f8fafc !important; color: #0f172a !important; }
          .btn-primary-custom { background-color: #8b0000 !important; border: none !important; color: white !important; transition: all 0.2s; }
          .btn-primary-custom:hover { background-color: #a00000 !important; transform: translateY(-2px); box-shadow: 0 4px 10px rgba(139,0,0,0.3) !important; text-decoration: none; color: white !important; }
        `}
      </style>

      <Container fluid="xl" className="pt-5">
        {activeTab === 'overview' ? (
          <div className="mb-5">
            <h2 className="admin-header-title">Painel Administrativo</h2>
            <p className="text-muted" style={{ fontSize: "1.05rem" }}>Gerencie o acervo e insira novos dados técnicos para a preservação histórica digital.</p>
          </div>
        ) : (
          <div className="mb-4 d-flex align-items-center justify-content-between flex-wrap gap-3">
            <div>
              <h2 className="admin-header-title">{editingId ? 'Editar Registro' : 'Novo Registro'}</h2>
              <p className="text-muted" style={{ fontSize: "1.05rem" }}>{editingId ? `Editando o item #${String(editingId).split('-')[0]}` : 'Preencha os dados abaixo.'}</p>
            </div>
            <div className="d-flex gap-3">
              <Button className="btn-outline-custom rounded-4 fw-bold" onClick={() => { setActiveTab('overview'); setEditingId(null); }} style={{ padding: "0.8rem 1.5rem" }}>Cancelar e Voltar</Button>
              {podeAdicionar && (!editingId || podeEditar) && (
                <Button disabled={isSubmitting} className="btn-primary-custom rounded-4 fw-bold" onClick={handleSubmit} style={{ padding: "0.8rem 1.5rem" }}>
                  {isSubmitting ? 'Salvando...' : editingId ? 'Salvar Edição' : 'Registrar Disco de Vinil'}
                </Button>
              )}
            </div>
          </div>
        )}

        <Row className="g-4">
          <Col lg={3}>
            <div className="d-flex flex-column gap-2 pe-lg-3">
              <div className="text-muted fw-bold text-uppercase mb-2 ms-2" style={{ fontSize: "0.65rem", letterSpacing: "1px" }}>Painel de Gestão</div>
              <button className={`admin-sidebar-btn ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => { setActiveTab('overview'); setEditingId(null); }}><LayoutDashboard size={20} /> Visão Geral</button>

              {podeAdicionar && (
                <button className={`admin-sidebar-btn ${activeTab === 'new' && !editingId ? 'active' : ''}`} onClick={handleNovoCadastroClick}><PlusSquare size={20} /> Novo Cadastro</button>
              )}

              {editingId && podeEditar && (
                <button className="admin-sidebar-btn active" onClick={() => { }}><Edit2 size={20} /> Editar Registro</button>
              )}
            </div>
          </Col>

          <Col lg={9}>
            {activeTab === 'overview' && (
              (isCurador && categoriasPermitidas.length === 0) ? (
                <div className="bg-white rounded-5 p-5 shadow-sm border border-light text-center">
                  <div className="icon-circle mx-auto mb-4" style={{ width: '80px', height: '80px', backgroundColor: 'rgba(139,0,0,0.05)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}>
                    <ShieldCheck size={40} color="#8b0000" />
                  </div>
                  <h4 className="fw-bold text-dark mb-3">Acesso de Gestão Restrito</h4>
                  <p className="text-muted mx-auto" style={{ maxWidth: '500px', fontSize: '1.1rem' }}>
                    Favor entre em contato com a administração. Você ainda não tem categorias de itens (Vinil, CDs, etc) liberadas no seu nível de Curador para gerir o Acervo.
                  </p>
                  <Button className="btn-primary-custom rounded-pill px-5 py-2 mt-2" onClick={() => navigate("/acesso-interno")}>
                    Voltar ao Painel Interno
                  </Button>
                </div>
              ) : (
                <div className="bg-white rounded-5 p-4 shadow-sm border border-light">
                  <div className="d-flex flex-wrap align-items-center justify-content-between mb-4 gap-3">
                    <div className="d-flex align-items-center gap-3">
                      <div className="d-flex align-items-center justify-content-center rounded-3 bg-light" style={{ width: '48px', height: '48px' }}>
                        <LayoutDashboard color="#8b0000" />
                      </div>
                      <div>
                        <h4 className="fw-bold mb-0 text-dark">Itens Catalogados</h4>
                        <div className="text-muted" style={{ fontSize: "0.85rem" }}>Visão geral do acervo completo cadastrado.</div>
                      </div>
                    </div>
                    <div className="d-flex flex-wrap gap-2 flex-grow-1 justify-content-lg-end mt-3 mt-lg-0">
                      <InputGroup style={{ maxWidth: '250px' }}>
                        <InputGroup.Text className="bg-white text-muted border-end-0 rounded-start-pill ps-3"><Search size={16} /></InputGroup.Text>
                        <Form.Control placeholder="Buscar item..." className="border-start-0 rounded-end-pill shadow-none" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ fontSize: "0.9rem" }} />
                      </InputGroup>
                      <Form.Select className="rounded-pill shadow-sm border-light text-muted fw-bold" style={{ maxWidth: '200px', fontSize: '0.85rem', cursor: 'pointer' }} value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
                        <option value="Todas as Categorias">Filtro: Todas as Categorias</option>
                        <option value="Discos de Vinil">Discos de Vinil</option>
                        <option value="Livros">Livros</option>
                        <option value="Áudios / CDs">Áudios / CDs</option>
                        <option value="Documentos">Documentos</option>
                      </Form.Select>
                      <Form.Select className="rounded-pill shadow-sm border-light text-muted fw-bold" style={{ maxWidth: '180px', fontSize: '0.85rem', cursor: 'pointer' }} value={filterSort} onChange={(e) => setFilterSort(e.target.value)}>
                        <option value="recentes">Data: Mais Recentes</option>
                        <option value="antigos">Data: Mais Antigos</option>
                        <option value="az">Ordem: A - Z</option>
                        <option value="qtdDesc">Qtd: Maior p/ Menor</option>
                      </Form.Select>
                    </div>
                  </div>

                  {loading ? (
                    <div className="text-center py-5"><Spinner animation="grow" style={{ color: "#8b0000" }} /></div>
                  ) : (
                    <div className="table-responsive">
                      <Table hover className="custom-table align-middle">
                        <thead>
                          <tr>
                            <th style={{ width: '50%' }}>Item Catalografado</th>
                            <th style={{ width: '15%' }}>Categoria</th>
                            <th className="text-center">Ano</th>
                            <th className="text-center">Qtd</th>
                            <th className="text-end pe-3">Ações</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredItems.map(item => (
                            <tr key={item.id}>
                              <td>
                                <div className="d-flex align-items-center gap-3">
                                  <img src={item.image || FALLBACK_IMAGE} className="item-thumb shadow-sm" alt="" />
                                  <div>
                                    <div className="fw-bold text-dark d-flex align-items-center gap-2" style={{ fontSize: "0.95rem" }}>
                                      {item.title}
                                      {(item.image && !item.recordImage) && (
                                        <span title="Alerta: Este item possui foto de capa, mas a foto do Disco/Mídia está ausente.">
                                          <AlertTriangle size={16} className="text-warning" />
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-muted" style={{ fontSize: "0.75rem", fontWeight: 600 }}>{item.author}</div>
                                  </div>
                                </div>
                              </td>
                              <td>
                                <Badge bg="" style={{ backgroundColor: "rgba(139,0,0,0.1)", color: "#8b0000", padding: "0.4rem 0.6rem", fontSize: "0.65rem", letterSpacing: "1px" }} className="rounded-pill text-uppercase">
                                  {item.type === 'vinil' ? 'Discos de Vinil' : item.type}
                                </Badge>
                              </td>
                              <td className="text-center fw-bold text-dark">{item.year || '-'}</td>
                              <td className="text-center fw-bold text-dark">{item.quantity || '1'}</td>
                              <td className="text-end pe-2" style={{ whiteSpace: "nowrap" }}>
                                <button className="action-btn" title="Visualizar" onClick={() => navigate(`/acervo/${item.type || 'vinil'}/${item.id}`)}><Eye size={16} /></button>
                                {podeEditar && (
                                  <button className="action-btn" title="Editar" onClick={() => handleEdit(item.id)}><Edit2 size={16} /></button>
                                )}
                                {podeApagar && (
                                  <button className="action-btn delete" title="Excluir Definitivamente" onClick={() => setItemDeleteConfirm({ visible: true, item: item })}><Trash2 size={16} /></button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  )}
                </div>
              )
            )}

            {activeTab === 'new' && (
              (isCurador && categoriasPermitidas.length === 0) ? (
                <div className="bg-white rounded-5 p-5 shadow-sm border border-light text-center">
                  <div className="icon-circle mx-auto mb-4" style={{ width: '80px', height: '80px', backgroundColor: 'rgba(139,0,0,0.05)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}>
                    <ShieldCheck size={40} color="#8b0000" />
                  </div>
                  <h4 className="fw-bold text-dark mb-3">Sem Categrias Autorizadas</h4>
                  <p className="text-muted mx-auto" style={{ maxWidth: '500px', fontSize: '1.1rem' }}>
                    Favor entrar em contato com a administração. Você ainda não tem acesso para poder editar ou cadastrar este item, ou precisa de categorias (Vinil, CD, etc) liberadas no seu perfil.
                  </p>
                  <Button className="btn-primary-custom rounded-pill px-4 mt-2" onClick={() => setActiveTab('overview')}>
                    Voltar para Visão Geral
                  </Button>
                </div>
              ) : (editingId && !podeEditar) ? (
                <div className="bg-white rounded-5 p-5 shadow-sm border border-light text-center">
                  <div className="icon-circle mx-auto mb-4" style={{ width: '80px', height: '80px', backgroundColor: 'rgba(139,0,0,0.05)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}>
                    <AlertTriangle size={40} color="#8b0000" />
                  </div>
                  <h4 className="fw-bold text-dark mb-3">Permissão de Edição Restrita</h4>
                  <p className="text-muted mx-auto" style={{ maxWidth: '500px', fontSize: '1.1rem' }}>
                    Favor entrar em contato com a administração. Você ainda não tem nível de acesso "Editor" para poder alterar registros existentes do acervo.
                  </p>
                  <Button className="btn-primary-custom rounded-pill px-4 mt-2" onClick={() => { setActiveTab('overview'); setEditingId(null); }}>
                    Voltar para Visão Geral
                  </Button>
                </div>
              ) : (
                <Form onSubmit={handleSubmit}>
                  {/* Seção 1: Dados Principais */}
                  <div className="form-section">
                    <div className="d-flex align-items-center gap-3 mb-5">
                      <div className="icon-circle"><Info size={22} style={{ color: "#8b0000" }} /></div>
                      <div>
                        <h4 className="fw-bold mb-1" style={{ fontSize: "1.25rem" }}>Dados Principais</h4>
                        <p className="text-muted mb-0" style={{ fontSize: "0.85rem" }}>Identificação inicial da obra ou artefato</p>
                      </div>
                    </div>

                    <Row className="g-4 mb-4">
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="form-label">Categoria do Arquivo</Form.Label>
                          <Form.Select value={category} onChange={(e) => setCategory(e.target.value)}>
                            {categoriasPermitidas.includes('vinil') && <option value="vinil">Disco de Vinil (LP)</option>}
                            {categoriasPermitidas.includes('cd') && <option value="cd">Áudio / CD</option>}
                            {categoriasPermitidas.includes('livro') && <option value="livro">Livro / Publicação</option>}
                            {categoriasPermitidas.includes('documento') && <option value="documento">Documento</option>}
                            {categoriasPermitidas.length === 0 && <option value="" disabled>Nenhuma categoria permitida</option>}
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="form-label">Título ou Nome</Form.Label>
                          <Form.Control placeholder="Título descritivo" value={title} onChange={(e) => setTitle(e.target.value)} />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="form-label">Autor / Mestre / Artista</Form.Label>
                          <Form.Control placeholder="Ex: Mestre Bimba" value={author} onChange={(e) => setAuthor(e.target.value)} />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="form-label">Gravadora</Form.Label>
                          <Form.Control placeholder="Ex: RCA Victor" value={recordLabel} onChange={(e) => setRecordLabel(e.target.value)} />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="form-label">País</Form.Label>
                          <Form.Select value={country} onChange={(e) => setCountry(e.target.value)}>
                            <option value="Brasil">Brasil</option>
                            <option value="Uruguai">Uruguai</option>
                            <option value="EUA">EUA</option>
                            <option value="França">França</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="form-label">Ano</Form.Label>
                          <Form.Control placeholder="Ex: 1960" type="number" value={year} onChange={(e) => setYear(e.target.value)} />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="form-label">Faixas (Lado A)</Form.Label>
                          <Form.Control type="number" min="0" value={trackCountA} onChange={(e) => handleTrackCountA(e.target.value)} />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="form-label">Faixas (Lado B)</Form.Label>
                          <Form.Control type="number" min="0" value={trackCountB} onChange={(e) => handleTrackCountB(e.target.value)} />
                        </Form.Group>
                      </Col>
                    </Row>

                    <Form.Group>
                      <Form.Label className="form-label">Quantidade em Acervo</Form.Label>
                      <div className="d-flex align-items-center justify-content-between px-3 py-2 rounded-4" style={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0" }}>
                        <button type="button" className="qty-btn minus" onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</button>
                        <span className="fw-bold fs-5 text-dark">{quantity}</span>
                        <button type="button" className="qty-btn" onClick={() => setQuantity(quantity + 1)}>+</button>
                      </div>
                    </Form.Group>
                  </div>

                  {/* Seção 2: Lista de Faixas Dinâmicas */}
                  {(tracksA.length > 0 || tracksB.length > 0) && (
                    <div className="form-section">
                      <div className="d-flex align-items-center gap-3 mb-5">
                        <div className="icon-circle"><Music size={22} style={{ color: "#8b0000" }} /></div>
                        <div>
                          <h4 className="fw-bold mb-1" style={{ fontSize: "1.25rem" }}>Lista de Faixas</h4>
                          <p className="text-muted mb-0" style={{ fontSize: "0.85rem" }}>Registro das músicas e toques do álbum</p>
                        </div>
                      </div>

                      <Table borderless className="track-table w-100">
                        <thead>
                          <tr>
                            <th style={{ width: '6%' }}>ORD.</th>
                            <th style={{ width: '28%' }}>NOME DO TOQUE</th>
                            <th style={{ width: '30%' }}>AUTOR / MESTRE / ARTISTA</th>
                            <th style={{ width: '10%' }}>DURAÇÃO</th>
                            <th style={{ width: '20%' }} className="text-center">ARQUIVO DE ÁUDIO</th>
                            <th className="text-end">AÇÃO</th>
                          </tr>
                        </thead>
                        <tbody>
                          {tracksA.length > 0 && (
                            <tr>
                              <td colSpan={6} className="text-center font-monospace fw-bold py-4 text-dark" style={{ letterSpacing: "1px", fontSize: "0.8rem", color: "#8b0000" }}>LADO A</td>
                            </tr>
                          )}
                          {tracksA.map((track, idx) => (
                            <tr key={track.id}>
                              <td className="text-dark fw-black fs-6 align-middle ps-1">
                                {String(idx + 1).padStart(2, '0')}
                              </td>
                              <td><input className="track-input" placeholder="Nome do toque..." value={track.name} onChange={(e) => updateTrackA(track.id, 'name', e.target.value)} /></td>
                              <td><input className="track-input author-style" placeholder={author || "Autor / Mestre / Artista"} value={track.artists || ''} onChange={(e) => updateTrackA(track.id, 'artists', e.target.value)} /></td>
                              <td><input className="track-input time-style" placeholder="00:00" maxLength="5" value={track.duration} onChange={(e) => updateTrackA(track.id, 'duration', handleTimeFormat(e.target.value))} /></td>
                              <td className="text-center align-middle relative">
                                <input type="file" accept="audio/*" id={`audio-A-${track.id}`} className="d-none" onChange={(e) => {
                                  if (e.target.files && e.target.files.length > 0) {
                                    const file = e.target.files[0];
                                    updateTrackA(track.id, 'audioFile', file);
                                    const tempAudio = new Audio(URL.createObjectURL(file));
                                    tempAudio.onloadedmetadata = () => {
                                      const m = Math.floor(tempAudio.duration / 60);
                                      const s = Math.floor(tempAudio.duration % 60);
                                      updateTrackA(track.id, 'duration', `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
                                    };
                                  }
                                }} />
                                <label htmlFor={`audio-A-${track.id}`} className="upload-btn mb-0" style={track.audioFile ? { borderColor: '#10b981', color: '#10b981', background: 'rgba(16,185,129,0.05)' } : {}}>
                                  {track.audioFile ? <><Music size={14} /> <span className="text-truncate" style={{ maxWidth: '80px' }}>{track.audioFile.name}</span></> : <><Upload size={14} /> Enviar MP3</>}
                                </label>
                              </td>
                              <td className="text-end pe-0">
                                <Button variant="light" size="sm" className="text-danger rounded-circle" style={{ width: '32px', height: '32px' }} onClick={() => removeTrackA(track.id)}><Trash2 size={14} /></Button>
                              </td>
                            </tr>
                          ))}

                          {tracksB.length > 0 && (
                            <tr>
                              <td colSpan={6} className="text-center font-monospace fw-bold py-4 text-dark" style={{ letterSpacing: "1px", fontSize: "0.8rem", color: "#8b0000" }}>LADO B</td>
                            </tr>
                          )}
                          {tracksB.map((track, idx) => (
                            <tr key={track.id}>
                              <td className="text-dark fw-black fs-6 align-middle ps-1">
                                {String(idx + 1).padStart(2, '0')}
                              </td>
                              <td><input className="track-input" placeholder="Nome do toque..." value={track.name} onChange={(e) => updateTrackB(track.id, 'name', e.target.value)} /></td>
                              <td><input className="track-input author-style" placeholder={author || "Autor / Mestre / Artista"} value={track.artists || ''} onChange={(e) => updateTrackB(track.id, 'artists', e.target.value)} /></td>
                              <td><input className="track-input time-style" placeholder="00:00" maxLength="5" value={track.duration} onChange={(e) => updateTrackB(track.id, 'duration', handleTimeFormat(e.target.value))} /></td>
                              <td className="text-center align-middle relative">
                                <input type="file" accept="audio/*" id={`audio-B-${track.id}`} className="d-none" onChange={(e) => {
                                  if (e.target.files && e.target.files.length > 0) {
                                    const file = e.target.files[0];
                                    updateTrackB(track.id, 'audioFile', file);
                                    const tempAudio = new Audio(URL.createObjectURL(file));
                                    tempAudio.onloadedmetadata = () => {
                                      const m = Math.floor(tempAudio.duration / 60);
                                      const s = Math.floor(tempAudio.duration % 60);
                                      updateTrackB(track.id, 'duration', `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
                                    };
                                  }
                                }} />
                                <label htmlFor={`audio-B-${track.id}`} className="upload-btn mb-0" style={track.audioFile ? { borderColor: '#10b981', color: '#10b981', background: 'rgba(16,185,129,0.05)' } : {}}>
                                  {track.audioFile ? <><Music size={14} /> <span className="text-truncate" style={{ maxWidth: '80px' }}>{track.audioFile.name}</span></> : <><Upload size={14} /> Enviar MP3</>}
                                </label>
                              </td>
                              <td className="text-end pe-0">
                                <Button variant="light" size="sm" className="text-danger rounded-circle" style={{ width: '32px', height: '32px' }} onClick={() => removeTrackB(track.id)}><Trash2 size={14} /></Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  )}

                  {/* Seção 3: Imagens Visuais */}
                  <div className="form-section">
                    <div className="d-flex align-items-center gap-3 mb-5">
                      <div className="icon-circle"><ImageIcon size={22} style={{ color: "#8b0000" }} /></div>
                      <div>
                        <h4 className="fw-bold mb-1" style={{ fontSize: "1.25rem" }}>Mídia Visual</h4>
                        <p className="text-muted mb-0" style={{ fontSize: "0.85rem" }}>Fotos da capa, encartes ou artefato</p>
                      </div>
                    </div>

                    <Row className="g-4">
                      <Col xs={6} md={3}>
                        <div className="position-relative">
                          <label className="media-slot w-100 position-relative overflow-hidden mb-0">
                            {coverImage || existingImages.cover ? <img src={coverImage ? URL.createObjectURL(coverImage) : existingImages.cover} className="position-absolute w-100 h-100 top-0 start-0" style={{ objectFit: 'cover' }} alt="Capa" /> : <><Upload size={24} /><div className="slot-title">Capa Principal</div></>}
                            <input type="file" accept="image/*" className="d-none" onChange={(e) => e.target.files && setCoverImage(e.target.files[0])} />
                          </label>
                          {(coverImage || existingImages.cover) && (
                            <button type="button" onClick={() => triggerImageDeletion(existingImages.cover, 'cover')} className="position-absolute top-0 start-100 translate-middle badge rounded-circle bg-danger border-0 p-2 shadow" style={{ zIndex: 5 }}>&times;</button>
                          )}
                        </div>
                      </Col>
                      <Col xs={6} md={3}>
                        <div className="position-relative">
                          <label className="media-slot w-100 position-relative overflow-hidden mb-0">
                            {backImage || existingImages.back ? <img src={backImage ? URL.createObjectURL(backImage) : existingImages.back} className="position-absolute w-100 h-100 top-0 start-0" style={{ objectFit: 'cover' }} alt="Contracapa" /> : <><Upload size={24} /><div className="slot-title">Contracapa</div></>}
                            <input type="file" accept="image/*" className="d-none" onChange={(e) => e.target.files && setBackImage(e.target.files[0])} />
                          </label>
                          {(backImage || existingImages.back) && (
                            <button type="button" onClick={() => triggerImageDeletion(existingImages.back, 'back')} className="position-absolute top-0 start-100 translate-middle badge rounded-circle bg-danger border-0 p-2 shadow" style={{ zIndex: 5 }}>&times;</button>
                          )}
                        </div>
                      </Col>
                      <Col xs={6} md={3}>
                        <div className="position-relative">
                          <label className="media-slot w-100 position-relative overflow-hidden mb-0">
                            {insertImage || existingImages.insert ? <img src={insertImage ? URL.createObjectURL(insertImage) : existingImages.insert} className="position-absolute w-100 h-100 top-0 start-0" style={{ objectFit: 'cover' }} alt="Encarte" /> : <><Upload size={24} /><div className="slot-title">Encarte / Detalhes</div></>}
                            <input type="file" accept="image/*" className="d-none" onChange={(e) => e.target.files && setInsertImage(e.target.files[0])} />
                          </label>
                          {(insertImage || existingImages.insert) && (
                            <button type="button" onClick={() => triggerImageDeletion(existingImages.insert, 'insert')} className="position-absolute top-0 start-100 translate-middle badge rounded-circle bg-danger border-0 p-2 shadow" style={{ zIndex: 5 }}>&times;</button>
                          )}
                        </div>
                      </Col>
                      <Col xs={6} md={3}>
                        <div className="position-relative">
                          <label className="media-slot w-100 position-relative overflow-hidden mb-0" style={(recordImage || existingImages.record) ? {} : { borderColor: "#8b0000", color: "#8b0000", background: "rgba(139,0,0,0.02)" }}>
                            {recordImage || existingImages.record ? <img src={recordImage ? URL.createObjectURL(recordImage) : existingImages.record} className="position-absolute w-100 h-100 top-0 start-0" style={{ objectFit: 'cover' }} alt="Disco" /> : <><Disc size={24} /><div className="slot-title">Disco Físico #1</div></>}
                            <input type="file" accept="image/*" className="d-none" onChange={(e) => e.target.files && setRecordImage(e.target.files[0])} />
                          </label>
                          {(recordImage || existingImages.record) && (
                            <button type="button" onClick={() => triggerImageDeletion(existingImages.record, 'record')} className="position-absolute top-0 start-100 translate-middle badge rounded-circle bg-danger border-0 p-2 shadow" style={{ zIndex: 5 }}>&times;</button>
                          )}
                        </div>
                      </Col>
                    </Row>

                    {exemplars.map((ex, idx) => (
                      <div key={idx} className="mt-5 border-top pt-4">
                        <div className="d-flex align-items-center gap-2 mb-4">
                          <div className="text-muted fw-bold text-uppercase" style={{ fontSize: "0.85rem", letterSpacing: "1px" }}>
                            Cópia Física (Exemplar #{idx + 2})
                          </div>
                        </div>

                        <Row className="g-4">
                          <Col xs={6} md={3}>
                            <div className="position-relative">
                              <label className="media-slot w-100 position-relative overflow-hidden mb-0">
                                {ex.cover ? <img src={typeof ex.cover === 'string' ? ex.cover : URL.createObjectURL(ex.cover)} className="position-absolute w-100 h-100 top-0 start-0" style={{ objectFit: 'cover' }} alt={`Capa ${idx + 2}`} /> : <><Upload size={24} /><div className="slot-title">Capa #{idx + 2}</div></>}
                                <input type="file" accept="image/*" className="d-none" onChange={(e) => e.target.files && setExemplars(prev => prev.map((item, i) => i === idx ? { ...item, cover: e.target.files[0] } : item))} />
                              </label>
                              {ex.cover && (
                                <button type="button" onClick={() => triggerImageDeletion(ex.cover, `ex_cover_${idx}`)} className="position-absolute top-0 start-100 translate-middle badge rounded-circle bg-danger border-0 p-2 shadow" style={{ zIndex: 5 }}>&times;</button>
                              )}
                            </div>
                          </Col>
                          <Col xs={6} md={3}>
                            <div className="position-relative">
                              <label className="media-slot w-100 position-relative overflow-hidden mb-0">
                                {ex.back ? <img src={typeof ex.back === 'string' ? ex.back : URL.createObjectURL(ex.back)} className="position-absolute w-100 h-100 top-0 start-0" style={{ objectFit: 'cover' }} alt={`Contracapa ${idx + 2}`} /> : <><Upload size={24} /><div className="slot-title">Contracapa #{idx + 2}</div></>}
                                <input type="file" accept="image/*" className="d-none" onChange={(e) => e.target.files && setExemplars(prev => prev.map((item, i) => i === idx ? { ...item, back: e.target.files[0] } : item))} />
                              </label>
                              {ex.back && (
                                <button type="button" onClick={() => triggerImageDeletion(ex.back, `ex_back_${idx}`)} className="position-absolute top-0 start-100 translate-middle badge rounded-circle bg-danger border-0 p-2 shadow" style={{ zIndex: 5 }}>&times;</button>
                              )}
                            </div>
                          </Col>
                          <Col xs={6} md={3}>
                            <div className="position-relative">
                              <label className="media-slot w-100 position-relative overflow-hidden mb-0">
                                {ex.insert ? <img src={typeof ex.insert === 'string' ? ex.insert : URL.createObjectURL(ex.insert)} className="position-absolute w-100 h-100 top-0 start-0" style={{ objectFit: 'cover' }} alt={`Encarte ${idx + 2}`} /> : <><Upload size={24} /><div className="slot-title">Encarte #{idx + 2}</div></>}
                                <input type="file" accept="image/*" className="d-none" onChange={(e) => e.target.files && setExemplars(prev => prev.map((item, i) => i === idx ? { ...item, insert: e.target.files[0] } : item))} />
                              </label>
                              {ex.insert && (
                                <button type="button" onClick={() => triggerImageDeletion(ex.insert, `ex_insert_${idx}`)} className="position-absolute top-0 start-100 translate-middle badge rounded-circle bg-danger border-0 p-2 shadow" style={{ zIndex: 5 }}>&times;</button>
                              )}
                            </div>
                          </Col>
                          <Col xs={6} md={3}>
                            <div className="position-relative">
                              <label className="media-slot w-100 position-relative overflow-hidden mb-0">
                                {ex.record ? <img src={typeof ex.record === 'string' ? ex.record : URL.createObjectURL(ex.record)} className="position-absolute w-100 h-100 top-0 start-0" style={{ objectFit: 'cover' }} alt={`Disco ${idx + 2}`} /> : <><Disc size={24} /><div className="slot-title">Disco #{idx + 2}</div></>}
                                <input type="file" accept="image/*" className="d-none" onChange={(e) => e.target.files && setExemplars(prev => prev.map((item, i) => i === idx ? { ...item, record: e.target.files[0] } : item))} />
                              </label>
                              {ex.record && (
                                <button type="button" onClick={() => triggerImageDeletion(ex.record, `ex_record_${idx}`)} className="position-absolute top-0 start-100 translate-middle badge rounded-circle bg-danger border-0 p-2 shadow" style={{ zIndex: 5 }}>&times;</button>
                              )}
                            </div>
                          </Col>
                        </Row>
                      </div>
                    ))}
                  </div>
                </Form>
              )
            )}
          </Col>
        </Row>
      </Container>

      <Modal show={itemDeleteConfirm.visible} onHide={() => !isSubmitting && setItemDeleteConfirm({ visible: false, item: null })} centered>
        <Modal.Header closeButton={!isSubmitting} className="border-0">
          <Modal.Title className="fw-bold" style={{ color: "#8b0000" }}>Aviso Gravíssimo de Exclusão</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-secondary fw-semibold">
          Você está prestes a apagar completamente <strong className="text-dark">"{itemDeleteConfirm.item?.title}"</strong> do Banco de Dados. E não é só isso: todas as fotos da capa, encartes, cópias e faixas de MP3 associados serão DELETADOS do Azure Storage permanentemente.<br /><br />
          Esta ação é destrutiva e as mídias não poderão ser recuperadas. Tem certeza absoluta que deseja destruir este item e todas as suas médias contidas na nuvem?
        </Modal.Body>
        <Modal.Footer className="border-0">
          <Button variant="light" className="fw-bold px-4 rounded-pill" onClick={() => setItemDeleteConfirm({ visible: false, item: null })} disabled={isSubmitting}>Cancelar</Button>
          <Button variant="danger" className="fw-bold px-4 rounded-pill shadow-sm" onClick={executeItemDeletion} disabled={isSubmitting}>
            {isSubmitting ? <Spinner size="sm" /> : 'Sim, Apagar Conteúdo Definitivamente'}
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={imageDeleteConfirm.visible} onHide={() => !isSubmitting && setImageDeleteConfirm({ visible: false, url: null, field: null })} centered>
        <Modal.Header closeButton={!isSubmitting} className="border-0">
          <Modal.Title className="fw-bold" style={{ color: "#8b0000" }}>Aviso de Exclusão</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-secondary fw-semibold">
          Você está prestes a apagar essa imagem definitivamente do Azure Storage (Nuvem). Esta ação é permanente e não poderá ser desfeita. Tem certeza que deseja remover?
        </Modal.Body>
        <Modal.Footer className="border-0">
          <Button variant="light" className="fw-bold px-4 rounded-pill" onClick={() => setImageDeleteConfirm({ visible: false, url: null, field: null })} disabled={isSubmitting}>Cancelar</Button>
          <Button variant="danger" className="fw-bold px-4 rounded-pill shadow-sm" onClick={handleDeleteImagePermanent} disabled={isSubmitting}>
            {isSubmitting ? <Spinner size="sm" /> : 'Sim, Excluir da Nuvem'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
