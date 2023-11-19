const world = new World(240, 252);
const player = new Player(158, 112);
const camera = new Camera();
camera.setCenterCoordinates(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
camera.focusOn(player);

const wall = new StaticBoundObject(0, 15, 240, 110);

world.addObject(wall);
world.addObject(player);

function mount() {
  manifest.assets.snd_untitled.play();
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

  ctx.fillStyle = "transparent";

  // ctx.translate(
  //   CANVAS_WIDTH / 2 - (manifest.assets.bg_room.width) / 2,
  //   CANVAS_HEIGHT / 2 - (manifest.assets.bg_room.height) / 2
  // );

  ctx.translate(camera.getCoordinates(0, 0).x, camera.getCoordinates(0, 0).y);

  ctx.imageSmoothingEnabled = false;

  ctx.drawImage(
    manifest.assets.bg_room,
    0,
    0,
    manifest.assets.bg_room.width,
    manifest.assets.bg_room.height
  );

  ctx.fillRect(wall.x, wall.y, wall.w, wall.h);

  ctx.restore();

  ctx.save();

  ctx.translate(
    camera.getCoordinates(player.x, 0).x,
    camera.getCoordinates(0, player.y).y
  );

  player.render();

  ctx.restore();

  ctx.restore();

  if (showDebug) {
    ctx.textAlign = "left";
    ctx.font = "12px monospace";
    ctx.fillStyle = "#fff";
    ctx.fillMultiLineText(JSON.stringify(player, null, 2), 0, 24);

    for (let [id, object] of world.objects) {
      ctx.fillRect(object.x, object.y, object.w, object.h);
    }
  }
}
