// Configuração centralizada da URL da API para Deploy (Vercel / Render / Railway)
(function() {
  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  
  // Se estiver rodando localmente na porta do LiveServer, redireciona para a porta 3333 da API
  const defaultLocalApi = window.location.origin.includes(':3333') 
    ? window.location.origin 
    : 'http://localhost:3333';

  // Em produção no Vercel/Render, utiliza o mesmo origin ou a URL de produção configurada
  window.GEO_PB_API_URL = isLocal ? defaultLocalApi : window.location.origin;
})();
