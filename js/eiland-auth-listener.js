/* Update Eiland auth listener to the generic 'auth' event */
// (this file replaces the previous auth-listener usage in js/eiland.js)
(function(){
  window.addEventListener('auth', () => {
    if (Opslag.lees('auth_spotify')) Eiland.startSpotifyPoll();
    else Eiland.stopSpotifyPoll();
  });
})();
