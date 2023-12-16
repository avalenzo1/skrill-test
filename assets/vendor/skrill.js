// ███████╗██╗  ██╗██████╗ ██╗██╗     ██╗
// ██╔════╝██║ ██╔╝██╔══██╗██║██║     ██║
// ███████╗█████╔╝ ██████╔╝██║██║     ██║
// ╚════██║██╔═██╗ ██╔══██╗██║██║     ██║
// ███████║██║  ██╗██║  ██║██║███████╗███████╗
// ╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝╚══════╝╚══════╝

// Copyright (c) 2023 Anthony Valenzo

// Permission is hereby granted, free of charge, to any
// person obtaining a copy of this software and associated
// documentation files (the "Software"), to deal in the
// Software without restriction, including without
// limitation the rights to use, copy, modify, merge,
// publish, distribute, sublicense, and/or sell copies of
// the Software, and to permit persons to whom the Software
// is furnished to do so, subject to the following
// conditions:

// The above copyright notice and this permission notice
// shall be included in all copies or substantial portions
// of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF
// ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED
// TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
// PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT
// SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
// CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
// OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR
// IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
// DEALINGS IN THE SOFTWARE.

"use strict";

const Time = {
  previousTime: performance.now(),
  currentTime: performance.now(),
  get deltaTime() {
    return (this.currentTime - this.previousTime) / 1000;
  },
};

function Video(src) {
  const video = document.createElement("video");

  if (typeof src === "string") video.src = src;

  return video;
}

/**
 * Generates unique UUID
 *
 * @return {string} UUID (e.g., "b4204287-35b1-4939-939d-eaa8e7b157f1")
 */
function UUID() {
  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) =>
    (
      c ^
      (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))
    ).toString(16)
  );
}

/**
 * Vector datatype
 *
 * @param {number} x
 * @param {number} y
 */
class Vector2 {
  constructor(x, y) {
    this.x = x || 0;
    this.y = y || 0;
  }
}

class Frame {
  constructor() {}
}

class Quadtree {
  constructor() {}
}

class Physics {
  constructor(world) {
    this.world = world;
    this.quadtree = new Quadtree();
  }

  isColliding(obj1, obj2) {
    if (obj1 instanceof StaticBoundObject && obj2 instanceof StaticBoundObject)
      return false;

    return (
      obj1.x + obj1.bounds.x < obj2.x + obj1.bounds.x + obj2.bounds.w &&
      obj1.x + obj1.bounds.x + obj1.bounds.w > obj2.x + obj2.bounds.x &&
      obj1.y + obj1.bounds.y < obj2.y + obj2.bounds.y + obj2.bounds.h &&
      obj1.y + obj1.bounds.y + obj1.bounds.h > obj2.y + obj2.bounds.y
    );
  }

  handleCollision(obj1, obj2) {
    obj1.dispatchEvent(new CustomEvent("collision", {
      detail: {
        object: obj2
      }
    }));
    
    obj2.dispatchEvent(new CustomEvent("collision", {
      detail: {
        object: obj1
      }
    }));
    
    if (obj1 instanceof InteractiveObject || obj2 instanceof InteractiveObject) return;
    
    // Handle Collision
    if (obj1.vel.y.toFixed(3) > 0) {
      // checks if target_obj is positive (this is asking if the velocity faces down)
      obj1.y =
        obj1.prevPos.y; /* ((this.target_obj.y - hitbox.y) + (this.target.h + this.target.yOffset)) */
    }
    if (obj1.vel.y.toFixed(3) < 0) {
      obj1.y =
        obj1.prevPos.y; /* ((hitbox.y + hitbox.h) - (this.target_obj.y + this.target.yOffset)) */
    }
    if (obj1.vel.x.toFixed(3) > 0) {
      // same as above but the velocity faces right
      obj1.x =
        obj1.prevPos.x; /* ((this.target_obj.x - hitbox.w) + (this.target.w + this.target.xOffset)) */
    }
    if (obj1.vel.x.toFixed(3) < 0) {
      obj1.x =
        obj1.prevPos.x; /* ((hitbox.x + hitbox.w) - (this.target_obj.x + this.target.xOffset)) */
    }

    obj1.vel.x = obj1.vel.y = 0;
  }

  step(deltaTime) {
    for (const [id, obj1] of this.world.objects) {
      obj1.step(deltaTime);

      for (const [id, obj2] of this.world.objects) {
        if (obj1 === obj2) continue;

        if (this.isColliding(obj1, obj2)) {
          this.handleCollision(obj1, obj2);
        }
      }

      if (obj1 instanceof StaticBoundObject) continue;

      if (obj1.x + obj1.bounds.x < 0) obj1.x = obj1.bounds.x;
      if (obj1.x + obj1.bounds.x + obj1.bounds.w > this.world.bounds.w)
        obj1.x = this.world.bounds.w - obj1.bounds.w - obj1.bounds.x;
      if (obj1.y + obj1.bounds.y < 0) obj1.y = -obj1.bounds.y;
      if (obj1.y + obj1.bounds.y + obj1.bounds.h > this.world.bounds.h)
        obj1.y = this.world.bounds.h - obj1.bounds.h - obj1.bounds.y;
    }
  }
}

class World extends EventTarget {
  constructor(w = 300, h = 300) {
    super();

    this.physics = new Physics(this);
    this.objects = new Map();
    this.bounds = new Rect(0, 0, w, h);
    this.background = "transparent";
  }
  
  removeObject(object) {
    if (object instanceof GameObject) {
      this.objects.delete(object.uuid);
      
      this.dispatchEvent(
        new CustomEvent("deleteObject", {
          detail: {
            object
          }
        })
      );
    }
  }

  addObject(object) {
    if (object instanceof GameObject) {
      this.objects.set(object.uuid, object);
      this.dispatchEvent(
        new CustomEvent("newObject", {
          detail: {
            object
          }
        })
      );
    }
  }

  sortObjects() {
    this.objects = new Map(
      [...this.objects.entries()].sort((a, b) => a[1].zIndex - b[1].zIndex)
    );
  }
  
  clearObjects() {
    this.objects.clear();
  }
  
  getObject(id) {
    return this.objects.get(id);
  }

  render(ctx, camera) {
    this.sortObjects();

    for (const [id, object] of this.objects) {
      object.render(ctx, camera);
    }
  }
}

class Rect {
  constructor(x, y, w, h) {
    this.x = x || 0;
    this.y = y || 0;
    this.w = w;
    this.h = h;
  }

  get width() {
    return this.w;
  }

  set width(w) {
    this.w = w;
  }

  get height() {
    return this.h;
  }

  set height(h) {
    this.h = h;
  }

  get cx() {
    return this.w / 2;
  }

  get cy() {
    return this.h / 2;
  }
}

/**
 * GameObject
 *
 * @param {number} x
 * @param {number} y
 * @param {number} w
 * @param {number} h
 */
class GameObject extends EventTarget {
  constructor(x, y, w, h) {
    super();

    this.uuid = UUID();

    this.zIndex = 1;

    this.mass = 10;

    this.prevPos = new Vector2(x, y); // Previous Position
    this.pos = new Vector2(x, y); // Position
    this.vel = new Vector2(); // Velocity
    this.acc = new Vector2(); // Acceleration

    this.w = w;
    this.h = h;

    this.µ = 0.9; // Mu (Friction)
    this.θ = 0; // Thetha (Rotation)

    this.bounds = new Rect(0, 0, w, h);
    this.center = new Vector2(this.bounds.w / 2, this.bounds.h / 2);

    this.callbacks = new Map();
  }

  get rotation() {
    return this.θ;
  }

  get mu() {
    return this.µ;
  }

  set mu(µ) {
    this.µ = µ;
  }

  get x() {
    return this.pos.x;
  }
  set x(pos) {
    this.pos.x = pos;
  }
  get y() {
    return this.pos.y;
  }
  set y(pos) {
    this.pos.y = pos;
  }

  // Updates Physics of item
  step() {
    // if (typeof deltaTime === 'undefined') throw new Error(`Could not update ${this.uuid} because deltaTime was not given`);

    this.vel.x += this.acc.x * Time.deltaTime;
    this.vel.y += this.acc.y * Time.deltaTime;

    this.prevPos.x = this.pos.x;
    this.prevPos.y = this.pos.y;

    // Update position based on velocity
    this.pos.x += Number((this.vel.x * Time.deltaTime).toFixed(2));
    this.pos.y += Number((this.vel.y * Time.deltaTime).toFixed(2));

    // Apply friction using µ (mu) and deltaTime
    this.vel.x *= Math.pow(this.µ, Time.deltaTime);
    this.vel.y *= Math.pow(this.µ, Time.deltaTime);
  }

  extendRender(callback, key=UUID()) {
    if (typeof callback === "function") {
      this.callbacks.set(key, callback);
    } else {
      console.error("Invalid custom render callback. Must be a function.");
    }
  }
  
  reduceRender(key)
  {
    this.callbacks.remove(key);
  }

  render(ctx, camera) {
    for (const [key, callback] of this.callbacks) {
      ctx.save();

      ctx.translate(
        camera.getCoordinates(this.pos.x, this.pos.y).x,
        camera.getCoordinates(this.pos.x, this.pos.y).y
      );

      callback(this);

      ctx.restore();
    }
  }
}

class InteractiveObject extends GameObject {
  constructor(x, y, w, h) {
    super(x, y, w, h);

    this.mass = Infinity; // Infinity
  }
}

class StaticBoundObject extends GameObject {
  constructor(x, y, w, h) {
    super(x, y, w, h);

    this.mass = Infinity; // Infinity
  }
}

/**
 * Handles all assets that app handles
 *
 * @param {object} assets
 */
class Manifest {
  constructor(assets) {
    this.assets = {};
    this.loaded = 0;

    if (typeof assets == "object") this.parseAssets(assets);

    return;
  }

  get total() {
    return Object.keys(this.assets).length;
  }

  get ready() {
    return this.total <= this.loaded;
  }

  parseAssets(assets) {
    assets.forEach((asset) => {
      console.log(asset.type);

      if (asset.type === "image") {
        this.imageAsset(asset.name, asset.src);
      } else if (asset.type === "sound") {
        this.audioAsset(asset.name, asset.src);
      } else if (asset.type === "video") {
        this.videoAsset(asset.name, asset.src);
      } else {
        console.warn(asset.type, "is not a valid asset type");
      }
    });
  }

  videoAsset(name, src) {
    this.assets[name] = new Video(src);

    this.assets[name].crossOrigin = "Anonymous";

    this.assets[name].oncanplaythrough = () => {
      this.loaded++;

      this.assets[name].oncanplaythrough = undefined;
    };

    this.assets[name].onerror = () => {
      console.warn(name, " could not be loaded");
    };
  }

  audioAsset(name, src) {
    this.assets[name] = new Audio(src);

    this.assets[name].oncanplaythrough = () => {
      this.loaded++;

      this.assets[name].oncanplaythrough = undefined;
    };

    this.assets[name].onerror = () => {
      console.warn(name, " could not be loaded");
    };
  }

  imageAsset(name, src) {
    this.assets[name] = new Image();

    this.assets[name].onload = () => {
      this.loaded++;

      this.assets[name].oncanplaythrough = undefined;
    };

    this.assets[name].onerror = () => {
      console.warn(name, " could not be loaded");
    };

    this.assets[name].src = src;
  }
}

class Sprite {
  /**
   * https://codehs.com/tutorial/andy/Programming_Sprites_in_JavaScript
   * Original code adapted from Andy Bayer
   */

  constructor(sprites, name) {
    this.json = sprites;
    this.name = name;

    this.meta = this.json.sprites[this.name].meta;
    this.animations = this.json.sprites[this.name].animations;
  }

  getCurrentFrame(name, frame) {
    let position = this.animations[name][frame % this.animations[name].length];

    return this.toImagePosition(position[0], position[1]);
  }

  toImagePosition(row, col) {
    return {
      x:
        this.meta.borderWidth +
        col * (this.meta.spacingWidth + this.meta.width),
      y:
        this.meta.borderWidth +
        row * (this.meta.spacingWidth + this.meta.height),
      width: this.meta.width,
      height: this.meta.height,
    };
  }
}

class Camera {
  constructor(width, height) {
    this.pos = new Vector2();
    this.bounds = new Rect(0, 0, width, height);
    this.scale = 1;
    this.θ = 0;
    this.focus;
  }

  focusOn(object) {
    if (object instanceof GameObject) {
      this.focus = object;
    }
  }

  setCenterCoordinates(x, y) {
    this.pos.x = x;
    this.pos.y = y;

    return this;
  }

  fixScale(ctx) {
    ctx.translate(this.bounds.cx, this.bounds.cy);
    ctx.scale(this.scale, this.scale);
    ctx.translate(-this.bounds.cx, -this.bounds.cy);
  }

  getCoordinates(x, y) {
    const focus = new Vector2();

    if (this.focus instanceof GameObject) {
      focus.x = this.focus.pos.x + this.focus.center.x;
      focus.y = this.focus.pos.y + this.focus.center.y;
    }

    return {
      x: this.pos.x + x - focus.x,
      y: this.pos.y + y - focus.y,
    };
  }
}

export {
  Time,
  World,
  Camera,
  Sprite,
  GameObject,
  InteractiveObject,
  StaticBoundObject,
  Vector2,
  Frame,
  Manifest,
};
