import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import {
    Globe, Building2, User, Phone, MapPin,
    Briefcase, Map, Copy, ExternalLink, Loader2, Search,
    Zap, CheckCircle2, XCircle, Clock, LayoutTemplate,
    Scale, HardHat, Store, HeartPulse, ChevronRight,
    ArrowLeft, Sparkles, BarChart3, Instagram,
} from 'lucide-react';
import { getTemplate } from '@/lib/templates';
import { orchestrateSiteGeneration, type OrchestrationResult } from '@/lib/skills/siteOrchestrator';
import { SiteEditor } from '@/components/site-builder/SiteEditor';
import { LogoUploader, type LogoColors } from '@/components/site-builder/LogoUploader';
import { InstagramFetcher, type InstagramPost } from '@/components/site-builder/InstagramFetcher';
import type { ClientData, FilledSlots } from '@/lib/templates/types';

const CATEGORIES = [
    { id: 'all', label: 'Todos os Templates', icon: LayoutTemplate },
    { id: 'advocacia', label: 'Advocacia', icon: Scale },
    { id: 'engenharia', label: 'Engenharia', icon: HardHat },
    { id: 'saude', label: 'Saúde', icon: HeartPulse },
    { id: 'varejo', label: 'Varejo', icon: Store },
];

const TEMPLATES = [
    { id: 'advocacia', label: 'Advocacia Classic', category: 'advocacia', color: '#b45309', desc: 'Design tradicional e sóbrio', thumbnail: '/thumbnails/advocacia.png', hasSkills: true },
    { id: 'advocacia_premium', label: 'Advocacia Premium', category: 'advocacia', color: '#92400e', desc: 'Elegância e exclusividade', thumbnail: '/thumbnails/advocacia.png', hasSkills: false },
    { id: 'consultoria_juridica', label: 'Consultoria Jurídica', category: 'advocacia', color: '#1e40af', desc: 'Foco em prevenção e compliance', thumbnail: '/thumbnails/advocacia.png', hasSkills: false },
    { id: 'advocacia_moderna', label: 'Advocacia Digital', category: 'advocacia', color: '#60a5fa', desc: 'Inovação e tecnologia jurídica', thumbnail: '/thumbnails/advocacia.png', hasSkills: false },
    { id: 'construcao', label: 'Construção Civil', category: 'engenharia', color: '#D97706', desc: 'Foco em obras e empreiteiras', thumbnail: '/thumbnails/engenharia.png', hasSkills: false },
    { id: 'engenharia_premium', label: 'Engenharia Premium', category: 'engenharia', color: '#ea580c', desc: 'Alta performance estrutural', thumbnail: '/thumbnails/engenharia.png', hasSkills: true },
    { id: 'obras_e_projetos', label: 'Obras & Projetos', category: 'engenharia', color: '#111827', desc: 'Gerenciamento completo', thumbnail: '/thumbnails/engenharia.png', hasSkills: false },
    { id: 'engenharia_estrutural', label: 'Engenharia Estrutural', category: 'engenharia', color: '#000000', desc: 'Cálculos e precisão técnica', thumbnail: '/thumbnails/engenharia.png', hasSkills: false },
    { id: 'saude', label: 'Saúde & Bem-estar', category: 'saude', color: '#0ea5e9', desc: 'Clínicas e consultórios', thumbnail: '/thumbnails/saude.png', hasSkills: false },
    { id: 'varejo', label: 'Varejo & E-commerce', category: 'varejo', color: '#7c3aed', desc: 'Lojas e comércio em geral', thumbnail: '/thumbnails/varejo.png', hasSkills: false },
];

interface GeneratedResult {
    company: string;
    url: string;
    status: 'success' | 'error';
    error?: string;
}

interface LeadFromSearch {
    name: string;
    phone: string;
    address: string;
    selected: boolean;
}

type PageView = 'generator' | 'editor';

export default function GeneratorPage() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'manual' | 'batch'>('manual');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedTemplate, setSelectedTemplate] = useState('engenharia_premium');
    const [generatedSite, setGeneratedSite] = useState<{ url: string; id: string } | null>(null);
    const [progressMsg, setProgressMsg] = useState('');
    const [progressPct, setProgressPct] = useState(0);

    // Editor state
    const [pageView, setPageView] = useState<PageView>('generator');
    const [editorResult, setEditorResult] = useState<OrchestrationResult | null>(null);

    // Logo + cores
    const [logoColors, setLogoColors] = useState<LogoColors>({ primary: '#ea580c', secondary: '#ff6020' });
    const [hasLogoColors, setHasLogoColors] = useState(false);

    // Instagram
    const [instagramHandle, setInstagramHandle] = useState('');
    const [instagramPosts, setInstagramPosts] = useState<InstagramPost[]>([]);

    // Manual form
    const [formData, setFormData] = useState<ClientData>({
        company_name: '',
        owner_name: '',
        phone: '',
        address: '',
        logo_url: '',
        niche: 'Construção Civil',
        region: 'Oeste da Bahia',
        description: '',
    });

    // Search / Batch
    const [searchQuery, setSearchQuery] = useState('');
    const [searchKey, setSearchKey] = useState('');
    const [searching, setSearching] = useState(false);
    const [leads, setLeads] = useState<LeadFromSearch[]>([]);
    const [batchProgress, setBatchProgress] = useState(0);
    const [batchTotal, setBatchTotal] = useState(0);
    const [batchRunning, setBatchRunning] = useState(false);
    const [batchResults, setBatchResults] = useState<GeneratedResult[]>([]);

    const filteredTemplates = selectedCategory === 'all'
        ? TEMPLATES
        : TEMPLATES.filter(t => t.category === selectedCategory);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Geração com Skills (nova engine)
    const handleSkillGenerate = async () => {
        if (!formData.company_name) return;
        setLoading(true);
        setProgressMsg('Iniciando...');
        setProgressPct(0);

        try {
            const result = await orchestrateSiteGeneration(
                selectedTemplate,
                formData,
                (step, pct) => {
                    setProgressMsg(step);
                    setProgressPct(pct);
                },
                {
                    logoColors: hasLogoColors ? logoColors : undefined,
                    instagramPosts,
                    instagramHandle,
                }
            );

            setEditorResult(result);
            setPageView('editor');

            toast({
                title: 'Site gerado com Skills!',
                description: `${result.stats.totalCalls} skills executadas em ${result.stats.timeMs}ms (~${result.stats.totalTokens} tokens)`,
            });
        } catch (err: any) {
            toast({ title: 'Erro na geração', description: err.message, variant: 'destructive' });
        } finally {
            setLoading(false);
            setProgressMsg('');
            setProgressPct(0);
        }
    };

    // Geração legada (servidor externo)
    const handleLegacyGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setGeneratedSite(null);
        try {
            const response = await fetch('http://localhost:3500/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...formData, template: selectedTemplate }),
            });
            if (!response.ok) throw new Error('Erro ao comunicar com o servidor gerador.');
            const data = await response.json();
            if (data.site_url) {
                setGeneratedSite({ url: data.site_url, id: data.site_id });
                toast({ title: 'Site Gerado!', description: `Pronto para ${formData.company_name}.` });
            }
        } catch (error: any) {
            toast({ title: 'Falha', description: error.message, variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = (url: string) => {
        navigator.clipboard.writeText(url);
        toast({ title: 'Copiado!', description: 'Link copiado.' });
    };

    const handleSearch = async () => {
        if (!searchQuery) return;
        setSearching(true);
        setLeads([]);
        try {
            const res = await fetch(
                `http://localhost:3500/places-search?q=${encodeURIComponent(searchQuery)}&key=${searchKey || 'SEM_KEY'}`
            );
            const data = await res.json();
            if (data.results) {
                setLeads(data.results.slice(0, 20).map((r: any) => ({
                    name: r.name,
                    phone: r.formatted_phone_number || '',
                    address: r.formatted_address || r.vicinity || '',
                    selected: true,
                })));
            } else if (data.error) {
                toast({ title: 'Erro na busca', description: data.error, variant: 'destructive' });
            } else {
                toast({ title: 'Sem resultados', description: 'Nenhuma empresa encontrada.' });
            }
        } catch (e: any) {
            toast({ title: 'Erro', description: e.message, variant: 'destructive' });
        } finally {
            setSearching(false);
        }
    };

    const toggleLead = (i: number) => {
        const updated = [...leads];
        updated[i].selected = !updated[i].selected;
        setLeads(updated);
    };

    const handleBatchGenerate = async () => {
        const selected = leads.filter(l => l.selected);
        if (selected.length === 0) return;
        setBatchRunning(true);
        setBatchProgress(0);
        setBatchTotal(selected.length);
        setBatchResults([]);

        const results: GeneratedResult[] = [];
        for (let i = 0; i < selected.length; i++) {
            const lead = selected[i];
            try {
                const res = await fetch('http://localhost:3500/generate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        company_name: lead.name,
                        phone: lead.phone,
                        address: lead.address,
                        niche: formData.niche,
                        region: formData.region,
                        template: selectedTemplate,
                    }),
                });
                const data = await res.json();
                results.push({ company: lead.name, url: data.site_url, status: 'success' });
            } catch {
                results.push({ company: lead.name, url: '', status: 'error', error: 'Falha na geração' });
            }
            setBatchProgress(i + 1);
            setBatchResults([...results]);
        }
        setBatchRunning(false);
        toast({ title: `Lote concluído!`, description: `${results.filter(r => r.status === 'success').length} sites gerados.` });
    };

    const handleSave = (slots: FilledSlots) => {
        toast({ title: 'Salvo!', description: 'Alterações salvas com sucesso.' });
    };

    const handleExportHtml = () => {
        toast({ title: 'Exportar', description: 'Funcionalidade de exportação em desenvolvimento.' });
    };

    const templateObj = TEMPLATES.find(t => t.id === selectedTemplate)!;
    const templateDef = getTemplate(selectedTemplate);
    const hasSkills = !!templateDef;

    // ── EDITOR VIEW ────────────────────────────────────────────────
    if (pageView === 'editor' && editorResult && templateDef) {
        return (
            <div className="flex flex-col h-full w-full">
                <div className="flex items-center gap-3 px-4 py-2 bg-wa-surface border-b border-wa-border">
                    <button
                        onClick={() => setPageView('generator')}
                        className="flex items-center gap-1.5 text-sm text-wa-text-muted hover:text-wa-text-main"
                    >
                        <ArrowLeft className="h-4 w-4" /> Voltar ao Gerador
                    </button>
                    <span className="text-wa-text-muted">|</span>
                    <span className="text-sm font-semibold text-wa-text-main">
                        {formData.company_name} — {templateDef.name}
                    </span>
                </div>
                <div className="flex-1 overflow-hidden">
                    <SiteEditor
                        template={templateDef}
                        result={editorResult}
                        onSave={handleSave}
                        onExportHtml={handleExportHtml}
                    />
                </div>
            </div>
        );
    }

    // ── GENERATOR VIEW ─────────────────────────────────────────────
    return (
        <div className="flex h-full w-full bg-wa-bg-main overflow-hidden">
            {/* SIDEBAR CATEGORIES */}
            <div className="w-64 border-r border-wa-border bg-wa-surface flex flex-col h-full shrink-0">
                <div className="p-6">
                    <h2 className="text-xl font-bold text-wa-text-main flex items-center gap-2">
                        <LayoutTemplate className="h-5 w-5 text-primary" />
                        Templates
                    </h2>
                    <p className="text-xs text-wa-text-muted mt-1">Selecione uma categoria</p>
                </div>
                <div className="flex-1 overflow-y-auto px-3 space-y-1">
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setSelectedCategory(cat.id)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${selectedCategory === cat.id ? 'bg-primary/10 text-primary' : 'text-wa-text-muted hover:bg-wa-bg-subtle hover:text-wa-text-main'}`}
                        >
                            <cat.icon className="h-4 w-4" />
                            <span className="flex-1 text-left">{cat.label}</span>
                            {selectedCategory === cat.id && <ChevronRight className="h-3.5 w-3.5" />}
                        </button>
                    ))}
                </div>
                <div className="p-4 mt-auto">
                    <div className="p-3 bg-primary/5 rounded-xl border border-primary/10">
                        <p className="text-[10px] uppercase font-bold text-primary tracking-wider mb-1">Dica Pro</p>
                        <p className="text-[11px] text-wa-text-muted leading-tight">Templates com o badge Skills usam IA otimizada que gasta até 80% menos tokens.</p>
                    </div>
                </div>
            </div>

            {/* MAIN CONTENT */}
            <div className="flex-1 overflow-y-auto">
                <div className="max-w-5xl mx-auto p-6 md:p-8 space-y-8">

                    {/* HEADER */}
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-wa-text-main">Gerador de Landing Pages</h1>
                            <p className="text-wa-text-muted mt-1">Crie sites profissionais em segundos para qualquer nicho.</p>
                        </div>
                        <div className="flex bg-wa-surface p-1 rounded-xl border border-wa-border">
                            <button
                                onClick={() => setActiveTab('manual')}
                                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'manual' ? 'bg-primary text-white shadow-sm' : 'text-wa-text-muted hover:text-wa-text-main'}`}
                            >
                                Manual
                            </button>
                            <button
                                onClick={() => setActiveTab('batch')}
                                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'batch' ? 'bg-primary text-white shadow-sm' : 'text-wa-text-muted hover:text-wa-text-main'}`}
                            >
                                Lote
                            </button>
                        </div>
                    </div>

                    {/* TEMPLATE GALLERY */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="font-bold text-wa-text-main">Escolha o seu template preferido</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredTemplates.map(t => (
                                <button
                                    key={t.id}
                                    onClick={() => setSelectedTemplate(t.id)}
                                    className={`relative group flex flex-col items-start p-1.5 rounded-2xl border-2 transition-all ${selectedTemplate === t.id ? 'border-primary ring-4 ring-primary/10' : 'border-wa-border bg-wa-bg-subtle hover:border-primary/30'}`}
                                >
                                    <div className="w-full aspect-[16/10] rounded-xl bg-wa-surface overflow-hidden border border-wa-border mb-3 relative">
                                        <img
                                            src={t.thumbnail}
                                            alt={t.label}
                                            className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity duration-300"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-wa-surface/90 via-transparent to-transparent pointer-events-none" />

                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                            <div className="w-12 h-12 rounded-full flex items-center justify-center text-white text-2xl shadow-lg border-2 border-white/20" style={{ backgroundColor: t.color }}>
                                                {t.label.charAt(0)}
                                            </div>
                                        </div>

                                        {t.hasSkills && (
                                            <div className="absolute top-2 left-2 flex items-center gap-1 bg-amber-500 text-white px-2 py-0.5 rounded-full text-[10px] font-bold shadow-md z-10">
                                                <Sparkles className="h-3 w-3" /> Skills
                                            </div>
                                        )}

                                        {selectedTemplate === t.id && (
                                            <div className="absolute top-2 right-2 bg-primary text-white p-1 rounded-full shadow-md z-10">
                                                <CheckCircle2 className="h-4 w-4" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="px-2 pb-2">
                                        <div className="font-bold text-sm text-wa-text-main">{t.label}</div>
                                        <div className="text-[11px] text-wa-text-muted mt-0.5 line-clamp-1">{t.desc}</div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* ACTION AREA - MANUAL */}
                    {activeTab === 'manual' && (
                        <Card className="bg-wa-surface border-wa-border overflow-hidden">
                            <div className="h-1 bg-primary w-full" />
                            <CardHeader>
                                <CardTitle className="text-xl">Dados do Cliente</CardTitle>
                                <CardDescription>O template <strong>{templateObj.label}</strong> será customizado com estas informações.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label className="flex items-center gap-2"><Building2 className="h-4 w-4 text-primary" /> Nome da Empresa *</Label>
                                            <Input name="company_name" required placeholder="Ex: Escritório S3 Advocacia" value={formData.company_name} onChange={handleChange} className="bg-wa-bg-subtle h-11 border-wa-border focus:ring-primary" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="flex items-center gap-2"><User className="h-4 w-4 text-primary" /> Nome do Responsável</Label>
                                            <Input name="owner_name" placeholder="Ex: Dr. Roberto Silva" value={formData.owner_name} onChange={handleChange} className="bg-wa-bg-subtle h-11 border-wa-border" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="flex items-center gap-2"><Phone className="h-4 w-4 text-primary" /> WhatsApp (somente números)</Label>
                                            <Input name="phone" placeholder="11999999999" value={formData.phone} onChange={handleChange} className="bg-wa-bg-subtle h-11 border-wa-border" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="flex items-center gap-2 mb-1">
                                                <span className="h-4 w-4 text-primary font-bold text-sm">🖼</span> Logo do Cliente
                                            </Label>
                                            <LogoUploader
                                                logoUrl={formData.logo_url || ''}
                                                colors={logoColors}
                                                onChange={(url, colors) => {
                                                    setFormData(f => ({ ...f, logo_url: url }));
                                                    setLogoColors(colors);
                                                    setHasLogoColors(!!url);
                                                }}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /> Endereço Completo</Label>
                                            <Input name="address" placeholder="São Paulo, SP" value={formData.address} onChange={handleChange} className="bg-wa-bg-subtle h-11 border-wa-border" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="flex items-center gap-2"><Briefcase className="h-4 w-4 text-primary" /> Nicho Específico</Label>
                                            <Input name="niche" placeholder="Ex: Direito Civil" value={formData.niche} onChange={handleChange} className="bg-wa-bg-subtle h-11 border-wa-border" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="flex items-center gap-2"><Map className="h-4 w-4 text-primary" /> Região de Atuação</Label>
                                            <Input name="region" placeholder="Estado ou Cidade" value={formData.region} onChange={handleChange} className="bg-wa-bg-subtle h-11 border-wa-border" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> Descrição / Diferenciais</Label>
                                            <Input name="description" placeholder="Ex: 28 anos de experiência, projetos sustentáveis..." value={formData.description} onChange={handleChange} className="bg-wa-bg-subtle h-11 border-wa-border" />
                                        </div>
                                    </div>

                                    {/* Instagram Fetcher */}
                                    <div className="pt-2 space-y-2">
                                        <Label className="flex items-center gap-2">
                                            <Instagram className="h-4 w-4 text-primary" /> Instagram (opcional — galeria de fotos)
                                        </Label>
                                        <InstagramFetcher
                                            handle={instagramHandle}
                                            posts={instagramPosts}
                                            onHandleChange={setInstagramHandle}
                                            onPostsChange={setInstagramPosts}
                                        />
                                    </div>

                                    {/* Progress bar durante geração */}
                                    {loading && progressMsg && (
                                        <div className="space-y-2 p-4 bg-primary/5 rounded-xl border border-primary/10 animate-in fade-in">
                                            <div className="flex justify-between text-sm">
                                                <span className="font-semibold text-primary flex items-center gap-2">
                                                    <Loader2 className="h-4 w-4 animate-spin" /> {progressMsg}
                                                </span>
                                                <span className="text-wa-text-muted">{progressPct}%</span>
                                            </div>
                                            <Progress value={progressPct} className="h-2" />
                                        </div>
                                    )}

                                    {/* Botões de ação */}
                                    <div className="pt-4 flex flex-col sm:flex-row gap-3">
                                        {hasSkills && (
                                            <Button
                                                type="button"
                                                onClick={handleSkillGenerate}
                                                disabled={loading || !formData.company_name}
                                                className="h-12 px-10 text-base font-bold shadow-lg shadow-primary/20 gap-2"
                                            >
                                                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
                                                Gerar com Skills (Otimizado)
                                            </Button>
                                        )}

                                        <Button
                                            type="button"
                                            onClick={(e) => handleLegacyGenerate(e as any)}
                                            disabled={loading || !formData.company_name}
                                            variant={hasSkills ? 'outline' : 'default'}
                                            className={`h-12 px-10 text-base font-bold gap-2 ${!hasSkills ? 'shadow-lg shadow-primary/20' : ''}`}
                                        >
                                            {loading && !hasSkills ? <Loader2 className="h-5 w-5 animate-spin" /> : <Globe className="h-5 w-5" />}
                                            {hasSkills ? 'Gerar via Servidor' : 'Gerar Landing Page Agora'}
                                        </Button>
                                    </div>

                                    {/* Token stats */}
                                    {hasSkills && (
                                        <div className="flex items-center gap-2 text-xs text-wa-text-muted pt-2">
                                            <BarChart3 className="h-3.5 w-3.5" />
                                            <span>Skills executam 6 micro-prompts em paralelo. Economia de ~80% em tokens vs prompt único.</span>
                                        </div>
                                    )}
                                </div>

                                {generatedSite && (
                                    <div className="mt-8 p-6 rounded-2xl bg-green-500/5 border border-green-500/20 animate-in fade-in slide-in-from-bottom-4">
                                        <h3 className="text-lg font-bold text-green-600 mb-4 flex items-center gap-2">
                                            <CheckCircle2 className="h-6 w-6" /> Sucesso! Site gerado com sucesso.
                                        </h3>
                                        <div className="flex items-center gap-3 bg-wa-surface p-4 rounded-xl border border-wa-border shadow-sm">
                                            <input readOnly value={generatedSite.url} className="flex-1 bg-transparent text-sm font-mono text-wa-text-main outline-none" />
                                            <Button variant="outline" size="sm" onClick={() => copyToClipboard(generatedSite.url)} className="h-10 px-4"><Copy className="h-4 w-4 mr-2" />Copiar Link</Button>
                                            <Button size="sm" asChild className="h-10 px-4"><a href={generatedSite.url} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-4 w-4 mr-2" />Abrir Site</a></Button>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* BATCH TAB */}
                    {activeTab === 'batch' && (
                        <div className="space-y-6">
                            <Card className="bg-wa-surface border-wa-border overflow-hidden">
                                <div className="h-1 bg-primary w-full" />
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2"><Search className="h-5 w-5 text-primary" /> Busca Google Places</CardTitle>
                                    <CardDescription>Gere sites em massa buscando empresas reais no Google Maps.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label>Busca (nicho + cidade)</Label>
                                            <Input placeholder='Ex: escritório advocacia Brasília DF' value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="bg-wa-bg-subtle h-11 border-wa-border" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Google Places API Key</Label>
                                            <Input placeholder="AIza..." value={searchKey} onChange={e => setSearchKey(e.target.value)} type="password" className="bg-wa-bg-subtle h-11 border-wa-border" />
                                        </div>
                                    </div>
                                    <Button onClick={handleSearch} disabled={searching || !searchQuery} variant="outline" className="h-11 px-6 gap-2">
                                        {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                                        {searching ? 'Buscando...' : 'Pesquisar Empresas'}
                                    </Button>
                                </CardContent>
                            </Card>

                            {leads.length > 0 && (
                                <Card className="bg-wa-surface border-wa-border overflow-hidden">
                                    <CardHeader className="flex-row items-center justify-between pb-4">
                                        <div>
                                            <CardTitle className="text-base">Resultados da Busca</CardTitle>
                                            <CardDescription>{leads.filter(l => l.selected).length} de {leads.length} selecionadas</CardDescription>
                                        </div>
                                        <Button onClick={handleBatchGenerate} disabled={batchRunning || leads.filter(l => l.selected).length === 0} className="gap-2 shadow-lg shadow-primary/20">
                                            <Zap className="h-4 w-4" /> Gerar Sites em Lote
                                        </Button>
                                    </CardHeader>
                                    <CardContent>
                                        {batchRunning && (
                                            <div className="mb-6 space-y-3 p-4 bg-primary/5 rounded-xl border border-primary/10">
                                                <div className="flex justify-between text-sm">
                                                    <span className="font-semibold text-primary">Processando lote...</span>
                                                    <span className="text-wa-text-muted">{batchProgress} de {batchTotal} concluídos</span>
                                                </div>
                                                <Progress value={(batchProgress / batchTotal) * 100} className="h-2" />
                                            </div>
                                        )}
                                        <div className="divide-y divide-wa-border border border-wa-border rounded-xl">
                                            {leads.map((lead, i) => {
                                                const result = batchResults.find(r => r.company === lead.name);
                                                return (
                                                    <div key={i} className="flex items-center gap-4 py-4 px-4 hover:bg-wa-bg-subtle transition-colors first:rounded-t-xl last:rounded-b-xl">
                                                        <input type="checkbox" checked={lead.selected} onChange={() => toggleLead(i)} className="accent-primary h-5 w-5 flex-shrink-0 rounded" />
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-bold text-sm text-wa-text-main truncate">{lead.name}</p>
                                                            <p className="text-[11px] text-wa-text-muted truncate mt-0.5">{lead.phone && `${lead.phone} · `}{lead.address}</p>
                                                        </div>
                                                        {result && (
                                                            result.status === 'success' ? (
                                                                <div className="flex items-center gap-2 flex-shrink-0">
                                                                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                                                                    <Button variant="ghost" size="sm" asChild className="h-8 px-2 text-primary hover:text-primary hover:bg-primary/5">
                                                                        <a href={result.url} target="_blank"><ExternalLink className="h-4 w-4 mr-1" />Link</a>
                                                                    </Button>
                                                                </div>
                                                            ) : (
                                                                <XCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                                                            )
                                                        )}
                                                        {!result && batchRunning && batchProgress <= i && (
                                                            <Clock className="h-5 w-5 text-wa-text-muted flex-shrink-0 animate-pulse" />
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
