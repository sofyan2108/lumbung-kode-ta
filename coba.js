
class Clock {
  constructor() {
      this.#init();
  }

  #init() {
      this.#startTime();
  }

  #startTime() {
      setInterval(() => {
          const today = new Date();
          const h = today.getHours();
          const m = today.getMinutes();
          const s = today.getSeconds();
          const time = this.checkZero(h) + ":" + this.checkZero(m) + ":" + this.checkZero(s);
          document.getElementById("time").innerHTML = time;
      }, 1000);
  }

  checkZero(i) {
      return i < 10 ? "0" + i : i;
  }
}

class AlarmClock extends Clock {

  #alarmTime=null;

  constructor() {
      super();
      this.#alarmTime = null;
      this.myAudio = this.#buildAudio();
      this.#initAlarm();
  }

  #initAlarm() {
      this.#hrsMenu();
      this.#minsMenu();
      this.#secsMenu();
      this.#soundMenu();
      this.#bindEvents();
  }

  #buildAudio() {
      const myDiv = document.getElementById("myDiv");
      const myAudio = document.createElement("audio");
      myAudio.id = "myAudio";
      myDiv.appendChild(myAudio);
      return myAudio;
  }

  #hrsMenu() {
      this.populateMenu("alarmHrs", 23);
  }

  #minsMenu() {
      this.populateMenu("alarmMins", 59);
  }

  #secsMenu() {
      this.populateMenu("alarmSecs", 59);
  }

  #soundMenu() {
      const select = document.getElementById("mySelect");
      const sounds = [
          {   name: "Birds", 
              url: "https://www.freespecialeffects.co.uk/soundfx/various/forest.wav" 
          },
          {
              name: "Morning",
              url: "https://www.freespecialeffects.co.uk/soundfx/computers/goodmorningfemale.wav"
          },
          {
              name: "Bells",
              url: "https://www.freespecialeffects.co.uk/soundfx/bells/church_bells_01.wav"
          },
          {
              name: "Laser",
              url: "https://www.freespecialeffects.co.uk/soundfx/scifi/alien_laser_2.wav"
          },
          {
              name: "Explosion",
              url: "https://www.freespecialeffects.co.uk/soundfx/explosions/explosion_04.wav"
          },
          {
              name: "Piggy",
              url: "http://www.ringelkater.de/Sounds/2geraeusche_tiere/schwein.wav"
          },
          {
              name: "Rings",
              url: "https://www.freespecialeffects.co.uk/soundfx/telephone/phone_ring_2.wav"
          }
      ];

      for (const sound of sounds) {
          this.addOption(select, sound.name, sound.url);
      }
  }

  #bindEvents() {
      document.getElementById("mySetButton").addEventListener("click", () => this.#setAlarm());
      document.getElementById("myClearButton").addEventListener("click", () => this.#clearAlarm());
      document.getElementById("mySelect").addEventListener("change", () => this.#getSrc());
  }

  populateMenu(id, maxValue) {
      const select = document.getElementById(id);

      for (let i = 0; i <= maxValue; i++) {
          const value = this.checkZero(i);
          this.addOption(select, value, value);
      }
  }

  addOption(select, text, value) {
      const option = document.createElement("option");
      option.text = text;
      option.value = value;
      select.add(option);
  }

  #setAlarm() {
      const hour = document.getElementById("alarmHrs");
      const min = document.getElementById("alarmMins");
      const sec = document.getElementById("alarmSecs");

      const selectedHour = hour.options[hour.selectedIndex].value;
      const selectedMin = min.options[min.selectedIndex].value;
      const selectedSec = sec.options[sec.selectedIndex].value;

      this.#alarmTime = this.checkZero(selectedHour) + ":" + this.checkZero(selectedMin) + ":" + this.checkZero(selectedSec);
      this.disableInputs(true);

      // Set timeout untuk memeriksa waktu setelah waktu yang ditentukan
      this.timeoutId = setTimeout(() => {
          this.#playAlarmSound();
          this.disableInputs(false);
      }, this.#calculateTimeDifference());
  }
  #calculateTimeDifference() {
    const currentTime = new Date();
    const alarmTimeArray = this.#alarmTime.split(":");
    
    // Membuat objek Date untuk waktu alarm hari ini
    const alarmDateTimeToday = new Date(currentTime.getFullYear(), currentTime.getMonth(), currentTime.getDate(), alarmTimeArray[0], alarmTimeArray[1], alarmTimeArray[2]);

    // Membuat objek Date untuk waktu alarm besok
    const alarmDateTimeTomorrow = new Date(currentTime.getFullYear(), currentTime.getMonth(), currentTime.getDate() + 1, alarmTimeArray[0], alarmTimeArray[1], alarmTimeArray[2]);

    // Menentukan perbedaan waktu dari waktu saat ini hingga waktu alarm
    const timeDifferenceToday = alarmDateTimeToday - currentTime;

    // Jika waktu alarm hari ini sudah lewat, gunakan perbedaan waktu hingga waktu alarm besok
    return timeDifferenceToday > 0 ? timeDifferenceToday : alarmDateTimeTomorrow - currentTime;
}



  disableInputs(disable) {
      document.getElementById('alarmHrs').disabled = disable;
      document.getElementById('alarmMins').disabled = disable;
      document.getElementById('alarmSecs').disabled = disable;
      document.getElementById('mySelect').disabled = disable;
  }

  #playAlarmSound() {
      this.myAudio.src = document.getElementById("mySelect").value;
      this.myAudio.play();
      this.myAudio.loop = true;
  }

  #clearAlarm() {
      this.#alarmTime = null;
      this.disableInputs(false);
      this.myAudio.pause();
  }


  #getSrc() {
      this.myAudio.src = document.getElementById("mySelect").value;
  }
}

// Inisialisasi objek AlarmClock
const alarmClock = new AlarmClock();