import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowLeft, ArrowRight, Building2, Sparkles, Globe2, Palette,
  CheckCircle2, Upload, Loader2, Wand2, Zap, Instagram, Facebook, MessageCircle, MapPin,
} from 'lucide-react';
import { orchestrateSiteGeneration, type OrchestrationResult } from '@/lib/skills/siteOrchestrator';
import type { ClientData } from '@/lib/templates/types';

type Step = 1 | 2 | 3;

type Goal = 'servicos' | 'produtos' | 'portfolio' | 'institucional' | 'leads' | 'eventos';

const GOALS: { id: Goal; label: string }[] = [
  { id: 'servicos', label: 'Divulgar serviços' },
  { id: 'produtos', label: 'Divulgar produtos' },
  { id: 'portfolio', label: 'Mostrar portfólio' },
  { id: 'institucional', label: 'Site institucional' },
  { id: 'leads', label: 'Captar clientes/leads' },
  { id: 'eventos', label: 'Divulgar eventos' },
];

const PRIMARY_PALETTE = ['#ffffff', '#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899', '#111827', '#ca8a04'];

interface WizardData {
  companyName: string;
  description: string;
  goal: Goal;
  language: string;
  hasLogo: boolean;
  logoFile: File | null;
  logoPreview: string;
  primary: string;
  secondary: string;
  theme: 'light' | 'dark';
  noAddress: boolean;
  address: string;
  instagram: string;
  facebook: string;
  whatsapp: string;
}

const initial: WizardData = {
  companyName: '',
  description: '',
  goal: 'servicos',
  language: 'pt-BR',
  hasLogo: false,
  logoFile: null,
  logoPreview: '',
  primary: '#e06000',
  secondary: '#ff6020',
  theme: 'light',
  noAddress: false,
  address: '',
  instagram: '',
  facebook: '',
  whatsapp: '',
};

interface Props {
  template: string;
  onCancel: () => void;
  onGenerated: (result: OrchestrationResult, clientData: ClientData) => void;
}

export function CreateSiteWizard({ template, onCancel, onGenerated }: Props) {
  const { toast } = useToast();
  const [step, setStep] = useState<Step>(1);
  const [data, setData] = useState<WizardData>(initial);
  const [generatingDesc, setGeneratingDesc] = useState(false);
  const [generatingColors, setGeneratingColors] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [progressPct, setProgressPct] = useState(0);

  const set = <K extends keyof WizardData>(k: K, v: WizardData[K]) =>
    setData(d => ({ ...d, [k]: v }));

  const canStep1 = data.companyName.trim() && data.description.trim();
  const canStep2 = true;

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      set('logoFile', f);
      set('logoPreview', reader.result as string);
    };
    reader.readAsDataURL(f);
  };

  const handleGenerateDescription = async () => {
    if (!data.companyName.trim()) {
      toast({ title: 'Informe o nome da empresa primeiro' });
      return;
    }
    setGeneratingDesc(true);
    await new Promise(r => setTimeout(r, 600));
    set('description',
      `${data.companyName} é referência no setor, oferecendo atendimento personalizado, qualidade e confiança. Atuamos com foco em resultados e satisfação total dos nossos clientes.`
    );
    setGeneratingDesc(false);
  };

  const handleGenerateColors = async () => {
    setGeneratingColors(true);
    await new Promise(r => setTimeout(r, 500));
    const palettes = [
      ['#e06000', '#ff6020'],
      ['#1e40af', '#3b82f6'],
      ['#059669', '#10b981'],
      ['#7c3aed', '#a78bfa'],
      ['#be123c', '#f43f5e'],
    ];
    const [p, s] = palettes[Math.floor(Math.random() * palettes.length)];
    set('primary', p);
    set('secondary', s);
    setGeneratingColors(false);
  };

  const handleGenerate = async () => {
    setLoading(true);
    setProgressPct(0);
    setProgressMsg('Iniciando...');
    try {
      const clientData: ClientData = {
        company_name: data.companyName,
        description: data.description,
        niche: data.goal,
        address: data.noAddress ? '' : data.address,
        instagram: data.instagram,
        phone: data.whatsapp,
        logo_url: data.logoPreview,
      };
      const result = await orchestrateSiteGeneration(
        template,
        clientData,
        (s, p) => { setProgressMsg(s); setProgressPct(p); },
        {
          logoColors: { primary: data.primary, secondary: data.secondary },
          instagramPosts: [],
          instagramHandle: data.instagram,
        }
      );
      onGenerated(result, clientData);
    } catch (e: any) {
      toast({ title: 'Erro ao gerar', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const Dots = () => (
    <div className="flex items-center justify-center gap-2 py-6">
      {[1, 2, 3].map(n => (
        <div
          key={n}
          className={`h-2.5 rounded-full transition-all ${step === n ? 'w-8 bg-primary' : 'w-2.5 bg-wa-border'}`}
        />
      ))}
    </div>
  );

  return (
    <div className="flex flex-col h-full w-full bg-wa-bg-main overflow-hidden">
      {/* HEADER */}
      <div className="border-b border-wa-border bg-wa-surface px-6 py-3 flex items-center justify-between">
        <button onClick={onCancel} className="flex items-center gap-2 text-sm text-wa-text-muted hover:text-wa-text-main">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </button>
        <div className="flex items-center gap-2 font-bold text-wa-text-main">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          Criar Site
        </div>
        <div className="w-16" />
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto p-6">
          <Dots />

          {/* STEP 1 */}
          {step === 1 && (
            <div className="bg-wa-surface border border-wa-border rounded-2xl p-8 space-y-6">
              <div className="text-center space-y-2">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
                <h2 className="text-2xl font-bold">Informações do Negócio</h2>
                <p className="text-sm text-wa-text-muted">Conte-nos sobre a empresa para criar o site perfeito</p>
              </div>

              <div className="space-y-2">
                <Label>Nome da empresa *</Label>
                <Input
                  placeholder="Ex: Transportadora do Felipe"
                  value={data.companyName}
                  onChange={e => set('companyName', e.target.value)}
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Descrição do negócio *</Label>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleGenerateDescription}
                    disabled={generatingDesc}
                    className="h-8 gap-1.5 text-xs"
                  >
                    {generatingDesc ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />}
                    Gerar com IA
                  </Button>
                </div>
                <Textarea
                  rows={4}
                  placeholder="Ex: Empresa de logística e transporte de cargas em todo Brasil. Especializada em entregas rápidas e seguras para empresas e pessoas físicas..."
                  value={data.description}
                  onChange={e => set('description', e.target.value)}
                />
                <p className="text-xs text-wa-text-muted">Quanto mais detalhes, melhor o site gerado</p>
              </div>

              <div className="space-y-3">
                <div>
                  <Label>Objetivo do site *</Label>
                  <p className="text-xs text-wa-text-muted">Isso ajuda a IA a criar um site mais adequado ao seu objetivo</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {GOALS.map(g => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => set('goal', g.id)}
                      className={`text-left px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                        data.goal === g.id
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-wa-border hover:border-primary/40 text-wa-text-main'
                      }`}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2"><Globe2 className="h-4 w-4" /> Idioma do site</Label>
                <p className="text-xs text-wa-text-muted">Todo o conteúdo será gerado no idioma escolhido</p>
                <select
                  value={data.language}
                  onChange={e => set('language', e.target.value)}
                  className="w-full h-11 px-3 rounded-md border border-wa-border bg-wa-bg-subtle text-sm"
                >
                  <option value="pt-BR">🇧🇷 Português (Brasil)</option>
                  <option value="en">🇺🇸 English</option>
                  <option value="es">🇪🇸 Español</option>
                </select>
              </div>

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => set('hasLogo', !data.hasLogo)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                    data.hasLogo ? 'border-primary bg-primary/5' : 'border-wa-border'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${data.hasLogo ? 'border-primary bg-primary' : 'border-wa-border'}`}>
                      {data.hasLogo && <CheckCircle2 className="h-4 w-4 text-white" />}
                    </div>
                    <div>
                      <div className="font-semibold text-sm">Já tenho um logotipo</div>
                      <div className="text-xs text-wa-text-muted">
                        {data.hasLogo ? 'Faça upload do seu logo abaixo' : 'A IA criará um logo profissional baseado na descrição do seu negócio'}
                      </div>
                    </div>
                  </div>
                </button>

                {data.hasLogo ? (
                  <label className="block p-4 rounded-xl border-2 border-dashed border-wa-border hover:border-primary/50 cursor-pointer transition-all">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-lg border-2 border-dashed border-wa-border flex items-center justify-center bg-wa-bg-subtle overflow-hidden">
                        {data.logoPreview ? (
                          <img src={data.logoPreview} alt="logo" className="h-full w-full object-contain" />
                        ) : (
                          <Upload className="h-5 w-5 text-wa-text-muted" />
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-primary">
                          {data.logoFile ? data.logoFile.name : 'Envie seu logotipo'}
                        </div>
                        <div className="text-xs text-wa-text-muted">PNG ou JPG, preferencialmente com fundo transparente</div>
                      </div>
                    </div>
                    <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                  </label>
                ) : (
                  <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Sparkles className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-primary">Logo será criado pela IA</div>
                      <div className="text-xs text-wa-text-muted">Um logo profissional com ícones e cores do seu setor</div>
                    </div>
                  </div>
                )}
              </div>

              <Button
                onClick={() => setStep(2)}
                disabled={!canStep1}
                className="w-full h-12 text-base font-bold gap-2"
              >
                Continuar <ArrowRight className="h-5 w-5" />
              </Button>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div className="bg-wa-surface border border-wa-border rounded-2xl p-8 space-y-6">
              <div className="text-center space-y-2">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <Palette className="h-6 w-6 text-primary" />
                </div>
                <h2 className="text-2xl font-bold">Cores e Localização</h2>
                <p className="text-sm text-wa-text-muted">Escolha as cores e forneça o endereço para buscar avaliações</p>
              </div>

              <button
                type="button"
                onClick={handleGenerateColors}
                disabled={generatingColors}
                className="w-full p-4 rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 hover:bg-primary/10 transition-all"
              >
                <div className="h-11 rounded-lg bg-primary flex items-center justify-center gap-2 text-white font-bold mb-2">
                  {generatingColors ? <Loader2 className="h-5 w-5 animate-spin" /> : <Zap className="h-5 w-5" />}
                  Gerar Cores com I.A
                </div>
                <p className="text-xs text-wa-text-muted">A IA vai sugerir cores ideais com base no segmento do seu negócio</p>
              </button>

              <div className="text-center text-xs text-wa-text-muted">ou escolha manualmente</div>

              {(['primary', 'secondary'] as const).map((key, i) => (
                <div key={key} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-primary" />
                    <Label className="font-bold">{i + 1}. Cor {key === 'primary' ? 'Primária' : 'Secundária'}</Label>
                  </div>
                  <p className="text-xs text-wa-text-muted">
                    {key === 'primary' ? 'A cor principal do site — usada em botões, títulos e destaques' : 'Complementa a primária — usada em fundos, bordas e detalhes'}
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {PRIMARY_PALETTE.map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => set(key, c)}
                        className={`h-8 w-8 rounded-lg border-2 transition-all ${data[key].toLowerCase() === c.toLowerCase() ? 'border-primary ring-2 ring-primary/30' : 'border-wa-border'}`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                  <div className="flex gap-2 items-center">
                    <div className="h-10 w-10 rounded-lg border border-wa-border" style={{ backgroundColor: data[key] }} />
                    <Input
                      value={data[key]}
                      onChange={e => set(key, e.target.value)}
                      className="font-mono h-10"
                    />
                  </div>
                </div>
              ))}

              <div className="p-4 rounded-xl border border-wa-border space-y-3">
                <div className="text-xs text-wa-text-muted">Preview das cores</div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="h-12 rounded-lg flex items-center justify-center font-semibold text-white" style={{ backgroundColor: data.primary }}>Primária</div>
                  <div className="h-12 rounded-lg flex items-center justify-center font-semibold text-white" style={{ backgroundColor: data.secondary }}>Secundária</div>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="font-bold">🌓 Tema do site</Label>
                <p className="text-xs text-wa-text-muted">Escolha se o fundo do site será claro ou escuro</p>
                <div className="grid grid-cols-2 gap-3">
                  {(['light', 'dark'] as const).map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => set('theme', t)}
                      className={`p-4 rounded-xl border-2 transition-all ${data.theme === t ? 'border-primary bg-primary/5' : 'border-wa-border'}`}
                    >
                      <div className={`h-10 w-12 mx-auto rounded-lg flex items-center justify-center font-bold mb-2 ${t === 'light' ? 'bg-white text-black border border-wa-border' : 'bg-gray-900 text-white'}`}>
                        Aa
                      </div>
                      <div className="text-sm font-semibold">{t === 'light' ? 'Claro' : 'Escuro'}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label className="flex items-center gap-2 font-bold"><MapPin className="h-4 w-4" /> Endereço da empresa (opcional)</Label>
                <button
                  type="button"
                  onClick={() => set('noAddress', !data.noAddress)}
                  className={`w-full text-left p-3 rounded-xl border-2 flex items-center gap-3 transition-all ${data.noAddress ? 'border-primary bg-primary/5' : 'border-wa-border'}`}
                >
                  <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${data.noAddress ? 'border-primary bg-primary' : 'border-wa-border'}`}>
                    {data.noAddress && <CheckCircle2 className="h-4 w-4 text-white" />}
                  </div>
                  <span className="text-sm">Não tenho endereço fixo / empresa online</span>
                </button>
                {!data.noAddress && (
                  <>
                    <Input
                      placeholder="Ex: Av. Paulista, 1000 - São Paulo, SP"
                      value={data.address}
                      onChange={e => set('address', e.target.value)}
                      className="h-11"
                    />
                    <p className="text-xs text-wa-text-muted">📍 Buscaremos avaliações, fotos e dados do Google automaticamente</p>
                  </>
                )}
              </div>

              <div className="p-4 rounded-xl border border-wa-border space-y-4">
                <Label className="font-bold">📱 Redes Sociais (opcional)</Label>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm"><Instagram className="h-4 w-4" /> Instagram</Label>
                  <Input
                    placeholder="@seunegocio ou link do perfil"
                    value={data.instagram}
                    onChange={e => set('instagram', e.target.value)}
                  />
                  <p className="text-xs text-wa-text-muted">Buscaremos os últimos posts para criar uma galeria no site</p>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm"><Facebook className="h-4 w-4" /> Facebook</Label>
                  <Input
                    placeholder="facebook.com/seunegocio"
                    value={data.facebook}
                    onChange={e => set('facebook', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm"><MessageCircle className="h-4 w-4" /> WhatsApp</Label>
                  <Input
                    placeholder="+55 11 99999-9999"
                    value={data.whatsapp}
                    onChange={e => set('whatsapp', e.target.value)}
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(1)} className="h-12 gap-2">
                  <ArrowLeft className="h-5 w-5" /> Voltar
                </Button>
                <Button onClick={() => setStep(3)} disabled={!canStep2} className="flex-1 h-12 font-bold gap-2">
                  <ArrowRight className="h-5 w-5" /> Continuar
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div className="bg-wa-surface border border-wa-border rounded-2xl p-8 space-y-6">
              <div className="text-center space-y-2">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <CheckCircle2 className="h-6 w-6 text-primary" />
                </div>
                <h2 className="text-2xl font-bold">Pronto para criar!</h2>
                <p className="text-sm text-wa-text-muted">Revise as informações e gere seu site</p>
              </div>

              <div className="p-4 rounded-xl bg-wa-bg-subtle border border-wa-border">
                <div className="font-bold text-wa-text-main">{data.companyName}</div>
                {data.address && !data.noAddress && (
                  <div className="text-sm text-wa-text-muted mt-1">{data.address}</div>
                )}
              </div>

              <div>
                <div className="text-sm font-semibold mb-2">🎨 Cores selecionadas</div>
                <div className="flex gap-2">
                  <div className="h-12 w-12 rounded-lg" style={{ backgroundColor: data.primary }} />
                  <div className="h-12 w-12 rounded-lg" style={{ backgroundColor: data.secondary }} />
                </div>
              </div>

              <div>
                <div className="text-sm font-semibold mb-2">🖼 Logo</div>
                <div className="flex items-center gap-3 p-3 rounded-xl border border-wa-border">
                  <div className="h-12 w-12 rounded-lg border border-wa-border bg-wa-bg-subtle overflow-hidden flex items-center justify-center">
                    {data.logoPreview ? (
                      <img src={data.logoPreview} className="h-full w-full object-contain" alt="logo" />
                    ) : (
                      <Sparkles className="h-5 w-5 text-primary" />
                    )}
                  </div>
                  <div className="text-sm text-wa-text-muted">
                    {data.hasLogo && data.logoPreview ? 'Logo enviado' : 'Logo será criado pela IA'}
                  </div>
                </div>
              </div>

              {data.address && !data.noAddress ? (
                <div>
                  <div className="font-semibold">Buscando dados do Google...</div>
                  <p className="text-sm text-wa-text-muted">Avaliações e fotos serão incluídas automaticamente.</p>
                </div>
              ) : (
                <div>
                  <div className="font-semibold">Nenhum dado do Google encontrado</div>
                  <p className="text-sm text-wa-text-muted">O site será criado com base na descrição fornecida.</p>
                </div>
              )}

              {loading && (
                <div className="space-y-2 p-4 bg-primary/5 rounded-xl border border-primary/10">
                  <div className="flex justify-between text-sm">
                    <span className="font-semibold text-primary flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" /> {progressMsg}
                    </span>
                    <span className="text-wa-text-muted">{progressPct}%</span>
                  </div>
                  <Progress value={progressPct} className="h-2" />
                </div>
              )}

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(2)} disabled={loading} className="h-12 gap-2">
                  <ArrowLeft className="h-5 w-5" /> Voltar
                </Button>
                <Button onClick={handleGenerate} disabled={loading} className="flex-1 h-12 font-bold gap-2">
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Wand2 className="h-5 w-5" />}
                  Gerar Site com IA
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
