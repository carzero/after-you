// Pure placement helper. baseScale is the idle PNG-to-screen ratio.
export function placePose(asset, idle, ground, baseScale, motion={x:0,y:0}) {
  if (!(baseScale > 0) || !Number.isFinite(baseScale)) throw new Error('Invalid scale');
  const s=baseScale*asset.scale;
  const grounded=asset.groundContact!==null;
  const anchor=grounded?asset.groundContact:asset.bodyReference;
  const target=grounded?ground:{
    x:ground.x+(idle.bodyReference[0]-idle.groundContact[0])*baseScale,
    y:ground.y+(idle.bodyReference[1]-idle.groundContact[1])*baseScale
  };
  return {left:target.x+(motion.x??0)-anchor[0]*s,
          top:target.y+(motion.y??0)-anchor[1]*s,
          width:asset.size[0]*s,height:asset.size[1]*s};
}
