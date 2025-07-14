import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  // Cors headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    switch (req.method) {
      case 'GET':
        // Listar todas as salas disponíveis
        // No KV, vamos buscar por padrão de chaves "room:*"
        const keys = await kv.keys('room:*');
        const rooms = keys.map(key => key.replace('room:', ''));
        res.status(200).json({ rooms });
        break;
        
      case 'POST':
        // Verificar se sala existe
        const { roomCode } = req.body;
        const exists = await kv.exists(`room:${roomCode}`);
        res.status(200).json({ exists: !!exists });
        break;
        
      default:
        res.setHeader('Allow', ['GET', 'POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message 
    });
  }
}