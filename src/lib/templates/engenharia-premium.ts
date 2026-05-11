import type { SiteTemplate } from './types';

export const engenhariaPremiumTemplate: SiteTemplate = {
  id: 'engenharia_premium',
  name: 'Engenharia Premium',
  category: 'engenharia',
  description: 'Alta performance estrutural',
  color: '#ea580c',
  theme: 'light',
  fonts: {
    heading: 'Inter',
    body: 'Inter',
  },
  meta: {
    title: { key: 'meta_title', type: 'text', source: 'ai', label: 'Título SEO', maxLength: 60 },
    description: { key: 'meta_desc', type: 'text', source: 'ai', label: 'Descrição SEO', maxLength: 160 },
  },
  sections: [
    {
      id: 'hero',
      type: 'hero',
      slots: {
        headline:    { key: 'headline',    type: 'text',  source: 'ai',     label: 'Título principal', maxLength: 60 },
        subheadline: { key: 'subheadline', type: 'text',  source: 'ai',     label: 'Subtítulo', maxLength: 120 },
        cta_text:    { key: 'cta_text',    type: 'text',  source: 'fixed',  label: 'Texto do botão' },
        cta_link:    { key: 'cta_link',    type: 'link',  source: 'client', label: 'Link WhatsApp' },
        logo_url:    { key: 'logo_url',    type: 'image', source: 'client', label: 'Logo' },
        bg_image:    { key: 'bg_image',    type: 'image', source: 'fixed',  label: 'Imagem de fundo' },
      },
      defaults: {
        cta_text: 'Solicitar Orçamento',
        bg_image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1400&auto=format&fit=crop&q=80',
      },
    },
    {
      id: 'services',
      type: 'services',
      slots: {
        titulo: { key: 'titulo', type: 'text',  source: 'fixed', label: 'Título da seção' },
        cards:  { key: 'cards',  type: 'array', source: 'ai',    label: 'Cards de serviço' },
      },
      defaults: {
        titulo: 'Nossos Serviços',
      },
    },
    {
      id: 'about',
      type: 'about',
      slots: {
        titulo:  { key: 'titulo',  type: 'text',  source: 'fixed', label: 'Título' },
        texto:   { key: 'texto',   type: 'text',  source: 'ai',    label: 'Texto sobre a empresa' },
        imagem:  { key: 'imagem',  type: 'image', source: 'fixed', label: 'Imagem' },
        stats:   { key: 'stats',   type: 'array', source: 'ai',    label: 'Estatísticas' },
      },
      defaults: {
        titulo: 'Nossa História',
        imagem: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=800&auto=format&fit=crop&q=80',
      },
    },
    {
      id: 'testimonials',
      type: 'testimonials',
      slots: {
        titulo:       { key: 'titulo',       type: 'text',  source: 'fixed', label: 'Título' },
        depoimentos:  { key: 'depoimentos',  type: 'array', source: 'ai',    label: 'Depoimentos' },
      },
      defaults: {
        titulo: 'O que Nossos Clientes Dizem',
      },
    },
    {
      id: 'cta',
      type: 'cta',
      slots: {
        titulo:    { key: 'titulo',    type: 'text', source: 'ai',    label: 'CTA título' },
        subtitulo: { key: 'subtitulo', type: 'text', source: 'ai',    label: 'CTA subtítulo' },
        btn_text:  { key: 'btn_text',  type: 'text', source: 'fixed', label: 'Texto botão' },
        btn_link:  { key: 'btn_link',  type: 'link', source: 'client', label: 'Link' },
      },
      defaults: {
        btn_text: 'Fale com um Especialista',
      },
    },
    {
      id: 'gallery',
      type: 'gallery',
      slots: {
        posts:   { key: 'posts',   type: 'array', source: 'client', label: 'Fotos do Instagram' },
        handle:  { key: 'handle',  type: 'text',  source: 'client', label: '@Instagram' },
        titulo:  { key: 'titulo',  type: 'text',  source: 'fixed',  label: 'Título da seção' },
      },
      defaults: {
        titulo: 'Nossa Galeria',
        posts: [],
        handle: '',
      },
    },
    {
      id: 'contact',
      type: 'contact',
      slots: {
        phone:     { key: 'phone',   type: 'text', source: 'client', label: 'Telefone' },
        address:   { key: 'address', type: 'text', source: 'client', label: 'Endereço' },
        email:     { key: 'email',   type: 'text', source: 'ai',     label: 'Email sugerido' },
        horario:   { key: 'horario', type: 'text', source: 'fixed',  label: 'Horário' },
      },
      defaults: {
        horario: 'Seg - Sex: 08h às 18h',
      },
    },
    {
      id: 'footer',
      type: 'footer',
      slots: {
        company_name: { key: 'company_name', type: 'text',  source: 'client', label: 'Nome da empresa' },
        logo_url:     { key: 'logo_url',     type: 'image', source: 'client', label: 'Logo' },
      },
      defaults: {},
    },
  ],
};
