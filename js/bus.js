export const BUS={};
export function on(ev,f){(BUS[ev]=BUS[ev]||[]).push(f);}
export function emit(ev,d){(BUS[ev]||[]).forEach(f=>f(d));}
