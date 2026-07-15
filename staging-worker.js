// Staging worker: serves the draft branch's static assets directly (no GitHub
// Pages proxy) and handles the contact endpoint, so the form can be tested
// end-to-end before anything ships to production.

import { handleContact } from './contact.js';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/contact') {
      if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 });
      return handleContact(request, env);
    }
    return env.ASSETS.fetch(request);
  },
};
