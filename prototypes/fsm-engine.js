export const states=['IDLE','FEED','PRESS','EJECT'];
export function clock(state,{start,box,safe}){if(!states.includes(state))throw new RangeError('Unknown Moore state.');if(!safe)return'IDLE';return({IDLE:start?'FEED':'IDLE',FEED:box?'PRESS':'FEED',PRESS:'EJECT',EJECT:'IDLE'})[state];}
export function leds(state){if(!states.includes(state))throw new RangeError('Unknown Moore state.');return{feed:state==='FEED',press:state==='PRESS',eject:state==='EJECT'};}
