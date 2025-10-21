function loadVideo() {
  const urlInput = document.getElementById('videoUrl');
  const video = document.getElementById('videoPlayer');
  const url = urlInput.value.trim();

if (url) {
  video.src = url;
  video.load();
  video.play();
} else {
  alert('Please enter a video URL.');
}
