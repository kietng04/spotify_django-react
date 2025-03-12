module.exports = {
  playPauseAction: (
    e,
    PlayIcon,
    PauseIcon,
    PlayIconBlack = null,
    PauseIconBlack = null,
    // audioUrl
  ) => {
    let player_audio = document.getElementById("player_audio");

    const isProduction = process.env.NODE_ENV !== "development";

    const PlayButtonsIcon = document.querySelectorAll(
      `img[src="${PauseIcon.src}"]`
    );

    let player_section_playicon = document.getElementById(
      "player_section_playicon"
    );

    if (
      e.src.replace(
        isProduction
          ? process.env.NEXT_PUBLIC_BASE_PROD_URL
          : process.env.NEXT_PUBLIC_BASE_DEV_URL,
        ""
      ) === PlayIcon.src
    ) {
      // if (audioUrl != "" && audioUrl) {
      //   player_audio.src = audioUrl;
      // } else {
      //   player_audio.src = "";
      // }

      player_audio.play();
      player_section_playicon.src =
        PauseIconBlack === null ? PauseIcon.src : PauseIconBlack.src;
      let play_buttons = document.querySelectorAll(".play_button");

      if (document.getElementById("header_common_thing_playbutton")) {
        document.getElementById("header_common_thing_playbutton").src =
          PauseIconBlack === null ? PauseIcon.src : PauseIconBlack.src;
      }

      if (document.getElementById("collection_playbutton")) {
        document.getElementById("collection_playbutton").src =
          PauseIconBlack === null ? PauseIcon.src : PauseIconBlack.src;
      }

      play_buttons.forEach((play_button) => {
        play_button.src = PlayIcon.src;
        play_button.parentElement.classList.replace("opacity-100", "opacity-0");
        play_button.parentElement.classList.replace(
          "translate-y-[0px]",
          "translate-y-[10px]"
        );
      });
      e.src = PauseIcon.src;
      e.parentElement.classList.replace("opacity-0", "opacity-100");
      e.parentElement.classList.replace(
        "translate-y-[10px]",
        "translate-y-[0px]"
      );
    } else {
      PlayButtonsIcon.forEach((PlayButtonIcon) => {
        PlayButtonIcon.src = PlayIcon.src;
      });
      let play_buttons = document.querySelectorAll(".play_button");

      play_buttons.forEach((play_button) => {
        play_button.src = PlayIcon.src;
        play_button.parentElement.classList.replace("opacity-100", "opacity-0");
        play_button.parentElement.classList.replace(
          "translate-y-[0px]",
          "translate-y-[10px]"
        );
      });

      if (document.getElementById("header_common_thing_playbutton")) {
        document.getElementById("header_common_thing_playbutton").src =
          PlayIconBlack === null ? PlayIcon.src : PlayIconBlack.src;
      }

      if (document.getElementById("collection_playbutton")) {
        document.getElementById("collection_playbutton").src =
          PlayIconBlack === null ? PlayIcon.src : PlayIconBlack.src;
      }

      player_audio.pause();
      player_section_playicon.src =
        PlayIconBlack === null ? PlayIcon.src : PlayIconBlack.src;
      e.src = PlayIcon.src;
      e.parentElement.classList.replace("opacity-100", "opacity-0");
      e.parentElement.classList.replace(
        "translate-y-[0px]",
        "translate-y-[10px]"
      );
    }
  },
  greetingMessageShow: () => {
    let greetingMessage;

    let currentHour = new Date().getHours();

    if (currentHour >= 5 && currentHour < 12) {
      greetingMessage = "Good morning";
    } else if (currentHour >= 12 && currentHour < 18) {
      greetingMessage = "hi ";
    } else {
      greetingMessage = "hi";
    }

    const greetingShowElem = document.getElementById("greeting-elem");
    greetingShowElem.textContent = greetingMessage;
  },
  getImageAverageColor: (imageSrc, setAverageColor) => {
    const img = new window.Image();
    img.crossOrigin = "Anonymous";
    img.src = imageSrc;

    img.onload = function () {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(
        0,
        0,
        canvas.width,
        canvas.height
      ).data;
      let r = 0,
        g = 0,
        b = 0;

      for (let i = 0; i < imageData.length; i += 4) {
        r += imageData[i];
        g += imageData[i + 1];
        b += imageData[i + 2];
      }

      r = Math.round(r / (imageData.length / 4));
      g = Math.round(g / (imageData.length / 4));
      b = Math.round(b / (imageData.length / 4));

      // calculate the luminance of the color
      const luminance = 10 * r + 10 * g + 10 * b;

      // calculate the amount to adjust the color by
      const adjustment = Math.round((1000 - luminance) * 0);

      // adjust each color component by the same amount
      r = Math.max(0, Math.min(255, r - adjustment));
      g = Math.max(0, Math.min(255, g - adjustment));
      b = Math.max(0, Math.min(255, b - adjustment));

      // convert the RGB color values to a RGBA value with 50% transparency
      const rgba = `rgba(${r}, ${g}, ${b}, 0.7)`;

      const hero_gradient = document.getElementById("hero_gradient");
      const playlist_gradient = document.getElementById("playlist_gradient");

      if (hero_gradient) {
        const classes = hero_gradient.classList;
        for (let i = 0; i < classes.length; i++) {
          if (classes[i].startsWith("bg")) {
            hero_gradient.classList.remove(classes[i]);
          }
        }
        hero_gradient.style.backgroundColor = rgba;
      }

      if (playlist_gradient) {
        const classes = playlist_gradient.classList;
        for (let i = 0; i < classes.length; i++) {
          if (classes[i].startsWith("bg")) {
            playlist_gradient.classList.remove(classes[i]);
          }
        }
        playlist_gradient.style.backgroundColor = rgba;
      }

      setAverageColor(rgba);
    };
  },
  changeHeaderBackgroundColor: (averageColor, scrollTopValue = 240) => {
    const home_section = document.getElementById("home_section");

    home_section.addEventListener("scroll", function () {
      if (home_section.scrollTop > scrollTopValue) {
        document.querySelectorAll(".header_common_thing").forEach((elem) => {
          elem.classList.remove("invisible", "opacity-0");
        });
        document.getElementById("home_header").style.backgroundColor =
          averageColor.replace(/,\s*0?\.\d+\s*\)/, ", 1)");
        document
          .getElementById("home_header")
          .classList.add("brightness-[0.5]");
      } else {
        document.querySelectorAll(".header_common_thing").forEach((elem) => {
          elem.classList.add("invisible", "opacity-0");
        });
        document.getElementById("home_header").style.backgroundColor =
          "transparent";
        document
          .getElementById("home_header")
          .classList.remove("brightness-[0.5]");
      }
    });
  },
};
