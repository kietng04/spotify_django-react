module.exports = {
  init: (audioElement, SoundIcon, Sound25Icon, Sound75Icon, MuteIcon) => {
    if (!audioElement) {
        console.error("progressAndSoundBarAction.init: audioElement is null or undefined.");
        return;
    }

    const player_sound_icon = document.getElementById("player_sound_icon");
    const soundBar = document.getElementById("sound_bar");
    const soundBarBackground = document.getElementById("sound_background");
    const seekBar = document.getElementById("seek_bar");
    const seekBackground = document.getElementById("seek_background");
    const currentTimeDisplay = document.getElementById("current-time");
    const durationDisplay = document.getElementById("duration");

    // --- Logic cho Seek Bar (Thanh tiến trình) --- 
    function updateSeekBar() {
      if (audioElement && audioElement.duration && seekBar) {
        const percentage = (audioElement.currentTime / audioElement.duration) * 100;
        seekBar.style.width = `${percentage}%`;
      }
    }
    
    function updateTimeDisplay() {
       if (audioElement && currentTimeDisplay && durationDisplay) {
           const formatTime = (seconds) => {
               if (isNaN(seconds)) return "0:00";
               const mins = Math.floor(seconds / 60);
               const secs = Math.floor(seconds % 60);
               return `${mins}:${secs < 10 ? '0' + secs : secs}`;
           };
           currentTimeDisplay.textContent = formatTime(audioElement.currentTime);
           if (!isNaN(audioElement.duration)) {
               durationDisplay.textContent = formatTime(audioElement.duration);
           }
       }
    }

    function updateSeekBarOnClick(e) {
      if (audioElement && audioElement.duration) {
        let currentPoint = e.offsetX;
        let progressBarWidth = this.clientWidth;
        let currentRange = (currentPoint / progressBarWidth) * audioElement.duration;
        audioElement.currentTime = currentRange;
      }
    }

    if (seekBackground) {
        // Listener này sẽ được thay thế bằng logic trong Context/PlayerSection
        // seekBackground.addEventListener("click", updateSeekBarOnClick);
        console.log("Seek bar click listener NOT added by progressAction (should be handled by React component)");
    } else {
        console.error("progressAndSoundBarAction.init: seek_background element not found.");
    }

    // --- Logic cho Volume Bar (Thanh âm lượng) ---
    let isMutedInternal = false; // Trạng thái mute cục bộ của module này
    let lastVolumeBeforeMute = audioElement ? audioElement.volume : 1; // Lưu âm lượng trước khi mute

    function updateVolumeDisplay(volume) {
        if (!player_sound_icon || !soundBar) return;
        
        const seekPercentage = volume * 100;
      soundBar.style.width = `${seekPercentage}%`;
        
        if (volume <= 0) {
            player_sound_icon.src = MuteIcon.src;
        } else if (volume <= 0.25) {
            player_sound_icon.src = Sound25Icon.src;
        } else if (volume <= 0.75) {
        player_sound_icon.src = Sound75Icon.src;
      } else {
        player_sound_icon.src = SoundIcon.src;
      }
    }

    function updateVolumeOnClick(e) {
        // Listener này sẽ được thay thế bằng logic trong Context/PlayerSection
        // if (!audioElement) return;
        // let currentPoint = e.offsetX;
        // let progressBarWidth = this.clientWidth;
        // let seekPercentage = (currentPoint / progressBarWidth) * 100;
        // let currentVolume = seekPercentage / 100;
        // audioElement.volume = currentVolume;
        // isMutedInternal = false; // Unmute khi người dùng chủ động kéo thanh trượt
        // lastVolumeBeforeMute = currentVolume; 
        // updateVolumeDisplay(currentVolume);
        console.log("Volume bar click listener NOT added by progressAction (should be handled by React component)");
    }

    function toggleMuteInternal() {
         // Listener này sẽ được thay thế bằng logic trong Context/PlayerSection
        // if (!audioElement) return;
        // if (isMutedInternal) {
        //     audioElement.volume = lastVolumeBeforeMute; // Khôi phục âm lượng trước đó
        //     updateVolumeDisplay(lastVolumeBeforeMute);
        //     isMutedInternal = false;
        // } else {
        //     lastVolumeBeforeMute = audioElement.volume; // Lưu âm lượng hiện tại
        //     audioElement.volume = 0;
        //     updateVolumeDisplay(0);
        //     isMutedInternal = true;
        // }
        console.log("Toggle mute click listener NOT added by progressAction (should be handled by React component)");
    }

    if (soundBarBackground) {
         // soundBarBackground.addEventListener("click", updateVolumeOnClick);
    } else {
         console.error("progressAndSoundBarAction.init: sound_background element not found.");
    }

    if(player_sound_icon){
        // player_sound_icon.addEventListener("click", toggleMuteInternal);
    } else {
        console.error("progressAndSoundBarAction.init: player_sound_icon element not found.");
    }

    // --- Gắn Listener cập nhật UI --- 
    // Vẫn cần các listener này để cập nhật UI dựa trên trạng thái thực tế của audioElement
    if (audioElement) {
        audioElement.addEventListener("timeupdate", () => {
            updateSeekBar();
            updateTimeDisplay();
        });
        audioElement.addEventListener("volumechange", () => {
            // Cập nhật UI khi volume thay đổi (kể cả khi bị set từ bên ngoài)
            if (!isMutedInternal) { // Chỉ cập nhật nếu không phải đang ở trạng thái mute cục bộ
                 updateVolumeDisplay(audioElement.volume);
            }
             // Đồng bộ isMutedInternal nếu cần thiết (ví dụ: bị mute từ nguồn khác)
            if (audioElement.volume === 0 && !isMutedInternal) {
                // lastVolumeBeforeMute = 0.5; // Hoặc một giá trị mặc định khác
                // isMutedInternal = true;
            } else if (audioElement.volume > 0 && isMutedInternal) {
                // isMutedInternal = false;
            }
        });
        audioElement.addEventListener("loadedmetadata", updateTimeDisplay); // Cập nhật duration khi metadata load xong
        
        // Khởi tạo hiển thị volume ban đầu
        updateVolumeDisplay(audioElement.volume);
    } else {
         console.error("progressAndSoundBarAction.init: Cannot add listeners, audioElement is invalid.");
    }
    
    console.log("progressAndSoundBarAction initialized to primarily handle UI updates based on audioElement events.");

  },
};
