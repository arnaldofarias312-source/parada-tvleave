// shared/controller-sync.js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const channel = supabase.channel('parada_control_room');

channel.subscribe((status) => {
  console.log("Estado de conexión Supabase Realtime:", status);
});

export const CONTROL_ACTIONS = {
  SET_RADIO: 'SET_RADIO',
  STOP_RADIO: 'STOP_RADIO',
  SET_STREAM: 'SET_STREAM',
  STOP_STREAM: 'STOP_STREAM',
  RESET_ALL: 'RESET_ALL',
  RELOAD_SCREEN: 'RELOAD_SCREEN'
};

export function sendControlCommand(action, payload = {}) {
  console.log("Enviando comando:", action, payload);
  channel.send({
    type: 'broadcast',
    event: 'control_action',
    payload: { action, payload, timestamp: Date.now() }
  });
}

export function listenControlCommands(callback) {
  channel.on('broadcast', { event: 'control_action', schema: 'public' }, (response) => {
    console.log("Comando recibido en pantalla:", response);
    if (response.payload && response.payload.action) {
      callback(response.payload.action, response.payload.payload);
    }
  });
}