// Synthetic 1x1 GIFs: black frame, then white frame with a different delay.
const header = "47494638396101000100800000000000ffffff";
const blackFrame = "21f904000a0000002c0000000001000100000202440100";
const whiteFrame = "21f90400140000002c00000000010001000002024c0100";
const loop = "21ff0b4e45545343415045322e300301000000";

export const staticGif = Buffer.from(`${header}${blackFrame}3b`, "hex");
export const animatedGif = Buffer.from(`${header}${loop}${blackFrame}${whiteFrame}3b`, "hex");
