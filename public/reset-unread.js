// Script para resetar o sistema de unread count e começar a detectar mensagens reais

console.log('🔄 Resetando sistema de unread count...');

// Limpar contadores de teste
localStorage.removeItem('whatsapp_unread_counts');
localStorage.removeItem('whatsapp_last_seen_messages');

console.log('✅ Sistema resetado!');
console.log('📱 Agora peça para alguém enviar uma mensagem no WhatsApp');
console.log('⏱️ Aguarde ~30 segundos (polling) e o badge deve aparecer automaticamente!');
console.log('');
console.log('🔄 Recarregando página...');

setTimeout(() => {
    location.reload();
}, 1000);
