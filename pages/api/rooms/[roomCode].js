import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  const { roomCode } = req.query;
  
  // Cors headers para permitir requests do frontend
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    switch (req.method) {
      case 'GET':
        // Buscar dados da sala
        const tasks = await kv.get(`room:${roomCode}`) || [];
        res.status(200).json({ tasks });
        break;
        
      case 'POST':
        // Salvar dados da sala
        const { tasks: newTasks } = req.body;
        await kv.set(`room:${roomCode}`, newTasks);
        res.status(200).json({ success: true, message: 'Sala atualizada' });
        break;
        
      case 'DELETE':
        // Deletar sala
        await kv.del(`room:${roomCode}`);
        res.status(200).json({ success: true, message: 'Sala deletada' });
        break;
        
      default:
        res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
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