// @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
// @ (                     (                                      @
// @ )\ )              )   )\ )               )                 ) @
// @(()/(     ) (   ( /(  (()/(     ) (    ( /( (     (    ) ( /( @
// @ /(_)) ( /( )(  )\())  /(_)) ( /( )\ ) )\()))(   ))\( /( )\())@
// @(_))_  )(_)|()\((_)\  (_))_  )(_)|()/(((_)\(()\ /((_)(_)|(_)\ @
// @ |   \((_)_ ((_) |(_)  |   \((_)_ )(_)) |(_)((_|_))((_)_| |(_)@
// @ | |) / _` | '_| / /   | |) / _` | || | '_ \ '_/ -_) _` | / / @
// @ |___/\__,_|_| |_\_\   |___/\__,_|\_, |_.__/_| \___\__,_|_\_\ @
// @                                  |__/                        @
// @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@

import {
  Time,
  World,
  GameObject,
  StaticBoundObject,
  InteractiveObject,
  Sprite,
  Camera,
  Manifest,
  Vector2,
} from "/assets/vendor/skrill.js";

import sprites from "/assets/json/sprites.json" assert { type: "json" };
import assets from "/assets/json/assets.json" assert { type: "json" };

const $global = {
  debug: true,
  keys: {}
};
const CANVAS_WIDTH = window.screen.width * window.devicePixelRatio;
const CANVAS_HEIGHT = window.screen.height * window.devicePixelRatio;
const PIXEL_SCALE = 4;

const canvas = document.getElementById("canvas");
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

const ctx = canvas.getContext("2d");

ctx.fillMultiLineText = (_string, x, y, gap = 2) => {
  let stringList = _string.split("\n");

  const match = /(?<value>\d+\.?\d*)/;

  for (let i = 0; i < stringList.length; i++) {
    ctx.fillText(stringList[i], x, y + i * ctx.font.match(match)[0] + gap);
  }
};

const manifest = new Manifest(assets);

class TextBox {
  constructor(text) {
    this.stringArray = text;
    this.sound = manifest.assets.fx_keypress;
    this.start = 0.768;

    this.line = 0;
    this.char = 0;
    this.speed = 30;

    this.current = "";

    window.addEventListener("keydown", this.onKeyDown.bind(this));

    this.intervalId = undefined;
  }

  init() {
    this.intervalId = setInterval(() => {
      if (this.stringArray[this.line][this.char] !== undefined) {
        this.char++;

        this.sound.currentTime = this.start;
        this.sound.play();
      }

      this.current = this.stringArray[this.line].slice(0, this.char);
    }, 1000 / this.speed);
  }

  onKeyDown(e) {
    switch (e.key) {
      case "Backspace":
        this.prev();
        break;
      case "Enter":
      case " ":
        this.next();
        break;
    }
  }

  prev() {
    if (this.stringArray[this.line - 1]) {
      this.line--;
    }

    this.char = 0;
  }

  next() {
    if (this.stringArray[this.line + 1]) {
      this.line++;
    }

    this.char = 0;
  }

  destroy() {
    window.removeEventListener("keydown", this.onKeyDown);
    clearInterval(this.intervalId);
  }
  
  render(ctx) {
    
  }
}

class Item {
  constructor(name, icon, hp) {
    this.name = name;
    this.icon = icon;
    this.hp = hp;
  }
}

class Inventory {
  constructor() {
    // Inventory
    this.inventory = [
      new Item("Flashlight", manifest.assets.ico_flashlight, 10),
    ];
    this.maxCapacity = 20;

    // UI
    this.isHidden = true;
    this.clientX = 0;
    this.clientY = 0;
    this.size = 100;
    this.offsetX = CANVAS_WIDTH / 2 - (this.size * this.columns) / 2;
    this.offsetY = CANVAS_HEIGHT / 2 - (this.size * this.rows) / 2;

    window.addEventListener("keydown", this.handleKeyPress.bind(this));
    canvas.addEventListener("mousemove", this.handleMouseMove.bind(this));
  }

  handleKeyPress(e) {
    switch (e.key) {
      case "I":
      case "i":
        this.isHidden = !this.isHidden;
        break;
    }
  }

  isOverlapping(x, y) {
    return !(
      this.clientX < x ||
      this.clientX > x + this.size ||
      this.clientY > y + this.size ||
      this.clientY < y
    );
  }

  handleMouseMove(e) {
    let boundingRect = canvas.getBoundingClientRect();

    this.clientX = e.touches ? e.touches[0].clientX : e.clientX;
    this.clientY = e.touches ? e.touches[0].clientY : e.clientY;

    this.clientX *= window.devicePixelRatio;
    this.clientY *= window.devicePixelRatio;

    this.clientX -= boundingRect.left;
    this.clientY -= boundingRect.top;
  }

  render() {
    if (this.isHidden) return;

    ctx.save();

    ctx.fillStyle = "#000c";
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.textAlign = "left";

    for (let i = 0; i < this.inventory.length; i++) {
      let item = this.inventory[i];

      let x = 0;
      let y = i * this.size;

      ctx.save();

      ctx.strokeStyle = "#FFD700";
      ctx.lineWidth = 2;

      ctx.shadowColor = "#FFD700";
      ctx.shadowBlur = 5;
      ctx.fillStyle = "#000c";

      ctx.fillRect(x, y, this.size, this.size);
      ctx.strokeRect(x, y, this.size, this.size);

      ctx.restore();

      if (this.inventory[i] instanceof Item) {
        ctx.drawImage(this.inventory[i].icon, x, y, this.size, this.size);

        if (this.isOverlapping(x, y)) {
          ctx.font = "24px monospace";
          const text = this.inventory[i].name;
          const metrics = ctx.measureText(text);

          ctx.fillStyle = "#000c";

          ctx.beginPath();
          ctx.roundRect(this.clientX, this.clientY, metrics.width, 24, [4]);
          ctx.fill();

          ctx.fillStyle = "#fff";
          ctx.fillText(text, this.clientX, this.clientY + 20);
        }
      }
    }

    ctx.restore();
  }
}

class Player extends GameObject {
  constructor(x, y) {
    super(x, y, 15, 51);

    this.mass = 62;
    this.µ = 0.01;

    this.bounds.y = 41;
    this.bounds.h = 10;

    // Sprite data
    this.sprite = new Sprite(sprites, "@player/default");
    this.inventory = new Inventory();

    // TODO: Clean mess here so that class Sprite has needed functions
    this.validAnimations = [
      "up",
      "up_right",
      "right",
      "down_right",
      "down",
      "down_left",
      "left",
      "up_left",
    ];
    this.currentAnimation = "up";
    this.currentFrame = 0;
    this.position = this.sprite.getCurrentFrame(
      this.currentAnimation,
      this.currentFrame
    );
    this.intervalId = setInterval(() => {
      this.currentFrame++;
      this.position = this.sprite.getCurrentFrame(
        this.currentAnimation,
        this.currentFrame
      );
    }, 100);

    // Controls
    this.controls = { up: false, down: false, left: false, right: false };
    this.inventory = new Inventory();

    document.addEventListener("keydown", this.handleKeyDown.bind(this));
    document.addEventListener("keyup", this.handleKeyUp.bind(this));

    this.extendRender((object) => {
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(
        manifest.assets.spr_player,
        this.position.x,
        this.position.y,
        this.position.width,
        this.position.height,
        0,
        0,
        this.position.width,
        this.position.height
      );
    });
  }

  step() {
    super.step();

    if (!this.inventory.isHidden) return;

    this.acc.x = 0;
    this.acc.y = 0;

    if (this.controls.up) {
      this.acc.y = -10 * this.mass;
    }
    if (this.controls.down) {
      this.acc.y = 10 * this.mass;
    }
    if (this.controls.left) {
      this.acc.x = -10 * this.mass;
    }
    if (this.controls.right) {
      this.acc.x = 10 * this.mass;
    }
  }

  handleKeyDown(e) {
    this.handleKeyEvent(e, true);
  }

  handleKeyUp(e) {
    this.handleKeyEvent(e, false);
  }

  handleKeyEvent(e, bool) {
    switch (e.key) {
      case "ArrowUp":
      case "W":
      case "w":
        this.controls.up = bool;
        break;
      case "ArrowDown":
      case "S":
      case "s":
        this.controls.down = bool;
        break;
      case "ArrowLeft":
      case "A":
      case "a":
        this.controls.left = bool;
        break;
      case "ArrowRight":
      case "D":
      case "d":
        this.controls.right = bool;
        break;
    }

    const currentKeys = [];

    if (this.controls.up) currentKeys.push("up");
    if (this.controls.down) currentKeys.push("down");
    if (this.controls.left) currentKeys.push("left");
    if (this.controls.right) currentKeys.push("right");

    const newAnimation = currentKeys.join("_");

    if (this.validAnimations.includes(newAnimation))
      this.currentAnimation = newAnimation;
  }
}

function createDebugRect(object) {
  function renderDebug() {
    if ($global.debug) {
      ctx.fillStyle = "#f002";
      ctx.fillRect(
        object.bounds.x,
        object.bounds.y,
        object.bounds.w,
        object.bounds.h
      );

      ctx.strokeStyle = "red";
      ctx.lineWidth = 0.1;
      ctx.strokeRect(
        object.bounds.x,
        object.bounds.y,
        object.bounds.w,
        object.bounds.h
      );
      
      ctx.fillStyle = "#fff2";
      ctx.font = "4px monospace";
      ctx.fillMultiLineText(
        `UUID: ${object.uuid}\npos: ${JSON.stringify(object.pos)}\nbounds: ${JSON.stringify(object.bounds)}\n`,
        0,
        0
      );
    }
  }

  object.extendRender(renderDebug, "debug");
}

function createDialog(world, dialog) {
  let textbox = new TextBox(dialog);
  let guiTextbox = new InteractiveObject(0, 0, 0, 0);
  
  guiTextbox.extendRender(() => {
    ctx.fillStyle = "#000";
    ctx.fillRect(0,0,100,100);
    
    ctx.fillMultiLineText(textbox.current, 0,0);
  });
  
  world.addObject(guiTextbox);
}

async function loadStage(src) {
  let res = await fetch(src);
  let js = await res.text();

  return { mount, unmount, render };
}

function adjustGain(audioElement, targetVolume, duration = 2000) {
  const initialVolume = audioElement.volume;
  const volumeChangePerMs = (targetVolume - initialVolume) / duration;

  let startTime;

  function updateVolume(currentTime) {
    if (!startTime) {
      startTime = currentTime;
    }

    const elapsed = currentTime - startTime;
    const newVolume = initialVolume + volumeChangePerMs * elapsed;

    if (elapsed < duration) {
      audioElement.volume = newVolume;
      requestAnimationFrame(updateVolume);
    } else {
      audioElement.volume = targetVolume;
    }
  }

  requestAnimationFrame(updateVolume);
}

async function main() {
  window.addEventListener("keydown", function (e) {
    switch (e.key) {
      case "F9":
        $global.debug = !$global.debug;
        break;
    }
  });

  // Initialize global objects
  const world = new World();
  const camera = new Camera(canvas.width, canvas.height);
  const player = new Player(118, 112);

  world.addEventListener("newObject", function (e) {
    createDebugRect(e.detail.object);
  });

  world.background = "#333";
  camera.setCenterCoordinates(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  camera.scale = PIXEL_SCALE;
  camera.focusOn(player);
  player.zIndex = 999;

  // Stages
  const loaderStage = (function () {
    function mount() {}

    function unmount() {}

    function render() {
      if (manifest.ready && navigator.userActivation.hasBeenActive) {
        nextStage = loreStage;
      }

      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      ctx.font = "24px monospace";

      ctx.save();

      ctx.textAlign = "center";

      if (!manifest.ready) {
        ctx.fillStyle = "#555555";

        ctx.fillText(
          "Game is loading assets...",
          CANVAS_WIDTH / 2,
          CANVAS_HEIGHT / 2
        );
      } else if (!navigator.userActivation.hasBeenActive) {
        ctx.fillStyle = "#879ac7";

        ctx.drawImage(
          manifest.assets.ico_tap,
          CANVAS_WIDTH / 2 - 25,
          CANVAS_HEIGHT / 2 - 100,
          50,
          50
        );
        ctx.fillText(
          "Interaction with screen is needed.",
          CANVAS_WIDTH / 2,
          CANVAS_HEIGHT / 2
        );
      }

      ctx.restore();

      ctx.save();

      ctx.translate(0, CANVAS_HEIGHT - 20);

      ctx.fillStyle = "#bbb";
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 2;

      const barWidth = CANVAS_WIDTH / manifest.total;

      for (let i = 0; i < manifest.loaded; i++) {
        ctx.fillRect(barWidth * i, 0, barWidth, 20);
        ctx.strokeRect(barWidth * i, 0, barWidth, 20);
      }

      ctx.restore();
    }

    return { mount, unmount, render };
  })();
  const loreStage = (function () {
    const loreInitial = [
      "Use [Backspace] and [Enter] keys to progress",
      "You woke up.",
      "It's pitch black in your room.",
      "You check the time on your phone...",
      `"July 4, ${new Date().getFullYear() + 1} 9:06 AM"`,
      "You try to turn on the lights. It doesn't work.",
      "Bewildered, you go outside.",
      "\n",
      "The sun is gone.",
      "\n",
    ];
    const storyTextBox = new TextBox(loreInitial);

    function mount() {
      storyTextBox.init();
    }

    function unmount() {
      storyTextBox.destroy();
    }

    async function render() {
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      ctx.fillStyle = "#bbb";
      ctx.font = "bold 24px monospace";

      ctx.save();

      ctx.textAlign = "center";

      if (storyTextBox.line == 7) {
        manifest.assets.fx_door.play();
        manifest.assets.fx_door.loop = true;
      } else {
        manifest.assets.fx_door.currentTime = 0;
        manifest.assets.fx_door.pause();
      }

      if (storyTextBox.line == 9) {
        nextStage = roomStage;
      }

      ctx.fillMultiLineText(
        storyTextBox.current,
        CANVAS_WIDTH / 2,
        CANVAS_HEIGHT / 2
      );

      ctx.restore();
    }

    return { mount, unmount, render };
  })();
  
  const apartmentCutsceneStage = (function () {
    function mount() {
      setTimeout(() => { manifest.assets.snd_better_days.volume = 0.5; manifest.assets.snd_better_days.play(); }, 2000);
    }
    
    function unmount() {
      world.clearObjects();
    }
    
    function render() {
      // Background
      ctx.fillStyle = "#000   ";
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }
    
    return { mount, unmount, render };
  })();
  
  const apartmentStage = (function () {
    const hall = new GameObject(0, 0, 0, 0);
    const wall = new GameObject(0, 0, 500, 72);
    const door = new StaticBoundObject(108, 126, 34, 50);
    const cutscene = new InteractiveObject(400,100,50,50);

    hall.extendRender(() => {
      ctx.globalAlpha = 1;
      ctx.drawImage(
        manifest.assets.bg_hall,
        0,
        0,
        manifest.assets.bg_hall.width,
        manifest.assets.bg_hall.height
      );
    });

    door.addEventListener("collision", function () {
      nextStage = roomStage;
    });
    
    cutscene.addEventListener("collision", function () {
      nextStage = apartmentCutsceneStage;
    });


    function mount() {

      manifest.assets.snd_ambiance.volume = 0;
      manifest.assets.snd_ambiance.loop = true;
      manifest.assets.snd_ambiance.play();

      adjustGain(manifest.assets.snd_ambiance, 1);

      world.bounds.w = 500;
      world.bounds.h = 125;

      player.x = 118;
      player.y = 40;

      world.addObject(player);
      world.addObject(hall);
      world.addObject(wall);
      world.addObject(door);
      world.addObject(cutscene);
    }

    function unmount() {
      adjustGain(manifest.assets.snd_ambiance, 0);

      world.clearObjects();
    }

    function render() {
      world.physics.step();

      ctx.save();

      ctx.imageSmoothingEnabled = false;

      camera.fixScale(ctx);

      // Background
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // World
      world.render(ctx, camera);

      ctx.restore();

      player.inventory.render();
      
      ctx.fillStyle = `rgba(0,0,0, ${1 - ((cutscene.x - player.x + 118) / 400)})`
      ctx.fillRect(0,0,CANVAS_WIDTH,CANVAS_HEIGHT);
    }

    return { mount, unmount, render };
  })();
  const roomStage = (function () {
    const wall = new StaticBoundObject(0, 15, 240, 110);
    const door = new StaticBoundObject(108, 76, 34, 50);
    const cabinet = new StaticBoundObject(162, 120, 66, 20);
    const light = new InteractiveObject(83,130,23,23);
    const room = new GameObject(0, 0, 0, 0);

    room.extendRender(() => {
      ctx.drawImage(
        manifest.assets.bg_room,
        0,
        0,
        manifest.assets.bg_room.width,
        manifest.assets.bg_room.height
      );
    });
    
    light.addEventListener("collision", function (e) {
      if (e.detail.object === player && $global.keys["Enter"]) 
      {
        manifest.assets.fx_light.currentTime = 0;
        manifest.assets.fx_light.play();
        
        createDialog(world, ["The light doesn't work."]);
      }
    });

    door.addEventListener("collision", function () {
      nextStage = apartmentStage;
    });

    const gradient = ctx.createRadialGradient(
      CANVAS_WIDTH / 2,
      CANVAS_HEIGHT / 2,
      200,
      CANVAS_WIDTH / 2,
      CANVAS_HEIGHT / 2,
      10
    );

    // Add three color stops
    gradient.addColorStop(0, "black");
    gradient.addColorStop(1, "transparent");

    function mount() {
      manifest.assets.snd_untitled.play();
      manifest.assets.snd_untitled.loop = true;
      manifest.assets.snd_untitled.volume = 0;

      adjustGain(manifest.assets.snd_untitled, 1);

      player.x = 118;
      player.y = 112;

      world.bounds.w = 240;
      world.bounds.h = 235;

      world.addObject(light);
      world.addObject(room);
      world.addObject(cabinet);
      world.addObject(wall);
      world.addObject(door);
      world.addObject(player);
    }

    function unmount() {
      adjustGain(manifest.assets.snd_untitled, 0);

      world.clearObjects();
    }

    function render() {
      world.physics.step();

      ctx.save();

      ctx.imageSmoothingEnabled = false;

      camera.fixScale(ctx);

      // Background
      ctx.fillStyle = "#111";
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // World
      world.render(ctx, camera);

      // Gradient
      ctx.save();

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      ctx.restore();

      ctx.restore();

      player.inventory.render();
    }

    return { render, unmount, mount };
  })();

  let prevStage = undefined;
  let currStage = loaderStage;
  let nextStage = undefined;

  Time.previousTime = Date.now();

  function renderDebug() {    
    ctx.fillStyle = "#000000";
    ctx.fillRect(
      world.bounds.x,
      world.bounds.y,
      world.bounds.w,
      world.bounds.h
    );
    
    ctx.fillStyle = "#FF5800";
    for (let [id, object] of world.objects) {
      ctx.save();

      ctx.translate(
        object.x + object.center.x + object.bounds.x,
        object.y + object.center.y + object.bounds.y
      );
      ctx.rotate(object.θ);
      ctx.fillRect(
        -object.center.x,
        -object.center.y,
        object.bounds.w,
        object.bounds.h
      );

      ctx.restore();
    }
    
    ctx.textAlign = "left";
    ctx.font = "24px monospace";
    ctx.fillStyle = "white";
    ctx.fillMultiLineText(`XY: ${parseInt(camera.focus.x)} / ${parseInt(camera.focus.y)}\nKEYS: ${JSON.stringify($global)}\nSIZE: ${world.objects.size}`, 0, 24);
  }

  function loop() {
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    if (nextStage != undefined) {
      prevStage = currStage;
      currStage = nextStage;
      nextStage = undefined;

      prevStage.unmount();
      currStage.mount();
    }
    
    

    try {
      Time.currentTime = performance.now();

      currStage.render();

      if ($global.debug) renderDebug();

      Time.previousTime = performance.now();
    } catch (error) {
      ctx.fillStyle = "blue";
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      ctx.fillStyle = "white";
      ctx.textAlign = "left";
      ctx.fillMultiLineText(error.stack, 0, 24);

      throw error;
    }

    window.requestAnimationFrame(loop);
  }

  window.requestAnimationFrame(loop);
}

document.addEventListener("DOMContentLoaded", main);


document.addEventListener("keydown", (e) => {
  $global.keys[e.key] = true;
});

document.addEventListener("keyup", (e) => {
  $global.keys[e.key] = false;
});