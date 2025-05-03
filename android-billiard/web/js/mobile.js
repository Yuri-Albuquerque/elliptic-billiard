// Prevent zooming
document.addEventListener('touchmove', function(e) {
    e.preventDefault();
  }, { passive: false });
  
  // Fullscreen handling
  document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight - 10;
    
    if (window.screen.orientation) {
      window.screen.orientation.lock('landscape');
    }
  });