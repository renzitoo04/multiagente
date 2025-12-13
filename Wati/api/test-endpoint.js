// Test simple para verificar que el endpoint funciona
export default async function handler(req, res) {
  return res.status(200).json({
    message: 'TEST ENDPOINT FUNCIONA',
    method: req.method,
    timestamp: new Date().toISOString()
  });
}
