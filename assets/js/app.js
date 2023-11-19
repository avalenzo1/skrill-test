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
  Sprite,
  Camera,
  Manifest,
  Vector2,
} from "/assets/vendor/skrill.js";

import sprites from "/assets/json/sprites.json" assert { type: "json" };
import assets from "/assets/json/assets.json" assert { type: "json" };

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

  render() {
    ctx.save();

    ctx.strokeStyle = "red";

    // ctx.translate(CANVAS_WIDTH / 2 - this.center.x, CANVAS_HEIGHT / 2 - this.center.y);

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

    ctx.strokeRect(this.bounds.x, this.bounds.y, this.bounds.w, this.bounds.h);

    ctx.restore();
  }
}

async function loadStage(src) {
  let res = await fetch(src);
  let js = await res.text();

  return { mount, unmount, render };
}

async function main() {
  let showDebug = false;

  window.addEventListener("keydown", function (e) {
    switch (e.key) {
      case "F9":
        showDebug = !showDebug;
        break;
    }
  });

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
      "Use [a] and [d] keys to progress",
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

    //     let vhsEffect = new Image();

    //     async function parseChroma()
    //     {
    //       ctx.drawImage(
    //         manifest.assets.vid_vhs,
    //         0,
    //         0,
    //         CANVAS_WIDTH / 8,
    //         CANVAS_HEIGHT / 8
    //       );

    //       const imageData = ctx.getImageData(0, 0, CANVAS_WIDTH / 8, CANVAS_WIDTH / 8);

    //       let data = imageData.data;

    //       for (let i = 0; i < data.length; i += 8) {
    //         const red = data[i + 0];
    //         const green = data[i + 1];
    //         const blue = data[i + 2];

    //         if (red > 35 && green > 35 && blue > 35) data[i + 3] = 0;
    //       }

    //       ctx.putImageData(imageData, 0, 0);

    //       vhsEffect.src = canvas.toDataURL();
    //     }

    function mount() {
      storyTextBox.init();
      // manifest.assets.vid_vhs.play();
      // manifest.assets.vid_vhs.loop = true;
    }

    function unmount() {
      storyTextBox.destroy();
      // manifest.assets.vid_vhs.pause();
    }

    async function render() {
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      ctx.drawImage(manifest.assets.vid_vhs, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

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
  
  const world = new World(240, 252);
  const player = new Player(158, 112);
  const camera = new Camera();
  
  camera.setCenterCoordinates(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  camera.focusOn(player);

  const apartmentStage = (function () {
    function mount() {}

    function unmount() {}

    function render() {
      world.physics.step();

      ctx.save();

      ctx.imageSmoothingEnabled = false;

      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.scale(PIXEL_SCALE, PIXEL_SCALE);
      ctx.translate(-(canvas.width / 2), -(canvas.height / 2));

      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      ctx.save();

      ctx.translate(
        camera.getCoordinates(player.x, 0).x,
        camera.getCoordinates(0, player.y).y
      );

      player.render();

      ctx.restore();

      ctx.restore();
    }

    return { mount, unmount, render };
  })();   
  const roomStage = (function () {
    const wall = new StaticBoundObject(0, 15, 240, 110);
    const door = new StaticBoundObject(162, 96, 30, 50);
    
    const wallLeft = new StaticBoundObject(0, 190, 100, 20);
    wallLeft.θ = 0.4;

    door.addEventListener("collision", function() {
      world.removeObject(wall);
      world.removeObject(door);
      
      nextStage = apartmentStage;
    });

    world.addObject(wallLeft);
    world.addObject(wall);
    world.addObject(door);
    world.addObject(player);

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
    }

    function unmount() {
      manifest.assets.snd_untitled.pause();
    }

    function render() {
      world.physics.step();

      ctx.save();

      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.scale(PIXEL_SCALE, PIXEL_SCALE);
      ctx.translate(-(canvas.width / 2), -(canvas.height / 2));

      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      ctx.save();

      ctx.fillStyle = "red";

      // ctx.translate(
      //   CANVAS_WIDTH / 2 - (manifest.assets.bg_room.width) / 2,
      //   CANVAS_HEIGHT / 2 - (manifest.assets.bg_room.height) / 2
      // );

      ctx.translate(
        camera.getCoordinates(0, 0).x,
        camera.getCoordinates(0, 0).y
      );

      ctx.imageSmoothingEnabled = false;

      ctx.drawImage(
        manifest.assets.bg_room,
        0,
        0,
        manifest.assets.bg_room.width,
        manifest.assets.bg_room.height
      );

      ctx.restore();
      
      ctx.save();
      ctx.fillRect(wallLeft.x, wallLeft.y, wallLeft.w, wallLeft.h);
      ctx.restore();

      ctx.save();

      ctx.translate(
        camera.getCoordinates(player.x, 0).x,
        camera.getCoordinates(0, player.y).y
      );

      player.render();

      ctx.restore();

      ctx.save();

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      ctx.restore();

      ctx.restore();

      player.inventory.render();

      if (showDebug) {
        
        
        ctx.textAlign = "left";
        ctx.font = "12px monospace";
        ctx.fillStyle = "#fff";

        for (let [id, object] of world.objects) {
          ctx.fillText(`${camera.focus.x} ${camera.focus.y}`, 0, 12)
          
          ctx.save();
          
          ctx.translate(object.x + object.center.x + object.bounds.x, object.y + object.center.y + object.bounds.y);
          ctx.rotate(object.θ);
          ctx.fillRect(
            -object.center.x,
            -object.center.y,
            object.bounds.w,
            object.bounds.h
          );
          
          ctx.restore();
        }
        
        
      }
    }

    return { render, unmount, mount };
  })();

  let prevStage = undefined;
  let currStage = loaderStage;
  let nextStage = undefined;

  Time.previousTime = Date.now();

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
