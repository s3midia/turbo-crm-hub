import React from 'react';

// Nova paleta de cores:
// Fundo: Preto puro (#000000) e cinza muito escuro (#0a0a0a)
// Destaque: Verde Limão / Amarelo (#cfff04)

interface ServiceItem {
  nome: string;
  descricao: string;
}

interface InvestmentItem {
  item: string;
  valorOriginal?: number;
  valorFinal: number;
  recorrente?: boolean;
}

interface ProposalData {
  cliente: string;
  nicho?: string;
  introducao?: string;
  servicos?: ServiceItem[];
  investimentos?: InvestmentItem[];
  parcelamento?: string;
  prazo?: string;
  capaBgUrl?: string; // New
  logoUrl?: string; // New
}

interface SlideProps {
  children: React.ReactNode;
}

// Logo S3 Mídia (Geometric Fox + Text)
const S3Logo = ({ className = "", logoUrl }: { className?: string, logoUrl?: string }) => {
  if (logoUrl === "none") return null;
  if (logoUrl) {
    return <img src={logoUrl} alt="Logo" className={`max-h-12 object-contain ${className}`} />;
  }
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <svg viewBox="0 0 24 24" className="w-6 h-6 text-[#cfff04]" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21L5 14l2-8 5 3 5-3 2 8-7 7z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-7M5 14h14" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 6l2 4 3-1 3 1 2-4" />
      </svg>
      <span className="font-bold tracking-tight text-white text-base">S3MÍDIA</span>
    </div>
  );
};

// Decoração das Ondas Verdes no Topo
const TopWaves = () => (
  <svg className="absolute top-0 right-[-100px] w-[120%] h-[350px] opacity-60 pointer-events-none" viewBox="0 0 1000 300" preserveAspectRatio="none">
    {Array.from({ length: 15 }).map((_, i) => (
      <path 
        key={i} 
        d={`M 0 ${80 + i*10} Q 250 ${-50 + i*15}, 500 ${150 + i*5} T 1000 ${50 + i*12}`} 
        fill="none" 
        stroke={i % 2 === 0 ? "#cfff04" : "rgba(207, 255, 4, 0.4)"} 
        strokeWidth="0.5" 
      />
    ))}
  </svg>
);

// Padrão de fundo no base (curvas contínuas fracas)
const BottomPattern = () => (
  <svg className="absolute bottom-0 left-0 w-full h-[150px] opacity-10 pointer-events-none" viewBox="0 0 500 100" preserveAspectRatio="none">
    <path d="M0,100 C100,0 200,0 250,100 C300,0 400,0 500,100" fill="none" stroke="#ffffff" strokeWidth="1" />
  </svg>
);

// Layout Base de um Slide A4
// A4 em 96dpi = 794 x 1123 pixels
function Slide({ children }: SlideProps) {
  return (
    <div className="w-[794px] h-[1123px] shrink-0 bg-black text-white relative font-sans overflow-hidden border-b-4 border-gray-900 mx-auto flex flex-col box-border">
      {children}
    </div>
  );
}

// ==========================================
// Slide 1: Capa (PROPOSTA)
// ==========================================
function CoverSlide({ data }: { data: ProposalData }) {
  const currentDate = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  return (
    <Slide>
      {data.capaBgUrl && (
        <div className="absolute inset-0 z-0">
          <img src={data.capaBgUrl} alt="Background Capa" className="w-full h-full object-cover opacity-60 mix-blend-overlay" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent" />
        </div>
      )}
      <TopWaves />
      
      {/* Logo Top Left */}
      <div className="absolute top-12 left-12 z-10">
        <S3Logo logoUrl={data.logoUrl} />
      </div>

      <BottomPattern />

      {/* Conteúdo Central */}
      <div className="flex-1 flex flex-col justify-center items-center z-10 -mt-20">
         <div className="flex flex-col relative">
            {/* Box lateral para Data/Local */}
            <div className="absolute right-[-140px] top-[40px] text-[11px] text-gray-400 font-medium">
               Barreiras - BA<br />
               {currentDate}
            </div>

            <h1 className="text-[140px] font-bold leading-[0.85] tracking-tight text-white m-0">
               PRO<br/>
               <span className="text-[#cfff04]">POSTA</span>
            </h1>
         </div>
      </div>

      {/* Rodapé Capa */}
      <div className="absolute bottom-16 left-0 w-full flex flex-col items-center gap-12 z-10">
         <h2 className="text-xl font-medium tracking-widest uppercase text-gray-300">
            {data.cliente}
         </h2>
         <S3Logo logoUrl={data.logoUrl} className="opacity-80 scale-125" />
      </div>
    </Slide>
  );
}

// ==========================================
// Slide 2: Apresentação (Quem Somos)
// ==========================================
function AboutSlide({ data }: { data: ProposalData }) {
  return (
    <Slide>
      <TopWaves />
      <BottomPattern />
      
      <div className="absolute top-12 left-12 z-10">
        <S3Logo logoUrl={data.logoUrl} />
      </div>

      <div className="flex-1 flex flex-col justify-center px-[80px] z-10 mt-32">
         <p className="text-[17px] leading-[1.8] text-gray-100 font-normal">
            A <span className="font-bold text-[#cfff04]">S3 Mídia</span> é uma Agência com vasta experiência no mercado digital, comprometida em alcançar as metas de comunicação estabelecidas pelo cliente, visando maximizar o potencial comunicacional da empresa/marca.<br/><br/>
            Para isso, desenvolvemos serviços na elaboração de campanhas publicitárias para TV, criação de sites, gerenciamento de mídias sociais, criação de identidade visual, produção de vídeos, fotografia, tráfego direcionado e tudo relacionado as soluções no âmbito da comunicação.<br/><br/>
            Esperamos poder realizar o nosso melhor trabalho para seu negócio.
         </p>
         
         <div className="mt-32 self-end text-right">
            <h3 className="text-[32px] tracking-tight font-medium text-white mb-1">
               Jeferson Santos
            </h3>
            <p className="text-[15px] text-gray-400 font-medium">Sócio S3 Mídia</p>
         </div>
      </div>
    </Slide>
  );
}

// ==========================================
// Slide 3/4: Descrição e Investimento
// ==========================================
function InvestmentSlide({ data }: { data: ProposalData }) {
  const formatMoney = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  // Calcula a primeira parcela como metade do total (estimativa para demonstração caso não tenha)
  const primeiraParcela = data.investimentos && data.investimentos.length > 0 
      ? data.investimentos.reduce((acc, curr) => acc + curr.valorFinal, 0)
      : 0;

  return (
    <Slide>
      <TopWaves />
      <div className="absolute top-12 left-12 z-10">
        <S3Logo logoUrl={data.logoUrl} />
      </div>

      <div className="pt-[140px] px-[60px] flex flex-col h-full z-10">
         
         {/* Título da Seção */}
         <div className="mb-10">
            <h1 className="text-[60px] font-bold leading-[0.85] tracking-tight text-white">
               DESCRIÇÃO<br/>
               <span className="text-[#cfff04]">PROPOSTA</span>
            </h1>
         </div>

         {/* Saudação */}
         <div className="mb-8">
            <h2 className="text-[19px] font-bold text-[#cfff04] mb-1">Sr(a). {data.cliente.split(' ')[0]},</h2>
            <p className="text-[12px] text-gray-400">segue nossa proposta para prestação de serviços :</p>
         </div>

         {/* Tabela de Investimentos */}
         <div className="w-full bg-[#111] rounded-t-xl rounded-b-sm border border-gray-800 flex flex-col overflow-hidden shadow-2xl">
            {/* Headers */}
            <div className="flex px-6 py-4 bg-[#141414] border-b border-gray-800 text-[13px] text-gray-400 font-medium">
               <div className="w-[180px]">Serviços</div>
               <div className="flex-1 px-4">Observações</div>
               <div className="w-[120px] text-right">Valores</div>
            </div>

            {/* Rows (Serviços e Investimentos mesclados) */}
            <div className="flex flex-col">
               {data.servicos?.map((svc, i) => {
                 // Tenta encontrar um investimento correspondente ou pega o de mesmo índice
                 const inv = data.investimentos?.[i] || null;
                 
                 return (
                   <div key={i} className={`flex px-6 py-8 ${i !== data.servicos!.length - 1 ? 'border-b border-dashed border-[#cfff04]/30' : ''}`}>
                      <div className="w-[180px] font-bold text-[15px] pt-1 leading-tight">{svc.nome}</div>
                      <div className="flex-1 px-4 text-[13px] text-gray-300 leading-relaxed font-normal prose prose-invert prose-p:my-1 prose-headings:mb-2 prose-headings:mt-4 max-w-none" dangerouslySetInnerHTML={{ __html: svc.descricao || "" }} />
                      <div className="w-[120px] text-right pt-1 flex flex-col gap-1">
                         {inv ? (
                            <>
                               {inv.valorOriginal && (
                                   <div className="text-[13px] text-gray-500 line-through">
                                      {formatMoney(inv.valorOriginal)}
                                   </div>
                               )}
                               <div className="text-[15px] font-bold text-[#cfff04]">
                                  {formatMoney(inv.valorFinal)}
                                  {inv.recorrente && <span className="text-[11px] font-normal">/mês</span>}
                               </div>
                            </>
                         ) : (
                            <span className="text-[13px] text-gray-500">-</span>
                         )}
                      </div>
                   </div>
                 );
               })}
            </div>

            {/* Faixa Amarela Rodapé da Tabela */}
            <div className="w-full bg-[#cfff04] text-black px-6 py-3 flex text-[12px] items-center justify-between font-bold">
               <div>Prazo de Produção: {data.prazo || "30 Dias"}</div>
               <div className="text-center">*Não inclui os valores pagos para impulsionamentos.</div>
               <div className="text-right leading-tight">
                 1ª Parcela do Investimento<br/>
                 {formatMoney(primeiraParcela)}
               </div>
            </div>
         </div>

         {/* Barra Decorativa Pequena */}
         <div className="w-[60%] mx-auto h-4 bg-[#8b8b8b] my-8 rounded-sm"></div>

         {/* Cards de Pagamento */}
         <div className="grid grid-cols-3 gap-4 pb-12 w-full mt-auto">
            {/* Crédito */}
            <div className="bg-[#1a1a1a] border border-gray-800 p-4 rounded-xl flex flex-col items-center justify-center text-center">
               <span className="text-[11px] text-gray-400 mb-1">cartão de crédito</span>
               <span className="text-[18px] text-[#cfff04] font-bold">
                 12x de {formatMoney(primeiraParcela / 12)}
               </span>
            </div>
            
            {/* Boleto */}
            <div className="bg-[#1a1a1a] border border-gray-800 p-4 rounded-xl flex flex-col items-center justify-center text-center">
               <span className="text-[11px] text-gray-400 mb-1">boleto bancário parcelado</span>
               <span className="text-[15px] text-[#cfff04] font-bold leading-tight">
                 {formatMoney((primeiraParcela / 2))} +<br/>
                 12x de {formatMoney((primeiraParcela / 2) / 12)}
               </span>
            </div>

            {/* Pix */}
            <div className="bg-[#1a1a1a] border border-gray-800 p-4 rounded-xl flex flex-col items-center justify-center text-center">
               <span className="text-[11px] text-gray-400 mb-1">Pix ou Cash com 5% de desconto</span>
               <span className="text-[20px] text-[#cfff04] font-bold">
                 {formatMoney(primeiraParcela * 0.95)}
               </span>
            </div>
         </div>

      </div>
    </Slide>
  );
}

// ==========================================
// Main Component Output
// ==========================================
export default function ModernProposalTemplate({ data }: { data: ProposalData }) {
  // Ajusta o wrapper para centralizar as visões A4
  return (
    <div className="flex flex-col items-center gap-8 bg-[#222] min-h-full py-8 text-black overflow-y-auto">
      <div className="shadow-[0_0_40px_rgba(0,0,0,0.5)] bg-black">
         <CoverSlide data={data} />
      </div>
      
      <div className="shadow-[0_0_40px_rgba(0,0,0,0.5)] bg-black">
         <AboutSlide data={data} />
      </div>

      {(data.servicos || data.investimentos) && (
         <div className="shadow-[0_0_40px_rgba(0,0,0,0.5)] bg-black">
            <InvestmentSlide data={data} />
         </div>
      )}
    </div>
  );
}

