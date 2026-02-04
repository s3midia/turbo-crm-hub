// Script para testar o sistema de unread count no console do navegador

// 1. Adicionar contador de teste para os primeiros 3 chats
function addTestUnreadCounts() {
    // Pegar os chats atuais do estado (você precisa ver no console quais remoteJids existem)
    const testCounts = {
        // Exemplo - Substitua pelos remoteJids reais que você vê no console
        // "5511999999999@s.whatsapp.net": 3,
        // "5511888888888@s.whatsapp.net": 5,
        // "120363123456789012@g.us": 2,
    };

    localStorage.setItem('whatsapp_unread_counts', JSON.stringify(testCounts));
    console.log('✅ Unread counts de teste adicionados:', testCounts);
    console.log('🔄 Recarregue a página para ver os badges!');
}

// 2. Ver todos os unread counts salvos
function viewUnreadCounts() {
    const saved = localStorage.getItem('whatsapp_unread_counts');
    const counts = saved ? JSON.parse(saved) : {};
    console.log('📊 Unread counts salvos:', counts);
    return counts;
}

// 3. Adicionar unread count manualmente
function addUnreadCount(remoteJid, count) {
    const saved = localStorage.getItem('whatsapp_unread_counts');
    const counts = saved ? JSON.parse(saved) : {};
    counts[remoteJid] = count;
    localStorage.setItem('whatsapp_unread_counts', JSON.stringify(counts));
    console.log(`✅ Adicionado ${count} mensagens não lidas para ${remoteJid}`);
    console.log('🔄 Recarregue a página para ver o badge!');
}

// 4. Limpar todos os unread counts
function clearUnreadCounts() {
    localStorage.removeItem('whatsapp_unread_counts');
    console.log('🗑️ Todos os unread counts foram removidos');
    console.log('🔄 Recarregue a página');
}

// 5. Simular mensagem recebida (incrementa contador)
function simulateMessageReceived(remoteJid) {
    const saved = localStorage.getItem('whatsapp_unread_counts');
    const counts = saved ? JSON.parse(saved) : {};
    counts[remoteJid] = (counts[remoteJid] || 0) + 1;
    localStorage.setItem('whatsapp_unread_counts', JSON.stringify(counts));
    console.log(`📩 Mensagem recebida! Total não lido: ${counts[remoteJid]}`);
    console.log('🔄 Recarregue a página para ver o badge atualizado!');
}

console.log(`
🎯 COMANDOS DISPONÍVEIS PARA TESTAR UNREAD COUNT:

1. addTestUnreadCounts()        - Adiciona contadores de teste
2. viewUnreadCounts()            - Ver contadores salvos
3. addUnreadCount(jid, count)    - Adicionar contador manual
4. clearUnreadCounts()           - Limpar todos os contadores
5. simulateMessageReceived(jid)  - Simular mensagem recebida

📝 COMO USAR:

1. Cole este arquivo no console
2. Veja os chats disponíveis (olhe o console para ver "Formatted chats")
3. Use: addUnreadCount("REMOTE_JID_AQUI", 3)
4. Recarregue a página
5. Badge azul deve aparecer! 💙

Exemplo:
  addUnreadCount("5511999999999@s.whatsapp.net", 3)
`);
