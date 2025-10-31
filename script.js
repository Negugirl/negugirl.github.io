document.getElementById('start-btn').addEventListener('click', () => {
  const roomName = document.getElementById('room-name').value.trim();
  if (!roomName) {
    alert('Please enter a room name.');
    return;
  }

  const domain = "meet.jit.si";
  const options = {
    roomName: roomName,
    width: "100%",
    height: "100%",
    parentNode: document.querySelector('#meet'),
    interfaceConfigOverwrite: {
      DEFAULT_REMOTE_DISPLAY_NAME: 'Guest',
      SHOW_JITSI_WATERMARK: false
    },
    configOverwrite: {
      prejoinPageEnabled: true
    }
  };

  // Clear old meeting if any
  document.querySelector('.container').style.display = 'none';
  document.querySelector('#meet').style.display = 'block';

  const api = new JitsiMeetExternalAPI(domain, options);

  api.addListener('readyToClose', () => {
    document.querySelector('#meet').style.display = 'none';
    document.querySelector('.container').style.display = 'block';
  });
});
