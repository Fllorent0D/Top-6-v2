/**
 * RealtimeChannel — drop-in remplacement de BroadcastChannel qui passe par le
 * serveur (SSE serveur -> client, POST client -> serveur). Permet le vrai
 * contrôle à distance entre appareils du même réseau, là où BroadcastChannel
 * ne fonctionne qu'entre onglets d'un même navigateur.
 *
 * Si le relais /events n'est pas disponible (ex : hébergement statique Vercel),
 * on retombe automatiquement sur BroadcastChannel au lieu de reconnecter en
 * boucle : le contrôle reste possible entre onglets du même navigateur.
 *
 * API compatible : new RealtimeChannel(name), .postMessage(obj), .onmessage, .close()
 */
(function () {
    'use strict';

    function randomId(prefix) {
        return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    }

    class RealtimeChannel {
        constructor(name) {
            this.name = name;
            this.onmessage = null;
            this._id = randomId('rc');
            this._closed = false;
            this._eventSource = null;
            this._fallback = null;
            this._opened = false;
            this._connect();
        }

        _connect() {
            if (this._closed) {
                return;
            }

            if (typeof window.EventSource !== 'function') {
                this._useFallback();
                return;
            }

            const url = `/events?channel=${encodeURIComponent(this.name)}&client=${encodeURIComponent(this._id)}`;
            const eventSource = new EventSource(url);
            this._eventSource = eventSource;

            eventSource.onopen = () => {
                this._opened = true;
            };

            eventSource.onerror = () => {
                // Une erreur avant toute connexion réussie = pas de relais serveur.
                if (this._opened || this._closed) {
                    return;
                }

                eventSource.close();
                this._eventSource = null;
                this._useFallback();
            };

            eventSource.onmessage = event => {
                if (this._closed || typeof this.onmessage !== 'function') {
                    return;
                }

                let data;
                try {
                    data = JSON.parse(event.data);
                } catch (error) {
                    return;
                }

                this.onmessage({ data });
            };

            // EventSource se reconnecte tout seul en cas de coupure réseau.
        }

        _useFallback() {
            if (this._fallback || this._closed || !('BroadcastChannel' in window)) {
                return;
            }

            this._fallback = new BroadcastChannel(this.name);
            this._fallback.onmessage = event => {
                if (this._closed || typeof this.onmessage !== 'function') {
                    return;
                }

                this.onmessage({ data: event.data });
            };
        }

        postMessage(message) {
            if (this._closed) {
                return;
            }

            if (this._fallback) {
                this._fallback.postMessage(message);
                return;
            }

            const url = `/publish?channel=${encodeURIComponent(this.name)}&client=${encodeURIComponent(this._id)}`;

            try {
                fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(message),
                    keepalive: true
                }).catch(() => {});
            } catch (error) {
                /* réseau indisponible : on ignore, le client réessaiera au prochain message */
            }
        }

        close() {
            this._closed = true;

            if (this._eventSource) {
                this._eventSource.close();
                this._eventSource = null;
            }

            if (this._fallback) {
                this._fallback.close();
                this._fallback = null;
            }
        }
    }

    window.RealtimeChannel = RealtimeChannel;
})();
