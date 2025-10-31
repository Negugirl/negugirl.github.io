let api = null;

document.getElementById('start-meeting').addEventListener('click', () => {
  const roomName = document.getElementById('room-name').value.trim();
  if (!roomName) {
    alert('Please enter a room name!');
    return;
  }

  document.querySelector('.landing-screen').classList.add('hidden');
  document.getElementById('meeting-container').classList.remove('hidden');
  document.getElementById('room-display').innerText = `Room: ${roomName}`;

  const domain = 'meet.jit.si';
  const options = {
    roomName: roomName,
    parentNode: document.querySelector('#meet'),
    width: '100%',
    height: '100%',
    interfaceConfigOverwrite: {
      TOOLBAR_BUTTONS: ['microphone', 'camera', 'chat', 'raisehand', 'tileview', 'hangup'],
      SHOW_JITSI_WATERMARK: false,
      SHOW_BRAND_WATERMARK: false,
      SHOW_POWERED_BY: false,
      SHOW_WATERMARK_FOR_GUESTS: false,
      DEFAULT_REMOTE_DISPLAY_NAME: 'Guest',
      DISABLE_VIDEO_BACKGROUND: true,
    },
    configOverwrite: {
      prejoinPageEnabled: false
    }
  };

  api = new JitsiMeetExternalAPI(domain, options);

  api.addListener('readyToClose', () => {
    leaveMeeting();
  });
});

document.getElementById('leave-btn').addEventListener('click', leaveMeeting);

function leaveMeeting() {
  if (api) {
    api.dispose();
    api = null;
  }

  document.getElementById('meeting-container').classList.add('hidden');
  document.querySelector('.landing-screen').classList.remove('hidden');
}
