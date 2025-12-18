// WebSocket helper for HQ alarm panel.
// Listens to PostgreSQL NOTIFY payloads (JSON) and fans them out to connected clients.

const clients = new Set();

function init(wss) {
	wss.on('connection', (ws) => {
		clients.add(ws);
		ws.send(JSON.stringify({ type: 'connected', message: 'HQ alarm channel ready' }));

		ws.on('close', () => clients.delete(ws));
		ws.on('error', () => clients.delete(ws));
	});
}

function broadcast(wss, payload) {
	for (const client of clients) {
		if (client.readyState === 1) {
			client.send(JSON.stringify({ type: 'incident_alert', data: JSON.parse(payload) }));
		}
	}
}

export default { init, broadcast };
