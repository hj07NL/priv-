/* A simple change: listen for the generic 'auth' event instead of 'privé:auth' */
(function(){
  if (window.SpotifyManager) {}
  window.addEventListener('auth', () => { SpotifyManager.init().catch(()=>{}); });
})();
