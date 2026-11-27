// Manual anatomy registration, relative to the approved idle body's screen size.
// Pectoral/head landmarks are used instead of the silhouette (ears, arms, crouching).
// Original image canvases stay untouched; foot anchors remain in source pixels.
export const rabbitActingRegistration = Object.freeze({
  after_you: { scale: .112, foot: [620,1255] },
  inspect: { scale: .104, foot: [530,1490] },
  relief: { scale: .131, foot: [780,980] },
});
export const rabbitDescentScale = .112 * 1.06;
