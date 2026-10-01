/* Whole drawings stay connected. The old polygon replacement could erase
   heads and leave torso seams. CSS sway remains on the outer wrapper. */
(() => {
  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const actors = [...document.querySelectorAll('.actor-rig')];
  const lawnActors = [...document.querySelectorAll('[data-lawn-actor]')];
  const revisions = { bike: 'complete-clockwise-6', chair: 'complete-head-6', journal: 'complete-6', dog: 'complete-6', runner: 'complete-6', lounger: 'complete-4', walker: 'designer-loop-timing-4' };
  function update() {
    for (const actor of actors) {
      const image = actor.querySelector('.rig-source');
      const name = actor.dataset.actor;
      const still = preference.matches;
      const assetName = name === 'walker' ? 'walker-designer-final' : name;
      const next = 'assets/motion-actor-' + assetName + (still ? '-still' : '') + '.webp'
        + (revisions[name] ? '?v=' + revisions[name] : '');
      if (image.getAttribute('src') === next) continue;
      const preload = new Image();
      preload.onload = () => {
        if (preference.matches !== still) return;
        image.src = next;
        actor.dataset.motionReady = 'true';
        actor.dataset.motionMode = still ? 'still' : (name === 'walker' ? 'designer-finished-frames' : 'complete-frames');
      };
      preload.src = next;
    }
    for (const image of lawnActors) {
      const name = image.dataset.lawnActor;
      image.src = 'assets/lawn-' + name + (preference.matches ? '-still' : '') + '.webp?v=original-angle-1';
      image.dataset.motionMode = preference.matches ? 'still' : 'homepage-cycle-original-angle';
    }
  }
  update();
  preference.addEventListener('change', update);
})();
